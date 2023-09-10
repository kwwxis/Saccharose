import { LangCode } from '../../../../shared/types/lang-types';
import { VoAppState } from './vo-tool';
import { SbOut } from '../../../../shared/util/stringUtil';

export type PropFillMode = 'fill' | 'remove' | 'empty';

export type VoAppPreloadOptions = {
  swapTitleSubtitle?: boolean,
  paramFill?: { [paramName: string]: PropFillMode },
}

export type VoAppPreloadResult = { templateName: string, wikitext: string };

export type VoAppPreloadFunction = (state: VoAppState,
                              mode: 'story' | 'combat',
                              lang: LangCode,
                              userLang: LangCode,
                              opts: VoAppPreloadOptions) => VoAppPreloadResult;

export function createSbOutForVoPreload(opts: VoAppPreloadOptions): SbOut {
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