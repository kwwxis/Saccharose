import { createElement } from './domutil';

export type EventBusListener = (...args: any[]) => void;

export class EventBus {
  private eventBusName: string;
  private eventTarget: EventTarget;

  private listeners: {
    type: string,
    original: EventBusListener,
    wrapped: EventListener,
  }[] = [];

  constructor(eventBusName: string) {
    this.eventBusName = eventBusName;
    this.eventTarget = document.body.appendChild(createElement('div', {
      'data-event-bus': eventBusName,
      'style': 'display: none !important',
    }));
  }

  private wrap(type: string, fn: EventBusListener, fetchOnly: boolean = false): EventListener {
    for (let listener of this.listeners) {
      if (listener.original === fn) {
        return listener.wrapped;
      }
    }

    if (fetchOnly) {
      return null;
    }

    const wrapped = (event: Event) => {
      if (event instanceof CustomEvent) {
        fn(... event.detail);
      }
    };
    this.listeners.push({type, original: fn, wrapped});
    return wrapped;
  }

  on(type: string, listener: EventBusListener) {
    this.eventTarget.addEventListener(type, this.wrap(type, listener));
  }

  once(type: string, listener: EventBusListener) {
    this.eventTarget.addEventListener(type, this.wrap(type, listener), { once: true });
  }

  off(type: string, listener?: EventBusListener) {
    if (!listener) {
      let removed = [];
      for (let listener of this.listeners) {
        if (listener.type === type) {
          removed.push(listener);
          this.eventTarget.removeEventListener(type, listener.wrapped);
        }
      }
      this.listeners = this.listeners.filter(x => !removed.includes(x));
      return;
    }
    const wrapped = this.wrap(type, listener, true);
    if (wrapped) {
      this.eventTarget.removeEventListener(type, wrapped);
      this.listeners = this.listeners.filter(x => x.wrapped !== wrapped);
    }
  }

  emit(type: string, ... args: any[]) {
    console.log('[EventBus:'+this.eventBusName+']', type, { type, detail: args, eventBus: this });
    return this.eventTarget.dispatchEvent(new CustomEvent(type, { detail: args }));
  }
}