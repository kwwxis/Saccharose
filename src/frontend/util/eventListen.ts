import { waitForElement } from './domutil.ts';

export interface ListenerCallback<T extends Event, E extends Element = HTMLElement> {
  (evt: T, target?: E): void;
}

export interface ListenerEventMap extends HTMLElementEventMap, WindowEventMap {
  enter: KeyboardEvent,
  ready: Event
}

export interface ListenerObject<K extends keyof ListenerEventMap> {
  selector?: HTMLElement|HTMLElement[]|Document|string;
  event: K;
  multiple?: boolean;
  handle: ListenerCallback<ListenerEventMap[K]>;
  [extraProp: string]: any;
}

export type Listener =
  ListenerObject<'abort'> |
  ListenerObject<'animationcancel'> |
  ListenerObject<'animationend'> |
  ListenerObject<'animationiteration'> |
  ListenerObject<'animationstart'> |
  ListenerObject<'auxclick'> |
  ListenerObject<'beforeinput'> |
  ListenerObject<'blur'> |
  ListenerObject<'cancel'> |
  ListenerObject<'canplay'> |
  ListenerObject<'canplaythrough'> |
  ListenerObject<'change'> |
  ListenerObject<'click'> |
  ListenerObject<'close'> |
  ListenerObject<'compositionend'> |
  ListenerObject<'compositionstart'> |
  ListenerObject<'compositionupdate'> |
  ListenerObject<'contextmenu'> |
  ListenerObject<'copy'> |
  ListenerObject<'cuechange'> |
  ListenerObject<'cut'> |
  ListenerObject<'dblclick'> |
  ListenerObject<'drag'> |
  ListenerObject<'dragend'> |
  ListenerObject<'dragenter'> |
  ListenerObject<'dragleave'> |
  ListenerObject<'dragover'> |
  ListenerObject<'dragstart'> |
  ListenerObject<'drop'> |
  ListenerObject<'durationchange'> |
  ListenerObject<'emptied'> |
  ListenerObject<'ended'> |
  ListenerObject<'error'> |
  ListenerObject<'focus'> |
  ListenerObject<'focusin'> |
  ListenerObject<'focusout'> |
  ListenerObject<'formdata'> |
  ListenerObject<'gotpointercapture'> |
  ListenerObject<'input'> |
  ListenerObject<'invalid'> |
  ListenerObject<'keydown'> |
  ListenerObject<'keypress'> |
  ListenerObject<'keyup'> |
  ListenerObject<'load'> |
  ListenerObject<'loadeddata'> |
  ListenerObject<'loadedmetadata'> |
  ListenerObject<'loadstart'> |
  ListenerObject<'lostpointercapture'> |
  ListenerObject<'mousedown'> |
  ListenerObject<'mouseenter'> |
  ListenerObject<'mouseleave'> |
  ListenerObject<'mousemove'> |
  ListenerObject<'mouseout'> |
  ListenerObject<'mouseover'> |
  ListenerObject<'mouseup'> |
  ListenerObject<'paste'> |
  ListenerObject<'pause'> |
  ListenerObject<'play'> |
  ListenerObject<'playing'> |
  ListenerObject<'pointercancel'> |
  ListenerObject<'pointerdown'> |
  ListenerObject<'pointerenter'> |
  ListenerObject<'pointerleave'> |
  ListenerObject<'pointermove'> |
  ListenerObject<'pointerout'> |
  ListenerObject<'pointerover'> |
  ListenerObject<'pointerup'> |
  ListenerObject<'progress'> |
  ListenerObject<'ratechange'> |
  ListenerObject<'reset'> |
  ListenerObject<'resize'> |
  ListenerObject<'scroll'> |
  ListenerObject<'scrollend'> |
  ListenerObject<'securitypolicyviolation'> |
  ListenerObject<'seeked'> |
  ListenerObject<'seeking'> |
  ListenerObject<'select'> |
  ListenerObject<'selectionchange'> |
  ListenerObject<'selectstart'> |
  ListenerObject<'slotchange'> |
  ListenerObject<'stalled'> |
  ListenerObject<'submit'> |
  ListenerObject<'suspend'> |
  ListenerObject<'timeupdate'> |
  ListenerObject<'toggle'> |
  ListenerObject<'touchcancel'> |
  ListenerObject<'touchend'> |
  ListenerObject<'touchmove'> |
  ListenerObject<'touchstart'> |
  ListenerObject<'transitioncancel'> |
  ListenerObject<'transitionend'> |
  ListenerObject<'transitionrun'> |
  ListenerObject<'transitionstart'> |
  ListenerObject<'volumechange'> |
  ListenerObject<'waiting'> |
  ListenerObject<'webkitanimationend'> |
  ListenerObject<'webkitanimationiteration'> |
  ListenerObject<'webkitanimationstart'> |
  ListenerObject<'webkittransitionend'> |
  ListenerObject<'wheel'> |

  ListenerObject<'afterprint'> |
  ListenerObject<'beforeprint'> |
  ListenerObject<'beforeunload'> |
  ListenerObject<'DOMContentLoaded'> |
  ListenerObject<'devicemotion'> |
  ListenerObject<'deviceorientation'> |
  ListenerObject<'fullscreenchange'> |
  ListenerObject<'fullscreenerror'> |
  ListenerObject<'gamepadconnected'> |
  ListenerObject<'gamepaddisconnected'> |
  ListenerObject<'hashchange'> |
  ListenerObject<'languagechange'> |
  ListenerObject<'message'> |
  ListenerObject<'messageerror'> |
  ListenerObject<'offline'> |
  ListenerObject<'online'> |
  ListenerObject<'orientationchange'> |
  ListenerObject<'pagehide'> |
  ListenerObject<'pageshow'> |
  ListenerObject<'popstate'> |
  ListenerObject<'rejectionhandled'> |
  ListenerObject<'storage'> |
  ListenerObject<'unhandledrejection'> |
  ListenerObject<'unload'> |

  ListenerObject<'ready'> |
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

export function listen(
  listeners: Listener|Listener[],
  rel: HTMLElement|Document|string = undefined
): void {
  if (!Array.isArray(listeners)) {
    listeners = [listeners];
  }
  if (typeof rel === 'string') {
    waitForElement(document, rel).then(el => listen(listeners, el));
    return;
  } else if (!rel || typeof rel === 'undefined') {
    listen(listeners, window.document);
    return;
  }

  listeners.forEach(opts => {
    if (opts.event === 'ready') {
      runWhenDOMContentLoaded(() => opts.handle.call(opts));
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
      Array.from(targets).forEach(target =>
        target.addEventListener(opts.event, function(event) {
          opts.handle.call(opts, event, target);
        })
      );
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
      target.addEventListener(opts.event, function(event) {
        opts.handle.call(opts, event, target);
      });
    }
  });
}
