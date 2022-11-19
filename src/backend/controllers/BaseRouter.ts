import config from '../config';

import AppRouter from './app/AppRouter';
import helmet from 'helmet';

import { create, Router, Request, Response, NextFunction } from '../util/router';

export default async function(): Promise<Router> {
  const router: Router = create({
    layouts: ['layouts/base-layout'],
    locals: async (req: Request) => ({
      csrfToken: req.csrfToken(),
    })
  });

  router.use((req: Request, res: Response, next: NextFunction) => {
    helmet.contentSecurityPolicy({
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'", 'cdnjs.cloudflare.com', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com', `${process.env.VHOST}:*`],
        prefetchSrc: ["'self'", 'cdnjs.cloudflare.com', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com', `${process.env.VHOST}:*`],
        styleSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'],
        scriptSrc: ["'self'", "'unsafe-eval'", 'cdnjs.cloudflare.com', 'unpkg.com', `'nonce-${req.context.nonce}'`, `${process.env.VHOST}:*`],
        fontSrc: ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com'],
        connectSrc: ["'self'", `wss://${process.env.VHOST}:*`],
        upgradeInsecureRequests: [],
      },
      reportOnly: false,
    })(req, res, next);
  });

  router.use('/', await AppRouter());

  return router;
};
