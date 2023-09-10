import { VoAppState } from './vo-tool';
import * as ace from 'brace';
import { flashTippy } from '../../../util/tooltips';
import { createWikitextEditor } from '../../../util/ace/wikitextEditor';
import { VoHandle } from './vo-handle';
import { mwParse } from '../../../../shared/mediawiki/mwParse';
import { MwTemplateNode } from '../../../../shared/mediawiki/mwTypes';
import Cookies from 'js-cookie';
import { DEFAULT_LANG, LangCode } from '../../../../shared/types/lang-types';
import { VoAppPreloadOptions, VoAppPreloadResult } from './vo-preload-support';

function compareTemplateName(t1: string, t2: string) {
  return t1?.toLowerCase()?.replace(/_/g, ' ') === t2?.toLowerCase()?.replace(/_/g, ' ');
}

export function VoAppWikitextEditor(state: VoAppState) {
  const editor: ace.Editor = createWikitextEditor('wikitext-editor');

  let editorEl = document.getElementById('wikitext-editor');
  editorEl.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 70) {
      e.preventDefault();
      e.stopPropagation();
      editor.execCommand('find');
    }
  });

  let reformatButtonEl = document.getElementById('wikitext-reformat-button');
  reformatButtonEl.addEventListener('click', () => {
    state.eventBus.emit('VO-Visual-RequestHandle', 'story', (voStoryHandle: VoHandle) => {
      state.eventBus.emit('VO-Visual-RequestHandle', 'combat', (voCombatHandle: VoHandle) => {
        console.log('[VO-App] Wikitext reformat', { voStoryHandle, voCombatHandle });
        state.eventBus.emit('VO-Wikitext-SetFromVoHandle', [voStoryHandle, voCombatHandle], true);
      });
    });
  });

  function localLoad(isFirstLoad: boolean = false) {
    console.log('[VO-App] Wikitext Local Load');
    let localStorageValue = window.localStorage.getItem(state.config.storagePrefix + 'CHAR_VO_WIKITEXT_' + state.voLang + '_' + state.avatar.Id);

    if (localStorageValue) {
      editor.setValue(localStorageValue, -1);
    } else {
      editor.setValue('', -1);
    }
    if (!isFirstLoad) {
      let langButton = document.querySelector<HTMLElement>('#vo-app-language-button');
      flashTippy(langButton, {content: 'Loaded locally saved text for ' + state.avatar.NameText + ' (' + state.voLang + ')', delay:[0,2000]});
    }
    state.eventBus.emit('VO-Visual-Reload', localStorageValue || '');
  }

  function localSave() {
    console.log('[VO-App] Wikitext Local Save');
    let editorValue = editor.getValue();
    let localKey = state.config.storagePrefix + 'CHAR_VO_WIKITEXT_' + state.voLang + '_' + state.avatar.Id;
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
    state.eventBus.emit('VO-Visual-Reload', editor.getValue());
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
  state.eventBus.on('VO-Wikitext-SetFromVoHandle', (voHandleArg: VoHandle|VoHandle[], reformat: boolean = false) => {
    let voHandleArray: VoHandle[] = Array.isArray(voHandleArg) ? voHandleArg : [voHandleArg];
    let wikitext = mwParse(editor.getValue());
    let didWork = false;

    for (let voHandle of voHandleArray) {
      if (!voHandle) {
        continue;
      }
      if (reformat) {
        voHandle.recalculate();
      }

      let templateName = voHandle.templateNode.templateName;

      for (let wikitextTemplate of wikitext.findTemplateNodes()) {
        if (compareTemplateName(wikitextTemplate.templateName, templateName)) {
          console.log('[VO-App] Replaced {{' + wikitextTemplate.templateName + '}} in wikitext with editor result.');
          wikitextTemplate.parts = voHandle.templateNode.parts;
          didWork = true;
        }
      }
    }

    if (didWork) {
      let stringified = wikitext.toString();
      editor.setValue(stringified, -1);
      editor.resize();
      localSave();
    }
  });
  state.eventBus.on('VO-Wikitext-OverwriteFromVoiceItems', (requestedMode: string, opts: VoAppPreloadOptions = {}) => {
    if (!state.voiceItems) {
      return;
    }
    console.log('[VO-App] Received OverwriteFromVoiceItems with mode ' + requestedMode + ' and options:', opts);
    let voLang: LangCode = state.voLang;
    let userLang: LangCode = (Cookies.get('outputLangCode') || DEFAULT_LANG) as LangCode;
    let mode: 'story' | 'combat' = null;
    if (requestedMode === 'story') {
      mode = 'story';
    } else if (requestedMode === 'combat') {
      mode = 'combat';
    } else {
      return;
    }

    let result: VoAppPreloadResult = state.config.preloader(state, mode, voLang, userLang, opts);
    let parsedResult: MwTemplateNode = mwParse(result.wikitext).findTemplateNodes()[0];

    let wikitext = mwParse(editor.getValue());
    let templateFound: MwTemplateNode = null;
    for (let wikitextTemplate of wikitext.findTemplateNodes()) {
      if (compareTemplateName(wikitextTemplate.templateName, result.templateName)) {
        templateFound = wikitextTemplate;
        wikitextTemplate.parts = parsedResult.parts;
      }
    }

    let scrollTop = editor.session.getScrollTop();
    if (templateFound) {
      let stringified = wikitext.toString();
      console.log('[VO-App] Replaced {{' + templateFound.templateName + '}} in wikitext with load from voice items.', { stringified });
      editor.setValue(stringified, -1);
      editor.resize();
      editor.session.setScrollTop(scrollTop);
      localSave();
      state.eventBus.emit('VO-Visual-Reload', editor.getValue());
    } else {
      let stringified = (editor.getValue() + '\n\n' + result.wikitext).trimStart();
      console.log('[VO-App] Appended {{' + result.templateName + '}} to wikitext with load from voice items.', { stringified });
      editor.setValue(stringified, -1);
      editor.resize();
      editor.session.setScrollTop(scrollTop);
      localSave();
      state.eventBus.emit('VO-Visual-Reload', editor.getValue());
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