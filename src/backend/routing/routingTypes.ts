import { RequestContext } from './requestContext';
import { NextFunction, Request, Response } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    context: RequestContext
  }
  interface Response {
    //csv(data: any, csvHeaders?: boolean, headers?: any, statusCode?: number): Response,
  }
  interface Router {
    endpoint(route: string | string[], handlers: RouterRestfulHandlers): void,
  }
}

export type IncludeFunction = (view: string, locals?: RequestLocals) => string;

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