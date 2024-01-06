import { GeneralEventBus } from '../generalEventBus.ts';
import { DEFAULT_LANG, LangCode, LangCodeMap } from '../../../shared/types/lang-types.ts';
import Cookies from 'js-cookie';
import { tag } from '../../util/domutil.ts';
import { Listener } from '../../util/eventListen.ts';

export const languages: LangCodeMap<string> = (() => {
  let viewStackMeta: HTMLMetaElement = document.querySelector('meta[name="langCodes"]');
  let langCodesStr = viewStackMeta.content;
  viewStackMeta.remove();
  return JSON.parse(langCodesStr);
})();

(<any> window).appLanguages = languages;

export function initializeSiteLanguageEvents() {
  function langCodeChanged(name: 'inputLangCode' | 'outputLangCode', value: LangCode) {
    console.log('Language selector: Name='+name+', Value='+value);
    Cookies.set(name, value, { expires: 365 });

    const processOption = (opt: HTMLElement) => {
      let isSelectOption = tag(opt) === 'option';
      let optValue = (opt.hasAttribute('value')
          ? opt.getAttribute('value')
          : opt.getAttribute('data-value')
      ) || opt.textContent;
      if (optValue === value) {
        if (isSelectOption) {
          if (!opt.hasAttribute('selected')) {
            opt.setAttribute('selected', 'selected');
          }
        } else {
          opt.classList.add('selected');
        }
      } else {
        if (isSelectOption) {
          if (opt.hasAttribute('selected')) {
            opt.removeAttribute('selected');
          }
        } else {
          opt.classList.remove('selected');
        }
      }
    }

    const processCurrentValueElement = (el: HTMLElement) => {
      el.setAttribute('data-value', value);
      if (el.hasAttribute('value')) {
        el.setAttribute('value', value);
      }
      if (tag(el) != 'input' && tag(el)!= 'select' && tag(el) !== 'textarea') {
        el.textContent = languages[value];
      }
    };

    let elements = Array.from(document.querySelectorAll(`[name="${name}"], [data-name="${name}"], [data-for="${name}"], [data-control="${name}"]`));
    for (let element of elements) {
      if (tag(element) === 'select') {
        element.querySelectorAll('option').forEach(el => processOption(el));
      } else if (tag(element) === 'span' || tag(element) === 'p' || tag(element) === 'div' || tag(element) === 'section') {
        element.querySelectorAll('.option').forEach(el => processOption(el as HTMLElement));

        if (element.classList.contains('current-value') || element.classList.contains('current-option')) {
          processCurrentValueElement(element as HTMLElement);
        } else {
          element.querySelectorAll('.current-value, .current-option').forEach(el => processCurrentValueElement(el as HTMLElement))
        }
      }
    }
  }

  GeneralEventBus.on('inputLangCodeChanged', (langCode: LangCode) => {
    langCodeChanged('inputLangCode', langCode);
  });
  GeneralEventBus.on('outputLangCodeChanged', (langCode: LangCode) => {
    langCodeChanged('outputLangCode', langCode);
  });
}

export const SiteLanguageListener: Listener = {
  selector: '.header-language-selector select',
  event: 'change',
  multiple: true,
  handle: function(_event: Event, target: HTMLSelectElement) {
    if (target.name === 'inputLangCode') {
      setInputLanguage(target.value as LangCode);
    }
    if (target.name === 'outputLangCode') {
      setOutputLanguage(target.value as LangCode);
    }
  }
};

export function setInputLanguage(value: LangCode) {
  GeneralEventBus.emit('inputLangCodeChanged', value);
}

export function getInputLanguage(): LangCode {
  return (Cookies.get('inputLangCode') || DEFAULT_LANG) as LangCode;
}

export function setOutputLanguage(value: LangCode) {
  GeneralEventBus.emit('outputLangCodeChanged', value);
}

export function getOutputLanguage(): LangCode {
  return (Cookies.get('outputLangCode') || DEFAULT_LANG) as LangCode;
}

export function onInputLanguageChanged(handler: (langCode?: LangCode) => void) {
  GeneralEventBus.on('inputLangCodeChanged', handler);
}

export function onOutputLanguageChanged(handler: (langCode?: LangCode) => void) {
  GeneralEventBus.on('outputLangCodeChanged', handler);
}
