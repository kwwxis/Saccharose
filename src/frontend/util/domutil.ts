import { saveAs } from 'file-saver';

export function createElement(tag: string, attrs: {[attr: string]: string|number|boolean} = {}) {
    let el = document.createElement(tag);
    for (let attr of Object.keys(attrs)) {
        if (typeof attrs[attr] === 'string') {
            el.setAttribute(attr, attrs[attr] as string);
        } else if (typeof attrs[attr] === 'number') {
            el.setAttribute(attr, String(attrs[attr]));
        } else if (attrs[attr] === true) {
            el.setAttribute(attr, '');
        }
    }
    return el;
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

/**
 * Should be called from a user-interaction event listener such as `click`.
 *
 * Copied from https://stackoverflow.com/a/33928558
 */
export function copyToClipboard(text: string): Promise<void> {
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

export function downloadTextAsFile(filename: string, text: string) {
    let blob = new Blob([ text ], { type: "text/plain;charset=utf-8" });
    saveAs(blob, filename);
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