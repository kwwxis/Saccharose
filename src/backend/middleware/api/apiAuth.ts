
import { HttpError } from '../../../shared/util/httpError.ts';
import { csrfMiddleware } from '../request/csrf.ts';
import { NextFunction, Request, Response } from 'express';

const devApiKey: string = process.env.DEV_API_KEY || undefined;

function isValidApiKey(apiKey: string) {
  if (devApiKey && devApiKey === apiKey) {
    return true;
  }
  return false;
}

export default function(req: Request, res: Response, next: NextFunction) {
  if (typeof req.headers['x-api-key'] === 'string') {
    const apiKey = req.headers['x-api-key'].trim();
    if (!isValidApiKey(apiKey)) {
      throw HttpError.unauthenticated('EBADAPIKEY', 'Invalid API key.');
    }
    return next();
  } else if (typeof req.query.apiKey === 'string') {
    const apiKey = req.query.apiKey.trim();
    if (!isValidApiKey(apiKey)) {
      throw HttpError.unauthenticated('EBADAPIKEY', 'Invalid API key.');
    }
    return next();
  } else if (req.headers['x-csrf-token']) {
    csrfMiddleware(req, res, next);
  } else {
    throw HttpError.unauthenticated('AuthRequired', 'Must use an API key or CSRF token to authenticate requests.');
  }
};