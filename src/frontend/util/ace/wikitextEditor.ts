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
import { isInt } from '../../../shared/util/numberUtil';
import { Marker } from '../../../shared/util/highlightMarker';

let aceEditors: ace.Editor[] = [];

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

export function highlightWikitext(wikitext: string, disableGutter: boolean = false, markers: Marker[] = []): HTMLElement {
  createDomClassWatcher();

  // Create unique ID for highlight element
  let guid = 'highlight-'+uuidv4();

  // Load EditSession/TextLayer
  let EditSession = ace.acequire('ace/edit_session').EditSession;
  let TextLayer = ace.acequire('ace/layer/text').Text;
  let SimpleTextLayer = function(config: any = {}) {
    this.config = config;
  };
  SimpleTextLayer.prototype = TextLayer.prototype;

  // Override default implementation of Highlight.renderSync
  let Highlight = ace.acequire('ace/ext/static_highlight').highlight;

  Highlight.renderSync = function(input, mode, theme, lineStart, disableGutter: boolean = false) {
    lineStart = parseInt(lineStart || 1, 10);

    let session = new EditSession("");
    session.setUseWorker(false);
    session.setMode(mode);

    let textLayer = new SimpleTextLayer();
    textLayer.setSession(session);

    let markerConfig = {
      characterWidth: 13.333,
      lineHeight: 22,
      firstRowScreen: 1
    };

    session.setValue(input);

    let textLayerSb = [];
    let markerFrontLayerSb = [];
    let markerBackLayerSb = [];
    let length: number = session.getLength();
    let rawLines: string[] = input.split(/\r?\n/g);

    for(let ix = 0; ix < length; ix++) {
      textLayerSb.push("<div class='ace_line'>");
      if (!disableGutter)
        textLayerSb.push(`<span class="ace_gutter ace_gutter-cell">` + /*(ix + lineStart) + */ `</span>`);
      textLayer.$renderLine(textLayerSb, ix, true, false);
      textLayerSb.push(`\n</div>`);

      let marker = markers.find(m => m.line === (ix + 1));
      let line: string = rawLines[ix];
      if (marker) {
        let start = line.slice(0, marker.startCol);
        let range = marker.endCol <= marker.startCol ? '' : line.slice(marker.startCol, marker.endCol);

        let clazz = marker.token.split('.').join(' ');

        let markerHtml = `<span>${start}</span><span class="${clazz}">${range}</span>`;
        if (marker.fullLine) {
          markerHtml = `<span class="${clazz}" style="width:100%">${line}</span>`;
        }
        if (marker.isFront) {
          markerFrontLayerSb.push(`<div class="ace_line">${markerHtml}</div>`);
          markerBackLayerSb.push(`<div class="ace_line">${line}</div>`);
        } else {
          markerFrontLayerSb.push(`<div class="ace_line">${line}</div>`);
          markerBackLayerSb.push(`<div class="ace_line">${markerHtml}</div>`);
        }
      } else {
        markerFrontLayerSb.push(`<div class="ace_line">${line}</div>`);
        markerBackLayerSb.push(`<div class="ace_line">${line}</div>`);
      }
    }

    let html =
      `<div data-ace-highlight-id="${guid}" class="highlighted ${theme.cssClass}" style="position:relative">` +
        `<div class="ace_static_highlight${disableGutter ? '' : ' ace_show_gutter'}" style="counter-reset:ace_line ${lineStart - 1}">` +
          `<div class="ace_static_layer ace_static_marker_layer ace_static_marker_back_layer">${markerBackLayerSb.join('')}</div>` +
          `<div class="ace_static_layer ace_static_text_layer">${textLayerSb.join('')}</div>` +
          `<div class="ace_static_layer ace_static_marker_layer ace_static_marker_front_layer">${markerFrontLayerSb.join('')}</div>` +
        `</div>` +
      `</div>`;

    textLayer.destroy();

    return {
      css: theme.cssText,
      html: html,
      session: session
    };
  };

  // Load Theme
  let TextmateTheme = ace.acequire('ace/theme/textmate');
  let TomorrowNightTheme = ace.acequire('ace/theme/tomorrow_night');
  let Range = ace.acequire('ace/range').Range;

  let theme;
  if (toBoolean(Cookies.get('nightmode'))) {
    theme = TomorrowNightTheme;
  } else {
    theme = TextmateTheme;
  }

  // Run highlight
  let result: {html: string, session: ace.IEditSession} = Highlight.renderSync(wikitext, 'ace/mode/wikitext', theme, 1, disableGutter,
    (editSession) => {
      editSession.addMarker(new Range(1, 0, 2, 1), 'highlight', 'line', false);
    });

  // Convert to element
  return document.createRange().createContextualFragment(result.html).firstElementChild as HTMLElement;
}

export function highlightWikitextReplace(textarea: HTMLTextAreaElement, disableGutter: boolean = false, markers?: (string|Marker)[]|string): HTMLElement {
  if (typeof markers === 'string') {
    markers = markers.split(';').filter(x => !!x).map(str => Marker.fromString(str)).filter(x => !!x);
  }
  if (!markers) {
    markers = [];
  } else {
    markers = markers.map(m => {
      if ((<any> m).token) {
        return m as Marker;
      } else {
        return Marker.fromString(m as string);
      }
    }).filter(x => !!x);
  }

  let element = highlightWikitext(textarea.value, disableGutter, markers as Marker[]);

  if (textarea.hasAttribute('class')) {
    element.setAttribute('class', element.getAttribute('class') + ' ' + textarea.getAttribute('class'));
  }

  for (let attributeName of textarea.getAttributeNames()) {
    if (attributeName.toUpperCase() === 'CLASS') {
      continue;
    }
    element.setAttribute(attributeName, textarea.getAttribute(attributeName))
  }

  element.setAttribute('contenteditable', '');

  textarea.replaceWith(element);
  return element;
}

(<any> window).highlightWikitext = highlightWikitext;
(<any> window).highlightWikitextReplace = highlightWikitextReplace;
(<any> window).aceEditors = aceEditors;