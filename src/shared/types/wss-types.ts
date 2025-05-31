import { LogViewEntity } from './site/site-logview-types.ts';

// CODES
// --------------------------------------------------------------------------------------------------------------

/**
 * See https://github.com/Luka967/websocket-close-codes
 */
export const WSS_CLOSE_CODES = {
  NORMAL_CLOSURE: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS_RCVD: 1005,
  ABNORMAL_CLOSURE: 1006,
  INVALID_FRAME_PAYLOAD_DATA: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  MANDATORY_EXT: 1010,
  INTERNAL_SERVER_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  BAD_GATEWAY: 1014,
  TLS_HANDSHAKE: 1015,
  UNAUTHORIZED: 3000,
  FORBIDDEN: 3001,
  TIMEOUT: 3008,
};

// DECODER
// --------------------------------------------------------------------------------------------------------------
const textDecoder = new TextDecoder('utf-8');

export function readWebSocketRawData(rawData: any) {
  let message: string = '';

  if (typeof rawData === 'string') {
    message = rawData;
  } else if (rawData instanceof Buffer) {
    message = rawData.toString('utf-8');
  } else if (rawData instanceof ArrayBuffer) {
    message = textDecoder.decode(rawData);
  } else if (Array.isArray(rawData)) {
    for (let element of rawData) {
      message += readWebSocketRawData(element);
    }
  }

  return message;
}

export function toWsMessage(s: string): WsMessage {
  const json = JSON.parse(s);
  if (json.type && json.payload && typeof json.payload === 'object') {
    return json;
  } else {
    throw new Error('Malformed message');
  }
}

// MESSAGE
// --------------------------------------------------------------------------------------------------------------
export function isWsMessageType<T extends WsMessageType>(o: WsMessage, type: T): o is WsMessage<T> {
  return o.type === type;
}

export type WsMessage<T extends WsMessageType = WsMessageType> = {
  type: T,
  data: WsMessageData[T]
}

export type WsMessageType = keyof WsMessageData;

export type WsMessageData = {
  // Client Messages:
  ClientHello: WsHello,
  WsSubscribe: WsSubscribe,
  WsUnsubscribe: WsUnsubscribe,
  LogViewRequest: LogViewRequest,

  // Server Messages:
  ServerHello: WsHello,
  LogViewLine: LogViewLine,
  WsClientError: WsClientError,
};

// MESSAGE DATA
// --------------------------------------------------------------------------------------------------------------
export type WsHello = {
  message: string;
}

export type WsClientError = {
  message: string;
}

export type WsSubscribe = {
  subscriptionId: string,
  messageTypes: WsMessageType[]
}
export type WsUnsubscribe = {
  subscriptionId: string,
  messageTypes: WsMessageType[]
}

export type LogViewLine = {
  lines: LogViewEntity[];
}

export type LogViewRequest = {
  byWikiUser?: string,
  byDiscordUser?: string,
  byContentQuery?: string,
  lowerbound?: string,
  upperbound?: string,
};
