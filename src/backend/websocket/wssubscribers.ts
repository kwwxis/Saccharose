import { wssListen, wssSend } from './wsserver.ts';
import { WsMessage, WsMessageData, WsMessageType } from '../../shared/types/wss-types.ts';
import WebSocket from 'ws';
import { defaultMap } from '../../shared/util/genericUtil.ts';

const MAX_EVICTS = 15;

class Subscriber {
  public evicts: number = 0;
  public backlog: WsMessage[] = [];

  constructor(public ws: WebSocket) {}

  isOpen() {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  sendAndFlushBacklog() {
    if (this.backlog.length && this.isOpen()) {
      const backlogCopy = this.backlog.slice();
      this.backlog = [];

      for (let message of backlogCopy) {
        wssSend(this.ws, message);
      }
    }
  }

  send(message: WsMessage) {
    if (this.isOpen()) {
      wssSend(this.ws, message);
    } else {
      this.backlog.push(message);
    }
  }
}

const subscriptions: Record<WsMessageType, Record<string, Subscriber>> = defaultMap('Object');

wssListen('WsSubscribe', event => {
  const data = event.data;
  for (let type of data.messageTypes) {
    if (subscriptions[type][data.subscriptionId]) {
      subscriptions[type][data.subscriptionId].ws = event.ws;
      subscriptions[type][data.subscriptionId].evicts = 0;
    } else {
      subscriptions[type][data.subscriptionId] = new Subscriber(event.ws);
    }
  }
});

wssListen('WsUnsubscribe', event => {
  const data = event.data;
  for (let type of data.messageTypes) {
    const subscriber = subscriptions[type][data.subscriptionId];
    if (subscriber) {
      subscriber.ws = null;
      subscriber.backlog = [];
      delete subscriptions[type][data.subscriptionId];
    }
  }
});

export function wssDispatch<T extends WsMessageType>(type: T, data: WsMessageData[T]) {
  for (let subscriber of Object.values(subscriptions[type])) {
    subscriber.send({ type, data });
  }
}

setInterval(() => {
  for (let subscription of Object.values(subscriptions)) {
    for (let [listenerId, subscriber] of Object.entries(subscription)) {
      if (!subscriber.isOpen()) {
        subscriber.evicts++;
        if (subscriber.evicts === MAX_EVICTS) {
          delete subscription[listenerId];
        }
      } else {
        subscriber.evicts = 0;
        subscriber.sendAndFlushBacklog();
      }
    }
  }
}, 2000);
