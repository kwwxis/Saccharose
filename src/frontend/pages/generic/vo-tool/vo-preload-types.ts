import { VoAppState } from './vo-tool.ts';
import { LangCode, LangCodeMap } from '../../../../shared/types/lang-types.ts';
import { CommonVoiceOver } from '../../../../shared/types/common-types.ts';
import { SbOut } from '../../../../shared/util/stringUtil.ts';
import { getOutputLanguage } from '../../../core/userPreferences/siteLanguage.ts';

export const VO_PROP_PAD: number = 20;

export type PropFillMode = 'fill' | 'remove' | 'empty';

export type VoAppPreloadOptions = {
  swapTitleSubtitle?: boolean,
  paramFill?: { [paramName: string]: PropFillMode },
}

export class VoAppPreloadInput {
  out: SbOut;
  templateName: string;
  storyContext: VoAppPreloadStoryContext;
  combatContext: VoAppPreloadCombatContext;
  voiceOver: CommonVoiceOver;
  lang: LangCode;
  userLang: LangCode;

  constructor(readonly state: VoAppState,
              readonly mode: 'story' | 'combat',
              readonly opts: VoAppPreloadOptions) {
    this.lang = state.voLang;
    this.userLang = getOutputLanguage();
    if (!this.opts)
      this.opts = {};
  }

  get isStory(): boolean {
    return this.mode === 'story';
  }

  get isCombat(): boolean {
    return this.mode === 'combat';
  }

  get avatarName(): LangCodeMap {
    return this.state.voiceOverGroup.avatarName;
  }

  get isMainCharacter(): boolean {
    return this.state.isMainCharacter();
  }
}

export type VoAppPreloadResult = { templateName: string, wikitext: string };

export class VoAppPreloadStoryContext {
  public currGroupName: string = '';
  public voGroupNum = 0;
  public voItemNum = 0;
  public miscGroupNum: number = 0;
}

export class VoAppPreloadCombatContext {

}

export type VoAppPreloadCombatGroupCodeConf = { groupTitle: string, animEvtFileMatch: RegExp, filePrefix?: string };

export abstract class VoAppPreloadConfig {
  abstract getTemplateName(input: VoAppPreloadInput): string;

  abstract getStoryFileName(input: VoAppPreloadInput): string;
  abstract getStoryGroupName(input: VoAppPreloadInput): string;
  abstract runStoryExtraHook(input: VoAppPreloadInput): void;

  abstract getCombatGroupCode(input: VoAppPreloadInput): string;
  abstract getCombatGroupCodes(input: VoAppPreloadInput): Map<string, VoAppPreloadCombatGroupCodeConf>;
}
