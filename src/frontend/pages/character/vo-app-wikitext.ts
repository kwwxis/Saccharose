import { VoAppState } from './vo-tool';
import * as ace from 'brace';
import 'brace/mode/text';
import 'brace/mode/javascript';
import 'brace/mode/xml';
import 'brace/mode/html';
import 'brace/mode/css';
import '../../util/ace_mode/wikitext';
import '../../util/ace_mode/wikitext.scss';
import 'brace/theme/textmate';
import 'brace/theme/tomorrow_night';
import { flashTippy } from '../../util/tooltips';
import Cookies from 'js-cookie';
import { toBoolean } from '../../../shared/util/genericUtil';
import { DOMClassWatcher } from '../../util/domClassWatcher';

export function VoAppWikitext(state: VoAppState) {
  const editor: ace.Editor = ace.edit('wikitext-editor');
  editor.getSession().setMode('ace/mode/wikitext');
  editor.setShowPrintMargin(false);
  if (toBoolean(Cookies.get('nightmode'))) {
    editor.setTheme('ace/theme/tomorrow_night');
  } else {
    editor.setTheme('ace/theme/textmate');
  }
  editor.resize();
  state.wikitext = editor;

  new DOMClassWatcher('body', 'nightmode',
    () => editor.setTheme('ace/theme/tomorrow_night'),
    () => editor.setTheme('ace/theme/textmate'));

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
    window.localStorage.setItem('CHAR_VO_WIKITEXT_' + state.voLang + '_' + state.avatar.Id, editor.getValue());
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