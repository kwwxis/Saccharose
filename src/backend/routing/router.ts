import fs from 'fs';
import ejs from 'ejs';
import path from 'path';
import availableMethods from '../middleware/api/availableMethods.ts';
import * as express from 'express';
import { ltrim, removeSuffix } from '../../shared/util/stringUtil.ts';
import { EJS_DELIMITER, VIEWS_ROOT } from '../loadenv.ts';
import { RequestContext, RequestContextUpdate } from './requestContext.ts';
import { DEFAULT_GLOBAL_LOCALS } from './routingConstants.ts';
import { Request, Response, NextFunction, Router } from 'express';
import {
  IncludeFunction,
  RequestLocals,
  RequestViewStack,
  RouterRestfulHandlers,
} from './routingTypes.ts';
import { Component } from '@vue/runtime-core';
import { App, createSSRApp } from 'vue';

export function isVueComponent(object: any): object is Component {
  return !!(<any> object).ssrRender || !!(<any> object).render;
}

export function isVueApp(object: any): object is App {
  return !!(<any> object)._component && !!(<any> object)._context && !!(<any> object).version;
}

function resolveViewPath(view: string): string {
  view = removeSuffix(view, '.ejs');
  view = ltrim(view, '/\\');
  return path.resolve(VIEWS_ROOT, view + '.ejs');
}

const viewContentCache: Record<string, string> = {};

function getViewContent(viewPath: string): string {
  if (viewContentCache[viewPath]) {
    return viewContentCache[viewPath];
  } else {
    let content = fs.readFileSync(viewPath, 'utf8');
    viewContentCache[viewPath] = content;
    return content;
  }
}

function createIncludeFunction(req: Request, viewStackPointer: RequestViewStack): IncludeFunction {
  return function include(view: string, locals: RequestLocals = {}): string {
    if (req.context.virtualStaticViews[view]) {
      return req.context.virtualStaticViews[view];
    }

    const viewPath = resolveViewPath(view);
    const viewContent = ENV.NODE_ENV === 'development'
      ? fs.readFileSync(viewPath, 'utf8')
      : getViewContent(viewPath)

    return ejs.render(
      viewContent,
      Object.assign({
        include,
        use: include,
        req,
        ctx: req.context,
      }, DEFAULT_GLOBAL_LOCALS, viewStackPointer, typeof locals !== 'object' ? {} : locals),
      { delimiter: EJS_DELIMITER }
    );
  };
}

export function reqContextInitMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!req.context) {
    req.context = new RequestContext(req);
  }
  next();
}

async function updateReqContext(req: Request, res: Response, payload: Readonly<RequestContextUpdate>) {
  if (!req.context) {
    req.context = new RequestContext(req);
  }
  if (payload.bodyClass && payload.bodyClass.length) {
    req.context.bodyClass = req.context.bodyClass.concat(
      typeof payload.bodyClass === 'function' ? await payload.bodyClass(req) : payload.bodyClass
    );
  }
  if (payload.title) {
    req.context.title = typeof payload.title === 'function' ? await payload.title(req) : payload.title;
  }

  const locals: any = typeof payload.locals === 'function' ? await payload.locals(req, res) : payload.locals;
  let numLayoutsProcessed = 0;

  for (let layout of (payload.layouts || [])) {
    if (locals && typeof locals === 'object')
      Object.assign(req.context.viewStackPointer, locals);

    const viewName: string = typeof layout === 'string' && !layout.startsWith('<')
      ? layout
      : await req.context.createStaticVirtualView(layout);

    req.context.viewStackPointer.subviewName = viewName;

    req.context.viewStackPointer.include = createIncludeFunction(req, req.context.viewStackPointer);
    req.context.viewStackPointer.use = req.context.viewStackPointer.include;

    // copy down to child view b/c child views should inherit the locals of the parent view
    req.context.viewStackPointer.subviewStack = Object.assign({}, req.context.viewStackPointer, {
      viewName: viewName,
      subviewName: undefined,
      subviewStack: undefined,
      parent: req.context.viewStackPointer,
    });
    req.context.viewStackPointer = req.context.viewStackPointer.subviewStack;
    numLayoutsProcessed++;
  }

  if (!numLayoutsProcessed && locals && typeof locals === 'object') {
    Object.assign(req.context.viewStackPointer, locals);
  }
}

/**
 * Create an Express Router.
 */
export function create(context?: Readonly<RequestContextUpdate>): Router {
  const router: Router = express.Router();

  router.use(async function defaultMiddleware(req: Request, res: Response, next: NextFunction) {
    if (context)
      await updateReqContext(req, res, context);

    res.render = async function(view: string|Component,
                                locals?: RequestLocals,
                                callback?: (err: Error, html: string) => void): Promise<string|Error> {
      try {
        await updateReqContext(req, res, {
          locals,
          layouts: [
            ... (locals && Array.isArray(locals.layouts) ? locals.layouts : []),
            isVueComponent(view) ? createSSRApp(view, locals).mixin({inheritAttrs: false}) : view
          ],
          title: locals && (<any> locals).title,
          bodyClass: locals && (<any> locals).bodyClass,
        });

        const rendered = req.context.viewStack.include(req.context.viewStack.subviewName, req.context.viewStack.subviewStack);
        res.set('Content-Type', 'text/html');
        res.send(rendered);

        if (typeof callback === 'function') {
          callback(null, rendered);
        }
        return rendered;
      } catch (e) {
        if (typeof callback === 'function') {
          callback(e, null);
        }
        if (locals && locals.throwOnError) {
          throw e;
        } else if (req.next) {
          req.next(e);
        }
        return e;
      }
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
