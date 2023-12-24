import { SbOut } from '../../../../shared/util/stringUtil.ts';
import { CommonVoiceOver } from '../../../../shared/types/common-types.ts';
import { defaultMap } from '../../../../shared/util/genericUtil.ts';
import {
  PropFillMode, VoAppPreloadCombatContext,
  VoAppPreloadConfig,
  VoAppPreloadInput,
  VoAppPreloadOptions,
  VoAppPreloadResult, VoAppPreloadStoryContext,
} from './vo-preload-types.ts';

// region Main Function
// --------------------------------------------------------------------------------------------------------------
export function voPreload(input: VoAppPreloadInput, conf: VoAppPreloadConfig): VoAppPreloadResult {
  if (!conf) {
    return { templateName: 'VO', wikitext: '(Preload not implemented yet)' };
  }

  const out: SbOut = createSbOutForVoPreload(input.opts);
  input.templateName = conf.getTemplateName(input);
  input.out = out;

  appendTemplateStart(out, input, conf);

  if (input.isStory) {
    processStoryVO(out, input, conf);
  }
  if (input.isCombat) {
    processCombatVO(out, input, conf);
  }

  appendTemplateEnd(out, input, conf);

  return { templateName: input.templateName, wikitext: out.toString() };
}
// endregion

// region Process Story VO
// --------------------------------------------------------------------------------------------------------------
function processStoryVO(out: SbOut, input: VoAppPreloadInput, conf: VoAppPreloadConfig): void {
  let { state, avatarName, lang, userLang, opts } = input;
  const ctx = new VoAppPreloadStoryContext();
  input.storyContext = ctx;

  for (let voiceOver of state.voiceOverGroup.storyVoiceOvers) {
    input.voiceOver = voiceOver;
    ctx.voItemNum++;

    out.emptyLine();

    let groupNameRet = conf.getStoryGroupName(input);
    if (groupNameRet !== ctx.currGroupName) {
      ctx.currGroupName = groupNameRet;
      ctx.voGroupNum++;
      ctx.voItemNum = 1;
      out.htmlComment(ctx.currGroupName);
    }

    out.setPropPrefix(`vo_${String(ctx.voGroupNum).padStart(2, '0')}_${String(ctx.voItemNum).padStart(2, '0')}_`);

    if (lang === 'CH') {
      out.prop('title_s', voiceOver.TitleTextMap.CHS);
      out.prop('title_t', voiceOver.TitleTextMap.CHT);
    } else {
      let langProp = opts.swapTitleSubtitle ? userLang : lang;
      out.prop('title', voiceOver.TitleTextMap[langProp].replace(avatarName.EN, '{character}'));
    }
    if (lang !== userLang) {
      let langProp = opts.swapTitleSubtitle ? lang : userLang;
      out.prop('subtitle', voiceOver.TitleTextMap[langProp].replace(avatarName.EN, '{character}'));
    }

    conf.runStoryExtraHook(input);

    out.prop('file', conf.getStoryFileName(input));

    if (lang === 'CH') {
      out.prop('tx_s', voiceOver.DescTextMap.CHS);
      out.prop('tx_t', voiceOver.DescTextMap.CHT);
      out.prop('rm');
    } else {
      let langProp = opts.swapTitleSubtitle ? userLang : lang;
      out.prop('tx', voiceOver.DescTextMap[langProp]);
      if (lang !== 'EN') {
        out.prop('rm');
      }
    }
    if (lang !== userLang) {
      let langProp = opts.swapTitleSubtitle ? lang : userLang;
      out.prop('tl', voiceOver.DescTextMap[langProp]);
    }
  }
}
// endregion

// region Process Combat VO
// --------------------------------------------------------------------------------------------------------------
function processCombatVO(out: SbOut, input: VoAppPreloadInput, conf: VoAppPreloadConfig): void {
  let { state, lang, userLang, opts } = input;
  input.combatContext = new VoAppPreloadCombatContext();

  function getCombatFileName(animEvtFileMatch: RegExp, filePrefix: string): string {
    return state.voiceOverGroup.animatorEventFiles.filter(f => animEvtFileMatch.test(f)).map(file => {
      let num = /(\d+)\.ogg/.exec(file)[1];
      return filePrefix + ' ' + num;
    }).join(',');
  }

  const combatFettersByGroupCode: {[combatGroupCode: string]: CommonVoiceOver[]} = defaultMap('Array');

  for (let voiceOver of state.voiceOverGroup.combatVoiceOvers) {
    input.voiceOver = voiceOver;
    let groupCode = conf.getCombatGroupCode(input);
    combatFettersByGroupCode[groupCode].push(voiceOver);
  }

  const combatGroupCodes = conf.getCombatGroupCodes(input);
  for (let groupCode of combatGroupCodes.keys()) {
    let groupMeta = combatGroupCodes.get(groupCode);
    let voiceOvers: CommonVoiceOver[] = combatFettersByGroupCode[groupCode];
    let animatorEvtFile: string;

    if (groupMeta.animEvtFileMatch) {
      animatorEvtFile = getCombatFileName(groupMeta.animEvtFileMatch, groupMeta.filePrefix || groupMeta.groupTitle);
    }

    if (animatorEvtFile || voiceOvers.length) {
      out.emptyLine();
      out.htmlComment(groupMeta.groupTitle);
    }

    if (animatorEvtFile && voiceOvers.length) {
      animatorEvtFile = animatorEvtFile.split(',').slice(voiceOvers.length).join(',');
    }

    let voItemNum = 0;
    for (; voItemNum < voiceOvers.length; voItemNum++) {
      let fetter: CommonVoiceOver = voiceOvers[voItemNum];
      out.setPropPrefix(`${groupCode}_${voItemNum + 1}_`);
      if (lang === 'CH') {
        out.prop('tx_s', fetter.DescTextMap.CHS);
        out.prop('tx_t', fetter.DescTextMap.CHT);
        if (fetter.DescTextMap.CHS === fetter.DescTextMap.CHT) {
          out.prop('rm');
        } else {
          out.prop('rm_s');
          out.prop('rm_t');
        }
      } else {
        let langProp = opts.swapTitleSubtitle ? userLang : lang;
        out.prop('tx', fetter.DescTextMap[langProp]);
        if (lang !== 'EN') {
          out.prop('rm');
        }
      }
      if (lang !== userLang) {
        let langProp = opts.swapTitleSubtitle ? lang : userLang;
        out.prop('tl', fetter.DescTextMap[langProp]);
      }
    }
    if (animatorEvtFile) {
      out.setPropPrefix(`${groupCode}_${voItemNum + 1}_`);
      out.prop('file', animatorEvtFile);
    }
  }
}
// endregion

// region String Builder Support
// --------------------------------------------------------------------------------------------------------------
function createSbOutForVoPreload(opts: VoAppPreloadOptions): SbOut {
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
  return out;
}

function appendTemplateStart(out: SbOut, input: VoAppPreloadInput, conf: VoAppPreloadConfig) {
  let { templateName, lang, isStory, avatarName } = input;

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
}

function appendTemplateEnd(out: SbOut, input: VoAppPreloadInput, conf: VoAppPreloadConfig) {
  out.line('}}');
}
// endregion