import { HttpError } from '../../../shared/util/httpError.ts';
import { doubleCsrfProtection } from '../request/csrf.ts';
import { NextFunction, Request, Response } from 'express';
import { openPgSite } from '../../util/db.ts';

export type ApiKey = {
  api_key: string,
  expires?: number,
  info?: string,
  owner_id: string,
  owner_name: string,
}

export async function isValidApiKey(apiKey: string): Promise<boolean> {
  const entry: ApiKey = await openPgSite().select('*').from('api_keys').where({
    api_key: apiKey,
  }).first().then();

  return entry && (!entry.expires || entry.expires > Date.now());
}

export async function getApiKeysForUser(userId: string): Promise<ApiKey[]> {
  return await openPgSite().select('*').from('api_keys').where({
    owner_id: userId,
  }).then();
}

const apiAuthBypassPathPatterns: RegExp[] = [
  /\/OL\//i,
];

export default async function(req: Request, res: Response, next: NextFunction) {
  if (apiAuthBypassPathPatterns.some(re => re.test(req.path))) {
    next();
    return;
  } else if (typeof req.headers['x-api-key'] === 'string' || typeof req.query.apiKey === 'string' || typeof req.query.apikey === 'string') {
    const apiKey: string = String(req.headers['x-api-key'] || req.query.apiKey || req.query.apikey).trim();

    delete req.headers['x-api-key'];
    delete req.query.apiKey;
    delete req.query.apikey;

    const result = await isValidApiKey(apiKey);

    if (result) {
      next();
    } else {
      next(HttpError.unauthenticated('EBADAPIKEY', 'Invalid API key.'));
    }
  } else if (req.isAuthenticated() && req.headers['x-csrf-token']) {
    doubleCsrfProtection(req, res, next);
  } else {
    next(HttpError.unauthenticated('AuthRequired', 'Must use an API key or CSRF token to authenticate requests.'));
  }
};
