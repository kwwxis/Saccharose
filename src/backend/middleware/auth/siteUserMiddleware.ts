import { NextFunction, Request, Response } from 'express';
import DiscordLoginPage from '../../components/auth/DiscordLoginPage.vue';
import WikiLoginPage from '../../components/auth/WikiLoginPage.vue';
import { SiteUserProvider } from './SiteUserProvider.ts';
import UserBannedPage from '../../components/auth/UserBannedPage.vue';

export default async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    await res.renderComponent(DiscordLoginPage, {
      layoutType: 'basic'
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

  if (!req.user.wiki_allowed) {
    if (await SiteUserProvider.isBanned(req.user)) {
      const reason = await SiteUserProvider.getBanReason(req.user);
      await res.renderComponent(UserBannedPage, {
        layoutType: 'basic',
        reason,
      });
    } else {
      await res.renderComponent(WikiLoginPage, {
        layoutType: 'basic'
      });
    }
    return;
  }

  if (await SiteUserProvider.isBanned(req.user)) {
    const reason = await SiteUserProvider.getBanReason(req.user);
    await res.renderComponent(UserBannedPage, {
      layoutType: 'basic',
      reason,
    });
    return;
  }

  next();
}
