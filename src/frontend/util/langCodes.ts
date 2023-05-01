import { LangCodeMap } from '../../shared/types/lang-types';

export const languages: LangCodeMap<string> = (() => {
  let viewStackMeta: HTMLMetaElement = document.querySelector('meta[name="langCodes"]');
  let langCodesStr = viewStackMeta.content;
  viewStackMeta.remove();
  return JSON.parse(langCodesStr);
})();

(<any> window).appLanguages = languages;