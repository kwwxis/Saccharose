import { AsyncLocalStorage } from 'node:async_hooks';
import { NextFunction, Request, Response } from 'express';
import { RequestContext } from '../../routing/requestContext';

export type ITrace = {
  req: Request,
  res: Response,
  ctx: RequestContext,
}

export const asyncLocalStorage: AsyncLocalStorage<ITrace> = new AsyncLocalStorage<ITrace>();

export function traceMiddleware(req: Request, res: Response, next: NextFunction) {
  const store: ITrace = { req, res, ctx: req.context };
  asyncLocalStorage.run(store, () => {
    next();
  });
}

export function getCurrentRequest(): Request {
  return asyncLocalStorage.getStore().req;
}

export function getTrace(): ITrace {
  return asyncLocalStorage.getStore();
}