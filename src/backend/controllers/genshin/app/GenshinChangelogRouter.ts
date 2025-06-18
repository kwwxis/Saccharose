import { Request, Response, Router } from 'express';
import { create } from '../../../routing/router.ts';
import ChangelogListPage from '../../../components/genshin/changelogs/GenshinChangelogListPage.vue';
import { GenshinVersions } from '../../../../shared/types/game-versions.ts';
import GenshinChangelogPage from '../../../components/genshin/changelogs/GenshinChangelogPage.vue';
import { getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import GenshinChangelogSingleExcelPage
  from '../../../components/genshin/changelogs/GenshinChangelogSingleExcelPage.vue';
import { generateGenshinChangelogNewRecordSummary } from '../../../domain/genshin/changelog/genshinChangelogHelpers.ts';
import { isInt } from '../../../../shared/util/numberUtil.ts';
import { LANG_CODES, LangCodeMap } from '../../../../shared/types/lang-types.ts';
import { textMapChangesAsRows } from '../../../../shared/types/changelog-types.ts';
import GenshinChangelogTextMapPage from '../../../components/genshin/changelogs/GenshinChangelogTextMapPage.vue';
import { queryTab } from '../../../middleware/util/queryTab.ts';

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
      title: 'Genshin Changelog ' + genshinVersion.number,
      genshinVersion,
      fullChangelog,
      newSummary,
      bodyClass: ['page--changelog', 'page--wide', 'page--narrow-sidebar']
    });
  });

  router.get('/changelog/:version/textmap', async (req: Request, res: Response) => {
    const genshinVersion = GenshinVersions.find(v => v.number === req.params.version);

    if (!genshinVersion || !genshinVersion.showChangelog) {
      return res.render(ChangelogListPage, {
        title: 'Genshin Changelog',
        errorMessage: 'No changelog available for ' + req.params.version
      });
    }

    const ctrl = getGenshinControl(req);
    const fullChangelog = await ctrl.selectChangelog(genshinVersion);
    const textmapChanges = fullChangelog.textmapChangelog[ctrl.outputLangCode];
    const textmapChangesAsRows = textMapChangesAsRows(textmapChanges, s => ctrl.normText(s, ctrl.outputLangCode));
    const activeTab: string = queryTab(req, 'added', 'updated', 'removed');

    res.render(GenshinChangelogTextMapPage, {
      title: 'Genshin TextMap Diff ' + genshinVersion.number,
      genshinVersion,
      activeTab,
      textmapChanges: textmapChangesAsRows,
      bodyClass: ['page--changelog', 'page--wide', 'page--narrow-sidebar']
    });
  });

  router.get('/changelog/:version/:excelFileName', async (req: Request, res: Response) => {
    const genshinVersion = GenshinVersions.find(v => v.number === req.params.version);

    if (!genshinVersion || !genshinVersion.showChangelog) {
      return res.render(ChangelogListPage, {
        title: 'Genshin Changelog',
        errorMessage: 'No changelog available for ' + req.params.version,
        bodyClass: ['page--changelog', 'page--wide', 'page--narrow-sidebar']
      });
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

    const activeTab: string = queryTab(req, 'added', 'updated', 'removed');
    res.render(GenshinChangelogSingleExcelPage, {
      title: 'Genshin Changelog - ' + excelFileChanges.name,
      genshinVersion,
      fullChangelog,
      excelFileChanges,
      activeTab,
      bodyClass: ['page--changelog', 'page--wide', 'page--narrow-sidebar']
    });
  });

  return router;
}
