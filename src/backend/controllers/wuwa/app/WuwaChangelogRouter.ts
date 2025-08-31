import { Request, Response, Router } from 'express';
import { create } from '../../../routing/router.ts';
import ChangelogListPage from '../../../components/changelogs/ChangelogListPage.vue';
import { WuwaVersions } from '../../../../shared/types/game-versions.ts';
import { textMapChangesAsRows } from '../../../../shared/types/changelog-types.ts';
import { queryTab } from '../../../middleware/util/queryTab.ts';
import ChangelogTextMapPage from '../../../components/changelogs/ChangelogTextMapPage.vue';
import { getWuwaControl } from '../../../domain/wuwa/wuwaControl.ts';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/changelog', async (req: Request, res: Response) => {
    await res.renderComponent(ChangelogListPage, {
      title: 'Wuwa Changelog',
      bodyClass: ['page--changelog'],
      gameVersions: WuwaVersions,
    });
  });

  router.get('/changelog/:version', async (req: Request, res: Response) => {
    res.redirect(`/wuwa/changelog/${req.params.version}/textmap`);
  });

  router.get('/changelog/:version/textmap', async (req: Request, res: Response) => {
    const gameVersion = WuwaVersions.find(v => v.number === req.params.version);

    if (!gameVersion || !gameVersion.showTextmapChangelog) {
      await res.renderComponent(ChangelogListPage, {
        title: 'Wuwa Changelog',
        errorMessage: 'No changelog available for ' + req.params.version
      });
      return;
    }

    const ctrl = getWuwaControl(req);
    const fullChangelog = await ctrl.selectChangelog(gameVersion);
    const textmapChanges = fullChangelog.textmapChangelog[ctrl.outputLangCode];
    const textmapChangesAsRows = textMapChangesAsRows(textmapChanges, s => ctrl.normText(s, ctrl.outputLangCode));
    const activeTab = queryTab(req, 'added', 'updated', 'removed');

    await res.renderComponent(ChangelogTextMapPage, {
      title: 'Wuwa TextMap Diff ' + gameVersion.number,
      currentVersion: gameVersion,
      activeTab,
      textmapChanges: textmapChangesAsRows,
      bodyClass: ['page--changelog', 'page--wide', 'page--narrow-sidebar']
    });
  });


  return router;
}
