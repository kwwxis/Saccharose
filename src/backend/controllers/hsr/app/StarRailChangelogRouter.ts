import { Request, Response, Router } from 'express';
import { create } from '../../../routing/router.ts';
import ChangelogListPage from '../../../components/changelogs/ChangelogListPage.vue';
import { StarRailVersions } from '../../../../shared/types/game-versions.ts';
import { queryTab } from '../../../middleware/util/queryTab.ts';
import ChangelogTextMapPage from '../../../components/changelogs/ChangelogTextMapPage.vue';
import { getStarRailControl } from '../../../domain/hsr/starRailControl.ts';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/changelog', async (req: Request, res: Response) => {
    await res.renderComponent(ChangelogListPage, {
      title: 'HSR Changelog',
      bodyClass: ['page--changelog'],
      gameVersions: StarRailVersions,
    });
  });

  router.get('/changelog/:version', async (req: Request, res: Response) => {
    res.redirect(`/hsr/changelog/${req.params.version}/textmap`);
  });

  router.get('/changelog/:version/textmap', async (req: Request, res: Response) => {
    const gameVersion = StarRailVersions.find(v => v.number === req.params.version);

    if (!gameVersion || !gameVersion.showTextmapChangelog) {
      await res.renderComponent(ChangelogListPage, {
        title: 'HSR Changelog',
        errorMessage: 'No changelog available for ' + req.params.version
      });
      return;
    }

    const ctrl = getStarRailControl(req);
    const textmapChanges = await ctrl.textMapChangelog.selectChangesForDisplay(
      gameVersion.number,
      ctrl.outputLangCode,
      true
    );

    const activeTab = queryTab(req, 'added', 'updated', 'removed');

    await res.renderComponent(ChangelogTextMapPage, {
      title: 'HSR TextMap Diff ' + gameVersion.number,
      currentVersion: gameVersion,
      activeTab,
      textmapChanges,
      bodyClass: ['page--changelog', 'page--wide', 'page--narrow-sidebar']
    });
  });


  return router;
}
