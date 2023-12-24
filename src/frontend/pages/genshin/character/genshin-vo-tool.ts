import { pageMatch } from '../../../pageMatch.ts';
import { initializeVoTool } from '../../generic/vo-tool/vo-tool.ts';
import {
  CommonAvatar,
  CommonVoiceOverGroup,
  toCommonVoiceOverGroupFromGenshin,
} from '../../../../shared/types/common-types.ts';
import { genshinEndpoints } from '../../../endpoints.ts';
import { FetterGroup } from '../../../../shared/types/genshin/fetter-types.ts';
import { AvatarExcelConfigData, isTraveler } from '../../../../shared/types/genshin/avatar-types.ts';
import {
  VoAppPreloadCombatGroupCodeConf,
  VoAppPreloadConfig,
  VoAppPreloadInput,
} from '../../generic/vo-tool/vo-preload-types.ts';
import { replaceRomanNumerals, romanize, romanToInt } from '../../../../shared/util/stringUtil.ts';

// region General Config
// --------------------------------------------------------------------------------------------------------------
pageMatch('pages/genshin/character/vo-tool', () => {
  initializeVoTool(() => ({
    storagePrefix: 'GENSHIN_',
    imagePathPrefix: '/images/genshin/',

    async fetchVoiceCollection(avatar: CommonAvatar): Promise<CommonVoiceOverGroup<FetterGroup>> {
      const fetterGroup: FetterGroup = await genshinEndpoints.getFetters.get({ avatarId: avatar.Id });
      return toCommonVoiceOverGroupFromGenshin(fetterGroup);
    },

    isMainCharacter(avatar: CommonAvatar<AvatarExcelConfigData>): boolean {
      return isTraveler(avatar.Original);
    },

    preloadConfig: new GenshinVoAppPreloadConfig(),
  }));
});
// endregion

// region Preload Config
// --------------------------------------------------------------------------------------------------------------
export class GenshinVoAppPreloadConfig extends VoAppPreloadConfig {

  // region General Preload Info
  // ------------------------------------------------------------------------------------------------------------
  override getTemplateName(input: VoAppPreloadInput): string {
    if (input.isMainCharacter) {
      if (input.isCombat) {
        return 'VO/Combat';
      } else {
        return 'VO/Traveler';
      }
    } else {
      if (input.isCombat) {
        return 'Combat VO';
      } else {
        return 'VO/Story';
      }
    }
  }
  // endregion

  // region Story Preload Config
  // ------------------------------------------------------------------------------------------------------------
  override getStoryFileName(input: VoAppPreloadInput): string {
    let prefix = 'VO_{language}{character} ';
    let title = input.voiceOver.TitleTextMap.EN;
    title = title.replace(/:/g, ' -');
    title = title.replace(input.avatarName.EN, '{character}');
    title = replaceRomanNumerals(title, roman => String(romanToInt(roman)).padStart(2, '0'));

    if (title === `{character}'s Hobbies`) {
      title = 'Hobbies';
    }

    if (title.startsWith('Feelings About Ascension - ')) {
      title = title.replace('Feelings About Ascension - Intro', 'Feelings About Ascension - 01');
      title = title.replace('Feelings About Ascension - Building Up', 'Feelings About Ascension - 02');
      title = title.replace('Feelings About Ascension - Climax', 'Feelings About Ascension - 03');
      title = title.replace('Feelings About Ascension - Conclusion', 'Feelings About Ascension - 04');
    }

    return prefix + title + '.ogg';
  }

  override getStoryGroupName(input: VoAppPreloadInput): string {
    const { voiceOver, storyContext } = input;
    let titleEN = voiceOver.TitleTextMap.EN.toLowerCase();

    const miscellany = () => storyContext.currGroupName.startsWith('Miscellany')
      ? storyContext.currGroupName
      : `Miscellany ${romanize(++storyContext.miscGroupNum)}`;

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
    } else if (titleEN.startsWith('about ' + input.avatarName.EN.toLowerCase())) {
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
    } else if (titleEN.includes('birthday') || voiceOver?.Original?.OpenCondsSummary?.Birthday) {
      return 'Birthday';
    } else if (titleEN.startsWith('feelings about ascension')) {
      return 'Feelings About Ascension';
    } else {
      return miscellany();
    }
  }

  override runStoryExtraHook(input: VoAppPreloadInput) {
    const { out, voiceOver } = input;
    const fetter = voiceOver.Original;
    if (fetter.OpenCondsSummary) {
      if (fetter.OpenCondsSummary.AscensionPhase) {
        out.prop('ascension', fetter.OpenCondsSummary.AscensionPhase);
      }
      if (fetter.OpenCondsSummary.QuestTitleTextMap) {
        out.prop('quest', fetter.OpenCondsSummary.QuestTitleTextMap[input.userLang]);
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
  }
  // endregion

  // region Combat Preload Config
  // ------------------------------------------------------------------------------------------------------------
  getCombatGroupCode(input: VoAppPreloadInput): string {
    let titleEN: string = input.voiceOver.TitleTextMap.EN.toLowerCase();
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
      console.log('[VO-App] Was unable to determine combat group for voice-over', input.voiceOver);
      return 'unknown';
    }
  }

  override getCombatGroupCodes(input: VoAppPreloadInput): Map<string, VoAppPreloadCombatGroupCodeConf> {
    const combatGroupCodes = new Map<string, VoAppPreloadCombatGroupCodeConf>();
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
    return combatGroupCodes;
  }
  // endregion
}
// endregion