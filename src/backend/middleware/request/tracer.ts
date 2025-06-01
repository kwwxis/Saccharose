import { AsyncLocalStorage } from 'node:async_hooks';
import { NextFunction, Request, Response } from 'express';
import { RequestContext } from '../../routing/requestContext.ts';
import { GenshinControl, getGenshinControl } from '../../domain/genshin/genshinControl.ts';
import { getStarRailControl, StarRailControl } from '../../domain/hsr/starRailControl.ts';
import { getZenlessControl, ZenlessControl } from '../../domain/zenless/zenlessControl.ts';
import { getWuwaControl, WuwaControl } from '../../domain/wuwa/wuwaControl.ts';
import { ProcessEnv } from '../../env-types.ts';

export type ITrace = {
  req: Request,
  res: Response,
  ctx: RequestContext,
  env: ProcessEnv,
  nonce: string,
  genshinControl: GenshinControl,
  starRailControl: StarRailControl,
  zenlessControl: ZenlessControl,
  wuwaControl: WuwaControl,
  normGenshinText: (s: string) => string,
  normStarRailText: (s: string) => string,
  normZenlessText: (s: string) => string,
  normWuwaText: (s: string) => string,
}

export const asyncLocalStorage: AsyncLocalStorage<ITrace> = new AsyncLocalStorage<ITrace>();

export type LocalControls = {
  genshinControl: GenshinControl,
  starRailControl: StarRailControl,
  zenlessControl: ZenlessControl,
  wuwaControl: WuwaControl,
  normGenshinText: (s: string) => string,
  normStarRailText: (s: string) => string,
  normZenlessText: (s: string) => string,
  normWuwaText: (s: string) => string,
};

export function createLocalControls(req: Request): LocalControls {
  const reqAsAny: any = req as any;
  if (reqAsAny._localControls) {
    return reqAsAny._localControls;
  }
  const controlCache: Record<string, any> = {};
  const self: LocalControls = {
    get genshinControl() {
      if (controlCache['genshin'])
        return controlCache['genshin'];
      return controlCache['genshin'] = getGenshinControl(req);
    },
    get starRailControl() {
      if (controlCache['hsr'])
        return controlCache['hsr'];
      return controlCache['hsr'] = getStarRailControl(req);
    },
    get zenlessControl() {
      if (controlCache['zenless'])
        return controlCache['zenless'];
      return controlCache['zenless'] = getZenlessControl(req);
    },
    get wuwaControl() {
      if (controlCache['wuwa'])
        return controlCache['wuwa'];
      return controlCache['wuwa'] = getWuwaControl(req);
    },
    normGenshinText: (s: string) => self.genshinControl.normText(s, req.context.outputLangCode),
    normStarRailText: (s: string) => self.starRailControl.normText(s, req.context.outputLangCode),
    normZenlessText: (s: string) => self.zenlessControl.normText(s, req.context.outputLangCode),
    normWuwaText: (s: string) => self.wuwaControl.normText(s, req.context.outputLangCode),
  };
  reqAsAny._localControls = self;
  return self;
}

export function traceMiddleware(req: Request, res: Response, next: NextFunction) {
  const store: ITrace = {
    req,
    res,
    env: process.env as any,
    get ctx() {
      return req.context;
    },
    get nonce() {
      return req.context.nonce;
    },
    ... createLocalControls(req),
  };
  asyncLocalStorage.run(store, () => {
    next();
  });
}

export function getTrace(): ITrace {
  return asyncLocalStorage.getStore();
}
