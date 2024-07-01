import { DialogExcelConfigData } from '../../../shared/types/genshin/dialogue-types.ts';
import { GenshinControl } from '../../domain/genshin/genshinControl.ts';
import {
  InterActionDialog,
  InterActionFile,
  InterActionNextDialogs,
} from '../../../shared/types/genshin/interaction-types.ts';
import {
  CookBonusExcelConfigData,
  CookRecipeExcelConfigData,
  MaterialRelation,
} from '../../../shared/types/genshin/material-types.ts';
import { normalizeRawJson } from '../import_db.ts';

// This file is for customRowResolvers that need to use GenshinControl.
// We cannot import GenshinControl inside genshin.schema.ts which is why we have this file.
// This file should be used by genshin.schema.ts through dynamic import ONLY.

export async function relation_DialogToNext_resolver(row: DialogExcelConfigData, _allRows, acc: Record<string, any>) {
  if (!acc.ctrl) {
    acc.ctrl = GenshinControl.noDbConnectInstance();
  }

  const ctrl: GenshinControl = acc.ctrl;
  const iaFile: InterActionFile = await ctrl.loadInterActionFile(row.Id);
  const iaDialog: InterActionDialog = iaFile.findDialog(row.Id);
  const iaNextDialogs: InterActionNextDialogs = iaDialog.next();
  const nextDialogs = iaNextDialogs.NextDialogs.length
    ? iaNextDialogs.NextDialogs
    : row.NextDialogs;

  if (nextDialogs && nextDialogs.length) {
    return nextDialogs.map(nextDialogId => ({
      DialogId: row.Id,
      NextId: nextDialogId,
    }));
  } else {
    return [];
  }
}

export async function Relation_CookBonusExcelConfigData_resolver(row: CookBonusExcelConfigData, _allRows: any[], acc: Record<string, any>) {
  if (!acc.ctrl) {
    acc.ctrl = GenshinControl.noDbConnectInstance();
  }
  if (!acc.cookRecipes) {
    const ctrl: GenshinControl = acc.ctrl;
    acc.cookRecipes = (await ctrl.readJsonFile('./ExcelBinOutput/CookRecipeExcelConfigData.json')).map(r => normalizeRawJson(r));
  }

  let ret: MaterialRelation[] = [];

  if (row.ParamVec) {
    ret.push({ RelationId: row.RecipeId, RoleId: row.ParamVec[0], RoleType: 'output' });
  }

  const cookRecipe: CookRecipeExcelConfigData = (<CookRecipeExcelConfigData[]> acc.cookRecipes).find(r => r.Id === row.RecipeId);
  for (let vecItem of cookRecipe.QualityOutputVec) {
    ret.push({ RelationId: row.RecipeId, RoleId: vecItem.Id, RoleType: 'substitute' });
  }

  return ret;
}
