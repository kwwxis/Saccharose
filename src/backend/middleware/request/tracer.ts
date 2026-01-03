import { Request } from 'express';
import { RequestContext } from '../../routing/requestContext.ts';
import { GenshinControl, getGenshinControl } from '../../domain/genshin/genshinControl.ts';
import { getStarRailControl, StarRailControl } from '../../domain/hsr/starRailControl.ts';
import { getZenlessControl, ZenlessControl } from '../../domain/zenless/zenlessControl.ts';
import { getWuwaControl, WuwaControl } from '../../domain/wuwa/wuwaControl.ts';
import { ProcessEnv } from '../../env-types.ts';
import { ControlUserMode, getControlUserMode } from '../../domain/abstract/abstractControlState.ts';
import { SiteUser } from '../../../shared/types/site/site-user-types.ts';
import { inject } from 'vue';

export const TraceKey = Symbol('trace');

export type ITrace = {
  // Request:
  ctx: RequestContext,
  nonce: string,
  cookies?: Record<string, any>,
  user?: SiteUser,
  isAuthenticated: boolean,
  url: string,

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

export function createITrace(req: Request): ITrace {
  const ctx = req.context;
  return {
    env: ENV as any,
    user: req.user,
    url: req.url,
    ctx: ctx,
    isAuthenticated: ctx.isAuthenticated(),
    cookies: ctx.cookies(),
    nonce: ctx.nonce,
    ... createLocalControls(getControlUserMode(req), req),
  };
}

export function useTrace(): ITrace {
  const trace: ITrace = inject(TraceKey);
  if (!trace) {
    throw new Error('Trace not available.');
  }
  return trace;
}
