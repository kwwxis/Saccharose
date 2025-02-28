import { Marker, MarkerAdjustment, MarkerAggregate } from '../../../shared/util/highlightMarker.ts';
import { CommonLineId, parseCommonLineIds } from '../../../shared/types/common-types.ts';
import { isEmpty, toBoolean } from '../../../shared/util/genericUtil.ts';
import Cookies from 'js-cookie';
import { uuidv4 } from '../../../shared/util/uuidv4.ts';
import * as ace from 'brace';
import { isNightmode } from '../userPreferences/siteTheme.ts';
import { applyWikitextClickableLinks } from './staticActions/wikitextClickableLinks.ts';
import { applyWikitextLineActions } from './staticActions/wikitextLineActions.ts';
import { IndexedRange, intersectRange } from '../../../shared/util/arrayUtil.ts';
import { getInputValue, isTextNode, textNodesUnder } from '../../util/domutil.ts';
import { initAceThemeWatcher } from './aceThemeWatcher.ts';
import { applyWikitextLinker } from './staticActions/wikitextLinker.ts';
import { escapeHtml } from '../../../shared/util/stringUtil.ts';
import { toInt } from '../../../shared/util/numberUtil.ts';

// region Static Highlight: Options
// --------------------------------------------------------------------------------------------------------------
export type BaseHighlightOptions = {
  id?: string,
  uuid?: string,
  mode: string,
  gutters?: boolean,
  markers?: string|(Marker|string)[],
  showTextMapHash?: boolean,
  markerAdjustments?: MarkerAdjustment[],
  commonLineIds?: CommonLineId[],
  isWikiTemplateFragment?: boolean,
  disableReadonlyContenteditable?: boolean,
  noInputStyle?: boolean,
  noTheme?: boolean,
};

export type HighlightOptions = BaseHighlightOptions & {
  text: string,
}

export type HighlightReplaceOptions = BaseHighlightOptions & {
  textOverride?: string,
}

export type HighlightExistingElementOptions = Omit<BaseHighlightOptions, 'gutters' | 'commonLineIds' | 'disableReadonlyContenteditable'>;
// endregion

// region Static Highlight: Core Function
// --------------------------------------------------------------------------------------------------------------
const aceHighlights: {[uuid: string]: HighlightOptions} = {};

export function highlight(opts: HighlightOptions): HTMLElement {
  initAceThemeWatcher();

  // Create unique ID for highlight element
  // --------------------------------------------------------------------------------------------------------------
  opts.uuid = opts.uuid || uuidv4();
  if (aceHighlights[opts.uuid]) {
    delete aceHighlights[opts.uuid]['markerAdjustments'];
    opts = aceHighlights[opts.uuid] = Object.assign(aceHighlights[opts.uuid], opts);
  } else {
    aceHighlights[opts.uuid] = opts;
  }

  // Normalize Opts
  // --------------------------------------------------------------------------------------------------------------
  if (opts.mode === 'ace/mode/wikitext' && toBoolean(Cookies.get('disable_wikitext_highlight'))) {
    opts.mode = 'ace/mode/plain_text';
  }
  if (!opts.mode) {
    opts.mode = 'ace/mode/plain_text';
  }
  if (!opts.commonLineIds) {
    opts.commonLineIds = [];
  }

  // Add Wiki Template Fragment Fake Lines
  // --------------------------------------------------------------------------------------------------------------
  if (opts.isWikiTemplateFragment) {
    // If we're in a wiki template fragment, then we add the template opener and closer braces so that the
    // highlighter will render all the text as in a mediawiki template.
    // But in the renderSync method, we will skip these new first and last lines we just added since the curly
    // braces are not in the original text.
    opts.text = '{{\n' + opts.text + '\n}}';
  }

  // Load EditSession/TextLayer
  // --------------------------------------------------------------------------------------------------------------
  const EditSession = ace.acequire('ace/edit_session').EditSession;
  const TextLayer = ace.acequire('ace/layer/text').Text;
  const SimpleTextLayer = function(config: any = {}) {
    this.config = config;
  };
  SimpleTextLayer.prototype = TextLayer.prototype;

  // Override default implementation of Highlight.renderSync
  // --------------------------------------------------------------------------------------------------------------
  let Highlight = ace.acequire('ace/ext/static_highlight').highlight;
  Highlight.renderSync = function(input, mode, theme, lineStart, gutters: boolean) {
    lineStart = toInt(lineStart || 1);

    // Edit Session Init
    // --------------------------------------------------------------------------------------------------------------
    const session = new EditSession('');
    session.setUseWorker(false);
    session.setMode(mode);

    // Text Layer Init
    // --------------------------------------------------------------------------------------------------------------
    const textLayer = new SimpleTextLayer();
    textLayer.setSession(session);
    session.setValue(input);

    const textLayerSb = [];
    const length: number = session.getLength();

    // Line Loop (ix is 0-based line number)
    // --------------------------------------------------------------------------------------------------------------
    for (let ix = 0; ix < length; ix++) {
      if (opts.isWikiTemplateFragment && (ix === 0 || ix === length - 1)) {
        // Skip first and last lines if isWikiTemplateFragment=true
        textLayer.$renderLine([], ix, true, false);
        continue;
      }

      const commonLineId = opts.commonLineIds[ix];
      if (commonLineId) {
        textLayerSb.push(`<div class="ace_line${opts.showTextMapHash ? ' show-textmaphash' : ''}" data-line-idx="${ix}" data-line-num="${ix+1}"${
          commonLineId.commonId ? ` data-id="${commonLineId.commonId}"` : ''
        }${
          commonLineId.textMapHash ? ` data-textMapHash="${commonLineId.textMapHash}"` : ''
        }>`);
      } else {
        textLayerSb.push(`<div class="ace_line" data-line-idx="${ix}" data-line-num="${ix+1}">`);
      }
      if (gutters) {
        textLayerSb.push(`<span class="ace_gutter ace_gutter-cell">`); /*(ix + lineStart) + */
        textLayerSb.push(`</span>`);
      }
      textLayer.$renderLine(textLayerSb, ix, true, false);
      textLayerSb.push(`\n</div>`);
    }
    // ---- END LINE LOOP --------------------------------------------------------------------------------------------

    // Final HTML
    // --------------------------------------------------------------------------------------------------------------
    const html =
      `<div${opts.id ? ` id="${escapeHtml(opts.id)}"` : ''} data-highlight-id="${opts.uuid}" ` +
            `class="highlighted${gutters ? ' highlighted-has-gutters' : ''}${opts.noTheme ? '' : ' ' + theme.cssClass}" ` +
            `${opts.disableReadonlyContenteditable ? '' : `contenteditable readonly `}` +
            `style="position:relative">` +
        `<div class="ace_static_highlight${gutters ? ' ace_show_gutter' : ''}${opts.noInputStyle ? ' no-input-style' : ''}" style="counter-reset:ace_line ${lineStart - 1}">` +
          `<div class="ace_static_layer ace_static_text_layer">${textLayerSb.join('').replace(/\s*style=['"]width:NaNpx['"]/g, '')}</div>` +
        `</div>` +
      `</div>`;

    textLayer.destroy();

    // Return render result
    // --------------------------------------------------------------------------------------------------------------
    return {
      css: theme.cssText,
      html: html,
      session: session,
    };
  };

  // Load Theme
  // --------------------------------------------------------------------------------------------------------------
  let TextmateTheme = ace.acequire('ace/theme/textmate');
  let TomorrowNightTheme = ace.acequire('ace/theme/tomorrow_night');

  let theme;
  if (isNightmode()) {
    theme = TomorrowNightTheme;
  } else {
    theme = TextmateTheme;
  }

  // Run highlight
  // --------------------------------------------------------------------------------------------------------------
  let result: { html: string, session: ace.IEditSession } = Highlight.renderSync(opts.text, opts.mode, theme, 1, opts.gutters);

  // Convert to element
  // --------------------------------------------------------------------------------------------------------------
  let element: HTMLElement = document.createRange().createContextualFragment(result.html).firstElementChild as HTMLElement;

  // Text Layer Markers
  // --------------------------------------------------------------------------------------------------------------
  const markerAggs: Map<number, MarkerAggregate> = MarkerAggregate.from(Marker.splitting(opts.markers));
  if (opts.markerAdjustments) {
    for (let agg of markerAggs.values()) {
      agg.applyAdjustments(opts.markerAdjustments);
    }
  }
  if (markerAggs.size) {
    markifyTextLayer(element, markerAggs);
  }

  // Add action listeners
  // --------------------------------------------------------------------------------------------------------------
  if (opts.mode === 'ace/mode/wikitext') {
    applyWikitextClickableLinks(element);
    applyWikitextLineActions(element, opts.commonLineIds);
    applyWikitextLinker();
  }

  // Return element
  // --------------------------------------------------------------------------------------------------------------
  return element;
}
// endregion

// region Static Highlight: Helpers
// --------------------------------------------------------------------------------------------------------------

function splitAceTokenInTwo(token: HTMLElement, relPos: number): [HTMLElement, HTMLElement] {
  relPos = relPos < 0 ? 0 : relPos;
  relPos = relPos > token.innerText.length ? token.innerText.length : relPos;

  if (relPos === 0 || relPos === token.innerText.length) {
    return null;
  }

  const p1: string = token.innerText.slice(0, relPos);
  const p2: string = token.innerText.slice(relPos);

  const p1_el = token;
  token.innerText = p1;

  const p2_el = document.createElement('span');
  p2_el.innerText = p2;
  for (let attrName of token.getAttributeNames()) {
    p2_el.setAttribute(attrName, token.getAttribute(attrName));
  }

  return [p1_el, p2_el];
}

/**
 * Split an Ace token (expected to be a span element not containing any sub-elements).
 * The split tokens are added to the DOM as needed.
 *
 * @param token The token to split.
 * @param relStart Start position to split the token relative to the start of the token.
 * @param relEnd End position to split the token relative to the start of the token.
 * @returns The element for the split result between relStart and relEnd, or null if not applicable.
 */
function splitAceTokenForMarker(token: HTMLElement, relStart: number, relEnd: number): HTMLElement {
  relStart = relStart < 0 ? 0 : relStart;
  relEnd = relEnd > token.innerText.length ? token.innerText.length : relEnd;

  if (relStart === relEnd || relStart >= token.innerText.length || relEnd <= 0) {
    return null;
  }

  let p1: string;
  let p2: string;
  let p3: string;

  if (relStart === 0) {
    p1 = '';
  } else {
    p1 = token.innerText.slice(0, relStart);
  }

  p2 = token.innerText.slice(relStart, relEnd);

  if (relEnd === token.innerText.length) {
    p3 = '';
  } else {
    p3 = token.innerText.slice(relEnd);
  }

  if (!p1 && !p3) {
    return token;
  }

  let p1_el: HTMLElement;
  let p2_el: HTMLElement;
  let p3_el: HTMLElement;

  if (p1) {
    p1_el = token;
    p1_el.innerText = p1;
  } else {
    p2_el = token;
    p2_el.innerText = p2;
  }
  if (!p2_el) {
    p2_el = document.createElement('span');
    p2_el.innerText = p2;
    for (let attrName of token.getAttributeNames()) {
      p2_el.setAttribute(attrName, token.getAttribute(attrName));
    }
  }
  if (p3) {
    p3_el = document.createElement('span');
    p3_el.innerText = p3;
    for (let attrName of token.getAttributeNames()) {
      p3_el.setAttribute(attrName, token.getAttribute(attrName));
    }
  }

  let insertRel: HTMLElement = token;
  for (let htmlElement of [p1_el, p2_el, p3_el].filter(x => !!x).slice(1)) {
    insertRel.insertAdjacentElement('afterend', htmlElement);
    insertRel = htmlElement;
  }
  return p2_el;
}

function applyMarkerToToken(token: HTMLElement, marker: Marker) {
  token.classList.add(...marker.token.split(/[.\s]/g).filter(x => !!x));

  if (marker.attr) {
    for (let [attrKey, attrVal] of Object.entries(marker.attr)) {
      if (attrKey.startsWith('style.')) {
        token.style.setProperty(attrKey.slice('style.'.length), String(attrVal));
      } else if (attrKey.startsWith('class.')) {
        if (!attrVal || isEmpty(attrVal)) {
          token.classList.remove(attrKey.slice('class.'.length));
        } else {
          token.classList.add(attrKey.slice('class.'.length));
        }
      } else {
        if (attrVal === true) {
          token.setAttribute(attrKey, '');
        } else if (attrVal === false) {
          token.removeAttribute(attrKey);
        } else {
          token.setAttribute(attrKey, String(attrVal));
        }
      }
    }
  }
}

function markifyTextLayer(element: HTMLElement, aggs: Map<number, MarkerAggregate>) {
  const aceLines: HTMLElement[] = Array.from(element.querySelectorAll('.ace_static_text_layer .ace_line'));

  for (let i = 0; i < aceLines.length; i++) {
    const aceLine: HTMLElement = aceLines[i];

    // In order for this markification to work, all the child nodes of every ace_line must be an element, there cannot
    // be any text nodes.
    // Additionally, under every child element of every ace_line, there cannot be any further child elements, only text.
    let aceLineNode = aceLine.firstChild;
    while (aceLineNode) {
      const nextSibling = aceLineNode.nextSibling;
      if (isTextNode(aceLineNode)) {
        const span: HTMLSpanElement = document.createElement('span');
        aceLineNode.replaceWith(span);
        span.append(aceLineNode);
      }
      aceLineNode = nextSibling;
    }

    const agg: MarkerAggregate = aggs.get(i + 1);
    if (!agg)
      continue;

    for (let marker of agg.markers) {
      if (marker.fullLine) {
        applyMarkerToToken(aceLine, marker);
        continue;
      }

      let pos: number = 0;
      let token: HTMLElement = aceLine.firstElementChild as HTMLElement;
      while (token) {
        const tokenRange: IndexedRange = { start: pos, end: pos + token.innerText.length };
        const intersect = intersectRange(tokenRange, marker);

        if (intersect) {
          const relStart = intersect.start - tokenRange.start;
          const relEnd = intersect.end - tokenRange.start;

          const markToken = splitAceTokenForMarker(token, relStart, relEnd);
          if (markToken) {
            applyMarkerToToken(markToken, marker);
          }
        }

        pos += token.innerText.length;
        token = token.nextElementSibling as HTMLElement;
      }
    }
  }
}
// endregion

// region Static Highlight: Replace Function
// --------------------------------------------------------------------------------------------------------------
export function highlightReplace(original: HTMLElement, opts: HighlightReplaceOptions): HTMLElement {
  if (original.hasAttribute('id'))
    opts.id = original.getAttribute('id');
  if (original.hasAttribute('data-highlight-id'))
    opts.uuid = original.getAttribute('data-highlight-id');
  if (original.hasAttribute('data-mode'))
    opts.mode = original.getAttribute('data-mode');
  if (!opts.markers && original.hasAttribute('data-markers'))
    opts.markers = original.getAttribute('data-markers');
  if (original.hasAttribute('data-gutters'))
    opts.gutters = toBoolean(original.getAttribute('data-gutters'));
  if (original.hasAttribute('data-show-text-map-hash'))
    opts.showTextMapHash = toBoolean(original.getAttribute('data-show-text-map-hash'));
  if (original.hasAttribute('data-is-wiki-template-fragment'))
    opts.isWikiTemplateFragment = toBoolean(original.getAttribute('data-is-wiki-template-fragment'));
  if (original.hasAttribute('data-line-ids'))
    opts.commonLineIds = parseCommonLineIds(original.getAttribute('data-line-ids'));
  if (toBoolean(original.hasAttribute('data-no-input-style')) || original.classList.contains('no-input-style'))
    opts.noInputStyle = true;
  if (toBoolean(original.hasAttribute('data-no-theme')) || original.classList.contains('no-theme'))
    opts.noTheme = true;


  const element: HTMLElement = highlight({ text: opts.textOverride || getInputValue(original), ... opts });

  if (original.hasAttribute('class')) {
    element.classList.add(...Array.from(original.classList));
  }

  for (let attributeName of original.getAttributeNames()) {
    if (attributeName.toUpperCase() === 'CLASS')
      continue;
    if (attributeName.toUpperCase() === 'ID' && element.hasAttribute('ID'))
      continue;
    element.setAttribute(attributeName, original.getAttribute(attributeName));
  }

  if (!opts.disableReadonlyContenteditable && element.classList.contains('readonly-contenteditable-processed')) {
    element.classList.remove('readonly-contenteditable-processed');
  }

  original.replaceWith(element);
  return element;
}
// endregion

// region Static Highlight: Existing Element
// --------------------------------------------------------------------------------------------------------------

export function highlightExistingElement(targetElement: HTMLElement, opts: HighlightExistingElementOptions) {
  const textNodes: Text[] = textNodesUnder(targetElement);
  const targetText: string = textNodes.map(n => n.textContent).join('');

  const highlightElement: HTMLElement = highlight({
    text: targetText,
    ...opts
  });

  highlightExistingElementInternal(targetElement, highlightElement);
}

export function highlightExistingElementInternal(targetElement: HTMLElement, highlightElement: HTMLElement, specificLine?: number) {
  const textNodes: Text[] = textNodesUnder(targetElement);
  const aceTokens: HTMLElement[] = specificLine
    ? Array.from(highlightElement.querySelectorAll<HTMLElement>(`.ace_line[data-line-num="${specificLine}"] > *`))
    : Array.from(highlightElement.querySelectorAll<HTMLElement>('.ace_line > *'));

  function eatTokens(expectedLength: number): HTMLElement[] {
    if (expectedLength <= 0) {
      return [];
    }

    const myTokens: HTMLElement[] = [];
    let accLen: number = 0;

    while (true) {
      const curr: HTMLElement = aceTokens.shift();
      if (!curr) {
        break;
      }

      const newAccLen = accLen + curr.textContent.length;

      if (newAccLen < expectedLength) {
        myTokens.push(curr);
        accLen = newAccLen;
        continue;
      } else if (newAccLen === expectedLength) {
        myTokens.push(curr);
        accLen = newAccLen;
        break;
      }

      const delta = newAccLen - expectedLength;
      const splitPos = curr.textContent.length - delta;
      const [tok1, tok2] = splitAceTokenInTwo(curr, splitPos);

      myTokens.push(tok1);
      if (tok2.textContent.length) {
        aceTokens.unshift(tok2);
      }
      break;
    }

    return myTokens;
  }

  for (let textNode of textNodes) {
    const len: number = textNode.textContent.length;
    if (len === 0)
      continue;
    const tokens = eatTokens(len)
    textNode.replaceWith(... tokens);
  }
}
// endregion

// region Specific Highlight: JSON
// --------------------------------------------------------------------------------------------------------------
export function highlightJson(opts: Omit<HighlightOptions, 'mode'>): HTMLElement {
  let realOpts: HighlightOptions = opts as HighlightOptions;
  realOpts.mode = 'ace/mode/json';
  return highlight(realOpts);
}
// endregion

// region Specific Highlight: Wikitext
// --------------------------------------------------------------------------------------------------------------
export function highlightWikitext(opts: Omit<HighlightOptions, 'mode'>): HTMLElement {
  let realOpts: HighlightOptions = opts as HighlightOptions;
  realOpts.mode = 'ace/mode/wikitext';
  return highlight(realOpts);
}

export function highlightWikitextReplace(original: HTMLElement, opts?: Omit<HighlightReplaceOptions, 'mode'>): HTMLElement {
  let realOpts: HighlightOptions = (opts || {}) as HighlightOptions;
  realOpts.mode = 'ace/mode/wikitext';
  return highlightReplace(original, realOpts);
}
// endregion

// region Window exports
// --------------------------------------------------------------------------------------------------------------
(<any> window).aceHighlights = aceHighlights;
(<any> window).highlight = highlight;
(<any> window).highlightReplace = highlightReplace;
(<any> window).highlightJson = highlightJson;
(<any> window).highlightWikitext = highlightWikitext;
(<any> window).highlightWikitextReplace = highlightWikitextReplace;
// endregion
