import { toBoolean } from '../../../shared/util/genericUtil.ts';
import { CookieOptions, Response } from 'express';
import { doubleCsrf, DoubleCsrfConfigOptions } from 'csrf-csrf';

export const CSRF_COOKIE_NAME =
  toBoolean(ENV.SSL_ENABLED) ? '__Host-x-csrf-token' : 'x-csrf-token';

const CSRF_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  path: '/',
  secure: toBoolean(ENV.SSL_ENABLED),
};

export function clearCsrfCookie(res: Response) {
  res.clearCookie(CSRF_COOKIE_NAME, CSRF_COOKIE_OPTIONS);
}

const CONFIG: DoubleCsrfConfigOptions = {
  getSecret: () => ENV.CSRF_TOKEN_SECRET,
  getSessionIdentifier: (req) => req?.user?.id || '',
  cookieName: CSRF_COOKIE_NAME,
  cookieOptions: CSRF_COOKIE_OPTIONS,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'],
}

export const {
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf(CONFIG);
