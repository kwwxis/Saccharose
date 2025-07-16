import { toBoolean } from '../../../shared/util/genericUtil.ts';
import { NextFunction, Request, Response } from 'express';

const sendHstsHeader: boolean = toBoolean(ENV.SSL_ENABLED) && ENV.NODE_ENV !== 'development';

export default (req: Request, res: Response, next: NextFunction) => {
  res.header('X-Robots-Tag', 'noindex, nofollow');
  if (sendHstsHeader && req.headers.host === ENV.WEB_DOMAIN) {
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
};
