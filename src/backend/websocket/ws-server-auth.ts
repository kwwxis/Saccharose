import { SiteUser } from '../../shared/types/site/site-user-types.ts';
import jwt from 'jsonwebtoken';
import http from 'http';
import { isUnset } from '../../shared/util/genericUtil.ts';
import { WsJwtToken } from '../../shared/types/wss-types.ts';
import cloneDeep from 'clone-deep';

export function createWsJwtToken(user: SiteUser): string {
  const userCopy = cloneDeep(user);
  delete userCopy.prefs?.siteMenuShown;
  delete (<any> userCopy.discord)?.accessToken;
  return jwt.sign(userCopy, ENV.JWT_SECRET, { expiresIn: '1h' });
}

export function verifyWsJwtToken(tokenSource: http.IncomingMessage|string|string[]): WsJwtToken {
  if (isUnset(tokenSource)) {
    return null;
  } else if (Array.isArray(tokenSource)) {
    for (let element of tokenSource) {
      if (element.startsWith('authorization.')) {
        return verifyWsJwtToken(element);
      }
    }
    return null;
  } else if (typeof tokenSource === 'string') {
    tokenSource = tokenSource.trim();

    if (tokenSource.includes(',')) {
      return verifyWsJwtToken(tokenSource.split(','));
    }

    tokenSource = tokenSource.replace(/^authorization([:.\s])\s*/i, '');
    tokenSource = tokenSource.replace(/^bearer([:.\s])\s*/i, '');

    try {
      let decoded = jwt.verify(tokenSource, ENV.JWT_SECRET);
      if (!!decoded && typeof decoded === 'object' && decoded.id) {
        return decoded as WsJwtToken;
      } else {
        return null;
      }
    } catch (err) {
      return null;
    }
  } else {
    if (tokenSource.headers['authorization']) {
      return verifyWsJwtToken(tokenSource.headers['authorization']);
    } else if (tokenSource.headers['sec-websocket-protocol']) {
      return verifyWsJwtToken(tokenSource.headers['sec-websocket-protocol']);
    } else {
      return null;
    }
  }
}
