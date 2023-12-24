import { LangCode } from '../../../shared/types/lang-types.ts';
import {
  genericNormText,
  mergeMcTemplate,
  NormTextOptions,
  postProcessBoldItalic,
} from '../generic/genericNormalizers.ts';

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
  return '(Traveler)';
}

/**
 * **Never use this function directly!!!**
 *
 * Always go through {@link AbstractControl#normText|AbstractControl.normText()}
 *
 * There are options that the Control may add on depending on user preferences.
 */
export function __normZenlessText(text: string, langCode: LangCode, opts: NormTextOptions = {}): string {
  if (!text) {
    return text;
  }

  if (!opts)
    opts = {};
  if (!opts.mcPlaceholderProvider)
    opts.mcPlaceholderProvider = __proxyPlaceholder;

  text = genericNormText(text, langCode, opts);

  if (!opts.decolor && !opts.plaintext) {
    text = text.replace(/<color=#\{0}>(.*?)<\/color>/g, `<b>$1</b>`);
    text = postProcessBoldItalic(text, opts);
    text = text.replace(/<color=(#[0-9a-fA-F]{6})FF>(.*?)<\/color>/g, '{{color|$1|$2}}');
  }

  // if (text.includes('{RUBY')) {
  //   text = text.replace(/\{RUBY_B#(.*?)}(.*?)\{RUBY_E#}/g, '{{Rubi|$2|$1}}');
  // }

  text = mergeMcTemplate(text, langCode, opts.plaintext)

  return text;
}

export async function loadZenlessTextSupportingData() {

}