import helmet from 'helmet';
import { create } from '../routing/router.ts';
import { getRandomInt, toBoolean } from '../../shared/util/genericUtil.ts';
import GenshinRouter from './genshin/app/_index.ts';
import StarRailRouter from './hsr/app/_index.ts';
import ZenlessRouter from './zenless/app/_index.ts';
import WuwaRouter from './wuwa/app/_index.ts';
import { NextFunction, Request, Response, Router } from 'express';
import { SiteUserProvider } from '../middleware/auth/SiteUserProvider.ts';
import UserRouter from './site/app/UserRouter.ts';
import { GENSHIN_DISABLED, HSR_DISABLED, WUWA_DISABLED, ZENLESS_DISABLED } from '../loadenv.ts';
import LogViewRouter from './site/app/LogViewRouter.ts';
import { createLocalControls } from '../middleware/request/tracer.ts';
import { getControlUserMode } from '../domain/abstract/abstractControlState.ts';

export default async function(): Promise<Router> {
  const router: Router = create({
    layouts: ['layouts/app-layout', 'layouts/app-layout-inner'],
    bodyClass: async (_req: Request) => {
      const num = getRandomInt(1, 100);
      return num >= 3 && num <= 10 ? ['painmelo'] : [];
    },
    locals: async (req: Request) => {
      const localControls = createLocalControls(getControlUserMode(req), req);
      return {
        ... localControls,
        outputLangCode: req.context.outputLangCode,
        inputLangCode: req.context.inputLangCode,
        csrfToken: req.csrfToken(),
        siteNoticeBanners: await SiteUserProvider.getSiteNoticesForBanner(req.user?.id)
      };
    }
  });

  router.use((req: Request, res: Response, next: NextFunction) => {
    const cspOptions: any = {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'", 'cdnjs.cloudflare.com', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com', `${process.env.WEB_DOMAIN}:*`, 'cdn.discordapp.com', 'static.wikia.nocookie.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'],
        scriptSrc: ["'self'", "'unsafe-eval'", 'cdnjs.cloudflare.com', 'unpkg.com', `'nonce-${req.context.nonce}'`, `${process.env.WEB_DOMAIN}:*`],
        fontSrc: ["'self'", 'data:', 'fonts.googleapis.com', 'fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', `${process.env.WEB_DOMAIN}:*`, 'cdn.discordapp.com', 'static.wikia.nocookie.net'],
        connectSrc: ["'self'", `wss://${process.env.WEB_DOMAIN}:*`],
      },
      reportOnly: false,
    };

    if (toBoolean(process.env.SSL_ENABLED)) {
      cspOptions.directives.upgradeInsecureRequests = [];
    } else {
      cspOptions.directives.upgradeInsecureRequests = null;
    }

    helmet.contentSecurityPolicy(cspOptions)(req, res, next);
  });

  if (GENSHIN_DISABLED) {
    router.use('/genshin**',  (_req: Request, res: Response) => {
      res.status(404).render('errors/unavailable', {
        label: 'Genshin Impact',
        bodyClass: 'hide-app-sidebar'
      });
    });
  } else {
    router.use('/genshin',  await GenshinRouter());
  }

  if (HSR_DISABLED) {
    router.use('/hsr**',  (_req: Request, res: Response) => {
      res.status(404).render('errors/unavailable', {
        label: 'Honkai Star Rail',
        bodyClass: 'hide-app-sidebar'
      });
    });
  } else {
    router.use('/hsr', await StarRailRouter());
  }

  if (ZENLESS_DISABLED) {
    router.use('/zenless**',  (_req: Request, res: Response) => {
      res.status(404).render('errors/unavailable', {
        label: 'Zenless Zone Zero',
        bodyClass: 'hide-app-sidebar'
      });
    });
  } else {
    router.use('/zenless', await ZenlessRouter());
  }

  if (WUWA_DISABLED) {
    router.use('/wuwa**',  (_req: Request, res: Response) => {
      res.status(404).render('errors/unavailable', {
        label: 'Wuthering Waves',
        bodyClass: 'hide-app-sidebar'
      });
    });
  } else {
    router.use('/wuwa', await WuwaRouter());
  }

  router.use('/', await LogViewRouter());
  router.use('/', await UserRouter());

  return router;
};
