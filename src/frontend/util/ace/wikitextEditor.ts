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
import { escapeHtml } from '../../../shared/util/stringUtil';
import { Marker, MarkerAggregate } from '../../../shared/util/highlightMarker';
import { uuidv4 } from '../../../shared/util/uuidv4';

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
    scrollPastEnd: 1,
  });

  // Set this variable to `Infinity` to deal with this console warning:
  //   "Automatically scrolling cursor into view after selection change this will be disabled in the next version
  //   set editor.$blockScrolling = Infinity to disable the message"
  editor.$blockScrolling = Infinity;

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
    let length: number = session.getLength();
    let rawLines: string[] = input.split(/\r?\n/g);

    let markerFrontLayerSb = [];
    let markerBackLayerSb = [];
    let anyMarkersInFront: boolean = false;
    let anyMarkersInBack: boolean = false;

    const markerAggs = MarkerAggregate.from(markers);
    const markerText = str => !str ? ' ' : escapeHtml(str);

    for(let ix = 0; ix < length; ix++) {
      textLayerSb.push("<div class='ace_line'>");
      if (gutters)
        textLayerSb.push(`<span class="ace_gutter ace_gutter-cell">` + /*(ix + lineStart) + */ `</span>`);
      textLayer.$renderLine(textLayerSb, ix, true, false);
      textLayerSb.push(`\n</div>`);

      let markerFrontAgg = markerAggs.front.get(ix + 1);
      let markerBackAgg = markerAggs.back.get(ix + 1);
      let line: string = rawLines[ix];
      let lineBlank = `<span class="ace_static_marker" data-text="${markerText(line)}"></span>`; //blankify(line);

      function processMarkerAgg(agg: MarkerAggregate, isFront: boolean) {
        if (!agg || !agg.ranges.length) {
          if (isFront) {
            markerFrontLayerSb.push(`<div class="ace_line">${lineBlank}</div>`);
          } else {
            markerBackLayerSb.push(`<div class="ace_line">${lineBlank}</div>`);
          }
          return;
        }

        let markerHtml = '';
        let prevRangeEnd = 0;
        for (let range of agg.ranges) {
          let clazz = range.token.split('.').join(' ');
          let beforeText = line.slice(prevRangeEnd, range.startCol);
          let rangeText = range.endCol <= range.startCol ? '' : line.slice(range.startCol, range.endCol);
          prevRangeEnd = range.endCol;

          if (range.fullLine) {
            markerHtml = `<span class="ace_static_marker ${clazz}" style="width:100%;display:inline-block;" data-text="${markerText(line)}"></span>`;
            prevRangeEnd = line.length;
            break;
          }

          if (beforeText) {
            markerHtml += `<span class="ace_static_marker range-norm-text" data-text="${markerText(beforeText)}"></span>`;
          }

          if (rangeText) {
            markerHtml += `<span class="ace_static_marker range-token-text ${clazz}" data-text="${markerText(rangeText)}"></span>`;
          }
        }
        let lastText = line.slice(prevRangeEnd);
        if (lastText) {
          markerHtml += `<span class="ace_static_marker range-norm-text" data-text="${markerText(lastText)}"></span>`;
        }

        if (agg.isFront) {
          markerFrontLayerSb.push(`<div class="ace_line">${markerHtml}</div>`);
          anyMarkersInFront = true;
        } else {
          markerBackLayerSb.push(`<div class="ace_line">${markerHtml}</div>`);
          anyMarkersInBack = true;
        }
      }

      processMarkerAgg(markerFrontAgg, true);
      processMarkerAgg(markerBackAgg, false);
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

export function highlightWikitextReplace(original: HTMLElement, textOverride?: string): HTMLElement {
  return highlightReplace(original, 'ace/mode/wikitext', textOverride, false);
}

export function getInputValue(element: HTMLElement) {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement || element.hasOwnProperty('value')) {
    return (<any> element).value;
  } else if (element.hasAttribute('contenteditable')) {
    let copyTarget: HTMLElement = element;
    if (element.querySelector('.ace_static_text_layer')) {
      copyTarget = copyTarget.querySelector('.ace_static_text_layer');
    }
    return copyTarget.textContent;
  } else {
    return element.textContent;
  }
}

export function highlightReplace(original: HTMLElement, mode: string, textOverride?: string,
                                 gutters: boolean = true, markers?: (string|Marker)[]|string): HTMLElement {
  if (original.hasAttribute('data-mode')) {
    mode = original.getAttribute('data-mode');
  }
  if (!markers && original.hasAttribute('data-markers')) {
    markers = original.getAttribute('data-markers') || [];
  }
  if (original.hasAttribute('data-gutters')) {
    gutters = toBoolean(original.getAttribute('data-gutters'));
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

  let element = highlight(textOverride || getInputValue(original), mode, gutters, markers as Marker[]);

  if (original.hasAttribute('class')) {
    element.classList.add(... Array.from(original.classList));
  }

  for (let attributeName of original.getAttributeNames()) {
    if (attributeName.toUpperCase() === 'CLASS') {
      continue;
    }
    if (attributeName.toUpperCase() === 'ID' && element.hasAttribute('ID')) {
      continue;
    }
    element.setAttribute(attributeName, original.getAttribute(attributeName))
  }

  element.setAttribute('contenteditable', '');

  original.replaceWith(element);
  return element;
}

(<any> window).highlight = highlight;
(<any> window).highlightReplace = highlightReplace;

(<any> window).highlightJson = highlightJson;
(<any> window).highlightWikitext = highlightWikitext;
(<any> window).highlightWikitextReplace = highlightWikitextReplace;

(<any> window).aceEditors = aceEditors;