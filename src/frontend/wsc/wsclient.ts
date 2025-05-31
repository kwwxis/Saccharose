import {
  readWebSocketRawData,
  toWsMessage,
  WSS_CLOSE_CODES,
  WsMessageType,
  WsPayload, WsMessage, WsMessageListener,
} from '../../shared/types/wss-types.ts';
import { defaultMap } from '../../shared/util/genericUtil.ts';

export const WSS_URL =
  document.querySelector<HTMLMetaElement>('meta[name="x-wss-url"]').content || '';

export class WsClient {
  private ws: WebSocket;
  private subscriptions: Record<WsMessageType, WsMessageListener<any>[]> = defaultMap('Array');
  private reconnectAttempts: number = 0;
  private reconnectInterval: number = 2000;
  private didOpen: boolean = false;

  public setWebSocket(ws: WebSocket) {
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
      if (message) {
        for (let listener of this.subscriptions[message.type]) {
          try {
            listener(message.payload, (reply) => {
              this.send(reply.type, reply.payload);
            });
          } catch (ignore) {
            // Error in listener
          }
        }
      }
    };

    this.ws.onopen = (event: Event) => {
      this.didOpen = true;
      console.log('[WS:Open] Successfully opened WebSocket.', event);
      this.reconnectAttempts = 10;
      this.subscribe('Hello', (payload) => {
        console.log('[WS:ServerHello]', payload.message);
      });
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

  send(type: WsMessageType, payload: WsPayload[WsMessageType]) {
    if (this.ws != null) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      throw new Error('[WS:Error] WebSocket is not open.');
    }
  }

  subscribe<T extends WsMessageType>(type: T, listener: WsMessageListener<T>) {
    this.subscriptions[type].push(listener);
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
