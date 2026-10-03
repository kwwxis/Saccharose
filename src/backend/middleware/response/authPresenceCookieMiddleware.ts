import { CookieOptions, NextFunction, Request, Response } from 'express';
import { toBoolean } from '../../../shared/util/genericUtil.ts';
import { Duration } from '../../../shared/util/duration.ts';

const PRESENCE_COOKIE_NAME =
  toBoolean(ENV.SSL_ENABLED) ? '__Host-insite-presence' : 'insite-presence';

const PRESENCE_COOKIE_VALUE = 'sucrose';

function getPresenceCookieOptions(forMode: 'set' | 'clear'): CookieOptions {
  const options: CookieOptions = {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    secure: toBoolean(ENV.SSL_ENABLED),
  };
  if (forMode === 'set') {
    options.expires = Duration.ofDays(30).toDate();
  }
  return options;
}

export default (req: Request, res: Response, next: NextFunction) => {
  // If the presence cookie exists but has an invalid value, clear it and continue
  if (req.cookies[PRESENCE_COOKIE_NAME] && req.cookies[PRESENCE_COOKIE_NAME] !== PRESENCE_COOKIE_VALUE) {
    res.clearCookie(PRESENCE_COOKIE_NAME, getPresenceCookieOptions('clear'));
    next();
    return;
  }

  const hasPresenceCookie = req.cookies[PRESENCE_COOKIE_NAME] === PRESENCE_COOKIE_VALUE;

  // If the user is authenticated and the presence cookie does not exist, set it
  if (req.isAuthenticated() && !hasPresenceCookie) {
    res.cookie(PRESENCE_COOKIE_NAME, PRESENCE_COOKIE_VALUE, getPresenceCookieOptions('set'));
  }

  // If the user is not authenticated and the presence cookie exists, clear it
  if (!req.isAuthenticated() && hasPresenceCookie) {
    res.clearCookie(PRESENCE_COOKIE_NAME, getPresenceCookieOptions('clear'));
  }

  next();
};
