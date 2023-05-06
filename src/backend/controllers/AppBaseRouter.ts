import helmet from 'helmet';
import { create, Router, Request, Response, NextFunction } from '../util/router';
import { toBoolean } from '../../shared/util/genericUtil';
import { normText } from '../domain/genshin/genshinNormalizers';

import GenshinRouter from './genshin/app/_index';
import StarRailRouter from './hsr/app/_index';
import ZenlessRouter from './zenless/app/_index';

export default async function(): Promise<Router> {
  const router: Router = create({
    layouts: ['layouts/base-layout', 'layouts/app-layout'],
    locals: async (req: Request) => {
      return {
        normText: (s: string) => normText(s, req.context.outputLangCode),
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
        fontSrc: ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com'],
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

  return router;
};
