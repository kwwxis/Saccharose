import config from '@/config';

import AppRouter from './app/AppRouter';
import helmet from 'helmet';

import { create, Router, Request, Response, NextFunction } from '@router';

export default async function(): Promise<Router> {
  const router: Router = create({
    layouts: config.views.base.layouts,
    styles: config.views.base.styles,
    scripts: config.views.base.scripts,
    locals: async (req: Request) => ({
      csrfToken: req.csrfToken(),
    })
  });

  router.use((req: Request, res: Response, next: NextFunction) => {
    helmet.contentSecurityPolicy({
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'", 'cdnjs.cloudflare.com', 'unpkg.com'],
        prefetchSrc: ["'self'", 'cdnjs.cloudflare.com', 'unpkg.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com', 'unpkg.com'],
        scriptSrc: ["'self'", "'unsafe-eval'", 'cdnjs.cloudflare.com', 'unpkg.com', `'nonce-${req.context.nonce}'`],
        upgradeInsecureRequests: [],
      },
      reportOnly: false,
    })(req, res, next);
  });

  router.use('/', await AppRouter());

  return router;
};
