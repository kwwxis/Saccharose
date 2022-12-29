import bodyParser from 'body-parser';
import baseResources from './baseResources';
import { create, Router, Request, Response, NextFunction } from '../../util/router';
import { apiErrorHandler } from '../../middleware/globalErrorHandler';
import { HttpError } from '../../../shared/util/httpError';
import { csrfMiddleware } from '../../middleware/csrf';

function isValidApiKey(apiKey: string) {
  return false;
}

export default async function(): Promise<Router> {
  const router: Router = create({ layouts: ['layouts/empty-layout'] });

  router.use(bodyParser.json());
  router.use((req: Request, res: Response, next: NextFunction) => {
    res.header({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'Origin, Content-Type, Accept, User-Agent, X-CSRF-Token, X-Requested-With, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    });
    next();
  });

  // Check Authentication
  // ~~~~~~~~~~~~~~~~~~~~
  router.use(function(req: Request, res: Response, next: NextFunction) {
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
  });

  // Add API Resources
  // ~~~~~~~~~~~~~~~~~
  router.use('/', baseResources);

  // Client Error Handlers
  // ~~~~~~~~~~~~~~~~~~~~~
  router.route('*').all((req: Request, res: Response) => res.status(404).send());
  router.use(apiErrorHandler);

  return router;
}