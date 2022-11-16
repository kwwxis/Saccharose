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
  //#endregion

  //#region Check Authentication
  router.use(function(req: Request, res: Response, next: NextFunction) {
    if (typeof req.headers['x-api-key'] === 'string') {
      //const apiKey = req.headers['x-api-key'].trim();
      // not implemented
      return next();
    } else if (req.headers['x-csrf-token']) {
      csrf(req, res, next);
    } else {
      accessDenied(
        'AUTH_REQUIRED',
        'Must use an API key or CSRF token to authenticate requests.'
      )(req, res, next);
    }
  });
  //#endregion

  //#region Add API Resources
  router.use('/', baseResources);
  //#endregion

  //#region Client Error Handlers
  router.route('*').all((req: Request, res: Response) => res.status(404).send());

  router.use(function(err, req, res, next) {
    if (res.headersSent) {
      return next(err);
    }
    if (err) {
      const sendBadRequest = (error_code, error_description) =>
        res.status(400).json({
          error: 'BAD_REQUEST',
          error_code,
          error_description,
        });

      if (typeof err === 'string') {
        return sendBadRequest(undefined, err);
      } else if (err instanceof APIError) {
        return sendBadRequest(err.code, err.message);
      } else {
        // For any other error types, assume internal server error
        // Don't include any details about the error in the JSON response in case it reveals
        // details about the code.

        console.error(err);

        return res.status(500).json({
          error: 'INTERNAL_SERVER_ERROR',
          error_description: 'An internal server error occurred. Try again later.'
        });
      }
    }
    next(err);
  });
  //#endregion

  return router;
}