import { create } from '../../routing/router.ts';
import { NextFunction, Request, Response } from 'express';
import DiscordLoginPage from '../../components/auth/DiscordLoginPage.vue';
import WikiLoginPage from '../../components/auth/WikiLoginPage.vue';
import { SiteUserProvider } from './SiteUserProvider.ts';
import UserBannedPage from '../../components/auth/UserBannedPage.vue';
import { SiteAuthEnabled } from '../../loadenv.ts';

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

    await SiteUserProvider.syncDatabaseStateToRequestUser(req);

    // No discord username -> failed login
    if (!req.user.discord_username) {
      req.logout(() => res.redirect('/'));
      return;
    }

    if (!req.user.wiki_id || !req.user.wiki_username || !req.user.wiki_allowed) {
      if (await SiteUserProvider.isBanned(req.user)) {
        res.render(UserBannedPage, {
          layouts: ['layouts/basic-layout'],
        });
      } else {
        res.render(WikiLoginPage, {
          layouts: ['layouts/basic-layout'],
        });
      }
      return;
    }

    if (await SiteUserProvider.isBanned(req.user)) {
      res.render(UserBannedPage, {
        layouts: ['layouts/basic-layout'],
      });
      return;
    }

    next();
  });

  return router;
}
