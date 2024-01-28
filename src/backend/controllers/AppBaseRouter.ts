import helmet from 'helmet';
import { create } from '../routing/router.ts';
import { toBoolean } from '../../shared/util/genericUtil.ts';
import GenshinRouter from './genshin/app/_index.ts';
import StarRailRouter from './hsr/app/_index.ts';
import ZenlessRouter from './zenless/app/_index.ts';
import { getGenshinControl } from '../domain/genshin/genshinControl.ts';
import { getStarRailControl } from '../domain/hsr/starRailControl.ts';
import { getZenlessControl } from '../domain/zenless/zenlessControl.ts';
import { NextFunction, Request, Response, Router } from 'express';
import SettingsPage from '../components/auth/SettingsPage.vue';
import { SiteAuthEnabled } from '../middleware/auth/SiteUserProvider.ts';

export default async function(): Promise<Router> {
  const router: Router = create({
    layouts: ['layouts/app-layout'],
    locals: async (req: Request) => {
      const genshinControl = getGenshinControl(req);
      const starRailControl = getStarRailControl(req);
      const zenlessControl = getZenlessControl(req);
      return {
        normGenshinText: (s: string) => genshinControl.normText(s, req.context.outputLangCode),
        normStarRailText: (s: string) => starRailControl.normText(s, req.context.outputLangCode),
        normZenlessText: (s: string) => zenlessControl.normText(s, req.context.outputLangCode),
        outputLangCode: req.context.outputLangCode,
        inputLangCode: req.context.inputLangCode,
        csrfToken: req.csrfToken(),
      };
    }
  });

  router.use((req: Request, res: Response, next: NextFunction) => {
    const cspOptions: any = {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'", 'cdnjs.cloudflare.com', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com', `${process.env.VHOST}:*`],
        styleSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'],
        scriptSrc: ["'self'", "'unsafe-eval'", 'cdnjs.cloudflare.com', 'unpkg.com', `'nonce-${req.context.nonce}'`, `${process.env.VHOST}:*`],
        fontSrc: ["'self'", 'data:', 'fonts.googleapis.com', 'fonts.gstatic.com'],
        connectSrc: ["'self'", `wss://${process.env.VHOST}:*`],
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

  router.use('/', await GenshinRouter());
  router.use('/hsr', await StarRailRouter());
  router.use('/zenless', await ZenlessRouter());

  router.get('/settings', (req: Request, res: Response) => {
    if (!SiteAuthEnabled) {
      return res.status(404).render('errors/404');
    }
    res.render(SettingsPage, {
      title: 'Settings'
    });
  });

  return router;
};
