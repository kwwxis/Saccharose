import {
  readWebSocketRawData,
  toWsMessage,
  WSS_CLOSE_CODES,
  WsMessageType,
  WsMessageData, WsMessage,
} from '../../shared/types/wss-types.ts';
import { uuidv4 } from '../../shared/util/uuidv4.ts';
import AsyncLock from 'async-lock';
import './ws-client-auth.ts';
import { WsClientAuth } from './ws-client-auth.ts';
import { isset, isUnset } from '../../shared/util/genericUtil.ts';
import { Duration } from '../../shared/util/duration.ts';

export type WsClientListener<T extends WsMessageType> = (data: WsMessageData[T]) => void;

export const WSS_URL: string =
  document.querySelector<HTMLMetaElement>('meta[name="x-wss-url"]').content || '';

const lock = new AsyncLock();


class ServerReplyWatchQueue {
  internal: ServerReplyWatcher[] = [];

  async poll(message: WsMessage): Promise<ServerReplyWatcher> {
    return await lock.acquire('ServerReplyWatchQueue', () => {
      let newInternal: ServerReplyWatcher[] = [];

      let pick: ServerReplyWatcher = null;

      for (let watcher of this.internal) {
        if (watcher.isExpired()) {
          continue;
        }
        if (!pick && watcher.canHandle(message)) {
          pick = watcher;
        } else {
          newInternal.push(watcher);
        }
      }

      this.internal = newInternal;

      return pick;
    });
  }

  async add(watcher: ServerReplyWatcher) {
    await lock.acquire('ServerReplyWatchQueue', () => {
      this.internal.push(watcher);
    });
  }
}

const INITIAL_RECONNECT_ATTEMPTS = 20;

// noinspection JSUnusedGlobalSymbols
export class WsClient {
  private ws: WebSocket;

  // Subscription fields
  private subscriptions: Map<WsMessageType, WsClientListener<any>[]> = new Map();

  // Reconnect fields
  private reconnectAttempts: number = 0;
  private reconnectInterval: number = 250;
  private didOpen: boolean = false;
  private firstOpen: boolean = true;
  private openThen: () => void = null;

  // Backlog:
  private backlog: WsMessage[] = [];
  readonly serverReplyWatchQueue: ServerReplyWatchQueue = new ServerReplyWatchQueue();

  constructor() {
    setInterval(async () => {
      await this.sendAndFlushBacklog();
    }, 500);
  }

  public setWebSocket(ws: WebSocket) {
    this.ws = ws;

    this.ws.onerror = (event: Event) => {
      console.error('[WS:Error]', event);
    };

    this.ws.onmessage = async (event: MessageEvent) => {
      const rawString: string = readWebSocketRawData(event.data);
      let message: WsMessage;
      try {
        message = toWsMessage(rawString);
      } catch (malformed) {
        console.error('[WS:Error] Received malformed message from server:', rawString);
      }

      if (!message) {
        return;
      }

      const watcher = await this.serverReplyWatchQueue.poll(message);
      console.log('[WS:Message]', message, watcher);

      if (watcher) {
        watcher.handle(message);
      } else if (this.subscriptions.has(message.type)) {
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
      console.log('[WS:Open] Successfully opened WebSocket.');
      this.reconnectAttempts = INITIAL_RECONNECT_ATTEMPTS;

      if (!this.firstOpen && this.subscriptions.size > 0) {
        const types: WsMessageType[] = Array.from(this.subscriptions.keys());
        console.log('[WS:Subscribe] Resubscribing to', types, 'after reconnection.');
        this.send('WsSubscribe', {
          messageTypes: types,
        });
      }

      this.sendAndFlushBacklog();

      if (this.openThen) {
        this.openThen();
        this.openThen = null;
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
      if (this.reconnectAttempts > 0) {
        this.reconnectAttempts--;
        setTimeout(() => {
          console.log('[WS:Reconnect] Attempting to reconnect.', this.reconnectAttempts, 'attempts left.')
          this.open(null, true);
        }, this.reconnectInterval);
      } else {
        console.log('[WS:Reconnect] No reconnect attempts left.');
      }
    };
  }

  public isOpen(): boolean {
    return isset(this.ws) && this.ws.readyState === WebSocket.OPEN;
  }

  private buildMessage<T extends WsMessageType>(message: WsMessage<T>): void;
  private buildMessage<T extends WsMessageType>(type: T, data: WsMessageData[T]): void;
  private buildMessage<T extends WsMessageType>(type: T, correlationId: string, data: WsMessageData[T]): void;

  private buildMessage<T extends WsMessageType>(typeOrMessage: T|WsMessage<T>, dataOrCorrelationId?: string|WsMessageData[T], maybeData?: WsMessageData[T]): WsMessage<T> {
    if (isUnset(typeOrMessage)) {
      throw 'Type or message is required';
    }

    let message: WsMessage<T>;

    if (typeof typeOrMessage === 'object') {
      message = typeOrMessage;
    } else {
      let correlationId = typeof dataOrCorrelationId === 'string' ? dataOrCorrelationId : uuidv4();
      let data = typeof dataOrCorrelationId === 'string' ? maybeData : dataOrCorrelationId;

      if (isUnset(data))
        throw 'Data is required';

      message = {
        correlationId,
        type: typeOrMessage,
        data
      };
    }

    return message;
  }

  public send<T extends WsMessageType>(message: WsMessage<T>): void;
  public send<T extends WsMessageType>(type: T, data: WsMessageData[T]): void;
  public send<T extends WsMessageType>(type: T, correlationId: string, data: WsMessageData[T]): void;
  public send(): void {
    const message = this.buildMessage.apply(this, arguments);
    if (this.isOpen()) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.backlog.push(message);
    }
  }

  public prepare<T extends WsMessageType>(message: WsMessage<T>): PreparedMessage<T>;
  public prepare<T extends WsMessageType>(type: T, data: WsMessageData[T]): PreparedMessage<T>;
  public prepare<T extends WsMessageType>(type: T, correlationId: string, data: WsMessageData[T]): PreparedMessage<T>;
  public prepare<T extends WsMessageType>(): PreparedMessage<T> {
    const message = this.buildMessage.apply(this, arguments);
    return new PreparedMessage<T>(message);
  }

  async sendAndFlushBacklog() {
    await lock.acquire('sendAndFlushBacklog', () => {
      if (this.isOpen()) {
        const backlogCopy = this.backlog.slice();
        this.backlog = [];

        for (let message of backlogCopy) {
          this.ws.send(JSON.stringify(message));
        }
      }
    });
  }

  subscribe<T extends WsMessageType>(type: T, listener: WsClientListener<T>) {
    console.log('[WS:Subscribe] Subscribing to', type)
    if (!this.subscriptions.has(type)) {
      this.subscriptions.set(type, []);

      this.send('WsSubscribe', {
        messageTypes: [type],
      });
    }
    this.subscriptions.get(type).push(listener);
  }

  // noinspection JSUnusedGlobalSymbols
  unsubscribe<T extends WsMessageType>(type: T, listener?: WsClientListener<T>) {
    if (!this.subscriptions.has(type)) {
      return;
    }
    console.log('[WS:Unsubscribe] Unsubscribing to', type)
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
        messageTypes: [type],
      });
    }
  }

  open(then?: () => void, isFromAutoReconnect: boolean = false) {
    if (this.ws == null) {
      if (!isFromAutoReconnect) {
        this.reconnectAttempts = INITIAL_RECONNECT_ATTEMPTS;
      }

      this.didOpen = false;
      this.openThen = then;

      WsClientAuth.getToken().then(token => {
        this.ws = new WebSocket(WSS_URL, ['authorization.bearer.' + token]);
        this.setWebSocket(this.ws);
      });
    }
  }

  close() {
    this.reconnectAttempts = 0;
    if (this.ws != null) {
      this.ws.close(WSS_CLOSE_CODES.NORMAL_CLOSURE, 'Client quitting normally');
      this.ws = null;
    }
  }
}

export class PreparedMessage<T extends WsMessageType> {
  constructor(private message: WsMessage<T>) {}

  send(serverReplyHandlers?: ServerReplyHandlers) {
    wsc.serverReplyWatchQueue.add(new ServerReplyWatcher(this.message.correlationId, serverReplyHandlers))
      .then(() => wsc.send(this.message))
  }
}

const MAX_SERVER_REPLY_WAIT_TIME: Duration = Duration.ofMinutes(1);

class ServerReplyWatcher {
  readonly timestampMs: number = Date.now();

  constructor(readonly correlationId: string, readonly handlers: ServerReplyHandlers) {}

  isExpired() {
    const elapsed = Duration.between(Date.now(), this.timestampMs);
    return elapsed.greaterThanOrEqual(MAX_SERVER_REPLY_WAIT_TIME);
  }

  canHandle(message: WsMessage) {
    return message.correlationId === this.correlationId && this.handlers.hasOwnProperty(message.type);
  }

  handle(message: WsMessage) {
    if (this.canHandle(message)) {
      this.handlers[message.type](message.data as any);
    }
  }
}

export type ServerReplyHandlers = {[K in WsMessageType]?: (data: WsMessageData[K]) => void};

export const wsc: WsClient = new WsClient();

(window as any).wsc = wsc;
