import { Request, Response, Router } from 'express';
import { create } from '../../../routing/router.ts';
import { SiteUserProvider } from '../../../middleware/auth/SiteUserProvider.ts';
import SettingsPage from '../../../components/auth/SettingsPage.vue';
import SiteNoticesPage from '../../../components/site/SiteNoticesPage.vue';
import NumberFormattingNotice from '../../../components/site/notices/NumberFormattingNotice.vue';
import { SiteNotice } from '../../../../shared/types/site/site-user-types.ts';
import UserLandingPage from '../../../components/auth/UserLandingPage.vue';
import { SITE_TITLE } from '../../../loadenv.ts';
import { getApiKeysForUser } from '../../../middleware/api/apiAuth.ts';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/', (req: Request, res: Response) => {
    res.renderComponent(UserLandingPage, {
      title: SITE_TITLE,
      bodyClass: ['page--user', 'page-landing'],
    });
  });

  router.get('/settings', (req: Request, res: Response) => {
    res.renderComponent(SettingsPage, {
      title: 'Settings',
      bodyClass: ['page--user', 'page--settings'],
    });
  });

  router.get('/settings/user-data.json', async (req: Request, res: Response) => {
    res.json({
      userData: req.user,
      userIsbanned: await SiteUserProvider.isBanned(req.user),
      userInWikiRequirementsBypass: await SiteUserProvider.isInReqBypass(req.user),
      userNoticesDismissed: await SiteUserProvider.getSiteNoticesDismissed(req.user.id),
      currentSessionData: req.session,
      myApiKeys: await getApiKeysForUser(req.user.id)
    });
  });

  router.get('/notices', async (req: Request, res: Response) => {
    const notices: SiteNotice[] = await SiteUserProvider.getAllSiteNotices();
    res.renderComponent(SiteNoticesPage, {
      title: 'Site Notices',
      notices,
      bodyClass: ['page--user', 'page--notices'],
    });
  });

  router.get('/notices/number-formatting', async (req: Request, res: Response) => {
    res.renderComponent(NumberFormattingNotice, {
      title: 'Notice - Upcoming change on how numbers are formatted',
      bodyClass: ['page--user', 'page--notices'],
    });
  });

  return router;
}
