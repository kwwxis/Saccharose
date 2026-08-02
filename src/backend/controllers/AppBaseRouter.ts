import helmet from 'helmet';
import { create } from '../routing/router.ts';
import { getRandomInt, toBoolean } from '../../shared/util/genericUtil.ts';
import GenshinRouter from './genshin/app/_index.ts';
import StarRailRouter from './hsr/app/_index.ts';
import ZenlessRouter from './zenless/app/_index.ts';
import WuwaRouter from './wuwa/app/_index.ts';
import { NextFunction, Request, Response, Router } from 'express';
import UserRouter from './site/app/UserRouter.ts';
import AdminRouter from './site/app/AdminRouter.ts';
import { isSiteModeDisabled } from '../loadenv.ts';
import {
  GENSHIN_SITE_MODE_BASE_PATHS,
  HSR_SITE_MODE_BASE_PATHS, WUWA_SITE_MODE_BASE_PATHS,
  ZENLESS_SITE_MODE_BASE_PATHS,
} from '../../shared/types/site/site-mode-type.ts';
import UnavailableErrorCard from '../components/errors/UnavailableErrorCard.vue';

export default async function(): Promise<Router> {
  const router: Router = create({
    layoutType: 'app',
    bodyClass: () => {
      const num = getRandomInt(1, 100);
      return num > 3 && num <= 7 ? ['painmelo'] : [];
      // 8 -> 5% chance of painmelo easter egg
    }
  });

  router.use((req: Request, res: Response, next: NextFunction) => {
    const cspOptions: any = {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'", 'cdnjs.cloudflare.com', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com', `${ENV.WEB_DOMAIN}:*`, 'cdn.discordapp.com', 'static.wikia.nocookie.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'],
        scriptSrc: ["'self'", "'unsafe-eval'", 'cdnjs.cloudflare.com', 'unpkg.com', `'nonce-${req.context.nonce}'`, `${ENV.WEB_DOMAIN}:*`],
        fontSrc: ["'self'", 'data:', 'fonts.googleapis.com', 'fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', `${ENV.WEB_DOMAIN}:*`, 'cdn.discordapp.com', 'static.wikia.nocookie.net'],
        connectSrc: ["'self'", `wss://${ENV.WEB_DOMAIN}:*`, `ws://${ENV.WEB_DOMAIN}:*`],
      },
      reportOnly: false,
    };

    if (toBoolean(ENV.SSL_ENABLED)) {
      cspOptions.directives.upgradeInsecureRequests = [];
    } else {
      cspOptions.directives.upgradeInsecureRequests = null;
    }

    helmet.contentSecurityPolicy(cspOptions)(req, res, next);
  });

  if (isSiteModeDisabled('genshin')) {
    unavailableSiteModeHandler(router, GENSHIN_SITE_MODE_BASE_PATHS, 'Genshin Impact');
  } else {
    router.use(GENSHIN_SITE_MODE_BASE_PATHS,  await GenshinRouter());
  }

  if (isSiteModeDisabled('hsr')) {
    unavailableSiteModeHandler(router, HSR_SITE_MODE_BASE_PATHS, 'Honkai Star Rail');
  } else {
    router.use(HSR_SITE_MODE_BASE_PATHS, await StarRailRouter());
  }

  if (isSiteModeDisabled('zenless')) {
    unavailableSiteModeHandler(router, ZENLESS_SITE_MODE_BASE_PATHS, 'Zenless Zone Zero');
  } else {
    router.use(ZENLESS_SITE_MODE_BASE_PATHS, await ZenlessRouter());
  }

  if (isSiteModeDisabled('wuwa')) {
    unavailableSiteModeHandler(router, WUWA_SITE_MODE_BASE_PATHS, 'Wuthering Waves');
  } else {
    router.use(WUWA_SITE_MODE_BASE_PATHS, await WuwaRouter());
  }

  router.use('/', await UserRouter());
  router.use('/admin', await AdminRouter());

  return router;
};

function unavailableSiteModeHandler(router: Router, basePaths: string[], label: string) {
  basePaths.forEach(basePath => {
    [`${basePath}`, `${basePath}/*splat`].forEach(actualPath => {
      router.use(actualPath, async (_req: Request, res: Response) => {
        await res.status(404).renderComponent(UnavailableErrorCard, {
          label: label,
          bodyClass: ['hide-app-sidebar']
        });
      });
    });
  });
}
