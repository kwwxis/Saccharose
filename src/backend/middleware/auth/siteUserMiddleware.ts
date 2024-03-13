import { create } from '../../routing/router.ts';
import { NextFunction, Request, Response } from 'express';
import DiscordLoginPage from '../../components/auth/DiscordLoginPage.vue';
import WikiLoginPage from '../../components/auth/WikiLoginPage.vue';
import { SiteUserProvider } from './SiteUserProvider.ts';
import UserBannedPage from '../../components/auth/UserBannedPage.vue';
import { SiteAuthEnabled } from '../../loadenv.ts';
import { SiteUserPrefs } from '../../../shared/types/site/site-user-types.ts';
import { toBoolean } from '../../../shared/util/genericUtil.ts';

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

    let prefsMigrate: Partial<SiteUserPrefs> = {};
    if (req.cookies['inputLangCode']) {
      prefsMigrate.inputLangCode = req.cookies['inputLangCode'];
      res.clearCookie('inputLangCode');
    }
    if (req.cookies['outputLangCode']) {
      prefsMigrate.outputLangCode = req.cookies['outputLangCode'];
      res.clearCookie('outputLangCode');
    }
    if (req.cookies['search-mode']) {
      prefsMigrate.searchMode = req.cookies['search-mode'];
      res.clearCookie('search-mode');
    }
    if (req.cookies['nightmode'] && toBoolean(req.cookies['nightmode'])) {
      prefsMigrate.isNightmode = true;
      res.clearCookie('nightmode');
    }
    if (Object.keys(prefsMigrate).length) {
      await SiteUserProvider.update(req.user.id, {
        prefs: Object.assign({}, req.user.prefs, prefsMigrate)
      });
    }

    next();
  });

  return router;
}
