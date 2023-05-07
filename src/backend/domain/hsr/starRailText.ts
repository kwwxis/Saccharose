import { LangCode } from '../../../shared/types/lang-types';
import { genericNormText, mergeMcTemplate, TextNormalizer } from '../generic/genericNormalizers';

function trailblazerPlaceholder(langCode: LangCode = 'EN', degender: boolean = false): string {
  switch (langCode) {
    case 'CH':
      return '(開拓者)';
    case 'CHS':
      return '(開拓者)';
    case 'CHT':
      return '(开拓者)';
    case 'DE':
      return '(Trailblazer)';
    case 'EN':
      return '(Trailblazer)';
    case 'ES':
      return '(Trazacaminos)';
    case 'FR':
      return degender ? '(Pionnier)' : '(Pionnier/Pionnière)';
    case 'ID':
      return '(Trailblazer)';
    case 'IT':
      return '(n/a)'; // not supported in-game
    case 'JP':
      return '(開拓者)';
    case 'KR':
      return '(개척자)';
    case 'PT':
      return degender ? '(Desbravador)' : '(Desbravador/Desbravadora)';
    case 'RU':
      return '(Первопроходец)';
    case 'TH':
      return '( ู้บุกเบิก)';
    case 'TR':
      return '(n/a)'; // not supported in-game
    case 'VI':
      return '(Nhà Khai Phá)';
  }
  return '(Traveler)';
}

export const normStarRailText: TextNormalizer = (text: string, langCode: LangCode, decolor: boolean = false, plaintext: boolean = false, plaintextMcMode: 'both' | 'male' | 'female' = 'both'): string => {
  if (!text) {
    return text;
  }

  text = genericNormText(text, langCode, decolor, plaintext, plaintextMcMode, trailblazerPlaceholder);

  if (!decolor && !plaintext) {
    text = text.replace(/<color=#\{0}>(.*?)<\/color>/g, `'''$1'''`);
    text = text.replace(/<color=(#[0-9a-fA-F]{6})FF>(.*?)<\/color>/g, '{{color|$1|$2}}');
  }

  if (text.includes('{RUBY')) {
    text = text.replace(/\{RUBY_B#(.*?)}(.*?)\{RUBY_E#}/g, '{{Rubi|$2|$1}}');
  }

  text = mergeMcTemplate(text, langCode, plaintext)

  return text;
};