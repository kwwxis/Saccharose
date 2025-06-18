import { SiteUser } from '../../shared/types/site/site-user-types.ts';
import WebSocket from 'ws';
import { WsMessage, WsMessageData, WsMessageType } from '../../shared/types/wss-types.ts';
import { isset, isUnset } from '../../shared/util/genericUtil.ts';
import { uuidv4 } from '../../shared/util/uuidv4.ts';

export const WS_SESSIONS: Map<string, WsSession> = new Map();

const MAX_EVICTS = 15;

export class WsSession {
  protected _ws: WebSocket;
  protected evictCount = 0;
  protected backlog: WsMessage[] = [];
  protected dispatchSubscriptions: Set<WsMessageType> = new Set();
  protected pingIntervalId: any;

  constructor(readonly user: SiteUser,
              ws: WebSocket) {
    this.setWebSocket(ws);
  }

  public get ws(): WebSocket {
    return this._ws;
  }

  public setWebSocket(ws: WebSocket): void {
    (ws as any).SITE_USER_ID = this.user.id;
    this._ws = ws;
    this.evictCount = 0;

    clearInterval(this.pingIntervalId);
    this.pingIntervalId = null;

    this.pingIntervalId = setInterval(() => {
      if (this.isOpen()) {
        this.ws.ping();
      } else {
        clearInterval(this.pingIntervalId);
        this.pingIntervalId = null;
      }
    }, 30_000);
  }

  public static from(ws: WebSocket): WsSession {
    const userId = (ws as any).SITE_USER_ID;
    return userId ? WS_SESSIONS.get(userId) : undefined;
  }

  public addDispatchSubscription(type: WsMessageType|WsMessageType[]) {
    if (Array.isArray(type)) {
      type.forEach(t => this.dispatchSubscriptions.add(t));
    } else {
      this.dispatchSubscriptions.add(type);
    }
  }

  public removeDispatchSubscription(type: WsMessageType|WsMessageType[]) {
    if (Array.isArray(type)) {
      type.forEach(t => this.dispatchSubscriptions.delete(t));
    } else {
      this.dispatchSubscriptions.delete(type);
    }
  }

  public hasDispatchSubscription(type: WsMessageType): boolean {
    return this.dispatchSubscriptions.has(type);
  }

  public tryEvict(): boolean {
    if (!this.isOpen()) {
      this.evictCount++;
      if (this.evictCount >= MAX_EVICTS) {
        WS_SESSIONS.delete(this.user.id);
        return true;
      } else {
        return false;
      }
    } else {
      this.evictCount = 0;
      this.sendAndFlushBacklog();
    }
  }

  public sendAndFlushBacklog() {
    if (this.backlog.length && this.isOpen()) {
      const backlogCopy = this.backlog.slice();
      this.backlog = [];

      for (let message of backlogCopy) {
        this.send(message);
      }
    }
  }

  public isOpen(): boolean {
    return isset(this.ws) && this.ws.readyState === WebSocket.OPEN;
  }

  public send<T extends WsMessageType>(message: WsMessage<T>): void;
  public send<T extends WsMessageType>(type: T, data: WsMessageData[T]): void;
  public send<T extends WsMessageType>(type: T, correlationId: string, data: WsMessageData[T]): void;

  public send<T extends WsMessageType>(typeOrMessage: T|WsMessage<T>, dataOrCorrelationId?: string|WsMessageData[T], maybeData?: WsMessageData[T]): void {
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

    if (this.isOpen()) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.backlog.push(message);
    }
  }
}

let isEvictionLoopRunning = false;

export function enableWsSessionEvictionLoop() {
  setInterval(() => {
    if (isEvictionLoopRunning) {
      return;
    }
    isEvictionLoopRunning = true;
    for (let session of WS_SESSIONS.values()) {
      session.tryEvict();
    }
    isEvictionLoopRunning = false;
  }, 2000);
}

