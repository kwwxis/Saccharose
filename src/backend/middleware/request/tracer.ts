import { AsyncLocalStorage } from 'node:async_hooks';
import { NextFunction, Request, Response } from 'express';
import { RequestContext } from '../../routing/requestContext.ts';
import { GenshinControl, getGenshinControl } from '../../domain/genshin/genshinControl.ts';
import { getStarRailControl, StarRailControl } from '../../domain/hsr/starRailControl.ts';
import { getZenlessControl, ZenlessControl } from '../../domain/zenless/zenlessControl.ts';
export type ITrace = {
  req: Request,
  res: Response,
  ctx: RequestContext,
  genshinControl: GenshinControl,
  starRailControl: StarRailControl,
  zenlessControl: ZenlessControl,
  normGenshinText: (s: string) => string,
  normStarRailText: (s: string) => string,
  normZenlessText: (s: string) => string,
}

export const asyncLocalStorage: AsyncLocalStorage<ITrace> = new AsyncLocalStorage<ITrace>();

export function traceMiddleware(req: Request, res: Response, next: NextFunction) {
  const genshinControl = getGenshinControl(req);
  const starRailControl = getStarRailControl(req);
  const zenlessControl = getZenlessControl(req);

  const store: ITrace = {
    req,
    res,
    ctx: req.context,
    genshinControl,
    starRailControl,
    zenlessControl,
    normGenshinText: (s: string) => genshinControl.normText(s, req.context.outputLangCode),
    normStarRailText: (s: string) => starRailControl.normText(s, req.context.outputLangCode),
    normZenlessText: (s: string) => zenlessControl.normText(s, req.context.outputLangCode),
  };
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