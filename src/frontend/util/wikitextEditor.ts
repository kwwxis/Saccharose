import * as ace from 'brace';
import 'brace/mode/text';
import 'brace/mode/javascript';
import 'brace/mode/xml';
import 'brace/mode/html';
import 'brace/mode/css';
import './ace_mode/wikitext';
import './ace_mode/wikitext.scss';
import 'brace/theme/textmate';
import 'brace/theme/tomorrow_night';

import { toBoolean } from '../../shared/util/genericUtil';
import Cookies from 'js-cookie';
import { DOMClassWatcher } from './domClassWatcher';

let editors: ace.Editor[] = [];
let createdDomClassWatcher = false;

export function createWikitextEditor(editorElementId: string|HTMLElement): ace.Editor {
  if (!createdDomClassWatcher) {
    createdDomClassWatcher = true;
    new DOMClassWatcher('body', 'nightmode',
      () => editors.forEach(editor => editor.setTheme('ace/theme/tomorrow_night')),
      () => editors.forEach(editor => editor.setTheme('ace/theme/textmate')));
  }

  const editor: ace.Editor = editorElementId instanceof HTMLElement
    ? ace.edit(editorElementId)
    : ace.edit(editorElementId);

  editor.setOptions({
    printMargin: false,
    selectionStyle: 'line',
    behavioursEnabled: false,
    wrapBehavioursEnabled: true,
    wrap: true,
    useWrapMode: true,
  })

  editor.setHighlightActiveLine(false);
  editor.setBehavioursEnabled(false);
  editor.setWrapBehavioursEnabled(true);
  editor.getSession().setMode('ace/mode/wikitext');
  editor.setShowPrintMargin(false);
  if (toBoolean(Cookies.get('nightmode'))) {
    editor.setTheme('ace/theme/tomorrow_night');
  } else {
    editor.setTheme('ace/theme/textmate');
  }
  editor.resize();
  editors.push(editor);
  return editor;
}