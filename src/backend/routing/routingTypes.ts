import { RequestContext } from './requestContext.ts';
import { NextFunction, Request, Response } from 'express';
import { Component } from '@vue/runtime-core';

import { SiteUser } from '../../shared/types/site/site-user-types.ts';

declare module 'express-serve-static-core' {
  interface Request {
    context: RequestContext,
    user: SiteUser,
  }
  interface Response {
    //csv(data: any, csvHeaders?: boolean, headers?: any, statusCode?: number): Response,
    render(view: Component, options?: object, callback?: (err: Error, html: string) => void): void;
    render<C extends Component>(view: C, options?: RequestCommonLocals & PropsOf<C>, callback?: (err: Error, html: string) => void): void;
    renderComponent<C extends Component>(view: C, options?: RequestCommonLocals & PropsOf<C>): Promise<string|Error>;
  }
  interface Router {
    endpoint(route: string | string[], handlers: RouterRestfulHandlers): void,
  }
}

export type IncludeFunction = (view: string, locals?: RequestLocals) => string;

export type RequestCommonLocals = {
  title?: string,
  layouts?: string[],
  bodyClass?: string[],
  throwOnError?: boolean,
}

export type RequestLocals = ((req: Request, res: Response) => any) | any;

export type RequestViewStack = {
  parent?: RequestViewStack;
  viewName?: string,
  subviewName?: string;
  subviewStack?: RequestViewStack;
  include?: IncludeFunction,
  use?: IncludeFunction,
  [prop: string]: any;
};

export type RouterRestfulHandlers = {
  get?: (req: Request, res: Response, next: NextFunction) => void,
  post?: (req: Request, res: Response, next: NextFunction) => void,
  put?: (req: Request, res: Response, next: NextFunction) => void,
  delete?: (req: Request, res: Response, next: NextFunction) => void,
  error?: (err: any, req: Request, res: Response, next: NextFunction) => void,
};

export type PropsOf<T> = T extends new (...args: any[]) => { $props: infer P } ? P : never;

