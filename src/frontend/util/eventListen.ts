import { isElement, waitForElement } from './domutil.ts';

export interface ListenerEventMap extends HTMLElementEventMap, WindowEventMap {
  enter: KeyboardEvent,
  ready: Event
}

export interface ListenerObject<K extends keyof ListenerEventMap, E extends Element = HTMLElement> {
  selector?: HTMLElement|HTMLElement[]|Document|string;
  event: K;
  multiple?: boolean;
  handle: (evt: ListenerEventMap[K], E) => void;
  [extraProp: string]: any;
}

export type Listener<E extends Element = any> =
  ListenerObject<'abort', E> |
  ListenerObject<'animationcancel', E> |
  ListenerObject<'animationend', E> |
  ListenerObject<'animationiteration', E> |
  ListenerObject<'animationstart', E> |
  ListenerObject<'auxclick', E> |
  ListenerObject<'beforeinput', E> |
  ListenerObject<'blur', E> |
  ListenerObject<'cancel', E> |
  ListenerObject<'canplay', E> |
  ListenerObject<'canplaythrough', E> |
  ListenerObject<'change', E> |
  ListenerObject<'click', E> |
  ListenerObject<'close', E> |
  ListenerObject<'compositionend', E> |
  ListenerObject<'compositionstart', E> |
  ListenerObject<'compositionupdate', E> |
  ListenerObject<'contextmenu', E> |
  ListenerObject<'copy', E> |
  ListenerObject<'cuechange', E> |
  ListenerObject<'cut', E> |
  ListenerObject<'dblclick', E> |
  ListenerObject<'drag', E> |
  ListenerObject<'dragend', E> |
  ListenerObject<'dragenter', E> |
  ListenerObject<'dragleave', E> |
  ListenerObject<'dragover', E> |
  ListenerObject<'dragstart', E> |
  ListenerObject<'drop', E> |
  ListenerObject<'durationchange', E> |
  ListenerObject<'emptied', E> |
  ListenerObject<'ended', E> |
  ListenerObject<'error', E> |
  ListenerObject<'focus', E> |
  ListenerObject<'focusin', E> |
  ListenerObject<'focusout', E> |
  ListenerObject<'formdata', E> |
  ListenerObject<'gotpointercapture', E> |
  ListenerObject<'input', E> |
  ListenerObject<'invalid', E> |
  ListenerObject<'keydown', E> |
  ListenerObject<'keypress', E> |
  ListenerObject<'keyup', E> |
  ListenerObject<'load', E> |
  ListenerObject<'loadeddata', E> |
  ListenerObject<'loadedmetadata', E> |
  ListenerObject<'loadstart', E> |
  ListenerObject<'lostpointercapture', E> |
  ListenerObject<'mousedown', E> |
  ListenerObject<'mouseenter', E> |
  ListenerObject<'mouseleave', E> |
  ListenerObject<'mousemove', E> |
  ListenerObject<'mouseout', E> |
  ListenerObject<'mouseover', E> |
  ListenerObject<'mouseup', E> |
  ListenerObject<'paste', E> |
  ListenerObject<'pause', E> |
  ListenerObject<'play', E> |
  ListenerObject<'playing', E> |
  ListenerObject<'pointercancel', E> |
  ListenerObject<'pointerdown', E> |
  ListenerObject<'pointerenter', E> |
  ListenerObject<'pointerleave', E> |
  ListenerObject<'pointermove', E> |
  ListenerObject<'pointerout', E> |
  ListenerObject<'pointerover', E> |
  ListenerObject<'pointerup', E> |
  ListenerObject<'progress', E> |
  ListenerObject<'ratechange', E> |
  ListenerObject<'reset', E> |
  ListenerObject<'resize', E> |
  ListenerObject<'scroll', E> |
  ListenerObject<'scrollend', E> |
  ListenerObject<'securitypolicyviolation', E> |
  ListenerObject<'seeked', E> |
  ListenerObject<'seeking', E> |
  ListenerObject<'select', E> |
  ListenerObject<'selectionchange', E> |
  ListenerObject<'selectstart', E> |
  ListenerObject<'slotchange', E> |
  ListenerObject<'stalled', E> |
  ListenerObject<'submit', E> |
  ListenerObject<'suspend', E> |
  ListenerObject<'timeupdate', E> |
  ListenerObject<'toggle', E> |
  ListenerObject<'touchcancel', E> |
  ListenerObject<'touchend', E> |
  ListenerObject<'touchmove', E> |
  ListenerObject<'touchstart', E> |
  ListenerObject<'transitioncancel', E> |
  ListenerObject<'transitionend', E> |
  ListenerObject<'transitionrun', E> |
  ListenerObject<'transitionstart', E> |
  ListenerObject<'volumechange', E> |
  ListenerObject<'waiting', E> |
  ListenerObject<'webkitanimationend', E> |
  ListenerObject<'webkitanimationiteration', E> |
  ListenerObject<'webkitanimationstart', E> |
  ListenerObject<'webkittransitionend', E> |
  ListenerObject<'wheel', E> |

  ListenerObject<'afterprint', E> |
  ListenerObject<'beforeprint', E> |
  ListenerObject<'beforeunload', E> |
  ListenerObject<'DOMContentLoaded', E> |
  ListenerObject<'devicemotion', E> |
  ListenerObject<'deviceorientation', E> |
  ListenerObject<'fullscreenchange', E> |
  ListenerObject<'fullscreenerror', E> |
  ListenerObject<'gamepadconnected', E> |
  ListenerObject<'gamepaddisconnected', E> |
  ListenerObject<'hashchange', E> |
  ListenerObject<'languagechange', E> |
  ListenerObject<'message', E> |
  ListenerObject<'messageerror', E> |
  ListenerObject<'offline', E> |
  ListenerObject<'online', E> |
  ListenerObject<'orientationchange', E> |
  ListenerObject<'pagehide', E> |
  ListenerObject<'pageshow', E> |
  ListenerObject<'popstate', E> |
  ListenerObject<'rejectionhandled', E> |
  ListenerObject<'storage', E> |
  ListenerObject<'unhandledrejection', E> |
  ListenerObject<'unload', E> |

  ListenerObject<'ready', E> |
  ListenerObject<'enter'>;

export function runWhenDOMContentLoaded(runnable: Function) {
  if (/comp|inter|loaded/.test(document.readyState)) {
    runnable();
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      runnable();
    });
  }
}

export class ListenRef {
  protected _rel: HTMLElement|Document;
  protected _didInit: boolean = false;
  protected _isEnabled: boolean = false;
  protected _handles: {element: Element|Document|Window, event: string, listener: Function}[] = [];

  get relElement(): HTMLElement|Document {
    return this._rel;
  }

  appendRelTo(target: Element|string) {
    const targetEl: Element = isElement(target) ? target : document.querySelector(target);
    targetEl.append(this._rel);
  }

  isEnabled() {
    return this._isEnabled;
  }

  isDisabled() {
    return !this._isEnabled;
  }

  enable() {
    if (!this._didInit) {
      return;
    }
    if (this.isEnabled()) {
      return;
    }
    this._isEnabled = true;
    for (let handle of this._handles) {
      handle.element.addEventListener(handle.event, handle.listener as any);
    }
  }

  disable() {
    if (!this._didInit) {
      return;
    }
    if (this.isDisabled()) {
      return;
    }
    this._isEnabled = false;
    for (let handle of this._handles) {
      handle.element.removeEventListener(handle.event, handle.listener as any);
    }
  }
}

export function listen(
  listeners: Listener|Listener[],
  rel: Element|HTMLElement|Document|string = undefined,
  addToRef?: ListenRef
): ListenRef {
  if (!Array.isArray(listeners)) {
    listeners = [listeners];
  }

  const ref: ListenRef = addToRef || new ListenRef();

  if (typeof rel === 'string') {
    waitForElement(document, rel).then(el => listen(listeners, el, ref));
    return ref;
  } else if (!rel || typeof rel === 'undefined') {
    listen(listeners, window.document, ref);
    return ref;
  }

  (<any> ref)._rel = rel;

  listeners.forEach(opts => {
    if (opts.event === 'ready') {
      runWhenDOMContentLoaded(() => opts.handle.call(opts, null, null));
      return;
    } else if (opts.event === 'enter') {
      opts.event = 'keypress' as any;
      let originalFn = opts.handle;
      opts.handle = function(event: KeyboardEvent, target: HTMLElement) {
        if (event.code === 'Enter' || (event.keyCode ? event.keyCode : event.which) === 13) {
          originalFn.call(opts, event, target);
        }
      } as any;
    }

    if (opts.multiple) {
      let targets: (Element|Document)[];
      if (typeof opts.selector === 'string') {
        targets = Array.from(rel.querySelectorAll(opts.selector));
      } else {
        targets = Array.isArray(opts.selector) ? opts.selector : [opts.selector];
      }
      Array.from(targets).forEach(target => {
        const listener = function(event) {
          opts.handle.call(opts, event, target);
        };
        target.addEventListener(opts.event, listener);
        (<any> ref)._handles.push({element: target, event: opts.event, listener});
      });
    } else {
      let target: Element|Document|Window;
      if (opts.selector === 'document') {
        target = window.document;
      } else if (opts.selector === 'window') {
        target = window;
      } else if (typeof opts.selector === 'string') {
        target = rel.querySelector(opts.selector);
      } else {
        target = Array.isArray(opts.selector) ? opts.selector[0] : opts.selector;
      }
      if (!target) return;

      const listener = function(event: Event) {
        (opts.handle as any).call(opts, event, target);
      };
      target.addEventListener(opts.event, listener);
      (<any> ref)._handles.push({element: target, event: opts.event, listener});
    }
  });

  (<any> ref)._didInit = true;
  (<any> ref)._isEnabled = true;

  return ref;
}
