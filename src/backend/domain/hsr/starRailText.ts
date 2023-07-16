import { LangCode } from '../../../shared/types/lang-types';
import { genericNormText, mergeMcTemplate, NormTextOptions } from '../generic/genericNormalizers';

function __trailblazerPlaceholder(langCode: LangCode = 'EN', degender: boolean = false): string {
  switch (langCode) {
    case 'CH':
      return '(开拓者)';
    case 'CHS':
      return '(开拓者)';
    case 'CHT':
      return '(開拓者)';
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

/**
 * **Never use this function directly!!!**
 *
 * Always go through {@link AbstractControl#normText|AbstractControl.normText()}
 *
 * There are options that the Control may add on depending on user preferences.
 */
export function __normStarRailText(text: string, langCode: LangCode, opts: NormTextOptions = {}): string {
  if (!text) {
    return text;
  }

  if (!opts)
    opts = {};
  if (!opts.mcPlaceholderProvider)
    opts.mcPlaceholderProvider = __trailblazerPlaceholder;

  text = genericNormText(text, langCode, opts);
  text = text.replace(/<\/?unbreak>/g, '');

  if (!opts.decolor && !opts.plaintext) {
    text = text.replace(/<color=#\{0}>(.*?)<\/color>/g, `'''$1'''`);
    text = text.replace(/<color=(#[0-9a-fA-F]{6})FF>(.*?)<\/color>/g, '{{color|$1|$2}}');
  }

  if (text.includes('{RUBY')) {
    text = text.replace(/\{RUBY_B#(.*?)}(.*?)\{RUBY_E#}/g, '{{Rubi|$2|$1}}');
  }

  if (langCode === 'KR') {
    text = text.replace(/&nbsp;/g, ' ');
  }

  text = mergeMcTemplate(text, langCode, opts.plaintext)

  return text;
}