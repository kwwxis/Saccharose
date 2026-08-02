import availableMethods from '../middleware/api/availableMethods.ts';
import * as express from 'express';
import { RequestContext } from './requestContext.ts';
import { Request, Response, NextFunction, Router } from 'express';
import {
  RequestCommonLocals,
  RouterRestfulHandlers,
} from './routingTypes.ts';
import { Component } from '@vue/runtime-core';
import { App, createSSRApp } from 'vue';
import { createITrace, ITrace, TraceKey } from '../middleware/request/tracer.ts';
import { renderToString } from '@vue/server-renderer';
import { VirtualComponent } from './VirtualComponent';
import AppLayout from '../components/site/layouts/AppLayout.vue';
import { SiteUserProvider } from '../middleware/auth/SiteUserProvider.ts';
import VisitorWrapper from '../components/site/layouts/VisitorWrapper.vue';
import { renderIndex } from './indexRenderer.ts';

export function reqContextInitMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!req.context) {
    req.context = new RequestContext(req);
  }
  next();
}

async function doRender(req: Request,
                        res: Response,
                        component: Component,
                        trace: ITrace,
                        props?: any): Promise<string|Error> {
  try {
    req.context.update(props);

    let rootComponent: VirtualComponent = VirtualComponent.empty();
    let rootPointer: VirtualComponent = rootComponent;

    switch (req.context.layoutType) {
      case 'basic':
        rootComponent.set(AppLayout, {
          isBasic: true,
        });
        break;
      case 'app':
        rootComponent.set(AppLayout, {
          isBasic: false,
          siteNoticeBanners: await SiteUserProvider.getSiteNoticesForBanner(req),
        });
        break;
      case 'empty':
        break;
      case 'visitor':
        rootComponent.set(AppLayout, {
          isBasic: true,
        });
        const visitorWrapper = VirtualComponent.of(VisitorWrapper);
        rootComponent.default(visitorWrapper);
        rootPointer = visitorWrapper;
        break;
    }

    if (req.context.layoutType !== 'empty') {
      rootPointer.default(VirtualComponent.of(component, props));
    } else {
      rootComponent.set(component, props);
    }

    const ssrApp: App = createSSRApp(rootComponent.compile())
      .mixin({inheritAttrs: false})
      .provide(TraceKey, trace);

    let rendered = await renderToString(ssrApp);

    if (req.context.layoutType !== 'empty') {
      let csrfToken = typeof req.csrfToken === 'function' ? req.csrfToken() : '';
      rendered = renderIndex(req, rendered, rootComponent.gatherNames(), csrfToken);
    }

    res.set('Content-Type', 'text/html');
    res.send(rendered);

    return rendered;
  } catch (e: unknown) {
    if (props && props.throwOnError) {
      throw e;
    } else if (req.next) {
      req.next(e);
    }
    if (e instanceof Error) {
      return e;
    }
  }
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
