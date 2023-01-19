import * as ace from 'brace';
import 'brace/mode/text';
import 'brace/mode/javascript';
import 'brace/mode/xml';
import 'brace/mode/html';
import 'brace/mode/css';
import 'brace/mode/json';
import './mode/wikitext';
import './mode/wikitext.scss';
import 'brace/theme/textmate';
import 'brace/theme/tomorrow_night';
import 'brace/ext/static_highlight';
import 'brace/ext/searchbox';
import './css/static_highlight.scss';

import Cookies from 'js-cookie';
import { toBoolean } from '../../../shared/util/genericUtil';
import { DOMClassWatcher } from '../domClassWatcher';
import { escapeHtml, uuidv4 } from '../../../shared/util/stringUtil';
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

export function highlightWikitext(text: string, gutters: boolean = false, markers: Marker[] = []): HTMLElement {
  return highlight(text, 'ace/mode/wikitext', gutters, markers);
}

export function highlightJson(text: string, gutters: boolean = false, markers: Marker[] = []): HTMLElement {
  return highlight(text, 'ace/mode/json', gutters, markers);
}

export function highlight(text: string, mode: string, gutters: boolean = true, markers: Marker[] = []): HTMLElement {
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

  Highlight.renderSync = function(input, mode, theme, lineStart, gutters: boolean = true) {
    lineStart = parseInt(lineStart || 1, 10);

    let session = new EditSession("");
    session.setUseWorker(false);
    session.setMode(mode);

    let textLayer = new SimpleTextLayer();
    textLayer.setSession(session);

    session.setValue(input);

    let textLayerSb = [];
    let markerFrontLayerSb = [];
    let markerBackLayerSb = [];
    let length: number = session.getLength();
    let rawLines: string[] = input.split(/\r?\n/g);

    let anyMarkersInFront: boolean = false;
    let anyMarkersInBack: boolean = false;

    function blankify(s: string): string {
      let cjkRegex = /([\u1100-\u115F\u11A3-\u11A7\u11FA-\u11FF\u2329-\u232A\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3000-\u303E\u3041-\u3096\u3099-\u30FF\u3105-\u312D\u3131-\u318E\u3190-\u31BA\u31C0-\u31E3\u31F0-\u321E\u3220-\u3247\u3250-\u32FE\u3300-\u4DBF\u4E00-\uA48C\uA490-\uA4C6\uA960-\uA97C\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFAFF\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE66\uFE68-\uFE6B\uFF01-\uFF60\uFFE0-\uFFE6]|[\uD800-\uDBFF][\uDC00-\uDFFF])/g;
      let split = s.split(cjkRegex);
      let out = '';
      for (let x of split) {
        if (cjkRegex.test(x)) {
          let xs = '&emsp;'.repeat(x.length);
          out += `<span class="ace_cjk">${xs}</span>`;
        } else {
          if (!x) {
            continue;
          }
          let xs = '&nbsp;'.repeat(x.length);
          out += `<span>${xs}</span>`;
        }
      }
      return out;
    }

    for(let ix = 0; ix < length; ix++) {
      textLayerSb.push("<div class='ace_line'>");
      if (gutters)
        textLayerSb.push(`<span class="ace_gutter ace_gutter-cell">` + /*(ix + lineStart) + */ `</span>`);
      textLayer.$renderLine(textLayerSb, ix, true, false);
      textLayerSb.push(`\n</div>`);

      let marker = markers.find(m => m.line === (ix + 1));
      let line: string = rawLines[ix];
      let lineBlank = `<span class="ace_static_marker" data-text="${escapeHtml(line)}"></span>`; //blankify(line);

      if (marker) {
        let clazz = marker.token.split('.').join(' ');
        let start = line.slice(0, marker.startCol);
        let range = marker.endCol <= marker.startCol ? '' : line.slice(marker.startCol, marker.endCol);
        let end = line.slice(marker.endCol);

        let markerHtml;
        if (marker.fullLine) {
          markerHtml = `<span class="ace_static_marker ${clazz}" style="width:100%" data-text="${escapeHtml(line)}"></span>`;
        } else {
          markerHtml = `<span class="ace_static_marker before-range" data-text="${escapeHtml(start)}"></span>` +
            `<span class="ace_static_marker range ${clazz}" data-text="${escapeHtml(range)}"></span>` +
            `<span class="ace_static_marker after-range" data-text="${escapeHtml(end)}"></span>`;
        }

        if (marker.isFront) {
          markerFrontLayerSb.push(`<div class="ace_line">${markerHtml}</div>`);
          markerBackLayerSb.push(`<div class="ace_line">${lineBlank}</div>`);
          anyMarkersInFront = true;
        } else {
          markerFrontLayerSb.push(`<div class="ace_line">${lineBlank}</div>`);
          markerBackLayerSb.push(`<div class="ace_line">${markerHtml}</div>`);
          anyMarkersInBack = true;
        }
      } else {
        markerFrontLayerSb.push(`<div class="ace_line">${lineBlank}</div>`);
        markerBackLayerSb.push(`<div class="ace_line">${lineBlank}</div>`);
      }
    }

    if (!anyMarkersInBack) {
      markerBackLayerSb = [];
    }

    if (!anyMarkersInFront) {
      markerFrontLayerSb = [];
    }

    let html =
      `<div data-ace-highlight-id="${guid}" class="highlighted ${gutters ? 'highlighted-has-gutters' : ''} ${theme.cssClass}" style="position:relative">` +
        `<div class="ace_static_highlight${gutters ? ' ace_show_gutter' : ''}" style="counter-reset:ace_line ${lineStart - 1}">` +
          `<div class="ace_static_layer ace_static_marker_layer ace_static_marker_back_layer">${markerBackLayerSb.join('')}</div>` +
          `<div class="ace_static_layer ace_static_text_layer">${textLayerSb.join('').replace(/\s*style=['"]width:NaNpx['"]/g, '')}</div>` +
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
  let result: {html: string, session: ace.IEditSession} = Highlight.renderSync(text, mode, theme, 1, gutters,
    (editSession) => {
      editSession.addMarker(new Range(1, 0, 2, 1), 'highlight', 'line', false);
    });

  // Convert to element
  return document.createRange().createContextualFragment(result.html).firstElementChild as HTMLElement;
}


export function highlightWikitextReplace(textarea: HTMLTextAreaElement, gutters: boolean = false, markers?: (string|Marker)[]|string): HTMLElement {
  return highlightReplace(textarea, 'ace/mode/wikitext', gutters, markers);
}

export function highlightReplace(textarea: HTMLTextAreaElement, mode: string, gutters: boolean = true, markers?: (string|Marker)[]|string): HTMLElement {
  if (textarea.hasAttribute('data-mode')) {
    mode = textarea.getAttribute('data-mode');
  }
  if (!markers && textarea.hasAttribute('data-markers')) {
    markers = textarea.getAttribute('data-markers') || [];
  }
  if (textarea.hasAttribute('data-gutters')) {
    gutters = toBoolean(textarea.getAttribute('data-gutters'));
  }

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

  let element = highlight(textarea.value, mode, gutters, markers as Marker[]);

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