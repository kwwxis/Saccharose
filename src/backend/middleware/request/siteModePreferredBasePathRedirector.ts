import { NextFunction, Request, Response } from 'express';
import { getCurrentBasePathForUrl } from '../../../shared/types/site/site-mode-type.ts';

const TEMPORARY_REDIRECT_STATUS_CODE = 302;

export function siteModePreferredBasePathRedirectorMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.context.siteMode === 'unset') {
    return next();
  }

  const preferredBasePath = req.context.siteModePreferredBasePath;
  const currentBasePath = getCurrentBasePathForUrl(req.context.siteMode, req.path);

  if (currentBasePath === preferredBasePath) {
    return next();
  }

  const redirectedUrl = preferredBasePath + req.originalUrl.slice(currentBasePath.length);
  res.redirect(TEMPORARY_REDIRECT_STATUS_CODE, redirectedUrl);
}
