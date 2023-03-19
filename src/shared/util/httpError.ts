import { camelCaseToTitleCase } from './stringUtil';

export const HTTP_STATUS_CODE_TO_NAME = {
  400: 'BadRequest',
  401: 'Unauthorized',
  402: 'PaymentRequired',
  403: 'Forbidden',
  404: 'NotFound',
  405: 'MethodNotAllowed',
  406: 'NotAcceptable',
  407: 'ProxyAuthenticationRequired',
  408: 'RequestTimeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'LengthRequired',
  412: 'PreconditionFailed',
  413: 'PayloadTooLarge',
  414: 'URITooLong',
  415: 'UnsupportedMediaType',
  416: 'RangeNotSatisfiable',
  417: 'ExpectationFailed',
  418: 'ImATeapot',
  421: 'MisdirectedRequest',
  422: 'UnprocessableEntity',
  423: 'Locked',
  424: 'FailedDependency',
  425: 'TooEarly',
  426: 'UpgradeRequired',
  428: 'PreconditionRequired',
  429: 'TooManyRequests',
  431: 'RequestHeaderFieldsTooLarge',
  451: 'UnavailableForLegalReasons',
  500: 'InternalServerError',
  501: 'NotImplemented',
  502: 'BadGateway',
  503: 'ServiceUnavailable',
  504: 'GatewayTimeout',
  505: 'HTTPVersionNotSupported',
  506: 'VariantAlsoNegotiates',
  507: 'InsufficientStorage',
  508: 'LoopDetected',
  509: 'BandwidthLimitExceeded',
  510: 'NotExtended',
  511: 'NetworkAuthenticationRequired',
}

export function isHttpErrorLike(o: any): boolean {
  return !!o && typeof o === 'object' && (typeof o.status === 'number' || typeof o.code  === 'number') && o.type && o.message;
}

export class HttpError extends Error {
  public code: number;
  public status: number;
  public type: string;

  constructor(code: number, type: string, message: string) {
    super(message || camelCaseToTitleCase(HTTP_STATUS_CODE_TO_NAME[code] || 'HttpError'));
    this.status = code;
    this.type = type;
    this.name = HTTP_STATUS_CODE_TO_NAME[code] || 'HttpError';
    this.code = code;
  }

  toJson(): any {
    return {
      status: this.status,
      name: this.name,
      type: this.type,
      message: this.message,
    };
  }

  static fromJson(obj: any): HttpError {
    if (isHttpErrorLike(obj)) {
      return new HttpError(obj.status || obj.code, obj.type, obj.message);
    } else {
      return null;
    }
  }

  static notFound(type: string, message: string) {
    return new HttpError(404, type, message);
  }

  static badRequest(type: string, message: string) {
    return new HttpError(400, type, message);
  }

  static unauthenticated(type: string, message) {
    return new HttpError(401, type, message);
  }

  static accessDenied(type: string, message: string) {
    return new HttpError(403, type, message);
  }

  static internalServerError(type: string, message: string) {
    return new HttpError(500, type, message);
  }
}