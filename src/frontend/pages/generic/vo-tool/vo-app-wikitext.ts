import { VoAppState } from './vo-tool.ts';
import * as ace from 'brace';
import { flashTippy } from '../../../util/tooltipUtil.ts';
import { createWikitextEditor } from '../../../core/ace/aceEditor.ts';
import { VoHandle } from './vo-handle.ts';
import { mwParse } from '../../../../shared/mediawiki/mwParse.ts';
import { MwTemplateNode } from '../../../../shared/mediawiki/mwParseTypes.ts';
import Cookies from 'js-cookie';
import { DEFAULT_LANG, LangCode } from '../../../../shared/types/lang-types.ts';
import { VoAppPreloadConfig, VoAppPreloadInput, VoAppPreloadOptions, VoAppPreloadResult } from './vo-preload-types.ts';
import { voPreload } from './vo-preload-support.ts';
import SiteMode from '../../../core/userPreferences/siteMode.ts';
import { getVoAppSavedAvatar, putVoAppSavedAvatar, removeVoAppSavedAvatar } from './vo-app-storage.ts';
import { getOutputLanguage } from '../../../core/userPreferences/siteLanguage.ts';

function compareTemplateName(t1: string, t2: string) {
  return t1?.toLowerCase()?.replace(/_/g, ' ') === t2?.toLowerCase()?.replace(/_/g, ' ');
}

export async function VoAppWikitextEditor(state: VoAppState): Promise<void> {
  if (!state.avatar)
    return;

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

  async function localLoad(isFirstLoad: boolean = false) {
    console.log('[VO-App] Wikitext Local Load');
    const savedAvatar = await getVoAppSavedAvatar(state.savedAvatarStoreName, state.savedAvatarKey);

    if (savedAvatar?.wikitext) {
      editor.setValue(savedAvatar.wikitext, -1);
    } else {
      editor.setValue('', -1);
    }
    if (!isFirstLoad) {
      let langButton = document.querySelector<HTMLElement>('#vo-app-language-button');
      flashTippy(langButton, {content: 'Loaded locally saved text for ' + state.avatar.NameText + ' (' + state.voLang + ')', delay:[0,2000]});
    }
    state.eventBus.emit('VO-Visual-Reload', savedAvatar?.wikitext || '');
  }

  async function localSave() {
    console.log('[VO-App] Wikitext Local Save');
    const editorValue: string = editor.getValue();

    if (!editorValue || !editorValue.trim()) {
      await removeVoAppSavedAvatar(state.savedAvatarStoreName, state.savedAvatarKey);
    } else {
      await putVoAppSavedAvatar(state.savedAvatarStoreName, {
        avatarId: state.avatar.Id,
        langCode: state.voLang,
        lastUpdated: Date.now(),
        wikitext: editorValue
      });
    }
  }

  await localLoad(true);

  editor.on('blur', async (e) => {
    console.log('Wikitext blur', e);
    await localSave();
    state.eventBus.emit('VO-Visual-Reload', editor.getValue());
  });

  state.eventBus.on('VO-Wikitext-LocalLoad', async () => {
    await localLoad();
  });
  state.eventBus.on('VO-Wikitext-LocalSave', async () => {
    await localSave();
  });
  state.eventBus.on('VO-Wikitext-SetValue', async (newValue: string) => {
    editor.setValue(newValue, -1);
    await localSave();
  });
  state.eventBus.on('VO-Wikitext-RequestValue', (cb: (value: string) => void) => {
    cb(editor.getValue());
  });
  state.eventBus.on('VO-Wikitext-SetFromVoHandle', async (voHandleArg: VoHandle|VoHandle[], reformat: boolean = false) => {
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
      await localSave();
    }
  });
  state.eventBus.on('VO-Wikitext-OverwriteFromVoiceOvers', async (requestedMode: string, opts: VoAppPreloadOptions = {}) => {
    if (!state.voiceOverGroup) {
      return;
    }
    console.log('[VO-App] Received OverwriteFromVoiceOvers with mode ' + requestedMode + ' and options:', opts);
    let voLang: LangCode = state.voLang;
    let userLang: LangCode = getOutputLanguage();
    let mode: 'story' | 'combat' = null;
    if (requestedMode === 'story') {
      mode = 'story';
    } else if (requestedMode === 'combat') {
      mode = 'combat';
    } else {
      return;
    }

    const preloadInput: VoAppPreloadInput = new VoAppPreloadInput(state, mode, voLang, userLang, opts);
    const preloadConf: VoAppPreloadConfig = state.config.preloadConfig;
    const result: VoAppPreloadResult = voPreload(preloadInput, preloadConf);

    const parsedResult: MwTemplateNode = mwParse(result.wikitext).findTemplateNodes()[0];

    const wikitext = mwParse(editor.getValue());
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
      await localSave();
      state.eventBus.emit('VO-Visual-Reload', editor.getValue());
    } else {
      let stringified = (editor.getValue() + '\n\n' + result.wikitext).trimStart();
      console.log('[VO-App] Appended {{' + result.templateName + '}} to wikitext with load from voice items.', { stringified });
      editor.setValue(stringified, -1);
      editor.resize();
      editor.session.setScrollTop(scrollTop);
      await localSave();
      state.eventBus.emit('VO-Visual-Reload', editor.getValue());
    }
  });

  window.addEventListener('beforeunload', async () => {
    await localSave();
  });

  document.querySelector('#tab-wikitext').addEventListener('click', () => {
    // Editor resize must be called if the editor container is resized or displayed.
    setTimeout(() => {
      console.log('[VO-App] Wikitext tab entered.');
      editor.resize();
    });
  });
}
