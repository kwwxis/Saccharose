import { Request, Response, Router } from 'express';
import { create } from '../../../routing/router.ts';
import ChangelogListPage from '../../../components/genshin/changelogs/GenshinChangelogListPage.vue';
import { GenshinVersions } from '../../../../shared/types/game-versions.ts';
import GenshinChangelogPage from '../../../components/genshin/changelogs/GenshinChangelogPage.vue';
import { getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import GenshinChangelogSingleExcelPage
  from '../../../components/genshin/changelogs/GenshinChangelogSingleExcelPage.vue';
import { generateGenshinChangelogNewRecordSummary } from '../../../domain/genshin/changelog/genshinChangelogHelpers.ts';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/changelog', (req: Request, res: Response) => {
    res.render(ChangelogListPage, {
      title: 'Genshin Changelog',
      bodyClass: ['page--changelog']
    });
  });

  router.get('/changelog/:version', async (req: Request, res: Response) => {
    const genshinVersion = GenshinVersions.find(v => v.number === req.params.version);

    if (!genshinVersion || !genshinVersion.showChangelog) {
      return res.render(ChangelogListPage, {
        title: 'Genshin Changelog',
        errorMessage: 'No changelog available for ' + req.params.version
      });
    }

    const ctrl = getGenshinControl(req);
    const fullChangelog = await ctrl.selectChangelog(genshinVersion);
    const newSummary = await generateGenshinChangelogNewRecordSummary(ctrl, fullChangelog);

    res.render(GenshinChangelogPage, {
      title: 'Genshin Changelog',
      genshinVersion,
      fullChangelog,
      newSummary,
      bodyClass: ['page--changelog', 'page--wide']
    });
  });

  router.get('/changelog/:version/:excelFileName', async (req: Request, res: Response) => {
    const genshinVersion = GenshinVersions.find(v => v.number === req.params.version);

    if (!genshinVersion || !genshinVersion.showChangelog) {
      return res.render(ChangelogListPage, {
        title: 'Genshin Changelog',
        errorMessage: 'No changelog available for ' + req.params.version,
        bodyClass: ['page--changelog', 'page--wide']
      });
    }

    const fullChangelog = await getGenshinControl(req).selectChangelog(genshinVersion);
    const excelFileChanges = fullChangelog.excelChangelog[req.params.excelFileName];

    res.render(GenshinChangelogSingleExcelPage, {
      title: 'Genshin Changelog',
      genshinVersion,
      fullChangelog,
      excelFileChanges,
      bodyClass: ['page--changelog', 'page--wide']
    });
  });

  return router;
}
