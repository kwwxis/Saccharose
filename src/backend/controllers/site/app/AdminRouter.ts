import { NextFunction, Request, Response, Router } from 'express';
import { create } from '../../../routing/router.ts';
import SiteLogViewPage from '../../../components/site/admin/SiteLogViewPage.vue';
import SiteCacheManager from '../../../components/site/admin/SiteCacheManager.vue';
import AccessDeniedErrorCard from '../../../components/errors/AccessDeniedErrorCard.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.use(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user || !req.user.roles.includes('admin')) {
      await res.status(403).renderComponent(AccessDeniedErrorCard);
      return;
    }
    next();
  });

  router.get('/logview', async (req, res) => {
    await res.renderComponent(SiteLogViewPage, {
      title: 'Admin :: Logview',
      bodyClass: ['page--logview', 'page--wide'],
    });
  });

  router.get('/cachemgr', async (req, res) => {
    await res.renderComponent(SiteCacheManager, {
      title: 'Admin :: Cache Manager',
      bodyClass: ['page--cachemgr'],
    });
  });

  return router;
}
