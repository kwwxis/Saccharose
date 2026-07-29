import express, { NextFunction, Request, Response } from 'express';
import { escapeRegExp } from '../../../shared/util/stringUtil.ts';

import { SiteMode } from '../../../shared/types/site/site-mode-type.ts';
import { CorsOptions } from 'cors';

export function createStaticImagesHandler(SERVER_IMAGES_ROOT: string, HTTP_PATH: string, FOR: SiteMode) {
  if (!HTTP_PATH.endsWith('/'))
    HTTP_PATH += '/';
  if (!HTTP_PATH.startsWith('/'))
    HTTP_PATH = '/' + HTTP_PATH;

  const staticHandler = express.static(SERVER_IMAGES_ROOT);
  const regex = new RegExp('(?<=' + escapeRegExp(HTTP_PATH) + ').*(?=\\/[^\\/]+$)');

  return (req: Request, res: Response, next: NextFunction) => {
    while (req.url.endsWith('.png.png'))
      req.url = req.url.slice(0, -4);
    while (req.originalUrl.endsWith('.png.png'))
      req.originalUrl = req.originalUrl.slice(0, -4);

    if (FOR === 'wuwa') {
      req.url = req.url.replace(/([^\/\\]+)\.\1.png$/, '$1.png');
      req.originalUrl = req.originalUrl.replace(/([^\/\\]+)\.\1.png$/, '$1.png');
    }

    if (FOR === 'hsr') {
      req.originalUrl = req.originalUrl.replace(regex, fm => fm.toLowerCase());
      req.url = req.url.replace(/.*(?=\/[^\/]+$)/, fm => fm.toLowerCase());
    }
    return staticHandler(req, res, next);
  };
}

const allowedOriginRegexes: RegExp[] = [
  /^https:\/\/([a-z0-9-]+\.)*discord(app)?\.com$/i,
  /^https:\/\/embed.dan.onl$/i,
];

export const StaticImageCorsOptions: CorsOptions = {
  origin: function (origin, callback) {
    // 1. Allow mobile apps or direct browser URL navigation (origin is undefined)
    if (!origin) {
      return callback(null, true);
    }

    // 2. Check if the web/desktop client origin matches Discord's ecosystem
    for (let allowedOriginRegex of allowedOriginRegexes) {
      if (allowedOriginRegex.test(origin)) {
        return callback(null, true);
      }
    }

    // 3. Reject any other website trying to embed your image
    callback(new Error('Not allowed by CORS / ORB restrictions'));
  },
  // Automatically attaches the 'Vary: Origin' header for browser caching health
  optionsSuccessStatus: 200
};
