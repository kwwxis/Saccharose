import WebSocket, { WebSocketServer } from 'ws';
import sslcreds, { sslEnabled } from '../sslcreds.ts';
import { logInit } from '../util/logger.ts';
import http from 'http';
import https from 'https';
import { toInt } from '../../shared/util/numberUtil.ts';
import {
  readWebSocketRawData,
  toWsMessage,
  WsMessage,
  WsMessageData,
  WsMessageType,
} from '../../shared/types/wss-types.ts';
import { defaultMap } from '../../shared/util/genericUtil.ts';
import { verifyWsJwtToken } from './ws-server-auth.ts';
import { enableWsSessionEvictionLoop, WS_SESSIONS, WsSession } from './ws-sessions.ts';
import { SiteUserProvider } from '../middleware/auth/SiteUserProvider.ts';
import { uuidv4 } from '../../shared/util/uuidv4.ts';
import { SiteUser } from '../../shared/types/site/site-user-types.ts';

// HANDLERS
// --------------------------------------------------------------------------------------------------------------
const serverHandlers: Record<WsMessageType, WssHandler<any>[]> = defaultMap('Array');

export class WssHandle<T extends WsMessageType> {
  constructor(public session: WsSession,
              public ws: WebSocket,
              public message: WsMessage<T>) {}

  get data(): WsMessageData[T] {
    return this.message.data;
  }

  get user(): SiteUser {
    return this.session.user;
  }

  public reply<R extends WsMessageType>(type: R, data: WsMessageData[R]): void {
    this.session.send(type, this.message.correlationId, data);
  }
}

export type WssHandler<T extends WsMessageType> = (event: WssHandle<T>) => void;

export function wssHandle<T extends WsMessageType>(type: T, listener: WssHandler<T>) {
  serverHandlers[type].push(listener);
}

// MAIN FIELDS
// --------------------------------------------------------------------------------------------------------------
let httpServer: http.Server = null;
let wss: WebSocketServer = null;

// START METHOD
// --------------------------------------------------------------------------------------------------------------
export function startWss() {
  logInit('Starting WebSocket server ...');

  const wss_port = toInt(ENV.WSS_PORT);

  enableWsSessionEvictionLoop();

  let dummyProcess = (_req: http.IncomingMessage, res: http.ServerResponse) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Welcome to the WebSocket server!');
  };

  if (sslEnabled) {
    httpServer = https.createServer(sslcreds, dummyProcess);
  } else {
    httpServer = http.createServer(dummyProcess);
  }

  wss = new WebSocketServer({
    clientTracking: false,
    noServer: true,
  });

  initDefaultHandlers();

  httpServer.listen(wss_port, () => {
    logInit(`WebSocket Server is running on port ${wss_port}`);
  });

  httpServer.on('upgrade', async (request, socket, head) => {
    const authorizedUser = verifyWsJwtToken(request);

    if (!authorizedUser || !authorizedUser.wiki_allowed || (await SiteUserProvider.isBanned(authorizedUser))) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      let session = WS_SESSIONS.get(authorizedUser.id);

      if (!session) {
        session = new WsSession(authorizedUser, ws);
        WS_SESSIONS.set(authorizedUser.id, session);
      } else {
        session.setWebSocket(ws);
      }

      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws: WebSocket, _req) => {
    const session = WsSession.from(ws);

    if (!session) {
      ws.terminate();
      return;
    }

    ws.on('message', (rawData: WebSocket.RawData) => {
      let message: WsMessage;
      try {
        message = toWsMessage(readWebSocketRawData(rawData));
      } catch (malformed) {
        session.send('WsBadRequest',{
          message: 'Malformed message received from client: ' + message,
        });
        return;
      }
      if (message) {
        for (let listener of serverHandlers[message.type]) {
          try {
            listener(new WssHandle(session, ws, message));
          } catch (ignore) {
            // Error in listener
          }
        }
      }
    });
    ws.on('close', (_code, _reason: Buffer<ArrayBufferLike>) => {
      //console.log(`[WSS] Client closed`, code, reason?.toString('utf-8'));
    });
    ws.on('error', (_error) => {
      console.error(`[WSS] Socket error`);
    });
  });
}

function initDefaultHandlers() {
  wssHandle('ClientHello', (event) => {
    event.reply('ServerHello', {
      message: 'Server echoes back: ' + event.data.message
    });
  });

  wssHandle('WsSubscribe', event => {
    event.session.addDispatchSubscription(event.data.messageTypes)
  });

  wssHandle('WsUnsubscribe', event => {
    event.session.removeDispatchSubscription(event.data.messageTypes)
  });
}

export function wssDispatch<T extends WsMessageType>(type: T, data: WsMessageData[T]) {
  const correlationId = uuidv4();
  for (let session of WS_SESSIONS.values()) {
    if (session.hasDispatchSubscription(type)) {
      session.send(type, correlationId, data);
    }
  }
}
