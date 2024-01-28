import { create } from '../../routing/router.ts';
import { NextFunction, Request, Response } from 'express';
import DiscordLoginPage from '../../components/auth/DiscordLoginPage.vue';
import WikiLoginPage from '../../components/auth/WikiLoginPage.vue';
import { SiteAuthEnabled, SiteUserProvider } from './SiteUserProvider.ts';

export function createSiteUserMiddlewareRouter() {
  const router = create();

  router.use(async (req: Request, res: Response, next: NextFunction) => {
    if (!SiteAuthEnabled) {
      next();
      return;
    }

    if (!req.isAuthenticated()) {
      res.render(DiscordLoginPage, {
        layouts: ['layouts/basic-layout'],
      });
      return;
    }

    if (!req.user || !req.user.id) {
      req.logout(() => res.redirect('/'));
      return;
    }

    req.user = await SiteUserProvider.find(req.user.id);

    if (!req.user.discord_username || !req.user?.discord?.avatar) {
      req.logout(() => res.redirect('/'));
      return;
    }

    if (!req.user.wiki_id || !req.user.wiki_username || !req.user.wiki_allowed) {
      res.render(WikiLoginPage, {
        layouts: ['layouts/basic-layout'],
      });
      return;
    }

    next();
  });

  return router;
}
