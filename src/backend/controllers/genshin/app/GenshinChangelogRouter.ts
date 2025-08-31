import { Request, Response, Router } from 'express';
import { create } from '../../../routing/router.ts';
import ChangelogListPage from '../../../components/changelogs/ChangelogListPage.vue';
import { GenshinVersions } from '../../../../shared/types/game-versions.ts';
import GenshinChangelogSummaryPage from '../../../components/changelogs/GenshinChangelogSummaryPage.vue';
import { getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import ChangelogSingleExcelPage
  from '../../../components/changelogs/ChangelogSingleExcelPage.vue';
import { generateGenshinChangelogNewRecordSummary } from '../../../domain/genshin/changelog/genshinChangelogHelpers.ts';
import { isInt } from '../../../../shared/util/numberUtil.ts';
import { LANG_CODES, LangCodeMap } from '../../../../shared/types/lang-types.ts';
import { textMapChangesAsRows } from '../../../../shared/types/changelog-types.ts';
import ChangelogTextMapPage from '../../../components/changelogs/ChangelogTextMapPage.vue';
import { queryTab } from '../../../middleware/util/queryTab.ts';
import ChangelogExcelListPage from '../../../components/changelogs/ChangelogExcelListPage.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/changelog', async (req: Request, res: Response) => {
    await res.renderComponent(ChangelogListPage, {
      title: 'Genshin Changelog',
      bodyClass: ['page--changelog'],
      gameVersions: GenshinVersions,
    });
  });

  router.get('/changelog/:version', async (req: Request, res: Response) => {
    const genshinVersion = GenshinVersions.find(v => v.number === req.params.version);

    if (!genshinVersion || !genshinVersion.showTextmapChangelog) {
      await res.renderComponent(ChangelogListPage, {
        title: 'Genshin Changelog',
        errorMessage: 'No changelog available for ' + req.params.version
      });
      return;
    }

    const ctrl = getGenshinControl(req);
    const fullChangelog = await ctrl.selectChangelog(genshinVersion);
    const newSummary = await generateGenshinChangelogNewRecordSummary(ctrl, fullChangelog);

    await res.renderComponent(GenshinChangelogSummaryPage, {
      title: 'Genshin Changelog ' + genshinVersion.number,
      currentVersion: genshinVersion,
      fullChangelog,
      newSummary,
      bodyClass: ['page--changelog', 'page--wide', 'page--narrow-sidebar']
    });
  });

  router.get('/changelog/:version/excels', async (req: Request, res: Response) => {
    const genshinVersion = GenshinVersions.find(v => v.number === req.params.version);

    if (!genshinVersion || !genshinVersion.showTextmapChangelog) {
      await res.renderComponent(ChangelogListPage, {
        title: 'Genshin Changelog',
        errorMessage: 'No changelog available for ' + req.params.version
      });
      return;
    }

    const ctrl = getGenshinControl(req);
    const fullChangelog = await ctrl.selectChangelog(genshinVersion);

    await res.renderComponent(ChangelogExcelListPage, {
      title: 'Genshin Changelog ' + genshinVersion.number,
      currentVersion: genshinVersion,
      fullChangelog,
      bodyClass: ['page--changelog', 'page--wide', 'page--narrow-sidebar']
    });
  });

  router.get('/changelog/:version/textmap', async (req: Request, res: Response) => {
    const genshinVersion = GenshinVersions.find(v => v.number === req.params.version);

    if (!genshinVersion || !genshinVersion.showTextmapChangelog) {
      await res.renderComponent(ChangelogListPage, {
        title: 'Genshin Changelog',
        errorMessage: 'No changelog available for ' + req.params.version
      });
      return;
    }

    const ctrl = getGenshinControl(req);
    const fullChangelog = await ctrl.selectChangelog(genshinVersion);
    const textmapChanges = fullChangelog.textmapChangelog[ctrl.outputLangCode];
    const textmapChangesAsRows = textMapChangesAsRows(textmapChanges, s => ctrl.normText(s, ctrl.outputLangCode));
    const activeTab = queryTab(req, 'added', 'updated', 'removed');

    await res.renderComponent(ChangelogTextMapPage, {
      title: 'Genshin TextMap Diff ' + genshinVersion.number,
      currentVersion: genshinVersion,
      activeTab,
      textmapChanges: textmapChangesAsRows,
      bodyClass: ['page--changelog', 'page--wide', 'page--narrow-sidebar']
    });
  });

  router.get('/changelog/:version/excels/:excelFileName', async (req: Request, res: Response) => {
    const genshinVersion = GenshinVersions.find(v => v.number === req.params.version);

    if (!genshinVersion || !genshinVersion.showExcelChangelog) {
      await res.renderComponent(ChangelogListPage, {
        title: 'Genshin Changelog',
        errorMessage: 'No changelog available for ' + req.params.version,
        bodyClass: ['page--changelog', 'page--wide', 'page--narrow-sidebar']
      });
      return;
    }

    const ctrl = getGenshinControl(req);
    ctrl.state.AutoloadAvatar = false;

    const fullChangelog = await ctrl.selectChangelog(genshinVersion);
    const excelFileChanges = fullChangelog.excelChangelog[req.params.excelFileName];
    const schemaTable = ctrl.schema[excelFileChanges.name];

    for (let record of Object.values(excelFileChanges.changedRecords)) {
      if (record.addedRecord) {
        record.addedRecord = await ctrl.commonLoadFirst(record.addedRecord, schemaTable, true);
      }
      for (let field of Object.values(record.updatedFields)) {
        if (field.field.endsWith('TextMapHash')) {
          let oldValueMap: Partial<LangCodeMap> = {};
          let newValueMap: Partial<LangCodeMap> = {};

          if (isInt(field.oldValue)) {
            oldValueMap = await ctrl.createLangCodeMap(field.oldValue);
          }
          if (isInt(field.newValue)) {
            newValueMap = await ctrl.createLangCodeMap(field.newValue);
          }
          if (!field.textChanges) {
            field.textChanges = [];
          }
          for (let langCode of LANG_CODES) {
            if (oldValueMap[langCode] || newValueMap[langCode]) {
              field.textChanges.push({
                langCode,
                oldValue: oldValueMap[langCode],
                newValue: newValueMap[langCode]
              });
            }
          }
        }
      }
    }

    const activeTab = queryTab(req, 'added', 'updated', 'removed');
    await res.renderComponent(ChangelogSingleExcelPage, {
      title: 'Genshin Changelog - ' + excelFileChanges.name,
      currentVersion: genshinVersion,
      fullChangelog,
      excelFileChanges,
      activeTab,
      bodyClass: ['page--changelog', 'page--wide', 'page--narrow-sidebar']
    });
  });

  return router;
}
