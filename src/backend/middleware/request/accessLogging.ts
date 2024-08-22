import morgan from 'morgan';

import { DEFAULT_LANG } from '../../../shared/types/lang-types.ts';
import { DEFAULT_SEARCH_MODE } from '../../../shared/util/searchUtil.ts';
import { NextFunction, Request, Response } from 'express';
import { promises as fsp } from 'fs';
import { WEB_ACCESS_LOG } from '../../loadenv.ts';

const getLogSkipRegex: () => RegExp = () => /(\.css|\.js|\.png|\.svg|\.ico|\.jpg|\.webp|\.woff|\.env)/gi;

morgan.token('date', function(){
  return new Date().toLocaleString('en-US', {timeZone: 'America/Los_Angeles'});
});

morgan.token('url', (req: Request) => decodeURI(req.originalUrl || req.url));
morgan.token('inputLanguage', (req: Request) => req.context.prefs.inputLangCode || DEFAULT_LANG);
morgan.token('outputLanguage', (req: Request) => req.context.prefs.outputLangCode || DEFAULT_LANG);
morgan.token('searchMode', (req: Request) => req.context.prefs.searchMode || DEFAULT_SEARCH_MODE);
morgan.token('siteUser', (req: Request) => {
  if (req.hasOwnProperty('isAuthenticated') && req.isAuthenticated()) {
    return '@' + (req.user.discord_username || '-') + ':' +(req.user.wiki_username || '-');
  } else {
    return 'guest';
  }
});

const morganInstance = morgan('[:date[web] PST] [:siteUser] [:inputLanguage::outputLanguage|:searchMode] :status :method :url (:response-time ms)', {
  skip: function(req: Request, res: Response) {
    return res.statusCode === 304 || getLogSkipRegex().test(req.url);
  }
});

export const normalAccessLogging = (req: Request, res: Response, next: NextFunction) => {
  if (res.statusCode === 304) {
    next();
    return;
  }
  if (getLogSkipRegex().test(req.url) || req.url.includes('/serve-image')) {
    next();
    return;
  }
  morganInstance(req, res, next);
};

export const earlyAccessLogging = (req: Request, res: Response, next: NextFunction) => {
  if (getLogSkipRegex().test(req.url) || req.url.includes('/serve-image')) {
    next();
    return;
  }
  const currTime: string = new Date().toLocaleString('en-US', {timeZone: 'America/Los_Angeles'});
  fsp.appendFile(WEB_ACCESS_LOG, `\n[${currTime} PST] ${req.method} ${req.url}`);
  next();
}
