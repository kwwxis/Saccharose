import { LangCode } from '../../../shared/types/lang-types';
import { genericNormText, mergeMcTemplate, TextNormalizer } from '../generic/genericNormalizers';

function proxyPlaceholder(langCode: LangCode = 'EN', degender: boolean = false): string {
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

export const normZenlessText: TextNormalizer = (text: string, langCode: LangCode, decolor: boolean = false, plaintext: boolean = false, plaintextMcMode: 'both' | 'male' | 'female' = 'both'): string => {
  if (!text) {
    return text;
  }

  text = genericNormText(text, langCode, decolor, plaintext, plaintextMcMode, proxyPlaceholder);

  if (!decolor && !plaintext) {
    text = text.replace(/<color=#\{0}>(.*?)<\/color>/g, `'''$1'''`);
    text = text.replace(/<color=(#[0-9a-fA-F]{6})FF>(.*?)<\/color>/g, '{{color|$1|$2}}');
  }

  // if (text.includes('{RUBY')) {
  //   text = text.replace(/\{RUBY_B#(.*?)}(.*?)\{RUBY_E#}/g, '{{Rubi|$2|$1}}');
  // }

  text = mergeMcTemplate(text, langCode, plaintext)

  return text;
};