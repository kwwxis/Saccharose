import * as ace from 'brace';
import 'brace/mode/text';
import 'brace/mode/javascript';
import 'brace/mode/xml';
import 'brace/mode/html';
import 'brace/mode/css';
import './mode/wikitext';
import './mode/wikitext.scss';
import 'brace/theme/textmate';
import 'brace/theme/tomorrow_night';
import 'brace/ext/static_highlight';
import './css/static_highlight.scss';

import Cookies from 'js-cookie';
import { toBoolean } from '../../../shared/util/genericUtil';
import { DOMClassWatcher } from '../domClassWatcher';
import { uuidv4 } from '../../../shared/util/stringUtil';

let aceEditors: ace.Editor[] = [];
let aceHighlights: {[guid: string]: ace.IEditSession} = {};

let createdDomClassWatcher = false;

function createDomClassWatcher() {
  if (!createdDomClassWatcher) {
    createdDomClassWatcher = true;
    new DOMClassWatcher('body', 'nightmode',
      () => {
        aceEditors.forEach(editor => editor.setTheme('ace/theme/tomorrow_night'));

        let TomorrowNightTheme = ace.acequire('ace/theme/tomorrow_night');
        let TextmateTheme = ace.acequire('ace/theme/textmate');
        document.querySelectorAll('.highlighted').forEach(el => {
          el.classList.remove(TextmateTheme.cssClass);
          el.classList.add(TomorrowNightTheme.cssClass);
        });
      },
      () => {
        aceEditors.forEach(editor => editor.setTheme('ace/theme/textmate'));

        let TomorrowNightTheme = ace.acequire('ace/theme/tomorrow_night');
        let TextmateTheme = ace.acequire('ace/theme/textmate');
        document.querySelectorAll('.highlighted').forEach(el => {
          el.classList.remove(TomorrowNightTheme.cssClass);
          el.classList.add(TextmateTheme.cssClass);
        });
      });
  }
}

export function createWikitextEditor(editorElementId: string|HTMLElement): ace.Editor {
  createDomClassWatcher();

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
    scrollPastEnd: 1,
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
  aceEditors.push(editor);
  return editor;
}

export function highlightWikitext(wikitext: string, disableGutter: boolean = false): HTMLElement {
  createDomClassWatcher();

  let Highlight = ace.acequire('ace/ext/static_highlight').highlight;
  let TextmateTheme = ace.acequire('ace/theme/textmate');
  let TomorrowNightTheme = ace.acequire('ace/theme/tomorrow_night');

  let theme;
  if (toBoolean(Cookies.get('nightmode'))) {
    theme = TomorrowNightTheme;
  } else {
    theme = TextmateTheme;
  }

  let guid = 'highlight-'+uuidv4();
  let result: {html: string, css: string, session: ace.IEditSession} = Highlight.renderSync(wikitext, 'ace/mode/wikitext', theme, 1, disableGutter);
  result.html = result.html.replace(
    /^<div class='/,
    `<div data-ace-highlight-id='${guid}' class='highlighted `
  );
  aceHighlights[guid] = result.session;

  return document.createRange().createContextualFragment(result.html).firstElementChild as HTMLElement;
}

export function highlightWikitextReplace(textarea: HTMLTextAreaElement, disableGutter: boolean = false): HTMLElement {
  let element = highlightWikitext(textarea.value, disableGutter);
  if (textarea.hasAttribute('id')) {
    element.setAttribute('id', textarea.getAttribute('id'));
  }
  if (textarea.hasAttribute('class')) {
    element.setAttribute('class', element.getAttribute('class') + ' ' + textarea.getAttribute('class'));
  }
  element.setAttribute('contenteditable', '');
  if (textarea.hasAttribute('readonly')) {
    element.setAttribute('readonly', '');
  }
  if (textarea.spellcheck == false) {
    element.setAttribute('spellcheck', 'false');
  }
  textarea.replaceWith(element);
  return element;
}

(<any> window).highlightWikitext = highlightWikitext;
(<any> window).highlightWikitextReplace = highlightWikitextReplace;
(<any> window).aceHighlights = aceHighlights;
(<any> window).aceEditors = aceEditors;