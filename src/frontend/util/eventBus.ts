import { createElement } from './domutil';

export type EventBusListener<EventDetail = any> = (event?: EventDetail) => void;

export class EventBus<EventDetail = any> {
  private eventTarget: EventTarget;

  private listeners: {
    type: string,
    original: EventBusListener<EventDetail>,
    wrapped: EventListener,
  }[] = [];

  constructor(eventBusName: string) {
    this.eventTarget = document.body.appendChild(createElement('div', {
      'data-event-bus': eventBusName,
      'style': 'display: none !important',
    }));
  }

  private wrap(type: string, fn: EventBusListener<EventDetail>, fetchOnly: boolean = false): EventListener {
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
        fn(event.detail);
      }
    };
    this.listeners.push({type, original: fn, wrapped});
    return wrapped;
  }

  on(type: string, listener: EventBusListener<EventDetail>) {
    this.eventTarget.addEventListener(type, this.wrap(type, listener));
  }

  once(type: string, listener: EventBusListener<EventDetail>) {
    this.eventTarget.addEventListener(type, this.wrap(type, listener), { once: true });
  }

  off(type: string, listener?: EventBusListener<EventDetail>) {
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

  emit(type: string, detail?: EventDetail) {
    return this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }
}