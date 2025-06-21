import { LogViewEntity } from './site/site-logview-types.ts';
import { SiteUser } from './site/site-user-types.ts';
import { JwtPayload } from 'jsonwebtoken';
import { SavedSearchEntity, SavedSearchesRequestCriteria } from './site/site-saved-searches-types.ts';
import { TextMapSearchResponse } from './lang-types.ts';
import { SiteMode } from './site/site-mode-type.ts';

// TOKEN
// --------------------------------------------------------------------------------------------------------------
export type WsJwtTokenResponse = {
  token: string,
}

export type WsJwtToken = SiteUser & JwtPayload;

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
  if (json.type && json.data && typeof json.data === 'object' && typeof json.correlationId === 'string') {
    return json;
  } else {
    throw new Error('Not parsable JSON or does not have all of the "correlationId", "type", and "data" properties.');
  }
}

// MESSAGE
// --------------------------------------------------------------------------------------------------------------
export function isWsMessageType<T extends WsMessageType>(o: WsMessage, type: T): o is WsMessage<T> {
  return o.type === type;
}

export type WsMessage<T extends WsMessageType = WsMessageType> = {
  correlationId: string,
  type: T,
  data: WsMessageData[T]
}

export type WsMessageType = keyof WsMessageData;

export type WsMessageData = {
  // --------------------------------------------------------------------------------------------------------------

  // Protocol (Client)
  ClientHello: WsHello,
  WsSubscribe: WsSubscribe,
  WsUnsubscribe: WsUnsubscribe,

  // Protocol (Server)
  WsBadRequest: WsBadRequest,
  WsInternalError: WsInternalError,
  ServerHello: WsHello,

  // --------------------------------------------------------------------------------------------------------------

  // Logview (Client)
  LogViewRequest: LogViewRequest,

  // Logview (Server)
  LogViewLine: LogViewLine,
  LogViewResult: LogViewLine,

  // --------------------------------------------------------------------------------------------------------------

  WsTextMapSearch: WsTextMapSearch,

  // -------------------------------------------------------------------------------------------------------------

  // Saved Searches (Client)
  WsSavedSearchesRequest: WsSavedSearchesRequest,
  WsSavedSearchesAdd: WsSavedSearchesAdd,
  WsSavedSearchesEdit: WsSavedSearchesEdit,

  // Saved Searches (Server)
  WsSavedSearchesResult: WsSavedSearchesResult,
};

// PROTOCOL
// --------------------------------------------------------------------------------------------------------------
export type WsHello = {
  message: string;
}
export type WsBadRequest = {
  message: string;
}
export type WsInternalError = {
  message: string;
}
export type WsSubscribe = {
  messageTypes: WsMessageType[]
}
export type WsUnsubscribe = {
  messageTypes: WsMessageType[]
}

// WS: Log View
// --------------------------------------------------------------------------------------------------------------
export type LogViewLine = {
  lines: LogViewEntity[]
}
export type LogViewRequest = {
  byWikiUser?: string,
  byDiscordUser?: string,
  byContentQuery?: string,
  lowerbound?: string,
  upperbound?: string,
};

// WS: Search Text Map
// --------------------------------------------------------------------------------------------------------------
export type WsTextMapSearch = {
  siteMode: SiteMode,
  resultType: 'json' | 'html',

  query: string,
  startFromLine?: number,
  isRawInput?: boolean,
  hashSearch?: boolean,
  isRawOutput?: boolean,
  versionFilter?: string,
  resultSetIdx?: number,
}
export type WsTextMapSearchResult = {
  html?: string,
  json?: TextMapSearchResponse,
}

// WS: Saved Searches
// --------------------------------------------------------------------------------------------------------------

export type WsSavedSearchesRequest = {
  criteria: SavedSearchesRequestCriteria,
};

export type WsSavedSearchesAdd = {
  search: SavedSearchEntity,
};

export type WsSavedSearchesEdit = {
  search: SavedSearchEntity,
};

export type WsSavedSearchesResult = {
  recent: SavedSearchEntity[],
  saved: SavedSearchEntity[],
  public: SavedSearchEntity[],
};
