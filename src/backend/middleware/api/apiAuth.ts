import { HttpError } from '../../../shared/util/httpError.ts';
import { csrfMiddleware } from '../request/csrf.ts';
import { NextFunction, Request, Response } from 'express';
import { openPg } from '../../util/db.ts';

type ApiKey = {
  api_key: string,
  expires: number,
  info: string,
}

async function isValidApiKey(apiKey: string): Promise<boolean> {
  const entry: ApiKey = await openPg().select('*').from('api_keys').where({
    api_key: apiKey,
  }).first().then();

  return entry && (!entry.expires || entry.expires > Date.now());
}

export default function(req: Request, res: Response, next: NextFunction) {
  if (typeof req.headers['x-api-key'] === 'string' || typeof req.query.apiKey === 'string') {
    const apiKey: string = String(req.headers['x-api-key'] || req.query.apiKey).trim();

    isValidApiKey(apiKey).then(result => {
      if (result) {
        next();
      } else {
        next(HttpError.unauthenticated('EBADAPIKEY', 'Invalid API key.'));
      }
    });
  } else if (req.headers['x-csrf-token']) {
    csrfMiddleware(req, res, next);
  } else {
    next(HttpError.unauthenticated('AuthRequired', 'Must use an API key or CSRF token to authenticate requests.'));
  }
};
