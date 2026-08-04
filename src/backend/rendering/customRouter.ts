import availableMethods from '../middleware/api/availableMethods.ts';
import * as express from 'express';
import { NextFunction, Request, Response, Router } from 'express';
import { RequestContext, LayoutType } from './requestContext.ts';
import { VuePropsOf } from './vueHelpers.ts';
import { Component } from '@vue/runtime-core';
import { createITrace } from '../middleware/request/tracer.ts';
import { HttpError } from '../../shared/util/httpError.ts';
import { doRender } from './mainRenderer.ts';
import { SiteUser } from '../../shared/types/site/site-user-types.ts';
import { ThinRequest } from './thinRequest.ts';

declare module 'express-serve-static-core' {
  interface Request {
    context: RequestContext,
    user: SiteUser,
  }
  interface Response {
    renderComponent<C extends Component>(view: C, options?: RequestCommonLocals & VuePropsOf<C>): Promise<string|Error>;
  }
  interface Router {
    endpoint(route: string | string[], handlers: RouterRestfulHandlers): void,
  }
}

export type RequestCommonLocals = {
  title?: string|((req: ThinRequest) => string),
  bodyClass?: string[]|((req: ThinRequest) => string[]),
  layoutType?: LayoutType|((req: ThinRequest) => LayoutType),
  throwOnError?: boolean,
}

export type RouterRestfulHandlers = {
  get?: (req: Request, res: Response, next: NextFunction) => void,
  post?: (req: Request, res: Response, next: NextFunction) => void,
  put?: (req: Request, res: Response, next: NextFunction) => void,
  delete?: (req: Request, res: Response, next: NextFunction) => void,
  error?: (err: any, req: Request, res: Response, next: NextFunction) => void,
};

export function reqContextInitMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (!req.context) {
    req.context = new RequestContext(req);
  }
  next();
}

/**
 * Create an Express Router.
 */
export function create(context?: RequestCommonLocals,
                       preContextCb?: (router: Router) => void): Router {
  const router: Router = express.Router();

  if (preContextCb) {
    preContextCb(router);
  }

  router.use(async function defaultMiddleware(req: Request, res: Response, next: NextFunction) {
    if (context)
      req.context.update(context);

    res.renderComponent = async function(component: Component, props?: any): Promise<string|Error> {
      return doRender(req, res, component, createITrace(req), props);
    };

    next();
  });

  router.endpoint = function(route: string|string[], handlers: RouterRestfulHandlers) {
    let tmp = router.route(route);

    Object.keys(handlers).forEach(method => {
      tmp[method](async (req: Request, res: Response, next: NextFunction) => {
        try {
          let data = await handlers[method](req, res, next);

          if (res.headersSent) {
            return;
          }

          if (typeof data === 'undefined') {
            res.status(204).send();
          } else if (data instanceof HttpError) {
            res.status(data.status).json(data.toJson());
          } else {
            res.json(data);
          }
        } catch (err) {
          if (handlers.error) {
            handlers.error(err, req, res, next);
          } else {
            next(err);
          }
        }
      });
    });

    if (!handlers.hasOwnProperty('options')) {
      tmp.all(availableMethods(204, Object.keys(handlers)));
    }

    if (!handlers.hasOwnProperty('all')) {
      tmp.all(availableMethods(405, Object.keys(handlers)));
    }
  };

  return router;
}
