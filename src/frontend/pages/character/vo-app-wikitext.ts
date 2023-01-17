import { VoAppState } from './vo-tool';
import * as ace from 'brace';
import { flashTippy } from '../../util/tooltips';
import { createWikitextEditor } from '../../util/ace/wikitextEditor';
import { VoHandle } from '../../../shared/vo-tool/vo-handle';
import { mwParse } from '../../../shared/mediawiki/mwParse';
import { MwTemplateNode } from '../../../shared/mediawiki/mwTypes';
import Cookies from 'js-cookie';
import { preloadFromFetters } from './vo-app-preload';
import { LangCode } from '../../../shared/types/dialogue-types';

export function VoAppWikitext(state: VoAppState) {
  const editor: ace.Editor = createWikitextEditor('wikitext-editor');

  function localLoad(isFirstLoad: boolean = false) {
    console.log('[VO-App] Wikitext Local Load');
    let localStorageValue = window.localStorage.getItem('CHAR_VO_WIKITEXT_' + state.voLang + '_' + state.avatar.Id);

    if (localStorageValue) {
      editor.setValue(localStorageValue, -1);
    } else {
      editor.setValue('', -1);
    }
    if (!isFirstLoad) {
      let langButton = document.querySelector<HTMLElement>('#vo-app-language-button');
      flashTippy(langButton, {content: 'Loaded locally saved text for ' + state.avatar.NameText + ' (' + state.voLang + ')', delay:[0,2000]});
    }
    state.eventBus.emit('VO-Editor-Reload', localStorageValue || '');
  }

  function localSave() {
    console.log('[VO-App] Wikitext Local Save');
    let editorValue = editor.getValue();
    let localKey = 'CHAR_VO_WIKITEXT_' + state.voLang + '_' + state.avatar.Id;
    let timeKey = localKey + '_UPDATETIME';

    if (!editorValue || !editorValue.trim()) {
      window.localStorage.removeItem(localKey);
      window.localStorage.removeItem(timeKey);
    } else {
      window.localStorage.setItem(localKey, editorValue);
      window.localStorage.setItem(timeKey, String(Date.now()));
    }
  }

  localLoad(true);

  editor.on('blur', (e) => {
    console.log('Wikitext blur', e);
    localSave();
    state.eventBus.emit('VO-Editor-Reload', editor.getValue());
  });

  state.eventBus.on('VO-Wikitext-LocalLoad', () => {
    localLoad();
  });
  state.eventBus.on('VO-Wikitext-LocalSave', () => {
    localSave();
  });
  state.eventBus.on('VO-Wikitext-SetValue', (newValue: string) => {
    editor.setValue(newValue, -1);
    localSave();
  });
  state.eventBus.on('VO-Wikitext-RequestValue', (cb: (value: string) => void) => {
    cb(editor.getValue());
  });
  state.eventBus.on('VO-Wikitext-SetFromVoHandle', (voHandle: VoHandle) => {
    let templateName = voHandle.templateNode.templateName;
    let wikitext = mwParse(editor.getValue());
    let templateFound: MwTemplateNode = null;

    for (let wikitextTemplate of wikitext.findTemplateNodes()) {
      if (wikitextTemplate.templateName.toLowerCase() === templateName.toLowerCase()) {
        templateFound = wikitextTemplate;
        wikitextTemplate.parts = voHandle.templateNode.parts;
      }
    }

    if (templateFound) {
      let stringified = wikitext.toString();
      console.log('[VO-App] Replaced {{' + templateFound.templateName + '}} in wikitext with editor result.', { stringified });
      editor.setValue(stringified, -1);
      editor.resize();
      localSave();
    }
  });
  state.eventBus.on('VO-Wikitext-OverwriteFromFetters', (requestedMode: string) => {
    if (!state.fetters) {
      return;
    }
    let voLang: LangCode = state.voLang;
    let userLang: LangCode = (Cookies.get('outputLangCode') || 'EN') as LangCode;
    let mode: 'story' | 'combat' = null;
    if (requestedMode === 'story') {
      mode = 'story';
    } else if (requestedMode === 'combat') {
      mode = 'combat';
    } else {
      return;
    }

    let result = preloadFromFetters(state.fetters, mode, voLang, userLang);
    let parsedResult: MwTemplateNode = mwParse(result.wikitext).findTemplateNodes()[0];

    let wikitext = mwParse(editor.getValue());
    let templateFound: MwTemplateNode = null;
    for (let wikitextTemplate of wikitext.findTemplateNodes()) {
      if (wikitextTemplate.templateName.toLowerCase() === result.templateName.toLowerCase()) {
        templateFound = wikitextTemplate;
        wikitextTemplate.parts = parsedResult.parts;
      }
    }

    let scrollTop = editor.session.getScrollTop();
    if (templateFound) {
      let stringified = wikitext.toString();
      console.log('[VO-App] Replaced {{' + templateFound.templateName + '}} in wikitext with load from fetters.', { stringified });
      editor.setValue(stringified, -1);
      editor.resize();
      editor.session.setScrollTop(scrollTop);
      localSave();
      state.eventBus.emit('VO-Editor-Reload', editor.getValue());
    } else {
      let stringified = editor.getValue() + '\n\n' + result.wikitext;
      console.log('[VO-App] Appended {{' + result.templateName + '}} to wikitext with load from fetters.', { stringified });
      editor.setValue(stringified, -1);
      editor.resize();
      editor.session.setScrollTop(scrollTop);
      localSave();
      state.eventBus.emit('VO-Editor-Reload', editor.getValue());
    }
  });

  window.addEventListener('beforeunload', () => {
    localSave();
  });

  document.querySelector('#tab-wikitext').addEventListener('click', () => {
    // Editor resize must be called if the editor container is resized or displayed.
    setTimeout(() => {
      console.log('[VO-App] Wikitext tab entered.');
      editor.resize();
    });
  });
}