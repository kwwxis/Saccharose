import { Request, Response, Router } from 'express';
import { create } from '../../../routing/router.ts';
import ChangelogListPage from '../../../components/changelogs/ChangelogListPage.vue';
import { ZenlessVersions } from '../../../../shared/types/game-versions.ts';
import { textMapChangesAsRows } from '../../../../shared/types/changelog-types.ts';
import { queryTab } from '../../../middleware/util/queryTab.ts';
import ChangelogTextMapPage from '../../../components/changelogs/ChangelogTextMapPage.vue';
import { getZenlessControl } from '../../../domain/zenless/zenlessControl.ts';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/changelog', (req: Request, res: Response) => {
    res.renderComponent(ChangelogListPage, {
      title: 'Zenless Changelog',
      bodyClass: ['page--changelog'],
      gameVersions: ZenlessVersions,
    });
  });

  router.get('/changelog/:version', async (req: Request, res: Response) => {
    res.redirect(`/zenless/changelog/${req.params.version}/textmap`);
  });

  router.get('/changelog/:version/textmap', async (req: Request, res: Response) => {
    const zenlessVersion = ZenlessVersions.find(v => v.number === req.params.version);

    if (!zenlessVersion || !zenlessVersion.showTextmapChangelog) {
      return res.renderComponent(ChangelogListPage, {
        title: 'Zenless Changelog',
        errorMessage: 'No changelog available for ' + req.params.version
      });
    }

    const ctrl = getZenlessControl(req);
    const fullChangelog = await ctrl.selectChangelog(zenlessVersion);
    const textmapChanges = fullChangelog.textmapChangelog[ctrl.outputLangCode];
    const textmapChangesAsRows = textMapChangesAsRows(textmapChanges, s => ctrl.normText(s, ctrl.outputLangCode));
    const activeTab = queryTab(req, 'added', 'updated', 'removed');

    res.renderComponent(ChangelogTextMapPage, {
      title: 'Zenless TextMap Diff ' + zenlessVersion.number,
      currentVersion: zenlessVersion,
      activeTab,
      textmapChanges: textmapChangesAsRows,
      bodyClass: ['page--changelog', 'page--wide', 'page--narrow-sidebar']
    });
  });


  return router;
}
