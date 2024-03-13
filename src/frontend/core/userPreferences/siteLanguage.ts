import { GeneralEventBus } from '../generalEventBus.ts';
import { DEFAULT_LANG, LangCode, LangCodeMap } from '../../../shared/types/lang-types.ts';
import { tag } from '../../util/domutil.ts';
import { Listener } from '../../util/eventListen.ts';
import { USER_PREFS, setUserPref } from './sitePrefsContainer.ts';

export const languages: LangCodeMap<string> = (() => {
  let viewStackMeta: HTMLMetaElement = document.querySelector('meta[name="langCodes"]');
  let langCodesStr = viewStackMeta.content;
  viewStackMeta.remove();
  return JSON.parse(langCodesStr);
})();

(<any> window).appLanguages = languages;

async function processLangCodeChange(name: 'inputLangCode' | 'outputLangCode', value: LangCode) {
  console.log('Language selector: Name='+name+', Value='+value);

  await setUserPref(name, value);

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

  switch (name) {
    case 'inputLangCode':
      GeneralEventBus.emit('inputLangCodeChanged', value);
      break;
    case 'outputLangCode':
      GeneralEventBus.emit('outputLangCodeChanged', value);
      break;
  }
}

export const SiteLanguageListener: Listener = {
  selector: '.header-language-selector select',
  event: 'change',
  multiple: true,
  handle: async function(_event: Event, target: HTMLSelectElement) {
    if (target.name === 'inputLangCode') {
      await setInputLanguage(target.value as LangCode);
    }
    if (target.name === 'outputLangCode') {
      await setOutputLanguage(target.value as LangCode);
    }
  }
};

export async function setInputLanguage(value: LangCode) {
  await processLangCodeChange('inputLangCode', value);
}

export function getInputLanguage(): LangCode {
  return USER_PREFS.inputLangCode || DEFAULT_LANG;
}

export async function setOutputLanguage(value: LangCode) {
  await processLangCodeChange('outputLangCode', value);
}

export function getOutputLanguage(): LangCode {
  return USER_PREFS.outputLangCode || DEFAULT_LANG;
}

export function onInputLanguageChanged(handler: (langCode?: LangCode) => void) {
  GeneralEventBus.on('inputLangCodeChanged', handler);
}

export function onOutputLanguageChanged(handler: (langCode?: LangCode) => void) {
  GeneralEventBus.on('outputLangCodeChanged', handler);
}
