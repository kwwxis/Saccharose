import { LangCode } from '../../../shared/types/lang-types.ts';
import {
  genericNormText,
  mergeMcTemplate,
  NormTextOptions,
  postProcessBoldItalic,
} from '../generic/genericNormalizers.ts';
import { TextJoinConfig, TextJoinItem } from '../../../shared/types/hsr/hsr-misc-types.ts';
import { getStarRailControl } from './starRailControl.ts';
import { logInitData } from '../../util/logger.ts';

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
  return '(Trailblazer)';
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
  text = text.replace(/<align="([^"]+)">/g, '<div align="$1">');
  text = text.replace(/<\/align>/g, '</div>');
  text = text.replace(/<size=([^>]+)>(.*?)<\/size>/gs, opts.plaintext ? '$2' : '{{Size|$1|$2}}');

  if (!opts.decolor && !opts.plaintext) {
    text = text.replace(/<color=#\{0}>(.*?)<\/color>/g, `<b>$1</b>`);
    text = postProcessBoldItalic(text, opts);

    text = text.replace(/<color=#f29e38(?:FF)?>(.*?)<\/color>/gi, '{{Color|highlight|$1|nobold=1}}');
    text = text.replace(/<color=#dd7a00(?:FF)?>(.*?)<\/color>/gi, '{{Color|highlight|$1|nobold=1}}');
    text = text.replace(/<color=#dbc291(?:FF)?>(.*?)<\/color>/gi, '{{Color|keyword|$1|nobold=1}}');
    text = text.replace(/<color=#42a8b9(?:FF)?>(.*?)<\/color>/gi, '{{Color|fthuser|$1|nobold=1}}');
    text = text.replace(/<color=#87e0ff(?:FF)?>(.*?)<\/color>/gi, '{{Color|blue|$1|nobold=1}}');
    text = text.replace(/<color=#77ede5(?:FF)?>(.*?)<\/color>/gi, '{{Color|heliobus|$1|nobold=1}}');
    text = text.replace(/<color=#eb4d3d(?:FF)?>(.*?)<\/color>/gi, '{{Color|fire|$1|nobold=1}}');
    text = text.replace(/<color=#ec505f(?:FF)?>(.*?)<\/color>/gi, '{{Color|fire|$1|nobold=1}}');
    text = text.replace(/<color=#ff3a3e(?:FF)?>(.*?)<\/color>/gi, '{{Color|red|$1|nobold=1}}');
    text = text.replace(/<color=#f3da75(?:FF)?>(.*?)<\/color>/gi, '{{Color|imaginary|$1|nobold=1}}');
    text = text.replace(/<color=#6f7cda(?:FF)?>(.*?)<\/color>/gi, '{{Color|harmonyblue|$1|nobold=1}}');
    text = text.replace(/<color=#ad5e68(?:FF)?>(.*?)<\/color>/gi, '{{Color|harmonyred|$1|nobold=1}}');
    text = text.replace(/<color=#ff4f53(?:FF)?>(.*?)<\/color>/gi, '{{Color|humanoid|$1|nobold=1}}');
    text = text.replace(/<color=#00f6ff(?:FF)?>(.*?)<\/color>/gi, '{{Color|mechanical|$1|nobold=1}}');
    text = text.replace(/<color=#ab88fe(?:FF)?>(.*?)<\/color>/gi, '{{Color|aberrant|$1|nobold=1}}');

    text = text.replace(/({{Color\|[^|]+\|)'''([^|]+)'''\|nobold=1}}/g, '$1$2}}');
    text = text.replace(/('''{{Color\|[^|]+\|)([^|]+)\|nobold=1}}'''/g, '$1$2}}');

    text = text.replace(/<color=(#[0-9a-fA-F]{6,8})>(.*?)<\/color>/g, '<span style="color:$1">$2</span>');
  }

  text = text.replace(/\{TEXTJOIN#(\d+)}/g, (fm: string, g: string) => {
    const id = parseInt(g);
    if (!textJoinConfigMap[id]) {
      return fm;
    }
    return '(' + textJoinConfigMap[id].TextJoinItemListMapped.map(x => x.TextJoinTextMap[langCode]).join('/') + ')';
  });

  if (text.includes('{RUBY')) {
    text = text.replace(/\{RUBY_B#(.*?)}(.*?)\{RUBY_E#}/g, '{{Rubi|$2|$1}}');
  }

  if (langCode === 'KR') {
    text = text.replace(/&nbsp;/g, ' ');
  }

  text = mergeMcTemplate(text, langCode, opts.plaintext)

  return text;
}

const textJoinConfigMap: {[id: number]: TextJoinConfig} = {};

export async function loadStarRailTextSupportingData() {
  logInitData('Loading HSR-supporting text data -- starting...');

  const ctrl = getStarRailControl();

  const textJoinItemMap = await ctrl.readExcelDataFileToStream<TextJoinItem>('TextJoinItem.json')
    .mappingScalar('TextJoinTextMapHash', 'TextJoinTextMap', hash => ctrl.createLangCodeMap(hash))
    .toMap('TextJoinItemId');

  await ctrl.readExcelDataFileToStream<TextJoinConfig>('TextJoinConfig.json')
    .mappingVector('TextJoinItemList', 'TextJoinItemListMapped', id => textJoinItemMap[id])
    .toMap('TextJoinId', textJoinConfigMap);

  logInitData('Loading HSR-supporting text data -- Done!');
}
