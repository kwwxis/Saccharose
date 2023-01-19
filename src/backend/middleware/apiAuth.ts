import { NextFunction, Request, Response } from '../util/router';
import { HttpError } from '../../shared/util/httpError';
import { csrfMiddleware } from './csrf';

function isValidApiKey(apiKey: string) {
  return false;
}

export default function(req: Request, res: Response, next: NextFunction) {
  if (typeof req.headers['x-api-key'] === 'string') {
    const apiKey = req.headers['x-api-key'].trim();
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