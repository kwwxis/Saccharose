import { createElement } from './domutil.ts';
import { runWhenDOMContentLoaded } from './eventListen.ts';

export type EventBusListener<T extends EventBusConfig, E extends keyof T> = (...args: T[E]) => void;

export type EventBusConfig = {[eventName: string]: any[]};

// noinspection JSUnusedGlobalSymbols
export class EventBus<T extends EventBusConfig> {
  readonly eventBusName: string;
  private readonly eventBusElement: HTMLElement;

  private listeners: {
    type: keyof T,
    original: EventBusListener<T, any>,
    wrapped: EventListener,
  }[] = [];

  constructor(eventBusName: string) {
    this.eventBusName = eventBusName;
    this.eventBusElement = createElement('div', {
      'data-event-bus': eventBusName,
      'style': 'display: none !important',
    });
    runWhenDOMContentLoaded(() => document.body.appendChild(this.eventBusElement));
  }

  private wrap<E extends keyof T>(type: E, fn: EventBusListener<T, E>, fetchOnly: boolean = false): EventListener {
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
        if (typeof fn !== 'function') {
          console.log(type, fn);
        }
        fn(... event.detail);
      }
    };
    this.listeners.push({type, original: fn, wrapped});
    return wrapped;
  }

  on<E extends keyof T>(type: E, listener: EventBusListener<T, E>) {
    this.eventBusElement.addEventListener(type as string, this.wrap(type, listener));
  }

  once<E extends keyof T>(type: E, listener: EventBusListener<T, E>) {
    this.eventBusElement.addEventListener(type as string, this.wrap(type, listener), { once: true });
  }

  off<E extends keyof T>(type: E, listener?: EventBusListener<T, E>) {
    if (!listener) {
      let removed = [];
      for (let listener of this.listeners) {
        if (listener.type === type) {
          removed.push(listener);
          this.eventBusElement.removeEventListener(type as string, listener.wrapped);
        }
      }
      this.listeners = this.listeners.filter(x => !removed.includes(x));
      return;
    }
    const wrapped: EventListener = this.wrap(type, listener, true);
    if (wrapped) {
      this.eventBusElement.removeEventListener(type as string, wrapped);
      this.listeners = this.listeners.filter(x => x.wrapped !== wrapped);
    }
  }

  emit<E extends keyof T>(type: E, ... detail: T[E]) {
    console.log('[EventBus:'+this.eventBusName+']', type, { type, detail: detail, eventBus: this });
    return this.eventBusElement.dispatchEvent(new CustomEvent(type as string, { detail: detail }));
  }
}
