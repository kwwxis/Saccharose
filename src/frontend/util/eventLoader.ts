import { waitForElement } from './domutil';

export interface ListenerCallback {
  (evt: Event, target?: HTMLElement): void;
}

export interface Listener {
  el?: HTMLElement|HTMLElement[]|Document|string;
  ev: string,
  multiple?: boolean,
  fn: ListenerCallback,
  [extraProp: string]: any,
}

export function runWhenDOMContentLoaded(runnable: Function) {
  if (/comp|inter|loaded/.test(document.readyState)) {
    runnable();
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      runnable();
    });
  }
}

export function startListeners(listeners: Listener[], rel: HTMLElement|Document|string = undefined) {
  if (typeof rel === 'string') {
    waitForElement(document, rel).then(el => startListeners(listeners, el));
    return;
  } else if (!rel || typeof rel === 'undefined') {
    startListeners(listeners, window.document);
    return;
  }

  listeners.forEach(opts => {
    if (opts.ev === 'ready') {
      runWhenDOMContentLoaded(() => opts.fn.call(opts));
      return;
    } else if (opts.ev === 'enter') {
      opts.ev = 'keypress';
      let originalFn = opts.fn;
      opts.fn = function(event: KeyboardEvent, target: HTMLElement) {
        if (event.code === 'Enter' || (event.keyCode ? event.keyCode : event.which) === 13) {
          originalFn.call(opts, event, target);
        }
      };
    }

    if (opts.multiple) {
      let targets: (Element|Document)[];
      if (typeof opts.el === 'string') {
        targets = Array.from(rel.querySelectorAll(opts.el));
      } else {
        targets = Array.isArray(opts.el) ? opts.el : [opts.el];
      }
      Array.from(targets).forEach(target =>
        target.addEventListener(opts.ev, function(event) {
          opts.fn.call(opts, event, target);
        })
      );
    } else {
      let target: Element|Document|Window;
      if (opts.el === 'document') {
        target = window.document;
      } else if (opts.el === 'window') {
        target = window;
      } else if (typeof opts.el === 'string') {
        target = rel.querySelector(opts.el);
      } else {
        target = Array.isArray(opts.el) ? opts.el[0] : opts.el;
      }
      if (!target) return;
      target.addEventListener(opts.ev, function(event) {
        opts.fn.call(opts, event, target);
      });
    }
  });
}