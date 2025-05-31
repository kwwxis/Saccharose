import {
  readWebSocketRawData,
  toWsMessage,
  WSS_CLOSE_CODES,
  WsMessageType,
  WsMessageData, WsMessage,
} from '../../shared/types/wss-types.ts';
import { uuidv4 } from '../../shared/util/uuidv4.ts';

export type WsClientListener<T extends WsMessageType> = (data: WsMessageData[T]) => void;

export const WSS_URL =
  document.querySelector<HTMLMetaElement>('meta[name="x-wss-url"]').content || '';

export class WsClient {
  private ws: WebSocket;

  // Subscription fields
  private subscriptionId: string;
  private subscriptions: Map<WsMessageType, WsClientListener<any>[]> = new Map();

  // Reconnect fields
  private reconnectAttempts: number = 0;
  private reconnectInterval: number = 1000;
  private didOpen: boolean = false;
  private firstOpen: boolean = true;

  public setWebSocket(ws: WebSocket) {
    this.subscriptionId = uuidv4();
    this.ws = ws;

    this.ws.onerror = (event: Event) => {
      console.error('[WS:Error]', event);
    };

    this.ws.onmessage = (event: MessageEvent) => {
      const rawString: string = readWebSocketRawData(event.data);
      let message: WsMessage;
      try {
        message = toWsMessage(rawString);
      } catch (malformed) {
        console.error('[WS:Error] Received malformed message from server:', message);
      }
      if (message && this.subscriptions.has(message.type)) {
        for (let listener of this.subscriptions.get(message.type)) {
          try {
            listener(message.data);
          } catch (ignore) {
            // Error in listener
          }
        }
      }
    };

    this.ws.onopen = (event: Event) => {
      this.didOpen = true;
      console.log('[WS:Open] Successfully opened WebSocket.', event);
      this.reconnectAttempts = 20;

      if (this.firstOpen) {
        this.subscribe('ServerHello', (payload) => {
          console.log('[WS:ServerHello]', payload.message);
        });
      } else if (this.subscriptions.size > 0) {
        const types: WsMessageType[] = Array.from(this.subscriptions.keys());
        this.send('WsSubscribe', {
          subscriptionId: this.subscriptionId,
          messageTypes: types,
        });
      }

      this.firstOpen = false;
    };

    this.ws.onclose = (event: CloseEvent) => {
      this.ws = null;
      if (this.didOpen) {
        console.log('[WS:Close] WebSocket has closed.', event.code, event.reason);
      } else {
        console.log('[WS:Close] WebSocket has failed to open.', event.code, event.reason);
      }
      this.didOpen = false;
      if (this.reconnectAttempts > 0) {
        this.reconnectAttempts--;
        setTimeout(() => {
          console.log('[WS:Reconnect] Attempting to reconnect.', this.reconnectAttempts, 'attempts left.')
          this.open();
        }, this.reconnectInterval);
      }
    };
  }

  send<T extends WsMessageType>(type: T, payload: WsMessageData[T]) {
    if (this.ws != null) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      throw new Error('[WS:Error] WebSocket is not open.');
    }
  }

  subscribe<T extends WsMessageType>(type: T, listener: WsClientListener<T>) {
    if (!this.subscriptions.has(type)) {
      this.subscriptions.set(type, []);

      this.send('WsSubscribe', {
        subscriptionId: this.subscriptionId,
        messageTypes: [type],
      });
    }
    this.subscriptions.get(type).push(listener);
  }

  unsubscribe<T extends WsMessageType>(type: T, listener?: WsClientListener<T>) {
    if (!this.subscriptions.has(type)) {
      return;
    }
    if (listener) {
      const listeners = this.subscriptions.get(type);
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    } else {
      this.subscriptions.delete(type);
    }
    if (!this.subscriptions.has(type) || this.subscriptions.get(type).length === 0) {
      this.send('WsUnsubscribe', {
        subscriptionId: this.subscriptionId,
        messageTypes: [type],
      });
    }
  }

  open() {
    if (this.ws == null) {
      this.ws = new WebSocket(WSS_URL);
      this.setWebSocket(this.ws);
    }
  }

  close() {
    this.reconnectAttempts = 0;
    this.didOpen = false;
    if (this.ws != null) {
      this.ws.close(WSS_CLOSE_CODES.NORMAL_CLOSURE, 'Client quitting normally');
      this.ws = null;
    }
  }
}

export const wsc: WsClient = new WsClient();

(window as any).wsc = wsc;
