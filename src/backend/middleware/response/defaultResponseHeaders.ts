import { toBoolean } from '../../../shared/util/genericUtil.ts';
import { NextFunction, Request, Response } from 'express';

const sendHstsHeader: boolean = toBoolean(process.env.SSL_ENABLED) && process.env.NODE_ENV !== 'development';

export default (req: Request, res: Response, next: NextFunction) => {
  res.header('X-Robots-Tag', 'noindex, nofollow');
  if (sendHstsHeader && req.headers.host === process.env.VHOST) {
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
};