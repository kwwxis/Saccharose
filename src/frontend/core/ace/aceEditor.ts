// Ace imports
// --------------------------------------------------------------------------------------------------------------

// region Ace Imports
// --------------------------------------------------------------------------------------------------------------
import * as ace from 'brace';
import 'brace/mode/text';
import 'brace/mode/javascript';
import 'brace/mode/xml';
import 'brace/mode/html';
import 'brace/mode/css';
import 'brace/mode/json';
import 'brace/mode/plain_text';
import './mode/aceWikiMode.ts';
import './mode/aceWikitext.scss';
import 'brace/theme/textmate';
import 'brace/theme/tomorrow_night';
import 'brace/ext/static_highlight';
import 'brace/ext/searchbox';
import './css/static_highlight.scss';
// endregion

// region Other imports
// --------------------------------------------------------------------------------------------------------------
import Cookies from 'js-cookie';
import { toBoolean } from '../../../shared/util/genericUtil.ts';
import { uuidv4 } from '../../../shared/util/uuidv4.ts';
import { toastError } from '../../util/toasterUtil.ts';
import { isNightmode } from '../userPreferences/siteTheme.ts';
import { initAceThemeWatcher } from './aceThemeWatcher.ts';
// endregion

// region Ace Editor: Core
// --------------------------------------------------------------------------------------------------------------
export const aceEditors: ace.Editor[] = [];
export const aceEditorsById: {[aceId: string]: ace.Editor} = {};

export function getAceEditor(editorElementId: string|HTMLElement): ace.Editor {
  const editorEl: HTMLElement = typeof editorElementId === 'string'
    ? document.getElementById(editorElementId)
    : editorElementId;
  if (!editorEl) {
    return undefined;
  }
  const editorId = editorEl.getAttribute('data-editor-id');
  return aceEditorsById[editorId];
}

export function createAceEditor(editorElementId: string|HTMLElement, mode: string, configure?: (editor: ace.Editor) => void): ace.Editor {
  initAceThemeWatcher();

  const editorEl: HTMLElement = typeof editorElementId === 'string'
    ? document.getElementById(editorElementId)
    : editorElementId;

  const editorId: string = uuidv4();
  editorEl.setAttribute('data-editor-id', editorId);

  const editor: ace.Editor = editorElementId instanceof HTMLElement
    ? ace.edit(editorElementId)
    : ace.edit(editorElementId);

  aceEditorsById[editorId] = editor;

  editor.setOptions({
    printMargin: false,
    selectionStyle: 'line',
    behavioursEnabled: false,
    wrapBehavioursEnabled: true,
    wrap: true,
    scrollPastEnd: true
  });

  // Set this variable to `Infinity` to deal with this console warning:
  //   "Automatically scrolling cursor into view after selection change this will be disabled in the next version
  //   set editor.$blockScrolling = Infinity to disable the message"
  editor.$blockScrolling = Infinity;

  editor.setHighlightActiveLine(false);
  editor.setBehavioursEnabled(false);
  editor.setWrapBehavioursEnabled(true);
  editor.getSession().setMode(mode);
  editor.setShowPrintMargin(false);
  if (isNightmode()) {
    editor.setTheme('ace/theme/tomorrow_night');
  } else {
    editor.setTheme('ace/theme/textmate');
  }

  if (configure) {
    configure(editor);
  }

  editor.resize();
  aceEditors.push(editor);
  return editor;
}
// endregion

// region Ace Editor: Wikitext
// --------------------------------------------------------------------------------------------------------------
export function createWikitextEditor(editorElementId: string|HTMLElement): ace.Editor {
  const mode: string = toBoolean(Cookies.get('disable_wikitext_highlight'))
    ? 'ace/mode/plain_text'
    : 'ace/mode/wikitext';

  return createAceEditor(editorElementId, mode, editor => {
    editor.commands.addCommand({
      name: 'wikiLink',
      bindKey: {
        win: 'Ctrl-K',
        mac: 'Command-K'
      },
      exec: (editor: ace.Editor) => {
        const selRange = editor.selection.getRange();
        const selText = editor.session.doc.getTextRange(selRange);

        if (selText.includes('\n')) {
          toastError({title: 'Cannot link', content: 'Cannot create a link over multiple lines.'})
        } else if (selText.includes('[[') && selText.includes(']]')) {
          if (selText.match(/\[\[/g).length >= 2 || selText.match(/]]/g).length >= 2) {
            toastError({title: 'Cannot unlink', content: 'Selection contains multiple links.'})
            return;
          }
          editor.session.replace(selRange, selText.replace(/\[\[/g, '').replace(/]]/g, ''));
        } else if (selText.includes('[[') || selText.includes(']]')) {
          toastError({title: 'Cannot unlink', content: 'Selection contains partial link.<br>Select an entire link to unlink.', allowHTML: true});
        } else {
          const [fm, spaceBefore, content, spaceAfter] = /^(\s*)(.*?)(\s*)$/.exec(selText);
          editor.session.replace(selRange, spaceBefore + '[[' + content + ']]' + spaceAfter);
        }
      }
    });
  });
}
// endregion

// region Window exports
// --------------------------------------------------------------------------------------------------------------
(<any> window).aceEditors = aceEditors;
(<any> window).getWikitextEditor = getAceEditor;
// endregion

