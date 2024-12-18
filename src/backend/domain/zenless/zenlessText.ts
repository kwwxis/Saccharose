import { LangCode } from '../../../shared/types/lang-types.ts';
import {
  genericNormText,
  mergeMcTemplate,
  NormTextOptions,
  postProcessBoldItalic,
} from '../abstract/genericNormalizers.ts';
import { ZENLESS_DISABLED } from '../../loadenv.ts';

export type ZenlessNormTextOpts = {

};

function __proxyPlaceholder(langCode: LangCode = 'EN', _degender: boolean = false): string {
  switch (langCode) {
    case 'CH':
      return '(绳匠)';
    case 'CHS':
      return '(绳匠)';
    case 'CHT':
      return '(繩匠)';
    case 'DE':
      return '(Proxy)';
    case 'EN':
      return '(Proxy)';
    case 'ES':
      return '(Proxy)';
    case 'FR':
      return '(Proxy)';
    case 'ID':
      return '(Proxy)';
    case 'IT':
      return '(n/a)'; // not supported in-game
    case 'JP':
      return '(プロキシ)';
    case 'KR':
      return '(プロキシ)';
    case 'PT':
      return '(Proxy)';
    case 'RU':
      return '(Proxy)';
    case 'TH':
      return '(Proxy)';
    case 'TR':
      return '(n/a)'; // not supported in-game
    case 'VI':
      return '(Proxy)';
  }
  return '(Proxy)';
}

/**
 * **Never use this function directly!!!**
 *
 * Always go through {@link AbstractControl#normText|AbstractControl.normText()}
 *
 * There are options that the Control may add on depending on user preferences.
 */
export function __normZenlessText(text: string, langCode: LangCode, opts: NormTextOptions<ZenlessNormTextOpts> = {}): string {
  if (!text) {
    return text;
  }

  if (!opts)
    opts = {};
  if (!opts.mcPlaceholderProvider)
    opts.mcPlaceholderProvider = __proxyPlaceholder;

  text = genericNormText(text, langCode, opts, {
    brFormat: '<br />'
  });

  if (!opts.decolor && !opts.plaintext) {
    text = text.replace(/<color=#\{0}>(.*?)<\/color>/g, `<b>$1</b>`);
    text = text.replace(/<color=#FFFFFF(?:FF)?>(.*?)<\/color>/g, `<b>$1</b>`);
    text = postProcessBoldItalic(text, opts);

    text = text.replace(/<color=(#[0-9a-fA-F]{6})(?:FF)?>(.*?)<\/color>/g, '{{Color|$1|$2}}');
  }

  text = text.replace(/<IconMap:Icon_(Normal|Evade|Switch|Special|SpecialReady|UltimateReady)>/g,
    (_fm, g: 'Normal'|'Evade'|'Switch'|'Special'|'SpecialReady'|'UltimateReady') => {
      switch (g) {
        case 'Normal':
          return '{{BA}}';
        case 'Evade':
          return '{{Dodge}}';
        case 'Switch':
          return '{{Assist}}';
        case 'Special':
          return '{{SA}}';
        case 'SpecialReady':
          return '{{EX}}';
        case 'UltimateReady':
          return '{{Ult2}}';
      }
    });

  // if (text.includes('{RUBY')) {
  //   text = text.replace(/\{RUBY_B#(.*?)}(.*?)\{RUBY_E#}/g, '{{Rubi|$2|$1}}');
  // }

  text = mergeMcTemplate(text, langCode, opts.plaintext)

  return text;
}

export async function loadZenlessTextSupportingData() {
  if (ZENLESS_DISABLED)
    return;
}
