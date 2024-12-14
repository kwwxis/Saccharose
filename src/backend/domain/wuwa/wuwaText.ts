import { LangCode } from '../../../shared/types/lang-types.ts';
import {
  genericNormText,
  mergeMcTemplate,
  NormTextOptions,
  postProcessBoldItalic,
} from '../abstract/genericNormalizers.ts';

export type WuwaNormTextOpts = {

};

function __roverPlaceholder(langCode: LangCode = 'EN', _degender: boolean = false): string {
  switch (langCode) {
    case 'CH':
      return '(漂泊者)';
    case 'CHS':
      return '(漂泊者)';
    case 'CHT':
      return '(漂泊者)';
    case 'DE':
      return '(Rover)';
    case 'EN':
      return '(Rover)';
    case 'ES':
      return '(Errante)';
    case 'FR':
      return '(Nomade)';
    case 'ID':
      return '(Rover)';
    case 'IT':
      return '(Rover)'; // not supported in-game
    case 'JP':
      return '(漂泊者)';
    case 'KR':
      return '(방랑자)';
    case 'PT':
      return '(Rover)';
    case 'RU':
      return '(Rover)';
    case 'TH':
      return '(Rover)';
    case 'TR':
      return '(Rover)'; // not supported in-game
    case 'VI':
      return '(Rover)';
  }
  return '(Rover)';
}

/**
 * **Never use this function directly!!!**
 *
 * Always go through {@link AbstractControl#normText|AbstractControl.normText()}
 *
 * There are options that the Control may add on depending on user preferences.
 */
export function __normWuwaText(text: string, langCode: LangCode, opts: NormTextOptions<WuwaNormTextOpts> = {}): string {
  if (!text) {
    return text;
  }

  if (!opts)
    opts = {};
  if (!opts.mcPlaceholderProvider)
    opts.mcPlaceholderProvider = __roverPlaceholder;

  text = genericNormText(text, langCode, opts, {
    brFormat: '<br />'
  });
  text = text.replace(/<size=([^>]+)>(.*?)<\/size>/gs, opts.plaintext ? '$2' : '{{Size|$1|$2}}');

  if (!opts.decolor && !opts.plaintext) {
    text = text.replace(/<color=#\{0}>(.*?)<\/color>/g, `<b>$1</b>`);
    text = postProcessBoldItalic(text, opts);

    text = text.replace(/<color=title>(.*?)<\/color>/gi, '{{Color|menu|$1|nobold=1}}');
    text = text.replace(/<color=highlight>(.*?)<\/color>/gi, '{{Color|help|$1|nobold=1}}');

    text = text.replace(/<color=wind>(.*?)<\/color>/gi, '{{Color|Aero|$1|nobold=1}}');
    text = text.replace(/<color=light>(.*?)<\/color>/gi, '{{Color|Spectro|$1|nobold=1}}');
    text = text.replace(/<color=fire>(.*?)<\/color>/gi, '{{Color|Fusion|$1|nobold=1}}');
    text = text.replace(/<color=thunder>(.*?)<\/color>/gi, '{{Color|Electro|$1|nobold=1}}');
    text = text.replace(/<color=ice>(.*?)<\/color>/gi, '{{Color|Glacio|$1|nobold=1}}');
    text = text.replace(/<color=dark>(.*?)<\/color>/gi, '{{Color|Havoc|$1|nobold=1}}');
    46
    text = text.replace(/({{Color\|[^|]+\|)'''([^|]+)'''\|nobold=1}}/g, '$1$2}}');
    text = text.replace(/('''{{Color\|[^|]+\|)([^|]+)\|nobold=1}}'''/g, '$1$2}}');

    text = text.replace(/<color=(#[0-9a-fA-F]{6,8})>(.*?)<\/color>/g, '<span style="color:$1">$2</span>');
  }

  text = mergeMcTemplate(text, langCode, opts.plaintext)

  return text;
}

export async function loadWuwaTextSupportingData() {

}
