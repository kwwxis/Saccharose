import csrf from 'csurf';
import { toBoolean } from '../../shared/util/genericUtil';
import { CookieOptions } from 'express';

export const CSRF_COOKIE_NAME = toBoolean(process.env.SSL_ENABLED) ? '__Host-x-csrf-token' : 'x-csrf-token';
const CSRF_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  path: '/',
  secure: toBoolean(process.env.SSL_ENABLED),
};

export const csrfMiddleware = csrf({
  cookie: {
    key: CSRF_COOKIE_NAME,
    ... CSRF_COOKIE_OPTIONS
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
});