import config from '@/config';

import HomePageController from './HomePageController';
import AppRouter from './app/AppRouter';

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

  router.use('/', await HomePageController());
  router.use('/', await AppRouter());

  return router;
};
