import { Request, Response, Router } from 'express';
import { create } from '../routing/router.ts';
import { SiteAuthEnabled, SiteUserProvider } from '../middleware/auth/SiteUserProvider.ts';
import SettingsPage from '../components/auth/SettingsPage.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/settings', (req: Request, res: Response) => {
    if (!SiteAuthEnabled) {
      return res.status(404).render('errors/404');
    }
    res.render(SettingsPage, {
      title: 'Settings'
    });
  });

  router.get('/settings/user-data.json', async (req: Request, res: Response) => {
    res.json({
      userData: req.user,
      userInWikiRequirementsBypass: await SiteUserProvider.isInReqBypass(req.user?.wiki_username),
      currentSessionData: req.session,
    });
  });

  return router;
}
