import express, { NextFunction, Request, Response } from 'express';
import { escapeRegExp } from '../../../shared/util/stringUtil.ts';
export function createStaticImagesHandler(SERVER_IMAGES_ROOT: string, HTTP_PATH: string) {
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

    req.originalUrl = req.originalUrl.replace(regex, fm => fm.toLowerCase());
    req.url = req.url.replace(/.*(?=\/[^\/]+$)/, fm => fm.toLowerCase());
    return staticHandler(req, res, next);
  };
}