//#region Imports
import config from '../../config';
import csurfImport from 'csurf';
const csrf = csurfImport(config.csrfConfig.api);
import bodyParser from 'body-parser';
import baseResources from './baseResources';
import {APIError} from './error';
//#endregion

//#region Setup Router
import { create, Router, Request, Response, NextFunction } from '../../util/router';
import { apiErrorHandler } from '../../middleware/globalErrorHandler';

function accessDenied(error_code = undefined, error_description = undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next();
    }

    res.status(403).json({
      error: 'ACCESS_DENIED',
      error_code,
      error_description,
    });
  };
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
    // if (typeof req.headers['x-api-key'] === 'string') {
    //   const apiKey = req.headers['x-api-key'].trim();
    //   return next();
    // } else

    if (req.headers['x-csrf-token']) {
      csrf(req, res, next);
    } else {
      accessDenied(
        'AUTH_REQUIRED',
        'Must use an API key or CSRF token to authenticate requests.'
      )(req, res, next);
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