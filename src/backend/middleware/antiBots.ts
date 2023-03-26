import { NextFunction, Request, Response } from '../util/router';

export const BAD_URI_REGEX: RegExp = /\/wp-|\baws\b|\.env|cgi-|php|\.git|\.asp|\.cgi|\.axd|\.bak|:80\/|:443\/|geoserver|boaform|reportserver|actuator/i;


export default (req: Request, res: Response, next: NextFunction) => {
  if (BAD_URI_REGEX.test(req.url)) {
    res.status(400).send('Bad request');
  } else {
    next();
  }
};