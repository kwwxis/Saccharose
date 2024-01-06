// noinspection JSUnusedGlobalSymbols,JSDeprecatedSymbols

import { saveAs } from 'file-saver';
import { isNotEmpty, isset } from '../../shared/util/genericUtil.ts';

/**
 * Returns the tag name of an element in all-lowercase.
 */
export function tag(el: Element): string {
  return el ? el.tagName.toLowerCase() : null;
}

export function createElement<T extends HTMLElement = HTMLElement>(tag: string, attrs: {[attr: string]: string|number|boolean} = {}): T {
  let el = document.createElement(tag);
  for (let attr of Object.keys(attrs)) {
    if (attr === 'text' || attr === 'textContent' || attr === 'innerText') {
      el.innerText = String(attrs[attr]);
    } else if (attr === 'html' || attr === 'HTML' || attr === 'innerHTML') {
      el.innerHTML = String(attrs[attr]);
    } else if (typeof attrs[attr] === 'string') {
      el.setAttribute(attr, attrs[attr] as string);
    } else if (typeof attrs[attr] === 'number') {
      el.setAttribute(attr, String(attrs[attr]));
    } else if (attrs[attr] === true) {
      el.setAttribute(attr, '');
    }
  }
  return el as T;
}

/**
 * Waits for an element to exist within the DOM.
 * @param parent The parent element to search for the element within.
 * @param selector The selector for the element to find.
 * @param callback The callback to run if the element is found.
 * @param [callbackNotFound] The callback to run if the element was not found after max tries is exceeded.
 * @param [intervalMs=50] The number of milliseconds between each try.
 * @param [maxTries=100] The maximum number of tries.
 * @param [currentTry=1] The current try (internal parameter).
 */
export function waitForElementCb<E extends Element = HTMLElement>(
        parent: Document|Element, selector: string, callback: ((el: E) => void), callbackNotFound?: (() => void),
        intervalMs: number = 50, maxTries = 100, currentTry = 1) {
    if (currentTry > maxTries) {
        if (callbackNotFound)
            callbackNotFound();
        return;
    }
    let el: E;
    if ((el = parent.querySelector(selector))) {
        callback(el);
        return;
    }
    setTimeout(() => {
        waitForElementCb(parent, selector, callback, callbackNotFound, intervalMs, maxTries, currentTry + 1);
    }, intervalMs);
}

/**
 * Waits for an element to exist within the DOM.
 * @param parent The parent element to search for the element within.
 * @param selector The selector for the element to find.
 * @param [intervalMs=50] The number of milliseconds between each try.
 * @param [maxTries=100] The maximum number of tries.
 * @returns {Promise<Element>} Promise that resolves with the element if found within max tries, otherwise rejects.
 */
export function waitForElement<E extends Element = HTMLElement>(parent: Document|Element, selector: string, intervalMs: number = 50, maxTries = 100): Promise<E> {
    return new Promise((resolve, reject) => {
        waitForElementCb<E>(parent, selector, el => resolve(el), () => reject(), intervalMs, maxTries);
    });
}

/**
 * Returns true if the provided element is completely within the viewport (vertically).
 * @param element
 */
export function isElementCompletelyInViewport(element: Element): boolean {
    return getElementPercentageInViewport(element) === 100;
}

/**
 * Returns true if the provided element is partially within the viewport (vertically).
 * @param element
 */
export function isElementPartiallyInViewport(element: Element): boolean {
    return getElementPercentageInViewport(element) > 0;
}

/**
 * Get percentage of element that is in the viewport (vertically).
 * @param element The element to check
 * @param viewportTopOffset Optional viewport top offset. This is useful if you have a sticky header, you can
 * set this to the height of the header.
 * @param viewportScrollTopProvider
 * @param viewportHeightProvider
 * @returns {number} A percentage from 0 to 100
 */
export function getElementPercentageInViewport(element: Element, viewportTopOffset: number = 0,
                                               viewportScrollTopProvider: (() => number) = () => window.scrollY,
                                               viewportHeightProvider: (() => number) = () => window.innerHeight || document.documentElement.clientHeight): number {
    if (!element)
        return 0;

    let boundingRect = element.getBoundingClientRect();
    let scrollTop = viewportScrollTopProvider();

    // Coordinates of the element:
    let s0 = scrollTop + boundingRect.top;
    let e0 = s0 + boundingRect.height;

    // Coordinates of the viewport:
    let s1 = scrollTop + viewportTopOffset;
    let e1 = s1 + viewportHeightProvider();

    if (s1 > e0 || s0 > e1) {
        return 0;
    }

    let s = Math.max(s0, s1);
    let e = Math.min(e0, e1);

    return ((e - s) / boundingRect.height) * 100;
}

/**
 * Scroll to a particular element.
 */
export function scrollToElement(scrollEl: Element) {
    if (!scrollEl || isElementPartiallyInViewport(scrollEl))
        return;
    const subtractTop = 10;
    const top = window.scrollY + scrollEl.getBoundingClientRect().top - subtractTop;
    window.scroll(0, top);
}

export function flashElement(flashEl: Element) {
    if (!flashEl)
        return;
    flashEl.classList.add('flash');
    setTimeout(() => (<Element> flashEl).classList.remove('flash'), 800);
}

export function scrollToElementThenFlash(scrollEl: Element, flashEl?: Element) {
    scrollToElement(scrollEl);
    flashElement(flashEl || scrollEl)
}

export function hashFlash(initialDelay: number = 0) {
    let hash = window.location.hash;
    if (hash && hash.length > 1) {
        hash = hash.slice(1);
        console.log('Hash Change:', hash);
        let target = document.getElementById(hash);
        if (target) {
            setTimeout(() => {
                window.history.replaceState({}, null, window.location.href.split('#')[0]);
                target.classList.add('flash');
                setTimeout(() => {
                    target.classList.remove('flash');
                }, 1000);
            }, initialDelay);
        }
    }
}

/**
 * Deselects any currently selected text.
 */
export function deselectText() {
    let docSelection = (<any> document).selection;
    if (docSelection && docSelection.empty) {
        docSelection.empty();
    } else if (window.getSelection) {
        let sel = window.getSelection();
        sel.removeAllRanges();
    }
}

/**
 * Checks if there is any selection anywhere in the page.
 */
export function hasSelection(): boolean {
  const sel = window.getSelection();
  return sel.rangeCount > 0 && !!sel.getRangeAt(0).toString();
}

/**
 * Get the closest parent that matches the given selector, or `null` if not found.
 * @param element
 * @param selector
 */
export function getClosestParent(element: Element, selector: string) {
    return element.parentElement ? element.parentElement.closest(selector) : null;
}

export const keyboardEventHandlers = {
    allowOnlyPositiveNumbers(e: KeyboardEvent, allowE = true) {
        // noinspection JSDeprecatedSymbols
        const code = e.keyCode || e.which;

        if (!allowE && (e.key === 'e' || e.key === 'E' || code === 69)) {
            e.preventDefault();
            e.stopPropagation();
        } else if (e.key === '-' || code === 189) {
            e.preventDefault();
            e.stopPropagation();
        }
    },
    allowOnlyPositiveIntegers(e: KeyboardEvent, allowE = true) {
        // noinspection JSDeprecatedSymbols
        const code = e.keyCode || e.which;

        if (!allowE && (e.key === 'e' || e.key === 'E' || code === 69)) {
            e.preventDefault();
            e.stopPropagation();
        } else if (e.key === '-' || code === 189) {
            e.preventDefault();
            e.stopPropagation();
        } else if (e.key === '.' || code === 190) {
            e.preventDefault();
            e.stopPropagation();
        }
    },
    disallowEKey(e: KeyboardEvent) {
        // noinspection JSDeprecatedSymbols
        const code = e.keyCode || e.which;
        if (e.key === 'e' || e.key === 'E' || code === 69) {
            e.preventDefault();
            e.stopPropagation();
        }
    },
    disallowNegatives(e: KeyboardEvent) {
        // noinspection JSDeprecatedSymbols
        const code = e.keyCode || e.which;
        if (e.key === '-' || code === 189) {
            e.preventDefault();
            e.stopPropagation();
        }
    },
    disallowDecimals(e: KeyboardEvent) {
        // noinspection JSDeprecatedSymbols
        const code = e.keyCode || e.which;
        if (e.key === '.' || code === 190) {
            e.preventDefault();
            e.stopPropagation();
        }
    }
}

export function getSessionStorageObject<T = any>(key: string): T {
  const value = window.sessionStorage.getItem(key);
  return value === null ? null : JSON.parse(value);
}

export function setSessionStorageObject(key: string, value: any): void {
  if (typeof value === 'undefined' || value === null) {
    removeSessionStorageObject(key);
  } else {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  }
}

export function removeSessionStorageObject(key: string): void {
  window.sessionStorage.removeItem(key);
}

export async function pasteFromClipboard(target: HTMLInputElement|HTMLTextAreaElement): Promise<string> {
  if (navigator.clipboard && navigator.clipboard.readText) {
    return navigator.clipboard.readText().then(text => target.value = text);
  } else {
    // not supported by firefox
  }
}

async function imageAsBlob(image: HTMLImageElement|Blob): Promise<Blob> {
  let blob: Blob;

  if (isElement(image)) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);

    blob = await new Promise((resolve) => {
      canvas.toBlob(canvasBlob => resolve(canvasBlob), 'image/png', 1);
    });
  } else {
    blob = image;
  }

  return blob;
}

export async function copyImageToClipboard(image: HTMLImageElement|Blob): Promise<void> {
  const blob: Blob = await imageAsBlob(image);
  return navigator.clipboard.write([
    new ClipboardItem({
      [blob.type]: blob
    })
  ]);
}

/**
 * Should be called from a user-interaction event listener such as `click`.
 *
 * Copied from https://stackoverflow.com/a/33928558
 */
export async function copyTextToClipboard(text: string): Promise<void> {
    if (navigator.clipboard) {
        return navigator.clipboard.writeText(text);
    } else if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
        const textarea = document.createElement('textarea');
        textarea.textContent = text;

        textarea.style.position = 'fixed'; // Prevent scrolling to bottom of page in MS Edge.
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.width = '2em';
        textarea.style.height = '2em';
        textarea.style.padding = '0';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.boxShadow = 'none';
        textarea.style.background = 'transparent';

        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            if (document.execCommand('copy')) {
                return Promise.resolve();
            } else {
                return Promise.reject();
            }
        } catch (ex) {
            return Promise.reject();
        } finally {
            document.body.removeChild(textarea);
        }
    } else {
        return Promise.reject();
    }
}

/**
 * Save JSON file.
 *
 * @param {object} exportObj the object to save
 * @param {string} exportName file name to save as
 * @param {number} indentation indentation level
 */
export function downloadObjectAsJson(exportObj: any, exportName: string, indentation: number = 0) {
  if (exportName.toLowerCase().endsWith('.json')) exportName = exportName.slice(0, -5);
  let text = JSON.stringify(exportObj, null, indentation);
  let blob = new Blob([ text ], { type: "application/json;charset=utf-8" });
  saveAs(blob, exportName + '.json');
}

export function downloadTextAsFile(fileName: string, text: string) {
  let blob = new Blob([ text ], { type: "text/plain;charset=utf-8" });
  saveAs(blob, fileName);
}

export async function downloadImage(image: HTMLImageElement|Blob, fileName: string) {
  const blob: Blob = await imageAsBlob(image);
  saveAs(blob, fileName);
}

/**
 * Set current url query string parameter without moving the browser history state forward.
 */
export function setQueryStringParameter(name: string, value: string) {
  const params = new URLSearchParams(window.location.search);
  params.set(name, value);
  window.history.replaceState({}, '', decodeURIComponent(`${window.location.pathname}?${params}`));
}

/**
 * Set current url query string parameter without moving the browser history state forward.
 */
export function deleteQueryStringParameter(name: string) {
  const params = new URLSearchParams(window.location.search);
  params.delete(name);
  let newUrl = decodeURIComponent(`${window.location.pathname}?${params}`);
  if (newUrl.endsWith('?')) {
    newUrl = newUrl.slice(0, -1);
  }
  window.history.replaceState({}, '', newUrl);
}

/**
 * Returns a CSS selector that selects any focusable elements (e.g. buttons, inputs, textareas, etc.)
 *
 * @param {string} [prefix] optional prefix for each component of the selector
 * @returns {string}
 */
export function getFocusableSelector(prefix: string = '') {
    let arr = ['button', '[role=button]', 'a', 'input:not([type=hidden]):not([readonly])', 'select', 'textarea:not([readonly])', '[tabindex]:not([tabindex^="-"])'];
    if (prefix) {
        arr = arr.map(v => prefix + ' ' + v);
    }
    return arr.join(', ');
}

export function focusFirstInElement(element: HTMLElement, e?: Event) {
    let focusableEl: HTMLElement = element.querySelector(getFocusableSelector());
    if (focusableEl) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        // Focus the first focusable element inside the target
        focusableEl.focus();
        setTimeout(() => focusableEl.focus(), 0);
    }
}

export function getScrollbarWidth() {
    // Creating invisible container
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll'; // forcing scrollbar to appear
    (<any> outer.style).msOverflowStyle = 'scrollbar'; // needed for WinJS apps
    document.body.appendChild(outer);

    // Creating inner element and placing it in the container
    const inner = document.createElement('div');
    outer.appendChild(inner);

    // Calculating difference between container's full width and the child width
    const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);

    // Removing temporary elements from the DOM
    outer.parentNode.removeChild(outer);

    return scrollbarWidth;
}

export function createPlaintextContenteditable(attrib: {[attr: string]: string|number} = {}): HTMLElement {
    let div = document.createElement('div');
    div.setAttribute('contenteditable', 'PLAINTEXT-ONLY');
    if (div.contentEditable?.toLowerCase() !== 'plaintext-only') {
        div.setAttribute('contenteditable', 'contenteditable');
    }
    div.addEventListener('keypress', (e) => {
        // noinspection JSDeprecatedSymbols
        const code = e.keyCode || e.which;
        if (e.key === 'Enter' || code === 10 || code === 13) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });
    div.addEventListener('paste', (e) => {
        if (!document.execCommand) {
            return;
        }

        e.preventDefault()
        e = (<any> e).originalEvent || e;

        let text = '';
        if (e.clipboardData) {
            text = e.clipboardData.getData('text/plain');
        } else if ((<any> window).clipboardData) {
            text = (<any> window).clipboardData.getData('Text');
        } else {
            return;
        }
        if (text) {
            text = (text || '').replace(/(\r\n|\r|\n)/g, ' ');
        }
        if (document.queryCommandSupported('insertText')) {
            document.execCommand('insertText', false, text);
        } else {
            document.execCommand('paste', false, text);
        }
    });
    for (let key in attrib) {
        div.setAttribute(key, String(attrib[key]));
    }
    return div;
}

export function getHiddenElementBounds(el: HTMLElement): { width: number, height: number } {
  let tmp = document.createElement('div');
  tmp.setAttribute('style', 'position: fixed; visibility: hidden; top: 0; left: 0; width: 0; height: 0; pointer-events: none; opacity: 0;');
  document.body.append(tmp);
  tmp.innerHTML = el.outerHTML;
  tmp.firstElementChild.setAttribute('style', 'transition:none;transform:none;');
  tmp.firstElementChild.classList.remove('hide');
  let width = tmp.firstElementChild.getBoundingClientRect().width;
  let height = tmp.firstElementChild.getBoundingClientRect().height;
  return { width, height };
}


export function isNode(o): o is Node {
  return (
    typeof Node === "object" ? o instanceof Node :
      o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
  );
}

export function isElement(o): o is HTMLElement {
  return (
    typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
      o && typeof o === "object" && o.nodeType === 1 && typeof o.nodeName==="string"
  );
}

export function isFragment(o): o is DocumentFragment {
  return (
    typeof DocumentFragment === "object" ? o instanceof DocumentFragment : //DOM2
      o && typeof o === "object" && o.nodeType === 11 && typeof o.nodeName==="string"
  );
}

export function isNodeList(nodes): nodes is NodeList {
  let stringRepr = Object.prototype.toString.call(nodes);

  return typeof nodes === 'object' &&
    /^\[object (HTMLCollection|NodeList|Object)]$/.test(stringRepr) &&
    (typeof nodes.length === 'number') &&
    (nodes.length === 0 || (typeof nodes[0] === "object" && nodes[0].nodeType > 0));
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export function frag(html: string|Node|NodeList|Node[]|HTMLElement) {
  if (!isset(html)) {
    return document.createDocumentFragment();
  }

  if (isElement(html) && html.tagName.toUpperCase() == 'TEMPLATE') {
    html = html.innerHTML.trim();
  }

  const frag = document.createDocumentFragment();
  const div = document.createElement('div');

  if (typeof html === 'string') {
    div.innerHTML = html;
  } else if (isNodeList(html)) {
    html.forEach(node => div.append(node));
  } else if (isNode(html)) {
    div.append(html);
  } else if (Array.isArray(html)) {
    div.append(... html);
  }

  let child;
  while ( (child = div.firstChild) ) {
    frag.appendChild(child);
  }

  return frag;
}

export function frag1<T extends Element = HTMLElement>(html: string|Node|NodeList|Node[]|HTMLElement): T {
  return frag(html).firstElementChild as T;
}

/**
 * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
 *
 * @param {String} text The text to be rendered.
 * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
 *
 * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
export function getTextWidth(text: string, font: string): number {
  // re-use canvas object for better performance
  const canvas: HTMLCanvasElement = (<any> getTextWidth).canvas || ((<any> getTextWidth).canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);
  return metrics.width;
}

function getCssStyle(element: Element, prop: string): string {
  return window.getComputedStyle(element, null).getPropertyValue(prop);
}

export function getCanvasFont(el = document.body) {
  const fontWeight = getCssStyle(el, 'font-weight') || 'normal';
  const fontSize = getCssStyle(el, 'font-size') || '16px';
  const fontFamily = getCssStyle(el, 'font-family') || 'Times New Roman';

  return `${fontWeight} ${fontSize} ${fontFamily}`;
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

export function textNodesUnder(el: Element): Text[] {
  const a: Text[] = [];
  const walk= document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  let n: Text;
  while(n = <Text> walk.nextNode()) a.push(n);
  return a;
}

/**
 * Similar to {@link Element#getBoundingClientRect} but gets the positions relative to the document rather than
 * the viewport.
 * @param el
 */
export function getElementOffset(el: HTMLElement): DOMRect {
  const boundingRect = el.getBoundingClientRect();
  var _docHeight = document.body.offsetHeight;
  var _docWidth = document.body.offsetWidth;

  var _x = 0;
  var _y = 0;
  while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
    _x += el.offsetLeft - el.scrollLeft;
    _y += el.offsetTop - el.scrollTop;
    el = el.offsetParent as HTMLElement;
  }

  const obj = {
    top: _y,
    left: _x,
    x: _x,
    y: _y,
    width: boundingRect.width,
    height: boundingRect.height,

    bottom: _docHeight - _y -  boundingRect.height,
    right: _docWidth - _x - boundingRect.width,
  };

  return {
    ... obj,
    toJSON(): any {
      return obj;
    }
  };
}

export class DOMClassWatcher {
  private readonly targetNode: HTMLElement;
  private readonly classToWatch: string;
  private readonly classAddedCallback: () => void;
  private readonly classRemovedCallback: () => void;
  private observer: MutationObserver;
  private lastClassState: boolean;

  constructor(targetNode: HTMLElement | string, classToWatch: string, classAddedCallback: () => void, classRemovedCallback: () => void) {
    if (typeof targetNode === 'string') {
      this.targetNode = document.querySelector<HTMLElement>(targetNode);
    } else {
      this.targetNode = targetNode;
    }
    this.classToWatch = classToWatch;
    this.classAddedCallback = classAddedCallback;
    this.classRemovedCallback = classRemovedCallback;
    this.observer = null;
    this.lastClassState = this.targetNode.classList.contains(this.classToWatch);

    this.init();
  }

  init() {
    this.observer = new MutationObserver(this.mutationCallback);
    this.observe();
  }

  observe() {
    this.observer.observe(this.targetNode, { attributes: true });
  }

  disconnect() {
    this.observer.disconnect();
  }

  mutationCallback = mutationsList => {
    for (let mutation of mutationsList) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        let currentClassState = mutation.target.classList.contains(this.classToWatch);
        if (this.lastClassState !== currentClassState) {
          this.lastClassState = currentClassState;
          if (currentClassState) {
            this.classAddedCallback();
          } else {
            this.classRemovedCallback();
          }
        }
      }
    }
  };
}

declare global {
  interface Storage {
    getObject<T>(key: string, defaultValue?: T): T;
    setObject<T>(key: string, value: T): void;
    removeObject(key: string): void;
  }
}

Object.defineProperty(Storage.prototype, 'getObject', {
  value: function<T>(this: Storage, key: string, defaultValue?: T): T {
    let value = this.getItem(key);
    if (typeof value === 'undefined' || value === null) {
      return isset(defaultValue) ? defaultValue : value as T;
    }
    return JSON.parse(value) as T;
  }
});

Object.defineProperty(Storage.prototype, 'setObject', {
  value: function<T>(this: Storage, key: string, value: T): void {
    if (typeof value === 'undefined' || value === null) {
      this.removeItem(key);
    } else {
      this.setItem(key, JSON.stringify(value));
    }
  }
});


Object.defineProperty(Storage.prototype, 'removeObject', {
  value: function(this: Storage, key: string) {
    this.removeItem(key);
  }
});
