import { CharacterFetters, FetterExcelConfigData } from '../../../../shared/types/genshin/fetter-types';
import { replaceRomanNumerals, romanize, romanToInt, SbOut } from '../../../../shared/util/stringUtil';
import { defaultMap } from '../../../../shared/util/genericUtil';
import { isTraveler as checkIsTraveler } from '../../../../shared/types/genshin/avatar-types';
import { LangCode } from '../../../../shared/types/lang-types';

export type PropFillMode = 'fill' | 'remove' | 'empty';

export type VoAppPreloadOptions = {
  swapTitleSubtitle?: boolean,
  paramFill?: {[paramName: string]: PropFillMode},
}

export type VoAppPreloadResult = { templateName: string, wikitext: string };

export function preloadFromFetters(characterFetters: CharacterFetters, mode: 'story' | 'combat', lang: LangCode, userLang: LangCode,
                                   opts: VoAppPreloadOptions = {}): VoAppPreloadResult {
  const out = new SbOut();
  out.setPropPad(20);
  out.setPropFilter((propName: string, propValue: string) => {
    let mode: PropFillMode = Object.entries(opts.paramFill).find(([key, _value]) => {
      return new RegExp('^' + key + '$').test(propName);
    })?.[1];
    if (mode === 'remove') {
      return undefined;
    } else if (mode === 'empty') {
      return '';
    } else {
      return propValue;
    }
  });

  const isStory: boolean = mode === 'story';
  const isCombat: boolean = mode === 'combat';
  const avatarName = characterFetters.avatarName;
  const fetters: FetterExcelConfigData[] = isStory ? characterFetters.storyFetters : characterFetters.combatFetters;
  const isTraveler: boolean = checkIsTraveler(characterFetters.avatar.Id);

  let templateName: string;
  if (isTraveler) {
    if (isCombat) {
      templateName = 'VO/Combat';
    } else {
      templateName = 'VO/Traveler';
    }
  } else {
    if (isCombat) {
      templateName = 'Combat VO';
    } else {
      templateName = 'VO/Story';
    }
  }

  out.line('{{' + templateName);
  out.prop('character', avatarName.EN);
  if (lang === 'EN') {
    out.prop('language', 'en');
    if (isStory) {
      out.prop('name', avatarName.EN);
    }
  } else if (lang === 'JP') {
    out.prop('language', 'ja');
    if (isStory) {
      out.prop('name', avatarName.JP);
    }
  } else if (lang === 'KR') {
    out.prop('language', 'ko');
    if (isStory) {
      out.prop('name', avatarName.KR);
    }
  } else if (lang === 'CH') {
    out.prop('language', 'zh');
    if (isStory) {
      out.prop('language_s', 'zh');
      out.prop('language_t', 'zh-tw');
      out.prop('name_s', avatarName.CHS);
      out.prop('name_t', avatarName.CHT);
    }
  }

  if (isStory) {
    let currGroupName: string = '';
    let voGroupNum = 0;
    let voItemNum = 0;
    let miscGroupNum = 0;

    function getStoryFileName(fetter: FetterExcelConfigData): string {
      let prefix = 'VO_{language}{character} ';
      let title = fetter.VoiceTitleTextMap.EN;
      title = title.replace(/:/g, ' -');
      title = title.replace(avatarName.EN, '{character}');
      title = replaceRomanNumerals(title, roman => String(romanToInt(roman)).padStart(2, '0'));
      return prefix + title + '.ogg';
    }

    function getStoryGroupName(fetter: FetterExcelConfigData): string {
      let titleEN = fetter.VoiceTitleTextMap.EN.toLowerCase();
      const miscellany = () => currGroupName.startsWith('Miscellany') ? currGroupName :`Miscellany ${romanize(++miscGroupNum)}`;
      if (titleEN.startsWith('hello')) {
        return 'Hello';
      } else if (titleEN.startsWith('chat')) {
        return 'Chats';
      } else if (
        (
          (titleEN.startsWith('when') || titleEN.startsWith('after') || titleEN.startsWith('in ')) &&
          (titleEN.includes('rain') || titleEN.includes('wind') || titleEN.includes('thunder')
            || titleEN.includes('lightning') || titleEN.includes('snow') || titleEN.includes('sun') || titleEN.includes('desert')
            || titleEN.includes('heat') || titleEN.includes('cold') || titleEN.includes('hot') || titleEN.includes('freez') || titleEN.includes('chill'))
        ) || (
          titleEN.includes('clear day') || titleEN.includes('desert')
        )
      ) {
        return 'Weather';
      } else if (titleEN.startsWith('good morning') || titleEN.startsWith('good afternoon') || titleEN.startsWith('good evening') || titleEN.startsWith('good night')) {
        return 'Greetings';
      } else if (titleEN.startsWith('about ' + avatarName.EN.toLowerCase())) {
        return 'About';
      } else if (titleEN.startsWith('about us')) {
        return 'About Us';
      } else if (titleEN.startsWith('about') && titleEN.includes('vision')) {
        return miscellany();
      } else if (titleEN.startsWith('about ')) {
        return 'About Others';
      } else if (titleEN.startsWith('more about')) {
        return 'More About';
      } else if (titleEN.startsWith('receiving a gift')) {
        return 'Receiving a Gift';
      } else if (titleEN.includes('birthday') || fetter?.OpenCondsSummary?.Birthday) {
        return 'Birthday';
      } else if (titleEN.startsWith('feelings about ascension')) {
        return 'Feelings About Ascension';
      } else {
        return miscellany();
      }
    }

    for (let fetter of fetters) {
      voItemNum++;

      out.emptyLine();

      let groupNameRet = getStoryGroupName(fetter);
      if (groupNameRet !== currGroupName) {
        currGroupName = groupNameRet;
        voGroupNum++;
        voItemNum = 1;
        out.htmlComment(currGroupName);
      }

      out.setPropPrefix(`vo_${String(voGroupNum).padStart(2, '0')}_${String(voItemNum).padStart(2, '0')}_`);

      if (lang === 'CH') {
        out.prop('title_s', fetter.VoiceTitleTextMap.CHS);
        out.prop('title_t', fetter.VoiceTitleTextMap.CHT);
      } else {
        let langProp = opts.swapTitleSubtitle ? userLang : lang;
        out.prop('title', fetter.VoiceTitleTextMap[langProp].replace(avatarName.EN, '{character}'));
      }
      if (lang !== userLang) {
        let langProp = opts.swapTitleSubtitle ? lang : userLang;
        out.prop('subtitle', fetter.VoiceTitleTextMap[langProp].replace(avatarName.EN, '{character}'));
      }

      if (fetter.OpenCondsSummary) {
        if (fetter.OpenCondsSummary.AscensionPhase) {
          out.prop('ascension', fetter.OpenCondsSummary.AscensionPhase);
        }
        if (fetter.OpenCondsSummary.QuestTitleTextMap) {
          out.prop('quest', fetter.OpenCondsSummary.QuestTitleTextMap[userLang]);
        }
        if (fetter.OpenCondsSummary.Friendship) {
          out.prop('friendship', fetter.OpenCondsSummary.Friendship);
        }
        if (fetter.OpenCondsSummary.Statue) {
          out.prop('statue', fetter.OpenCondsSummary.Statue);
        }
        if (fetter.OpenCondsSummary.Waypoint) {
          out.prop('waypoint', fetter.OpenCondsSummary.Waypoint);
        }
      }

      out.prop('file', getStoryFileName(fetter));

      if (lang === 'CH') {
        out.prop('tx_s', fetter.VoiceFileTextMap.CHS);
        out.prop('tx_t', fetter.VoiceFileTextMap.CHT);
        out.prop('rm');
      } else {
        let langProp = opts.swapTitleSubtitle ? userLang : lang;
        out.prop('tx', fetter.VoiceFileTextMap[langProp]);
        if (lang !== 'EN') {
          out.prop('rm');
        }
      }
      if (lang !== userLang) {
        let langProp = opts.swapTitleSubtitle ? lang : userLang;
        out.prop('tl', fetter.VoiceFileTextMap[langProp]);
      }
    }
  }

  if (isCombat) {
    function getCombatFileName(animEvtFileMatch: RegExp, filePrefix: string): string {
      let animEvtFiles = characterFetters.animatorEventFiles;
      let files = [];
      for (let file of animEvtFiles) {
        if (animEvtFileMatch.test(file)) {
          let num = /(\d+)\.ogg/.exec(file)[1];
          files.push(filePrefix + ' ' + num);
        }
      }
      return files.join(',');
    }

    function getCombatGroupCode(fetter: FetterExcelConfigData): string {
      let titleEN = fetter.VoiceTitleTextMap.EN.toLowerCase();
      if (titleEN.includes('skill')) {
        return 'skill';
      } else if (titleEN.includes('burst')) {
        return 'burst';
      } else if (titleEN.includes('sprint start')) {
        return 'sprint-s';
      } else if (titleEN.includes('sprint end')) {
        return 'sprint-e';
      } else if (titleEN.includes('glider')) {
        return 'glider';
      } else if (titleEN.includes('treasure') || titleEN.includes('chest')) {
        return 'chest';
      } else if (titleEN.includes('low hp')) {
        if (titleEN.includes('ally')) {
          return 'ally-low-hp';
        } else {
          return 'low-hp';
        }
      } else if (titleEN.includes('fallen')) {
        return 'fallen';
      } else if (titleEN.includes('light hit')) {
        return 'hit-l';
      } else if (titleEN.includes('heavy hit')) {
        return 'hit-h';
      } else if (titleEN.includes('joining party')) {
        return 'join';
      } else {
        console.log('[VO-App] Was unable to determine combat group for fetter', fetter);
        return 'unknown';
      }
    }

    const combatGroupCodes = new Map<string, { groupTitle: string, animEvtFileMatch: RegExp, filePrefix?: string }>();
    combatGroupCodes.set('skill', { groupTitle: 'Elemental Skill', animEvtFileMatch: null });
    combatGroupCodes.set('burst', { groupTitle: 'Elemental Burst', animEvtFileMatch: null });
    combatGroupCodes.set('sprint-s', { groupTitle: 'Sprint Start', animEvtFileMatch: /sprint start/ });
    combatGroupCodes.set('sprint-e', { groupTitle: 'Sprint End', animEvtFileMatch: /sprint end/ });
    combatGroupCodes.set('glider', { groupTitle: 'Deploying Wind Glider', animEvtFileMatch: /fly start/ });
    combatGroupCodes.set('chest', { groupTitle: 'Opening Treasure Chest', animEvtFileMatch: null });
    combatGroupCodes.set('low-hp', { groupTitle: 'Low HP', animEvtFileMatch: null });
    combatGroupCodes.set('ally-low-hp', { groupTitle: 'Ally Low HP', animEvtFileMatch: null });
    combatGroupCodes.set('fallen', { groupTitle: 'Fallen', animEvtFileMatch: /life die/ });
    combatGroupCodes.set('hit-l', { groupTitle: 'Light Hit Taken', animEvtFileMatch: /hit l/ });
    combatGroupCodes.set('hit-h', { groupTitle: 'Heavy Hit Taken', animEvtFileMatch: /hit h/ });
    combatGroupCodes.set('join', { groupTitle: 'Joining Party', animEvtFileMatch: null });
    combatGroupCodes.set('idle', { groupTitle: 'Character Idles', animEvtFileMatch: /explore idle/, filePrefix: 'Standby' });
    combatGroupCodes.set('atk-l', { groupTitle: 'Light Attack', animEvtFileMatch: /attacklight/ });
    combatGroupCodes.set('atk-m', { groupTitle: 'Mid Attack', animEvtFileMatch: /attackmid/ });
    combatGroupCodes.set('atk-h', { groupTitle: 'Heavy Attack', animEvtFileMatch: /attackheavy/ });
    combatGroupCodes.set('climb', { groupTitle: 'Climbing', animEvtFileMatch: /explore climb(?! breath)/ });
    combatGroupCodes.set('climb-b', { groupTitle: 'Climbing Breath', animEvtFileMatch: /explore climb breath/ });
    combatGroupCodes.set('jump', { groupTitle: 'Jumping', animEvtFileMatch: /jump/ });
    combatGroupCodes.set('unknown', { groupTitle: 'Unknown', animEvtFileMatch: null });
    const combatFettersByGroupCode: {[combatGroupCode: string]: FetterExcelConfigData[]} = defaultMap('Array');

    for (let fetter of fetters) {
      let groupCode = getCombatGroupCode(fetter);
      combatFettersByGroupCode[groupCode].push(fetter);
    }

    for (let groupCode of combatGroupCodes.keys()) {
      let groupMeta = combatGroupCodes.get(groupCode);
      let fetters: FetterExcelConfigData[] = combatFettersByGroupCode[groupCode];
      let file: string;

      if (groupMeta.animEvtFileMatch) {
        file = getCombatFileName(groupMeta.animEvtFileMatch, groupMeta.filePrefix || groupMeta.groupTitle);
      }

      if (file || fetters.length) {
        out.emptyLine();
        out.htmlComment(groupMeta.groupTitle);
      }

      if (file && fetters.length) {
        file = file.split(',').slice(fetters.length).join(',');
      }

      let voItemNum = 0;
      for (; voItemNum < fetters.length; voItemNum++) {
        let fetter: FetterExcelConfigData = fetters[voItemNum];
        out.setPropPrefix(`${groupCode}_${voItemNum + 1}_`);
        if (lang === 'CH') {
          out.prop('tx_s', fetter.VoiceFileTextMap.CHS);
          out.prop('tx_t', fetter.VoiceFileTextMap.CHT);
          if (fetter.VoiceFileTextMap.CHS === fetter.VoiceFileTextMap.CHT) {
            out.prop('rm');
          } else {
            out.prop('rm_s');
            out.prop('rm_t');
          }
        } else {
          let langProp = opts.swapTitleSubtitle ? userLang : lang;
          out.prop('tx', fetter.VoiceFileTextMap[langProp]);
          if (lang !== 'EN') {
            out.prop('rm');
          }
        }
        if (lang !== userLang) {
          let langProp = opts.swapTitleSubtitle ? lang : userLang;
          out.prop('tl', fetter.VoiceFileTextMap[langProp]);
        }
      }
      if (file) {
        out.setPropPrefix(`${groupCode}_${voItemNum + 1}_`);
        out.prop('file', file);
      }
    }
  }
  out.line('}}');

  return { templateName, wikitext: out.toString() };
}
