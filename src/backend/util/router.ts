// noinspection JSUnusedGlobalSymbols

import fs from 'fs';
import ejs from 'ejs';
import path from 'path';
import availableMethods from '../middleware/availableMethods';
import * as express from 'express';
import * as expressCore from 'express-serve-static-core';
import { printHumanTiming, icon, dragHandle, printTimestamp, TemplateLink, toParam } from './viewUtilities';
import { cachedSync } from './cache';
import crypto from 'crypto';
import { escapeHtml, ltrim, remove_suffix } from '../../shared/util/stringUtil';
import { getWebpackBundleFileNames, WebpackBundles } from './webpackBundle';
import { LANG_CODES_TO_NAME } from '../../shared/types/dialogue-types';
import { EJS_DELIMITER, SITE_TITLE, VIEWS_ROOT } from '../loadenv';
import { CompareTernary, ternary, toBoolean } from '../../shared/util/genericUtil';
import { toInt } from '../../shared/util/numberUtil';
import { Marker } from '../../shared/util/highlightMarker';

//#region Types
export type IncludeFunction = (view: string, locals?: RequestLocals) => string;

export type RequestLocals = ((req: Request, res: Response) => object)|object;

export type RequestViewStack = {
  parent?: RequestViewStack;
  viewName?: string,
  subviewName?: string;
  subviewStack?: RequestViewStack;
  include?: IncludeFunction,
  [prop: string]: any;
};

/** The only instance of this type should be at `req.context` */
class RequestContext {
  private _req: Request;
  title: string;
  styles: any[];
  scripts: any[];
  bodyClass: string[];
  viewStack: RequestViewStack;
  viewStackPointer: RequestViewStack;
  nonce = crypto.randomBytes(16).toString('hex');
  webpackBundles: WebpackBundles;
  htmlMetaProps: {[name: string]: string} = {};

  constructor(req: Request) {
    this._req = req;
    this.title = '';
    this.styles = [];
    this.scripts = [];
    this.bodyClass = [];
    this.viewStack = {viewName: 'RouterRootView'};
    this.viewStackPointer = this.viewStack;
    this.webpackBundles = getWebpackBundleFileNames();
  }

  getAllViewNames() {
    let pointer: RequestViewStack = this.viewStack;
    let names = [];
    while (pointer) {
      names.push(pointer.viewName);
      pointer = pointer.subviewStack;
    }
    return names;
  }

  canPopViewStack(): boolean {
    return this.viewStackPointer.parent && this.viewStackPointer.parent.viewName !== 'RouterRootView';
  }

  popViewStack(): boolean {
    if (!this.canPopViewStack()) {
      return false;
    }
    this.viewStackPointer = this.viewStackPointer.parent;
    this.viewStackPointer.subviewName = undefined;
    this.viewStackPointer.subviewStack = undefined;
    return true;
  }

  hasBodyClass(bodyClass: string) {
    return this.bodyClass.includes(bodyClass);
  }

  bodyClassTernary(bodyClass: string, ifIncludes?: any, ifNotIncludes?: any): any {
    return this.hasBodyClass(bodyClass) ? (ifIncludes || '') : (ifNotIncludes || '');
  }

  cookie(cookieName: string, orElse: string = '') {
    let cookieValue: string = this._req.cookies[cookieName];
    return cookieValue || orElse;
  }

  cookieTernary(cookieName: string): CompareTernary<string> {
    let cookieValue: string = this._req.cookies[cookieName];
    return ternary(cookieValue).setDefaultElse('');
  }

  get siteTitle() {
    return SITE_TITLE;
  }

  getFormattedPageTitle(customTitle?: string) {
    if (!customTitle) {
      customTitle = this.title;
    }
    return customTitle ? `${customTitle} | ${SITE_TITLE}` : SITE_TITLE;
  }

  get bodyClassString() {
    return this.bodyClass ? this.bodyClass.join(' ') : '';
  }

  get languages() {
    let copy = Object.assign({}, LANG_CODES_TO_NAME);
    delete copy['CH'];
    return copy;
  }

  get inputLangCode() {
    return this._req.cookies['inputLangCode'] || 'EN';
  }

  get outputLangCode() {
    return this._req.cookies['outputLangCode'] || 'EN';
  }
}

export type StringSupplier = string|((req: Request) => Promise<string>);
export type ListSupplier = any|any[]|((req: Request) => Promise<any|any[]>);
export type StringListSupplier = string|string[]|((req: Request) => Promise<string|string[]>);

/**
 * RequestContextUpdate is used to make updates to req.context
 */
export type RequestContextUpdate = {
  title?: StringSupplier;
  layouts?: StringListSupplier;
  styles?: ListSupplier;
  scripts?: ListSupplier;
  bodyClass?: StringListSupplier;
  locals?: RequestLocals;
};

export type Request = express.Request & {
  context: RequestContext,
  params: expressCore.Params & {
    [key: string]: any;
  }
};
export type Response = {
  csv: (data: any, csvHeaders?: boolean, headers?: any, statusCode?: number) => Response,
  render(view: string, options?: RequestLocals, callback?: (err: Error, html: string) => void, throwOnError?: boolean): Promise<string|Error>,
} & express.Response;
export type NextFunction = express.NextFunction;
export type RequestHandler = express.RequestHandler;

export type RouterRestfulHandlers = {
  get?: (req: Request, res: Response, next: NextFunction) => void,
  post?: (req: Request, res: Response, next: NextFunction) => void,
  put?: (req: Request, res: Response, next: NextFunction) => void,
  delete?: (req: Request, res: Response, next: NextFunction) => void,
  error?: (err: any, req: Request, res: Response, next: NextFunction) => void,
};

export type Router = express.Router & {
  restful: (route: string|string[], handlers: RouterRestfulHandlers) => void,
};
//#endregion

export function resolveViewPath(view: string): string {
  view = remove_suffix(view, '.ejs');
  view = ltrim(view, '/\\');
  return path.resolve(VIEWS_ROOT, view + '.ejs');
}

export const DEFAULT_GLOBAL_LOCALS = {
  icon,
  dragHandle,
  printTimestamp,
  printHumanTiming,
  ternary,
  TemplateLink,
  escapeHtml,
  env: process.env,
  toBoolean: toBoolean,
  toInt: toInt,
  Marker: Marker,
  toParam: toParam,
};

function createIncludeFunction(req: Request, viewStackPointer: RequestViewStack): IncludeFunction {
  return function include(view: string, locals: RequestLocals = {}): string {
    const viewPath = resolveViewPath(view);
    const viewContent = process.env.NODE_ENV === 'development'
      ? fs.readFileSync(viewPath, 'utf8')
      : cachedSync(`viewContent:${viewPath}`, () => fs.readFileSync(viewPath, 'utf8'));

    return ejs.render(
      viewContent,
      Object.assign({
        include,
        req,
        hasBodyClass: req.context.hasBodyClass.bind(req.context),
        bodyClassTernary: req.context.bodyClassTernary.bind(req.context),
        cookieTernary: req.context.cookieTernary.bind(req.context),
        cookie: req.context.cookie.bind(req.context),
      }, DEFAULT_GLOBAL_LOCALS, viewStackPointer, typeof locals !== 'object' ? {} : locals),
      { delimiter: EJS_DELIMITER }
    );
  };
}

async function mergeReqContextList(req: Request, prop: string, mergeIn?: StringListSupplier): Promise<void> {
  if (!req.context[prop]) {
    req.context[prop] = [];
  }
  if (mergeIn) {
    req.context[prop] = req.context[prop].concat(typeof mergeIn === 'function' ? await mergeIn(req) : mergeIn);
  }
}

export async function updateReqContext(req: Request, res: Response, ctx: Readonly<RequestContextUpdate>) {
  if (!req.context) {
    req.context = new RequestContext(req);
  }

  await mergeReqContextList(req, 'styles', ctx.styles);
  await mergeReqContextList(req, 'scripts', ctx.scripts);
  await mergeReqContextList(req, 'bodyClass', ctx.bodyClass);

  if (ctx.title) {
    req.context.title = typeof ctx.title === 'function' ? await ctx.title(req) : ctx.title;
  }

  let locals: RequestLocals = ctx.locals;
  let layouts: StringListSupplier = ctx.layouts;

  if (typeof locals === 'function') {
    locals = await locals(req, res);
  }

  let numLayoutsProcessed = 0;

  if (layouts) {
    if (typeof layouts === 'function') {
      layouts = await layouts(req);
    }
    if (!Array.isArray(layouts)) {
      layouts = [layouts];
    }
    layouts.forEach(viewName => {
      if (locals && typeof locals === 'object')
        Object.assign(req.context.viewStackPointer, locals);

      req.context.viewStackPointer.subviewName = viewName;

      req.context.viewStackPointer.include = createIncludeFunction(req, req.context.viewStackPointer);

      // copy down to child view b/c child views should inherit the locals of the parent view
      req.context.viewStackPointer.subviewStack = Object.assign({}, req.context.viewStackPointer, {
        viewName: viewName,
        subviewName: undefined,
        subviewStack: undefined,
        parent: req.context.viewStackPointer,
      });
      req.context.viewStackPointer = req.context.viewStackPointer.subviewStack;
      numLayoutsProcessed++;
    });
  }

  if (!numLayoutsProcessed && locals && typeof locals === 'object') {
    Object.assign(req.context.viewStackPointer, locals);
  }
}

/**
 * Create an Express Router.
 *
 * @param {RequestContextUpdate} [context]
 * @returns {Router}
 */
export function create(context?: Readonly<RequestContextUpdate>): Router {
  const router: Router = express.Router() as Router;

  router.use(async function defaultMiddleware(req: Request, res: Response, next: NextFunction) {
    if (context)
      await updateReqContext(req, res, context);

    res.render = async function(view: string, locals?: RequestLocals, callback?: (err: Error, html: string) => void, throwOnError: boolean = true): Promise<string|Error> {
      try {
        await updateReqContext(req, res, {
          locals,
          layouts: view,
          title: locals && (<any> locals).title,
          styles: locals && (<any> locals).styles,
          scripts: locals && (<any> locals).scripts,
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
        if (throwOnError) {
          throw e;
        } else if (req.next) {
          req.next(e);
        }
        return e;
      }
    };

    next();
  });

  router.restful = function(route: string|string[], handlers: RouterRestfulHandlers) {
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
            if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/csv') {
              res.csv(Array.isArray(data) ? data : [data], true);
            } else {
              res.json(data);
            }
          }
        } catch (err) {
          if (handlers.error) {
            await handlers.error(err, req, res, next);
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