import { pathToFileURL } from 'url';
import { getWuwaControl, WuwaControl } from '../wuwaControl.ts';
import path from 'path';
import fs from 'fs';
import { mapBy, sort } from '../../../../shared/util/arrayUtil.ts';
import { defaultMap } from '../../../../shared/util/genericUtil.ts';
import { DATAFILE_WUWA_ROLE_FAVOR_WORDS } from '../../../loadenv.ts';
import { RoleInfo } from '../../../../shared/types/wuwa/role-types.ts';
import {
  FavorWord,
  FavorWordCondSummary,
  FavorWordGroup,
  FavorWordGroupByRole,
} from '../../../../shared/types/wuwa/favor-types.ts';
import { closeKnex } from '../../../util/db.ts';
import { LangCodeMap } from '../../../../shared/types/lang-types.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { fsReadJson } from '../../../util/fsutil.ts';

export async function fetchFavorWords(ctrl: WuwaControl, skipCache: boolean = false): Promise<FavorWordGroupByRole> {
  if (!skipCache) {
    return ctrl.cached('RoleFavor:RoleFavorWordsGroup', 'json', async () => {
      const filePath = path.resolve(process.env.WUWA_DATA_ROOT, DATAFILE_WUWA_ROLE_FAVOR_WORDS);
      const result: FavorWordGroupByRole = await fsReadJson(filePath);
      return result;
    });
  }

  ctrl = ctrl.copy();
  ctrl.state.AutoloadRoleInfo = false;
  ctrl.state.AutoloadText = false;

  const roleInfoMap: {[roleId: number]: RoleInfo} = mapBy(await ctrl.selectAllRoleInfo(), 'Id');

  return ctrl.cached('RoleFavor:RoleFavorWordsGroup', 'json', async () => {
    let favorWords: FavorWord[] = await ctrl.readExcelDataFile('FavorWord.json');
    let favorWordGroupsByRole: FavorWordGroupByRole =
      defaultMap((roleId: number) => <FavorWordGroup> {
        roleId: roleId,
        storyFavorWords: [],
        combatFavorWords: [],
      });

    for (let favorWord of favorWords) {
      let agg: FavorWordGroup = favorWordGroupsByRole[favorWord.RoleId];

      if (!agg.roleName) {
        agg.roleName = await ctrl.createLangCodeMap(roleInfoMap[favorWord.RoleId].Name);
      }

      if (favorWord.Type === 1) {
        agg.storyFavorWords.push(favorWord);
      } else {
        agg.combatFavorWords.push(favorWord);
      }

      if (favorWord.Title) {
        favorWord.TitleTextMap = await ctrl.createLangCodeMap(favorWord.Title);
      }
      if (favorWord.Content) {
        favorWord.ContentTextMap = await ctrl.createLangCodeMap(favorWord.Content);
      }

      favorWord.CondSummary = {HintTextMap: null, CondDescriptions: []};
      if (!favorWord.CondGroup) {
        continue;
      }

      if (favorWord.CondGroup.HintText) {
        favorWord.CondSummary.HintTextMap = await ctrl.createLangCodeMap(favorWord.CondGroup.HintText);
      }
      if (Array.isArray(favorWord.CondGroup.Conditions)) {
        for (let condition of favorWord.CondGroup.Conditions) {
          if (condition.Description) {
            const map: LangCodeMap = await ctrl.createLangCodeMap(condition.Description);
            if (map && map.EN) {
              favorWord.CondSummary.CondDescriptions.push(map);
            }
          }
          if (condition.Type === 'RoleBreach') {
            favorWord.CondSummary.Ascension = toInt(condition.LimitParams.find(x => x.Key === 'Breach')?.Value);
          }
          if (condition.Type === 'RoleFavorLevel') {
            favorWord.CondSummary.Intimacy = toInt(condition.LimitParams.find(x => x.Key === 'Level')?.Value);
          }
        }
      }
    }

    for (let group of Object.values(favorWordGroupsByRole)) {
      sort(group.storyFavorWords, 'Sort');
      sort(group.combatFavorWords, 'Sort');
    }

    return favorWordGroupsByRole;
  });
}

export async function fetchFavorWordsByRoleId(ctrl: WuwaControl, roleId: number, skipCache: boolean = false): Promise<FavorWordGroup> {
  return (await fetchFavorWords(ctrl, skipCache))[roleId];
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ctrl = getWuwaControl();

  // 1402 - Yangyang
  // 1304 - Jinhsi
  // 1404 - Jiyan

  const result  = await fetchFavorWordsByRoleId(ctrl, 1304, true);
  console.log(JSON.stringify(result, null, 2));
  await closeKnex();
}
