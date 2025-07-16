import { AsyncLocalStorage } from 'node:async_hooks';
import { NextFunction, Request, Response } from 'express';
import { RequestContext } from '../../routing/requestContext.ts';
import { GenshinControl, getGenshinControl } from '../../domain/genshin/genshinControl.ts';
import { getStarRailControl, StarRailControl } from '../../domain/hsr/starRailControl.ts';
import { getZenlessControl, ZenlessControl } from '../../domain/zenless/zenlessControl.ts';
import { getWuwaControl, WuwaControl } from '../../domain/wuwa/wuwaControl.ts';
import { ProcessEnv } from '../../env-types.ts';
import { ControlUserMode, getControlUserMode } from '../../domain/abstract/abstractControlState.ts';

export type ITrace = {
  // Request:
  req: Request,
  res: Response,
  ctx: RequestContext,
  nonce: string,
  cookies?: Record<string, any>,

  // Process:
  env: ProcessEnv,

  // Controls:
  genshinControl: GenshinControl,
  starRailControl: StarRailControl,
  zenlessControl: ZenlessControl,
  wuwaControl: WuwaControl,

  // Norm Text:
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

export function createLocalControls(mode: ControlUserMode, cacheUpon?: any): LocalControls {
  if (cacheUpon?._localControls) {
    return cacheUpon._localControls;
  }

  const controlCache: Record<string, any> = {};
  const self: LocalControls = {
    get genshinControl() {
      if (controlCache['genshin'])
        return controlCache['genshin'];
      return controlCache['genshin'] = getGenshinControl(mode);
    },
    get starRailControl() {
      if (controlCache['hsr'])
        return controlCache['hsr'];
      return controlCache['hsr'] = getStarRailControl(mode);
    },
    get zenlessControl() {
      if (controlCache['zenless'])
        return controlCache['zenless'];
      return controlCache['zenless'] = getZenlessControl(mode);
    },
    get wuwaControl() {
      if (controlCache['wuwa'])
        return controlCache['wuwa'];
      return controlCache['wuwa'] = getWuwaControl(mode);
    },
    normGenshinText: (s: string) => self.genshinControl.normText(s, mode.outputLangCode),
    normStarRailText: (s: string) => self.starRailControl.normText(s, mode.outputLangCode),
    normZenlessText: (s: string) => self.zenlessControl.normText(s, mode.outputLangCode),
    normWuwaText: (s: string) => self.wuwaControl.normText(s, mode.outputLangCode),
  };

  if (cacheUpon) {
    cacheUpon._localControls = self;
  }

  return self;
}

export function traceMiddleware(req: Request, res: Response, next: NextFunction) {
  const store: ITrace = {
    req,
    res,
    env: ENV as any,
    get cookies() {
      return req.cookies || {};
    },
    get ctx() {
      return req.context;
    },
    get nonce() {
      return req.context.nonce;
    },
    ... createLocalControls(getControlUserMode(req), req),
  };
  asyncLocalStorage.run(store, () => {
    next();
  });
}

export function getTrace(): ITrace {
  return asyncLocalStorage.getStore();
}
