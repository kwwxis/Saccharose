import exitHook from 'async-exit-hook';
import WebSocket, { WebSocketServer } from 'ws';
import sslcreds, { sslEnabled } from './sslcreds.ts';
import { logInit, logShutdown } from './util/logger.ts';
import http from 'http';
import https from 'https';
import { toInt } from '../shared/util/numberUtil.ts';
import {
  isWsMessageType,
  readWebSocketRawData,
  toWsMessage,
  WsMessage, WsMessageListener, WsMessageType, WsMessageTypes,
  WSS_CLOSE_CODES,
} from '../shared/types/wss-types.ts';
import { defaultMap } from '../shared/util/genericUtil.ts';

let hs: http.Server = null;
let wss: WebSocketServer = null;
let subscriptions: Record<WsMessageType, WsMessageListener<any>[]> = defaultMap('Array');

export function wssBroadcast(wssMessage: WsMessage) {
  wss.clients.forEach((socket: WebSocket) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(wssMessage));
    }
  });
}

export function wssSend(wssMessage: WsMessage, ws: WebSocket) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(wssMessage));
  }
}

export function wssListen<T extends WsMessageType>(type: T, listener: WsMessageListener<T>) {
  subscriptions[type].push(listener);
}

export function startWss() {
  logInit('Starting WebSocket server ...');

  const wss_port = toInt(process.env.WSS_PORT);

  let dummyProcess = (req: http.IncomingMessage, res: http.ServerResponse) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Welcome to the WebSocket server!');
  };

  if (sslEnabled) {
    hs = https.createServer(sslcreds, (req, res) => dummyProcess);
  } else {
    hs = http.createServer(dummyProcess);
  }

  wss = new WebSocketServer({ server: hs });

  hs.listen(wss_port, () => {
    logInit(`WebSocket Server is running on port ${wss_port}`);
  });

  wss.on('connection', (ws: WebSocket, _req) => {
    ws.on('message', (rawData: WebSocket.RawData) => {
      let message: WsMessage;
      try {
        message = toWsMessage(readWebSocketRawData(rawData));
      } catch (malformed) {
        wssSend({
          type: 'WsClientError',
          payload: {
            message: 'Malformed message received from client: ' + malformed.message,
          }
        }, ws);
        return;
      }
      if (!WsMessageTypes.includes(message.type)) {
        wssSend({
          type: 'WsClientError',
          payload: {
            message: 'Not a valid message type: ' + message.type,
          }
        }, ws);
        return;
      }
      if (message) {
        for (let listener of subscriptions[message.type]) {
          try {
            listener(message.payload, (reply) => {
              wssSend(reply, ws);
            });
          } catch (ignore) {
            // Error in listener
          }
        }
      }
    });
    ws.on('close', (code, reason: Buffer<ArrayBufferLike>) => {
      //console.log(`[WSS] Client closed`, code, reason?.toString('utf-8'));
    });
    ws.on('error', (error) => {
      console.error(`[WSS] Socket error`);
    });
  });

  wssListen('Hello', (payload, reply) => {
    reply({
      type: 'Hello',
      payload: {
        message: 'Server echoes back: ' + payload.message
      }
    });
  });

  exitHook((callback) => {
    logShutdown('Shutting down WebSocket server...');
    new Promise<void>((resolve) => {
      wss.clients.forEach((socket: WebSocket) => {
        // Soft close
        socket.close(WSS_CLOSE_CODES.GOING_AWAY, 'Server is shutting down or restarting.');
      });

      setTimeout(() => {
        wss.clients.forEach((socket: WebSocket) => {
          if ([socket.OPEN, socket.CLOSING].includes(socket.readyState as any)) {
            // Socket still hangs, hard close
            socket.terminate();
          }
        });

        wss.close(() => resolve());
      }, 1000);
    }).then(() => {
      hs.close(() => callback());
    });
  });
}
