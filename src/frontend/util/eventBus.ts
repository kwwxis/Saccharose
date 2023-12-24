import { createElement } from './domutil.ts';
import { runWhenDOMContentLoaded } from './eventLoader.ts';

export type EventBusListener = (...args: any[]) => void;

// noinspection JSUnusedGlobalSymbols
export class EventBus {
  readonly eventBusName: string;
  private readonly eventBusElement: HTMLElement;

  private listeners: {
    type: string,
    original: EventBusListener,
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
    this.eventBusElement.addEventListener(type, this.wrap(type, listener));
  }

  once(type: string, listener: EventBusListener) {
    this.eventBusElement.addEventListener(type, this.wrap(type, listener), { once: true });
  }

  off(type: string, listener?: EventBusListener) {
    if (!listener) {
      let removed = [];
      for (let listener of this.listeners) {
        if (listener.type === type) {
          removed.push(listener);
          this.eventBusElement.removeEventListener(type, listener.wrapped);
        }
      }
      this.listeners = this.listeners.filter(x => !removed.includes(x));
      return;
    }
    const wrapped: EventListener = this.wrap(type, listener, true);
    if (wrapped) {
      this.eventBusElement.removeEventListener(type, wrapped);
      this.listeners = this.listeners.filter(x => x.wrapped !== wrapped);
    }
  }

  emit(type: string, ... args: any[]) {
    console.log('[EventBus:'+this.eventBusName+']', type, { type, detail: args, eventBus: this });
    return this.eventBusElement.dispatchEvent(new CustomEvent(type, { detail: args }));
  }
}
