import { NextFunction, Request, Response } from 'express';

export const BAD_PATH_REGEX: RegExp = /\/wp-|\baws\b|\.env|cgi-|php|\.git|\.asp|\.cgi|\.axd|\.bak|\.html|geoserver|boaform|reportserver|(health|web)[_\-]?check|telescope|\bjira\b|microsoft/i;
export const BAD_URI_REGEX: RegExp = /:80\/|:443\//g;
export const VALID_HOSTS: Set<string> = new Set(['saccharose.wiki', 'www.saccharose.wiki', 'saccharose.localhost']);

export default (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers?.host) {
    res.status(400).send('Bad request');
  } else if (!VALID_HOSTS.has(req.headers.host)) {
    res.status(400).send('Bad request');
  } else if (req.protocol !== 'https' && process.env.NODE_ENV === 'production') {
    res.status(400).send('Bad request');
  } else if (BAD_PATH_REGEX.test(req.path) || BAD_URI_REGEX.test(req.url)) {
    res.status(400).send('Bad request');
  } else {
    next();
  }
};
