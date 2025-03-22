import { toBoolean } from '../../../shared/util/genericUtil.ts';
import { CookieOptions, Response } from 'express';
import { doubleCsrf } from 'csrf-csrf';
import { DoubleCsrfConfigOptions } from 'csrf-csrf/lib';

export const CSRF_COOKIE_NAME =
  toBoolean(process.env.SSL_ENABLED) ? '__Host-x-csrf-token' : 'x-csrf-token';

const CSRF_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  path: '/',
  secure: toBoolean(process.env.SSL_ENABLED),
};

export function clearCsrfCookie(res: Response) {
  res.clearCookie(CSRF_COOKIE_NAME);
}

const CONFIG: DoubleCsrfConfigOptions = {
  getSecret: () => process.env.CSRF_TOKEN_SECRET,
  getSessionIdentifier: (req) => req?.user?.id || '',
  cookieName: CSRF_COOKIE_NAME,
  cookieOptions: CSRF_COOKIE_OPTIONS,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
}

export const {
  generateToken,
  doubleCsrfProtection,
} = doubleCsrf(CONFIG);
