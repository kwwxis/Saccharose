import { isElement, isNode, isNodeList } from '../domutil';
import { isEmpty, isset } from '../../../shared/util/genericUtil';
import { isArrayLike } from '../../../shared/util/arrayUtil';

export function Counter() {
  return {
    map: {},
    add(key) {
      if (this.map.hasOwnProperty(key)) {
        this.map[key] = this.map[key] + 1;
      } else {
        this.map[key] = 1;
      }
    },
    subtract(key) {
      if (this.map.hasOwnProperty(key)) {
        this.map[key] = Math.max(this.map[key] - 1, 0);
      } else {
        this.map[key] = 1;
      }
    },
    set(key, value) {
      this.map[key] = parseInt(value || 1);
    },
    get(key) {
      return this.map[key];
    },
    length() {
      return Object.keys(this.map).length;
    },
  };
}

export function forEach<T>(arr: T[], fn: (item: T, idx?: number, len?: number) => void) {
  for (let i = 0; i < arr.length; i++) {
    fn(arr[i], i, arr.length);
  }
}

export function addClass(e: Element|NodeListOf<Element>, cls: string) {
  if (isNodeList(e)) {
    e.forEach(el => el.classList.add(cls));
  } else {
    e.classList.add(cls);
  }
}

export function removeClass(e: Element|NodeListOf<Element>, cls: string) {
  if (isNodeList(e)) {
    e.forEach(el => el.classList.remove(cls));
  } else {
    e.classList.remove(cls);
  }
}

export function removeAllChildren(o: string|NodeList|Node) {
  if (isEmpty(o)) {
    return;
  }

  o = typeof o === 'string' ? document.querySelectorAll(o) : o;

  if (isNodeList(o)) {
    for (let i = 0, len = o.length; i < len; i++) {
      while (o[i].firstChild) {
        o[i].removeChild(o[i].firstChild);
      }
    }
  } else {
    while (o.firstChild) {
      o.removeChild(o.firstChild);
    }
  }
}

export function removeDom(o: string|Node|NodeList) {
  if (isEmpty(o)) {
    return;
  }

  o = typeof o === 'string' ? document.querySelectorAll(o) : o;

  if (isNodeList(o)) {
    for (let i = 0, len = o.length; i < len; i++) {
      if (!o[i] || !o[i].parentNode) {
        return;
      }
      o[i].parentNode.removeChild(o[i]);
    }
  } else {
    if (!o || !o.parentNode) {
      return;
    }
    o.parentNode.removeChild(o);
  }
}

export function isTextSelected(input: HTMLInputElement): boolean {
  if (typeof input.selectionStart == "number") {
    return input.selectionStart == 0 && input.selectionEnd == input.value.length;
  } else if (typeof (<any> document).selection != "undefined") {
    input.focus();
    return (<any> document).selection.createRange().text == input.value;
  }
}

const LISTENERS: {[id: string]: {[eventName: string]: Function[]}} = {};
let next_id = 0;

export function get_listener_id(element, no_issue?: boolean) {
  let my_id = null;

  if (isEmpty(element) || !isElement(element)) {
    // do nothing
  } else if (element.hasAttribute('data-evtid')) {
    my_id = parseInt(element.getAttribute('data-evtid'));
  } else if (!no_issue) {
    my_id = next_id++;
    element.setAttribute('data-evtid', my_id);
  }

  return isNaN(my_id) ? null : my_id;
}

export function getListeners(element, eventName) {
  let id = get_listener_id(element, true);

  if (!isset(id)) {
    if (eventName) return [];
    return {};
  }

  if (eventName) {
    if (LISTENERS[id][eventName]) {
      return LISTENERS[id][eventName];
    } else {
      return [];
    }
  }

  return LISTENERS[id];
}

export function off(o, eventName?: string, eventHandler?: Function) {
  o = typeof o === 'string' ? document.querySelectorAll(o) : o;

  if (isEmpty(o)) {
    return;
  }

  function detach_listener(el) {
    let id = get_listener_id(el, true);

    if (!eventHandler) {
      if (!LISTENERS[id])
        return false;

      if (!eventName) {
        for (let [eventName, handlerList] of Object.entries(LISTENERS[id])) {
          forEach(handlerList, (eventHandler) => {
            el.removeEventListener(eventName, eventHandler);
          });
        }
        LISTENERS[id] = {};
      } else if (LISTENERS[id][eventName]) {
        let handlerList = LISTENERS[id][eventName];
        forEach(handlerList, (eventHandler) => {
          el.removeEventListener(eventName, eventHandler);
        });
        LISTENERS[id][eventName] = [];
      } else {
        return false;
      }
    } else {
      if (LISTENERS[id] && LISTENERS[id][eventName]) {
        let index = LISTENERS[id][eventName].indexOf(eventHandler);
        if (index > -1) {
          LISTENERS[id][eventName].splice(index, 1);
        }
      }

      el.removeEventListener(eventName, eventHandler);
    }
    return true;
  }

  if (isArrayLike(o)) {
    for (let i = 0, len = o.length; i < len; i++) {
      detach_listener(o[i]);
    }
  } else {
    detach_listener(o);
  }
}

export function on(o, eventName, eventHandler) {
  o = typeof o === 'string' ? document.querySelectorAll(o) : o;

  if (isEmpty(o)) {
    return;
  }

  let multi_evt = eventName.split(' ');
  if (multi_evt.length >= 2) {
    for (let i = 0, len = multi_evt.length; i < len; i++) {
      on(o, multi_evt[i], eventHandler);
    }
    return;
  }

  if (eventName === 'enter') {
    eventName = 'keyup';
    let real_handler = eventHandler;

    eventHandler = function(event) {
      if (event.key === 'Enter') {
        real_handler.call(this, event);
      } else if (event.code === 'Enter') {
        real_handler.call(this, event);
      } else if (event.which === 13) {
        real_handler.call(this, event);
      } else if (event.keyCode === 13) {
        real_handler.call(this, event);
      }
    };
  }

  function attach_listener(el) {
    let id = get_listener_id(el);

    if (!LISTENERS[id]) {
      LISTENERS[id] = {};
    }

    if (!LISTENERS[id][eventName]) {
      LISTENERS[id][eventName] = [];
    }

    LISTENERS[id][eventName].push(eventHandler);
    el.addEventListener(eventName, eventHandler);
  }

  if (isArrayLike(o)) {
    for (let i = 0, len = o.length; i < len; i++) {
      attach_listener(o[i]);
    }
  } else {
    attach_listener(o);
  }
}

export function copy(o) {
  var to;

  if (isNode(o)) {
    to = o.cloneNode(true);
  } else if (typeof o === 'object') {
    if (o.constructor != Object && o.constructor != Array) return o;
    if (o.constructor == Date || o.constructor == RegExp || o.constructor == Function ||
      o.constructor == String || o.constructor == Number || o.constructor == Boolean)
      return new o.constructor(o);

    to = new o.constructor();

    for (var name in o) {
      // noinspection JSUnfilteredForInLoop
      to[name] = typeof(to[name]) === 'undefined' ? copy(o[name]) : to[name];
    }
  } else {
    to = o;
  }

  return to;
}

export function to_lower(s: string): string;
export function to_lower(s: string[]): string[];
export function to_lower(s: string|string[]): typeof s {
  if (Array.isArray(s)) {
    return s.map(x => typeof x === 'string' ? x.toLowerCase() : x);
  } else {
    return typeof s === 'string' ? s.toLowerCase() : s;
  }
}