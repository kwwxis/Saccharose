import {
  DialogExcelConfigData,
  TalkExcelBeginCondType,
  TalkExcelConfigData,
} from '../../../shared/types/genshin/dialogue-types.ts';
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
import { isInt, toInt } from '../../../shared/util/numberUtil.ts';
import { mapBy } from '../../../shared/util/arrayUtil.ts';

// This file is for customRowResolvers that need to use GenshinControl.
// We cannot import GenshinControl inside genshin.schema.ts which is why we have this file.
// This file should be used by genshin.schema.ts through dynamic import ONLY.

export async function relation_DialogToNext_resolver(row: DialogExcelConfigData, _allRows, acc: Record<string, any>) {
  if (!acc.ctrl) {
    acc.ctrl = GenshinControl.noDbConnectInstance();
  }

  const ctrl: GenshinControl = acc.ctrl;
  const iaFile: InterActionFile = await ctrl.loadInterActionFileByDialogId(row.Id);
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


const AvatarBeginCondTypes: Set<TalkExcelBeginCondType> = new Set([
  'QUEST_COND_AVATAR_FETTER_GT',
  'QUEST_COND_AVATAR_FETTER_LT',
  'QUEST_COND_AVATAR_FETTER_EQ',
  'QUEST_COND_PLAYER_TEAM_CONTAINS_AVATAR',
  'QUEST_COND_PLAYER_TEAM_NOT_CONTAINS_AVATAR',
  'QUEST_COND_PLAYER_HAVE_AVATAR',
  'QUEST_COND_PLAYER_CURRENT_AVATAR',
  'QUEST_COND_PLAYER_CURRENT_NOT_AVATAR'
]);
export async function Relation_TalkAvatarCond_resolver(row: TalkExcelConfigData, _allRows: any[], acc: Record<string, any>) {
  if (!row.BeginCond || !row.BeginCond.length) {
    return [];
  }
  if (!acc.ctrl) {
    acc.ctrl = GenshinControl.noDbConnectInstance();
  }
  const ctrl: GenshinControl = acc.ctrl;

  if (!acc.avatarsById) {
    acc.avatarsById = mapBy(<any[]> await ctrl.readJsonFile(ctrl.getExcelPath('./AvatarExcelConfigData.json')), 'Id');
  }
  const avatarsById: Record<number, any> = acc.avatarsById;

  const rows: {TalkId: number, AvatarId: number}[] = [];

  for (let cond of row.BeginCond) {
    if (!cond || !cond.Type || !cond.Param || !cond.Param.length) {
      continue;
    }
    if (AvatarBeginCondTypes.has(cond.Type)) {
      if (cond.Type.includes('FETTER') && row.PerformCfg?.includes('HomeWorld')) {
        continue;
      }
      if (isInt(cond.Param[0]) && avatarsById[toInt(cond.Param[0])]) {
        rows.push({
          TalkId: row.Id,
          AvatarId: toInt(cond.Param[0]),
        });
      } else if (!cond.Type.includes('FETTER') && isInt(cond.Param[1])) {
        const tagId: number = toInt(cond.Param[1]);
        const tag = await ctrl.getFeatureTag(tagId);
        if (tag) {
          for (let gid of tag.GroupIds) {
            if (avatarsById[gid]) {
              rows.push({
                TalkId: row.Id,
                AvatarId: gid,
              });
              break;
            }
          }
        }
      }
    }
  }

  return rows;
}
