import { VoAppState } from './vo-tool';
import * as ace from 'brace';
import { flashTippy } from '../../util/tooltips';
import { createWikitextEditor } from '../../util/wikitextEditor';

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
      let wikitext = document.querySelector<HTMLElement>('#wikitext-editor');
      flashTippy(wikitext, {content: 'Loaded locally saved text for ' + state.avatar.NameText + ' (' + state.voLang + ')', delay:[0,2000]});
    }
  }

  function localSave() {
    console.log('[VO-App] Wikitext Local Save');
    let editorValue = editor.getValue();
    let localKey = 'CHAR_VO_WIKITEXT_' + state.voLang + '_' + state.avatar.Id;

    if (!editorValue || !editorValue.trim()) {
      window.localStorage.removeItem(localKey);
    } else {
      window.localStorage.setItem(localKey, editorValue);
    }
  }

  localLoad(true);

  editor.on('blur', (e) => {
    console.log('Wikitext blur', e);
    localSave();
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
  window.addEventListener('beforeunload', () => {
    localSave();
  });
}