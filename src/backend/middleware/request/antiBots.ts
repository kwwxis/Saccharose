import { NextFunction, Request, Response } from '../../util/router';

export const BAD_PATH_REGEX: RegExp = /\/wp-|\baws\b|\.env|cgi-|php|\.git|\.asp|\.cgi|\.axd|\.bak|\.html|geoserver|boaform|reportserver|actuator|shell|ignition|(health|web)[_\-]?check|admin|solr|webfig|config/i;
export const BAD_URI_REGEX: RegExp = /:80\/|:443\//g;

export default (req: Request, res: Response, next: NextFunction) => {
  if (BAD_PATH_REGEX.test(req.path) || BAD_URI_REGEX.test(req.url)) {
    res.status(400).send('Bad request');
  } else {
    next();
  }
};