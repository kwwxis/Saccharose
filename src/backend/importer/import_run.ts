import '../loadenv';
import { openKnex } from '../util/db';
import { DialogExcelConfigData, TalkExcelConfigData } from '../../shared/types/dialogue-types';
import { MaterialExcelConfigData } from '../../shared/types/material-types';
import commandLineArgs, { OptionDefinition as ArgsOptionDefinition } from 'command-line-args';
import commandLineUsage, { OptionDefinition as UsageOptionDefinition } from 'command-line-usage';
import { getGenshinDataFilePath } from '../loadenv';
import { humanTiming, timeConvert } from '../../shared/util/genericUtil';
import { promises as fs } from 'fs';
import ora from 'ora';
import { pathToFileURL } from 'url';
import { ReliquaryCodexExcelConfigData, ReliquaryExcelConfigData } from '../../shared/types/artifact-types';
import { WeaponCodexExcelConfigData, WeaponExcelConfigData } from '../../shared/types/weapon-types';
import { AvatarFlycloakExcelConfigData } from '../../shared/types/avatar-types';
import chalk from 'chalk';
import { GCGCharacterLevelExcelConfigData, GCGRuleExcelConfigData } from '../../shared/types/gcg-types';
import { resolveObjectPath } from '../../shared/util/arrayUtil';
import { ucFirst } from '../../shared/util/stringUtil';
import { AchievementExcelConfigData, AchievementGoalExcelConfigData } from '../../shared/types/achievement-types';

export type SchemaTable = {
  name: string,
  columns: SchemaColumn[],
  jsonFile: string,
  customRowResolve?: (row: any, allRows?: any[]) => any[],
  normalizeFixFields?: { [oldName: string]: string },
  singularize?: string[],
};
export type SchemaColumnType =
  'string'
  | 'integer'
  | 'bigInteger'
  | 'boolean'
  | 'text'
  | 'float'
  | 'double'
  | 'decimal'
  | 'json'
  | 'jsonb'
  | 'uuid';
export type SchemaColumn = {
  name: string,
  type: SchemaColumnType,
  resolve?: string | Function,
  isIndex?: boolean,
  isPrimary?: boolean,
  defaultValue?: any,
};

export const schema = {
  DialogExcelConfigData: <SchemaTable> {
    name: 'DialogExcelConfigData',
    jsonFile: './ExcelBinOutput/DialogExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'TalkRoleType', type: 'string', resolve: 'TalkRole.Type', isIndex: true},
      {name: 'TalkRoleId', type: 'string', resolve: 'TalkRole.Id', isIndex: true},
      {name: 'TalkContentTextMapHash', type: 'integer', isIndex: true},
      {name: 'TalkTitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'TalkRoleNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'GroupId', type: 'integer', isIndex: true},
    ]
  },
  Relation_DialogToNext: <SchemaTable> {
    name: 'Relation_DialogToNext',
    jsonFile: './ExcelBinOutput/DialogExcelConfigData.json',
    columns: [
      {name: 'DialogId', type: 'integer', isIndex: true},
      {name: 'NextId', type: 'integer', isIndex: true},
    ],
    customRowResolve: (row: DialogExcelConfigData) => {
      if (row.NextDialogs && row.NextDialogs.length) {
        return row.NextDialogs.map(nextDialogId => ({
          DialogId: row.Id,
          NextId: nextDialogId,
        }));
      } else {
        return [];
      }
    }
  },
  ManualTextMapConfigData: <SchemaTable> {
    name: 'ManualTextMapConfigData',
    jsonFile: './ExcelBinOutput/ManualTextMapConfigData.json',
    columns: [
      {name: 'TextMapId', type: 'string', isPrimary: true},
      {name: 'TextMapContentTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  NpcExcelConfigData: <SchemaTable> {
    name: 'NpcExcelConfigData',
    jsonFile: './ExcelBinOutput/NpcExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true}
    ]
  },
  TalkExcelConfigData: <SchemaTable> {
    name: 'TalkExcelConfigData',
    jsonFile: './ExcelBinOutput/TalkExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'InitDialog', type: 'integer', isIndex: true},
      {name: 'LoadType', type: 'string', isIndex: true, defaultValue: 'TALK_DEFAULT' },
      {name: 'QuestId', type: 'integer', isIndex: true},
      {name: 'QuestCondStateEqualFirst', type: 'integer', isIndex: true, resolve(row: TalkExcelConfigData) {
        if (row.BeginCond) {
          let questCondStateEqual = row.BeginCond.find(cond => cond.Type === 'QUEST_COND_STATE_EQUAL');
          if (questCondStateEqual && Array.isArray(questCondStateEqual.Param)) {
            try {
              if (typeof questCondStateEqual.Param[0] === 'string') {
                return parseInt(questCondStateEqual.Param[0]);
              } else {
                return questCondStateEqual.Param[0];
              }
            } catch (e) {
              return null;
            }
          }
        }
        return null;
      }}
    ]
  },
  Relation_NpcToTalk: <SchemaTable> {
    name: 'Relation_NpcToTalk',
    jsonFile: './ExcelBinOutput/TalkExcelConfigData.json',
    columns: [
      {name: 'NpcId', type: 'integer', isIndex: true},
      {name: 'TalkId', type: 'integer'},
      {name: 'TalkLoadType', type: 'string', isIndex: true}
    ],
    customRowResolve: (row: TalkExcelConfigData) => {
      if (row.NpcId && row.NpcId.length) {
        return row.NpcId.map(npcId => ({NpcId: npcId, TalkId: row.Id, TalkLoadType: row.LoadType || 'TALK_DEFAULT'}));
      }
      return [];
    }
  },
  MainQuestExcelConfigData: <SchemaTable> {
    name: 'MainQuestExcelConfigData',
    jsonFile: './ExcelBinOutput/MainQuestExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'Series', type: 'integer', isIndex: true},
      {name: 'ChapterId', type: 'integer', isIndex: true},
      {name: 'TitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true}
    ]
  },
  ChapterExcelConfigData: <SchemaTable> {
    name: 'ChapterExcelConfigData',
    jsonFile: './ExcelBinOutput/ChapterExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'BeginQuestId', type: 'integer', isIndex: true},
      {name: 'EndQuestId', type: 'integer', isIndex: true},
      {name: 'ChapterNumTextMapHash', type: 'integer', isIndex: true},
      {name: 'ChapterTitleTextMapHash', type: 'integer', isIndex: true}
    ]
  },
  QuestExcelConfigData: <SchemaTable> {
    name: 'QuestExcelConfigData',
    jsonFile: './ExcelBinOutput/QuestExcelConfigData.json',
    columns: [
      {name: 'SubId', type: 'integer', isPrimary: true},
      {name: 'MainId', type: 'integer', isIndex: true},
      {name: 'Order', type: 'integer'},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
      {name: 'StepDescTextMapHash', type: 'integer', isIndex: true},
      {name: 'GuideTipsTextMapHash', type: 'integer', isIndex: true}
    ]
  },
  LoadingTipsExcelConfigData: <SchemaTable> {
    name: 'LoadingTipsExcelConfigData',
    jsonFile: './ExcelBinOutput/LoadingTipsExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'TipsTitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'TipsDescTextMapHash', type: 'integer', isIndex: true},
      {name: 'StageId', type: 'string', isIndex: true},
      {name: 'MinLevel', type: 'integer', isIndex: true},
    ]
  },
  LoadingSituationExcelConfigData: <SchemaTable> {
    name: 'LoadingSituationExcelConfigData',
    jsonFile: './ExcelBinOutput/LoadingSituationExcelConfigData.json',
    columns: [
      {name: 'StageId', type: 'integer', isPrimary: true},
      {name: 'LoadingSituationType', type: 'string', isIndex: true},
      {name: 'AreaTerrainType', type: 'string', isIndex: true},
    ]
  },
  ReminderExcelConfigData: <SchemaTable> {
    name: 'ReminderExcelConfigData',
    jsonFile: './ExcelBinOutput/ReminderExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'SpeakerTextMapHash', type: 'integer', isIndex: true},
      {name: 'ContentTextMapHash', type: 'integer', isIndex: true},
      {name: 'NextReminderId', type: 'integer', isIndex: true},
    ]
  },
  MaterialExcelConfigData: <SchemaTable> {
    name: 'MaterialExcelConfigData',
    jsonFile: './ExcelBinOutput/MaterialExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'InteractionTitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'EffectDescTextMapHash', type: 'integer', isIndex: true},
      {name: 'SpecialDescTextMapHash', type: 'integer', isIndex: true},
      {name: 'TypeDescTextMapHash', type: 'integer', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
      {name: 'Icon', type: 'string'},
      {name: 'ItemType', type: 'string'},
      {name: 'RankLevel', type: 'string'},
    ]
  },
  Relation_FurnitureToMaterial: <SchemaTable> {
    name: 'Relation_FurnitureToMaterial',
    jsonFile: './ExcelBinOutput/MaterialExcelConfigData.json',
    columns: [
      {name: 'FurnitureId', type: 'integer', isPrimary: true},
      {name: 'MaterialId', type: 'integer'},
    ],
    customRowResolve: (row: MaterialExcelConfigData) => {
      if (row.MaterialType === 'MATERIAL_FURNITURE_FORMULA' && row.ItemUse && row.ItemUse.length) {
        let furnitureId = row.ItemUse.find(x => x.UseOp === 'ITEM_USE_UNLOCK_FURNITURE_FORMULA').UseParam.find(x => !!x);
        return furnitureId ? [{FurnitureId: furnitureId, MaterialId: row.Id}] : [];
      } else {
        return [];
      }
    }
  },
  Relation_FurnitureSuiteToMaterial: <SchemaTable> {
    name: 'Relation_FurnitureSuiteToMaterial',
    jsonFile: './ExcelBinOutput/MaterialExcelConfigData.json',
    columns: [
      {name: 'FurnitureSuiteId', type: 'integer', isPrimary: true},
      {name: 'MaterialId', type: 'integer'},
    ],
    customRowResolve: (row: MaterialExcelConfigData) => {
      if (row.MaterialType === 'MATERIAL_FURNITURE_SUITE_FORMULA' && row.ItemUse && row.ItemUse.length) {
        let furnitureSuiteId = row.ItemUse.find(x => x.UseOp === 'ITEM_USE_UNLOCK_FURNITURE_SUITE').UseParam.find(x => !!x);
        return furnitureSuiteId ? [{FurnitureSuiteId: furnitureSuiteId, MaterialId: row.Id}] : [];
      } else {
        return [];
      }
    }
  },
  Relation_CodexToMaterial: <SchemaTable> {
    name: 'Relation_CodexToMaterial',
    jsonFile: './ExcelBinOutput/MaterialExcelConfigData.json',
    columns: [
      {name: 'CodexId', type: 'integer', isPrimary: true},
      {name: 'MaterialId', type: 'integer'},
    ],
    customRowResolve: (row: MaterialExcelConfigData) => {
      if (row.ItemUse && row.ItemUse.length) {
        let codexId = row.ItemUse.find(x => x.UseOp === 'ITEM_USE_UNLOCK_CODEX')?.UseParam.find(x => !!x);
        return codexId ? [{CodexId: codexId, MaterialId: row.Id}] : [];
      } else {
        return [];
      }
    }
  },
  MaterialSourceDataExcelConfigData: <SchemaTable> {
    name: 'MaterialSourceDataExcelConfigData',
    jsonFile: './ExcelBinOutput/MaterialSourceDataExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ]
  },
  DailyTaskExcelConfigData: <SchemaTable> {
    name: 'DailyTaskExcelConfigData',
    jsonFile: './ExcelBinOutput/DailyTaskExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'CityId', type: 'integer', isIndex: true},
      {name: 'PoolId', type: 'integer', isIndex: true},
      {name: 'QuestId', type: 'integer', isIndex: true},
      {name: 'TitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescriptionTextMapHash', type: 'integer', isIndex: true},
      {name: 'TargetTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  NpcFirstMetExcelConfigData: <SchemaTable> {
    name: 'NpcFirstMetExcelConfigData',
    jsonFile: './ExcelBinOutput/NpcFirstMetExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'AvatarId', type: 'integer', isIndex: true},
      {name: 'AvatarDescriptionTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  AvatarExcelConfigData: <SchemaTable> {
    name: 'AvatarExcelConfigData',
    jsonFile: './ExcelBinOutput/AvatarExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
      {name: 'WeaponType', type: 'string', isIndex: true},
      {name: 'BodyType', type: 'string', isIndex: true},
      {name: 'IconName', type: 'string'},
      {name: 'SideIconName', type: 'string'},
    ]
  },
  RewardExcelConfigData: <SchemaTable> {
    name: 'RewardExcelConfigData',
    jsonFile: './ExcelBinOutput/RewardExcelConfigData.json',
    columns: [
      {name: 'RewardId', type: 'integer', isPrimary: true},
    ]
  },
  HomeWorldFurnitureExcelConfigData: <SchemaTable> {
    name: 'HomeWorldFurnitureExcelConfigData',
    jsonFile: './ExcelBinOutput/HomeWorldFurnitureExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
      {name: 'SurfaceType', type: 'string', isIndex: true},
      {name: 'GridStyle', type: 'integer'},
      {name: 'Comfort', type: 'integer'},
      {name: 'StackLimit', type: 'integer'},
      {name: 'Cost', type: 'integer'},
      {name: 'Rank', type: 'integer', isIndex: true},
      {name: 'RankLevel', type: 'integer', isIndex: true},
      {name: 'ItemType', type: 'string', isIndex: true},
    ]
  },
  HomeWorldFurnitureTypeExcelConfigData: <SchemaTable> {
    name: 'HomeWorldFurnitureTypeExcelConfigData',
    jsonFile: './ExcelBinOutput/HomeWorldFurnitureTypeExcelConfigData.json',
    columns: [
      {name: 'TypeId', type: 'integer', isPrimary: true},
      {name: 'TypeNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'TypeName2TextMapHash', type: 'integer', isIndex: true},
      {name: 'TabIcon', type: 'integer'},
      {name: 'SceneType', type: 'string'},
    ]
  },
  HomeWorldEventExcelConfigData: <SchemaTable> {
    name: 'HomeWorldEventExcelConfigData',
    jsonFile: './ExcelBinOutput/HomeWorldEventExcelConfigData.json',
    columns: [
      {name: 'EventId', type: 'integer', isPrimary: true},
      {name: 'EventType', type: 'string', isIndex: true},
      {name: 'AvatarId', type: 'integer', isIndex: true},
      {name: 'TalkId', type: 'integer', isIndex: true},
      {name: 'RewardId', type: 'integer', isIndex: true},
      {name: 'FurnitureSuiteId', type: 'integer', isIndex: true},
    ]
  },
  HomeWorldNPCExcelConfigData: <SchemaTable> {
    name: 'HomeWorldNPCExcelConfigData',
    jsonFile: './ExcelBinOutput/HomeWorldNPCExcelConfigData.json',
    columns: [
      {name: 'FurnitureId', type: 'integer', isPrimary: true},
      {name: 'AvatarId', type: 'string', isIndex: true},
      {name: 'NpcId', type: 'integer', isIndex: true},
      {name: 'ShowNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  ReputationQuestExcelConfigData: <SchemaTable> {
    name: 'ReputationQuestExcelConfigData',
    jsonFile: './ExcelBinOutput/ReputationQuestExcelConfigData.json',
    columns: [
      {name: 'ParentQuestId', type: 'integer', isPrimary: true},
      {name: 'CityId', type: 'integer', isIndex: true},
      {name: 'RewardId', type: 'integer'},
      {name: 'TitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'Order', type: 'integer'},
    ]
  },
  CityConfigData: <SchemaTable> {
    name: 'CityConfigData',
    jsonFile: './ExcelBinOutput/CityConfigData.json',
    columns: [
      {name: 'CityId', type: 'integer', isPrimary: true},
      {name: 'CityNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'CityGoddnessNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'CityGoddnessDescTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  FurnitureSuiteExcelConfigData: <SchemaTable> {
    name: 'FurnitureSuiteExcelConfigData',
    jsonFile: './ExcelBinOutput/FurnitureSuiteExcelConfigData.json',
    columns: [
      {name: 'SuiteId', type: 'integer', isPrimary: true},
      {name: 'SuiteNameText', type: 'integer', isIndex: true},
    ]
  },
  FurnitureMakeExcelConfigData: <SchemaTable> {
    name: 'FurnitureMakeExcelConfigData',
    jsonFile: './ExcelBinOutput/FurnitureMakeExcelConfigData.json',
    columns: [
      {name: 'FurnitureItemId', type: 'integer', isIndex: true},
      {name: 'ConfigId', type: 'integer', isIndex: true},
    ]
  },
  BooksCodexExcelConfigData: <SchemaTable> {
    name: 'BooksCodexExcelConfigData',
    jsonFile: './ExcelBinOutput/BooksCodexExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'MaterialId', type: 'integer', isIndex: true},
    ]
  },
  BookSuitExcelConfigData: <SchemaTable> {
    name: 'BookSuitExcelConfigData',
    jsonFile: './ExcelBinOutput/BookSuitExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'SuitNameTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  LocalizationExcelConfigData: <SchemaTable> {
    name: 'LocalizationExcelConfigData',
    jsonFile: './ExcelBinOutput/LocalizationExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'AssetType', type: 'string', isIndex: true},
      {name: 'ScPath', type: 'string', isIndex: true},
      {name: 'TcPath', type: 'string', isIndex: true},
      {name: 'EnPath', type: 'string', isIndex: true},
      {name: 'KrPath', type: 'string', isIndex: true},
      {name: 'JpPath', type: 'string', isIndex: true},
      {name: 'EsPath', type: 'string', isIndex: true},
      {name: 'FrPath', type: 'string', isIndex: true},
      {name: 'IdPath', type: 'string', isIndex: true},
      {name: 'PtPath', type: 'string', isIndex: true},
      {name: 'RuPath', type: 'string', isIndex: true},
      {name: 'ThPath', type: 'string', isIndex: true},
      {name: 'ViPath', type: 'string', isIndex: true},
      {name: 'DePath', type: 'string', isIndex: true},
      {name: 'TrPath', type: 'string', isIndex: true},
      {name: 'ItPath', type: 'string', isIndex: true},
    ]
  },
  DocumentExcelConfigData: <SchemaTable> {
    name: 'DocumentExcelConfigData',
    jsonFile: './ExcelBinOutput/DocumentExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'ContentLocalizedId', type: 'integer', isIndex: true},
      {name: 'AltContentLocalizationId_0', type: 'integer', isIndex: true, resolve: 'AltContentLocalizedIds[0]'},
      {name: 'TitleTextMapHash', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      NHNENGFHDEG: 'AltContentLocalizedQuestConds',
      HGHPAKBJLMN: 'AltContentLocalizedIds',
    }
  },
  ReliquaryExcelConfigData: <SchemaTable> {
    name: 'ReliquaryExcelConfigData',
    jsonFile: './ExcelBinOutput/ReliquaryExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'SetId', type: 'integer', isIndex: true},
      {name: 'EquipType', type: 'string', isIndex: true},
      {name: 'StoryId', type: 'integer', isIndex: true}
    ]
  },
  ReliquaryCodexExcelConfigData: <SchemaTable> {
    name: 'ReliquaryCodexExcelConfigData',
    jsonFile: './ExcelBinOutput/ReliquaryCodexExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'SuitId', type: 'integer', isIndex: true},
    ]
  },
  ReliquarySetExcelConfigData: <SchemaTable> {
    name: 'ReliquarySetExcelConfigData',
    jsonFile: './ExcelBinOutput/ReliquarySetExcelConfigData.json',
    columns: [
      {name: 'SetId', type: 'integer', isPrimary: true},
    ]
  },
  WeaponExcelConfigData: <SchemaTable> {
    name: 'WeaponExcelConfigData',
    jsonFile: './ExcelBinOutput/WeaponExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'WeaponType', type: 'integer', isIndex: true},
      {name: 'StoryId', type: 'integer', isIndex: true}
    ]
  },
  WeaponCodexExcelConfigData: <SchemaTable> {
    name: 'WeaponCodexExcelConfigData',
    jsonFile: './ExcelBinOutput/WeaponCodexExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'WeaponId', type: 'integer', isIndex: true},
    ]
  },
  AchievementExcelConfigData: <SchemaTable> {
    name: 'AchievementExcelConfigData',
    jsonFile: './ExcelBinOutput/AchievementExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'TitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
      {name: 'Ps5TitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'PreStageAchievementId', type: 'integer', isIndex: true},
      {name: 'FinishRewardId', type: 'integer', isIndex: true},
    ]
  },
  AchievementGoalExcelConfigData: <SchemaTable> {
    name: 'AchievementGoalExcelConfigData',
    jsonFile: './ExcelBinOutput/AchievementGoalExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'FinishRewardId', type: 'integer', isIndex: true},
    ]
  },


  MonsterExcelConfigData: <SchemaTable> {
    name: 'MonsterExcelConfigData',
    jsonFile: './ExcelBinOutput/MonsterExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'Type', type: 'string', isIndex: true},
      {name: 'DescribeId', type: 'integer', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'SecurityLevel', type: 'string', isIndex: true},
      {name: 'VisionLevel', type: 'string', isIndex: true},
    ]
  },
  MonsterDescribeExcelConfigData: <SchemaTable> {
    name: 'MonsterDescribeExcelConfigData',
    jsonFile: './ExcelBinOutput/MonsterDescribeExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NameTextMapHash', type: 'decimal', isIndex: true},
      {name: 'TitleId', type: 'integer', isIndex: true},
      {name: 'SpecialNameLabId', type: 'integer', isIndex: true},
    ]
  },
  MonsterSpecialNameExcelConfigData: <SchemaTable> {
    name: 'MonsterSpecialNameExcelConfigData',
    jsonFile: './ExcelBinOutput/MonsterSpecialNameExcelConfigData.json',
    columns: [
      {name: 'SpecialNameId', type: 'integer', isPrimary: true},
      {name: 'SpecialNameLabId', type: 'integer', isIndex: true},
      {name: 'SpecialNameTextMapHash', type: 'decimal', isIndex: true},
    ]
  },
  MonsterTitleExcelConfigData: <SchemaTable> {
    name: 'MonsterTitleExcelConfigData',
    jsonFile: './ExcelBinOutput/MonsterTitleExcelConfigData.json',
    columns: [
      {name: 'TitleId', type: 'integer', isPrimary: true},
      {name: 'TitleNameTextMapHash', type: 'decimal', isIndex: true},
    ]
  },

  AvatarCodexExcelConfigData: <SchemaTable> {
    name: 'AvatarCodexExcelConfigData',
    jsonFile: './ExcelBinOutput/AvatarCodexExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'SortFactor', type: 'integer', isIndex: true},
      {name: 'AvatarId', type: 'integer', isIndex: true},
    ]
  },
  AvatarFlycloakExcelConfigData: <SchemaTable> {
    name: 'AvatarFlycloakExcelConfigData',
    jsonFile: './ExcelBinOutput/AvatarFlycloakExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
      {name: 'MaterialId', type: 'integer', isIndex: true},
    ]
  },
  AvatarCostumeExcelConfigData: <SchemaTable> {
    name: 'AvatarCostumeExcelConfigData',
    jsonFile: './ExcelBinOutput/AvatarCostumeExcelConfigData.json',
    columns: [
      {name: 'SkinId', type: 'integer', isPrimary: true},
      {name: 'IndexId', type: 'integer', isIndex: true},
      {name: 'NameTextMapHash', type: 'decimal', isIndex: true},
      {name: 'DescTextMapHash', type: 'decimal', isIndex: true},
      {name: 'ItemId', type: 'integer', isIndex: true},
      {name: 'CharacterId', type: 'integer', isIndex: true},
      {name: 'Quality', type: 'integer', isIndex: true},
    ]
  },
  GCGTalkExcelConfigData: <SchemaTable> {
    name: 'GCGTalkExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGTalkExcelConfigData.json',
    columns: [
      {name: 'GameId', type: 'integer', isPrimary: true},
      {name: 'HappyTalkId', type: 'integer', isIndex: true},
      {name: 'SadTalkId', type: 'integer', isIndex: true},
      {name: 'ToughTalkId', type: 'integer', isIndex: true},
      {name: 'ElementBurstTalkId', type: 'integer', isIndex: true},
      {name: 'HighHealthTalkId', type: 'integer', isIndex: true},
      {name: 'HighHealthConfigId', type: 'integer', isIndex: true},
      {name: 'LowHealthTalkId', type: 'integer', isIndex: true},
      {name: 'LowHealthConfigId', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      ElementBrustTalkId: 'ElementBurstTalkId'
    }
  },
  GCGTalkDetailExcelConfigData: <SchemaTable> {
    name: 'GCGTalkDetailExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGTalkDetailExcelConfigData.json',
    columns: [
      {name: 'TalkDetailId', type: 'integer', isPrimary: true},
      {name: 'TalkDetailIconId', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      OKFHEMAKLNN: 'TalkContentTextMapHash',
      CPBEMEKHDCO: 'TalkDetailIconId',
      PGFENJJPNBG: 'TalkEmoji',
    },
    singularize: ['TalkDetailIconId']
  },
  GCGTalkDetailIconExcelConfigData: <SchemaTable> {
    name: 'GCGTalkDetailIconExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGTalkDetailIconExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'Type', type: 'string', isIndex: true},
    ]
  },
  GCGGameExcelConfigData: <SchemaTable> {
    name: 'GCGGameExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGGameExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'RuleId', type: 'integer', isIndex: true},
      {name: 'CardGroupId', type: 'integer', isIndex: true},
      {name: 'EnemyCardGroupId', type: 'integer', isIndex: true},
      {name: 'GameType', type: 'string', isIndex: true},
    ],
    normalizeFixFields: {
      MBJIAMCDJLJ: 'EnemyNameTextMapHash',
    }
  },
  GCGBossLevelExcelConfigData: <SchemaTable> {
    name: 'GCGBossLevelExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGBossLevelExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NormalLevelId', type: 'integer', isIndex: true},
      {name: 'HardLevelId', type: 'integer', isIndex: true},
      {name: 'UnlockGcgLevel', type: 'integer', isIndex: true},
      {name: 'UnlockTipTextMapHash', type: 'integer', isIndex: true},
      {name: 'NpcId', type: 'integer', isIndex: true},
      {name: 'MonsterId', type: 'integer', isIndex: true},
      {name: 'MonsterTitleTextMapHash', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      JECHMICDJBE: 'NpcId',
      OAPOAACBKHJ: 'MonsterTitleTextMapHash',
      LKOILEBONPH: 'UnlockGcgLevel',
      AIIDKAAKFNL: 'UnlockTipTextMapHash',
    }
  },
  GCGGameRewardExcelConfigData: <SchemaTable> {
    name: 'GCGGameRewardExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGGameRewardExcelConfigData.json',
    columns: [
      {name: 'LevelId', type: 'integer', isPrimary: true},
      {name: 'LevelNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'IntroTextMapHash', type: 'integer', isIndex: true},
      {name: 'GroupId', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      ILOGAIHBHNE: 'IntroTextMapHash',
      CNMAEJMKIJG: 'TalkDetailIconId',
      IDJCJFFHJEE: 'ObjectiveTextMapHashList',
    }
  },
  GCGChallengeExcelConfigData: <SchemaTable> {
    name: 'GCGChallengeExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGChallengeExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'Type', type: 'string', isIndex: true},
    ],
    normalizeFixFields: {
      MIPOKBOGHGJ: 'ParamTarget'
    }
  },
  GCGTutorialTextExcelConfigData: <SchemaTable> {
    name: 'GCGTutorialTextExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGTutorialTextExcelConfigData.json',
    columns: [
      {name: 'TutorialTextId', type: 'integer', isPrimary: true},
      {name: 'TutorialTextMapHash', type: 'integer', isIndex: true}
    ],
    normalizeFixFields: {
      LFJMKDDJPNH: 'TutorialTextId',
      AFBOPFJIDKP: 'TutorialTextMapHash'
    }
  },
  GCGRuleExcelConfigData: <SchemaTable> {
    name: 'GCGRuleExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGRuleExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ]
  },
  GCGRuleTextExcelConfigData: <SchemaTable> {
    name: 'GCGRuleTextExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGRuleTextExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'TitleTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  GCGRuleTextDetailExcelConfigData: <SchemaTable> {
    name: 'GCGRuleTextDetailExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGRuleTextDetailExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'TitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'ContentTextMapHash', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      IFJNLHHKLME: 'Icon'
    }
  },
  GCGLevelLockExcelConfigData: <SchemaTable> {
    name: 'GCGLevelLockExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGLevelLockExcelConfigData.json',
    columns: [
      {name: 'LevelId', type: 'integer', isPrimary: true},
      {name: 'UnlockLevel', type: 'integer', isIndex: true},
      {name: 'UnlockMainQuestId', type: 'integer', isIndex: true},
      {name: 'UnlockDescTextMapHash', type: 'integer', isIndex: true},
      {name: 'QuestTitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'QuestDescTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  GcgOtherLevelExcelConfigData: <SchemaTable> {
    name: 'GcgOtherLevelExcelConfigData',
    jsonFile: './ExcelBinOutput/GcgOtherLevelExcelConfigData.json',
    columns: [
      {name: 'LevelId', type: 'integer', isPrimary: true},
    ]
  },
  GCGQuestLevelExcelConfigData: <SchemaTable> {
    name: 'GCGQuestLevelExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGQuestLevelExcelConfigData.json',
    columns: [
      {name: 'LevelId', type: 'integer', isPrimary: true},
      {name: 'QuestId', type: 'integer', isIndex: true},
    ]
  },
  GCGWorldLevelExcelConfigData: <SchemaTable> {
    name: 'GCGWorldLevelExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGWorldLevelExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NpcId', type: 'integer', isIndex: true},
      {name: 'LevelId', type: 'integer', isIndex: true},
      {name: 'LevelTitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'MapDescTextMapHash', type: 'integer', isIndex: true},
      {name: 'TalkId', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      ILOGAIHBHNE: 'MapDescTextMapHash'
    }
  },
  GCGWeekLevelExcelConfigData: <SchemaTable> {
    name: 'GCGWeekLevelExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGWeekLevelExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NpcId', type: 'integer', isIndex: true},
      {name: 'NpcType', type: 'string', isIndex: true},
      {name: 'OpenQuestId', type: 'integer', isIndex: true},
    ]
  },
  GCGCardExcelConfigData: <SchemaTable> {
    name: 'GCGCardExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGCardExcelConfigData.json',
    columns: [
      {name: 'CardType', type: 'string', isIndex: true},
      {name: 'ChooseTargetType', type: 'string', isIndex: true},
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      PMEAKELAHJJ: 'StateBuffType',
      BBNNKHIKEEB: 'PersistEffectType',
      EJLBDGICGCA: 'TokenIconToShow',
      MJEFNLJLBIJ: 'ElementHintType',
      IKKGAPALFCH: 'TokenDescId'
    }
  },
  GCGCardFaceExcelConfigData: <SchemaTable> {
    name: 'GCGCardFaceExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGCardFaceExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'ItemId', type: 'integer', isIndex: true},
      {name: 'CardId', type: 'integer', isIndex: true},
      {name: 'ShopGoodId', type: 'integer', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  GCGCardViewExcelConfigData: <SchemaTable> {
    name: 'GCGCardViewExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGCardViewExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ],
    normalizeFixFields: {
      GLCONCDPNCI: 'ImagePath',
      DEPNICHKLNH: 'SpinePaths',
    }
  },
  GCGCharExcelConfigData: <SchemaTable> {
    name: 'GCGCharExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGCharExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
    ],
  },
  GCGCharacterLevelExcelConfigData: <SchemaTable> {
    name: 'GCGCharacterLevelExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGCharacterLevelExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NpcId', type: 'integer', isIndex: true},
      {name: 'AvatarId', type: 'integer', isIndex: true},
      {name: 'NormalLevelId', type: 'integer', isIndex: true},
      {name: 'HardLevelId', type: 'integer', isIndex: true},
      {name: 'WinNormalLevelTalkId', type: 'integer', isIndex: true},
      {name: 'LoseNormalLevelTalkId', type: 'integer', isIndex: true},
      {name: 'WinHardLevelTalkId', type: 'integer', isIndex: true},
      {name: 'LoseHardLevelTalkId', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      NIDONEPDAOP: 'WinNormalLevelTalkId',
      HEGBPOCJBCF: 'LoseNormalLevelTalkId',
      GLAAKALKCEJ: 'WinHardLevelTalkId',
      FMDNIFOPMGP: 'LoseHardLevelTalkId',
    }
  },
  Relation_GCGCharacterLevel: <SchemaTable> {
    name: 'Relation_GCGCharacterLevel',
    jsonFile: './ExcelBinOutput/GCGCharacterLevelExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isIndex: true},
      {name: 'LevelId', type: 'integer', isIndex: true},
    ],
    customRowResolve: (row: GCGCharacterLevelExcelConfigData) => {
      let ret = [];
      if (row.NormalLevelId) {
        ret.push({Id: row.Id, LevelId: row.NormalLevelId});
      }
      if (row.HardLevelId) {
        ret.push({Id: row.Id, LevelId: row.HardLevelId});
      }
      if (row.NormalLevelList && row.NormalLevelList.length) {
        for (let level of row.NormalLevelList) {
          if (level.LevelId !== row.NormalLevelId) {
            ret.push({Id: row.Id, LevelId: level.LevelId });
          }
        }
      }
      return ret;
    }
  },
  GCGElementReactionExcelConfigData: <SchemaTable> {
    name: 'GCGElementReactionExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGElementReactionExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'ElementType1', type: 'string', isIndex: true},
      {name: 'ElementType2', type: 'string', isIndex: true},
      {name: 'SkillId', type: 'integer', isIndex: true},
    ]
  },
  GCGSkillExcelConfigData: <SchemaTable> {
    name: 'GCGSkillExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGSkillExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  GCGChooseExcelConfigData: <SchemaTable> {
    name: 'GCGChooseExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGChooseExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'CardType', type: 'string', isIndex: true},
      {name: 'TargetCamp', type: 'string', isIndex: true},
      {name: 'ChooseType', type: 'string', isIndex: true},
    ],
    normalizeFixFields: {
      HMHHABHDBAG: 'ChooseTextMapHash',
      FABKBPGPHII: 'ChooseType',
    }
  },
  GCGDeckExcelConfigData: <SchemaTable> {
    name: 'GCGDeckExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGDeckExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ]
  },
  GCGDeckCardExcelConfigData: <SchemaTable> {
    name: 'GCGDeckCardExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGDeckCardExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ],
    normalizeFixFields: {
      GKHGDCBALPE: 'CardFaceIdList',
      PEBMEKJKGOB: 'StoryContextTextMapHash',
      FLLIMNKBNNC: 'SourceTextMapHash',
    }
  },
  GCGProficiencyRewardExcelConfigData: <SchemaTable> {
    name: 'GCGProficiencyRewardExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGProficiencyRewardExcelConfigData.json',
    columns: [
      {name: 'CardId', type: 'integer', isPrimary: true},
    ]
  },
  GCGDeckFaceLinkExcelConfigData: <SchemaTable> {
    name: 'GCGDeckFaceLinkExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGDeckFaceLinkExcelConfigData.json',
    columns: [
      {name: 'CardId', type: 'integer', isIndex: true},
      {name: 'DeckCardId', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      KFDMIAPDCEG: 'CardId',
      AGBEBLBIMGD: 'DeckCardId'
    }
  },
  GCGTokenDescConfigData: <SchemaTable> {
    name: 'GCGTokenDescConfigData',
    jsonFile: './ExcelBinOutput/GCGTokenDescConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  GCGSkillTagExcelConfigData: <SchemaTable> {
    name: 'GCGSkillTagExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGSkillTagExcelConfigData.json',
    columns: [
      {name: 'Type', type: 'string', isPrimary: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'KeywordId', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      BNKFFFCCNGF: 'KeywordId',
    }
  },
  GCGTagExcelConfigData: <SchemaTable> {
    name: 'GCGTagExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGTagExcelConfigData.json',
    columns: [
      {name: 'Type', type: 'string', isPrimary: true},
      {name: 'CategoryType', type: 'string', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      PHMOLEPKEIB: 'CategoryType',
    },
    singularize: ['CategoryType']
  },
  GCGKeywordExcelConfigData: <SchemaTable> {
    name: 'GCGKeywordExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGKeywordExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'TitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  GCGCostExcelConfigData: <SchemaTable> {
    name: 'GCGCostExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGCostExcelConfigData.json',
    columns: [
      {name: 'Type', type: 'string', isPrimary: true},
      {name: 'KeywordId', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      BNKFFFCCNGF: 'KeywordId',
    }
  },
  GCGDeckStorageExcelConfigData: <SchemaTable> { // Configuration for deck-saving slots for player level rewards
    name: 'GCGDeckStorageExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGDeckStorageExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'UnlockCond', type: 'string', isIndex: true},
      {name: 'UnlockParam', type: 'integer', isIndex: true},
      {name: 'SourceTextMapHash', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      KPINCGJPICF: 'SourceTextMapHash',
    }
  },
  GCGDeckBackExcelConfigData: <SchemaTable> { // "Card Back" items, e.g. [[Dandelion_Seed_(Card_Back)]] or [[Legend]]
    name: 'GCGDeckBackExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGDeckBackExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'ItemId', type: 'integer', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
      {name: 'Order', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      DameTextMapHash: 'NameTextMapHash',
    }
  },
  GCGDeckFieldExcelConfigData: <SchemaTable> { // "Card Box" items, e.g. [[Liyue_(Card_Box)]]
    name: 'GCGDeckFieldExcelConfigData',
    jsonFile: './ExcelBinOutput/GCGDeckFieldExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'ItemId', type: 'integer', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
      {name: 'SourceTextMapHash', type: 'integer', isIndex: true},
      {name: 'Order', type: 'integer', isIndex: true},
      {name: 'BattleTableId', type: 'integer', isIndex: true},
      {name: 'DiceTableId', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      KPINCGJPICF: 'SourceTextMapHash',
    }
  },
  FettersExcelConfigData: <SchemaTable> {
    name: 'FettersExcelConfigData',
    jsonFile: './ExcelBinOutput/FettersExcelConfigData.json',
    columns: [
      {name: 'Type', type: 'integer', isIndex: true},
      {name: 'VoiceTitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'VoiceFileTextMapHash', type: 'integer', isIndex: true},
      {name: 'VoiceTitleLockedTextMapHash', type: 'integer', isIndex: true},
      {name: 'FetterId', type: 'integer', isPrimary: true},
      {name: 'AvatarId', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      IsHiden: 'IsHidden'
    }
  },
  TutorialExcelConfigData: <SchemaTable> {
    name: 'TutorialExcelConfigData',
    jsonFile: './ExcelBinOutput/TutorialExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
    ],
  },
  TutorialDetailExcelConfigData: <SchemaTable> {
    name: 'TutorialDetailExcelConfigData',
    jsonFile: './ExcelBinOutput/TutorialDetailExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'DescriptTextMapHash', type: 'integer', isIndex: true},
    ],
  },
  TutorialCatalogExcelConfigData: <SchemaTable> {
    name: 'TutorialCatalogExcelConfigData',
    jsonFile: './ExcelBinOutput/TutorialCatalogExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'PushTipsId', type: 'integer', isIndex: true},
      {name: 'TitleTextMapHash', type: 'integer', isIndex: true},
    ],
  },

  PushTipsConfigData: <SchemaTable> {
    name: 'PushTipsConfigData',
    jsonFile: './ExcelBinOutput/PushTipsConfigData.json',
    columns: [
      {name: 'PushTipsId', type: 'integer', isPrimary: true},
      {name: 'PushTipsType', type: 'string', isIndex: true},
      {name: 'CodexType', type: 'string', isIndex: true},
      {name: 'TitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'SubtitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'TutorialId', type: 'integer', isIndex: true},
      {name: 'GroupId', type: 'integer', isIndex: true},
    ]
  },
  PushTipsCodexExcelConfigData: <SchemaTable> {
    name: 'PushTipsCodexExcelConfigData',
    jsonFile: './ExcelBinOutput/PushTipsCodexExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'PushTipId', type: 'integer', isIndex: true},
      {name: 'SortOrder', type: 'integer', isIndex: true},
    ]
  },
  ViewCodexExcelConfigData: <SchemaTable> {
    name: 'ViewCodexExcelConfigData',
    jsonFile: './ExcelBinOutput/ViewCodexExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'SceneId', type: 'integer', isIndex: true},
      {name: 'GroupId', type: 'integer', isIndex: true},
      {name: 'ConfigId', type: 'integer', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
      {name: 'CityId', type: 'integer', isIndex: true},
      {name: 'WorldAreaId', type: 'integer', isIndex: true},
      {name: 'SortOrder', type: 'integer', isIndex: true},
    ]
  },
  WorldAreaConfigData: <SchemaTable> {
    name: 'WorldAreaConfigData',
    jsonFile: './ExcelBinOutput/WorldAreaConfigData.json',
    columns: [
      {name: 'ElementType', type: 'string', isIndex: true},
      {name: 'TerrainType', type: 'string', isIndex: true},
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'SceneId', type: 'integer', isIndex: true},
      {name: 'AreaType', type: 'string', isIndex: true},
      {name: 'AreaNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'TowerPointId', type: 'integer', isIndex: true},
    ]
  },
  NewActivityExcelConfigData: <SchemaTable> {
    name: 'NewActivityExcelConfigData',
    jsonFile: './ExcelBinOutput/NewActivityExcelConfigData.json',
    columns: [
      {name: 'ActivityId', type: 'integer', isPrimary: true},
      {name: 'ActivityType', type: 'string', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  NewActivityEntryConfigData: <SchemaTable> {
    name: 'NewActivityEntryConfigData',
    jsonFile: './ExcelBinOutput/NewActivityEntryConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'ActivityType', type: 'string', isIndex: true},
      {name: 'TabNameTextMapHash', type: 'integer', isIndex: true},
    ]
  },
  FetterInfoExcelConfigData: <SchemaTable> {
    name: 'FetterInfoExcelConfigData',
    jsonFile: './ExcelBinOutput/FetterInfoExcelConfigData.json',
    columns: [
      {name: 'FetterId', type: 'integer', isPrimary: true},
      {name: 'AvatarId', type: 'integer', isIndex: true},
      {name: 'AvatarNativeTextMapHash', type: 'integer', isIndex: true},
      {name: 'AvatarVisionBeforTextMapHash', type: 'integer', isIndex: true},
      {name: 'AvatarConstellationBeforTextMapHash', type: 'integer', isIndex: true},
      {name: 'AvatarTitleTextMapHash', type: 'integer', isIndex: true},
      {name: 'AvatarDetailTextMapHash', type: 'integer', isIndex: true},
      {name: 'AvatarAssocType', type: 'string', isIndex: true},
      {name: 'CvChineseTextMapHash', type: 'integer', isIndex: true},
      {name: 'CvJapaneseTextMapHash', type: 'integer', isIndex: true},
      {name: 'CvEnglishTextMapHash', type: 'integer', isIndex: true},
      {name: 'CvKoreanTextMapHash', type: 'integer', isIndex: true},
      {name: 'AvatarVisionAfterTextMapHash', type: 'integer', isIndex: true},
      {name: 'AvatarConstellationAfterTextMapHash', type: 'integer', isIndex: true},
    ],
    normalizeFixFields: {
      'AvatarVisionBeforText': 'AvatarVisionBeforeText',
      'AvatarConstellationBeforText': 'AvatarConstellationBeforeText',
    }
  },
  DungeonExcelConfigData: <SchemaTable> {
    name: 'DungeonExcelConfigData',
    jsonFile: './ExcelBinOutput/DungeonExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'Type', type: 'string', isIndex: true},
      {name: 'SubType', type: 'string', isIndex: true},
      {name: 'InvolveType', type: 'string', isIndex: true},
      {name: 'SettleUIType', type: 'string', isIndex: true},
      {name: 'StateType', type: 'string', isIndex: true},
      {name: 'PlayType', type: 'string', isIndex: true},
      {name: 'NameTextMapHash', type: 'integer', isIndex: true},
      {name: 'DisplayNameTextMapHash', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
      {name: 'SceneId', type: 'integer', isIndex: true},
      {name: 'ShowLevel', type: 'integer', isIndex: true},
      {name: 'LimitLevel', type: 'integer', isIndex: true},
      {name: 'GearDescTextMapHash', type: 'integer', isIndex: true},
      {name: 'CityId', type: 'integer', isIndex: true},
      {name: 'PassRewardPreviewId', type: 'integer', isIndex: true},
      {name: 'FirstPassRewardPreviewId', type: 'integer', isIndex: true},
    ]
  },
  DungeonPassExcelConfigData: <SchemaTable>{
    name: 'DungeonPassExcelConfigData',
    jsonFile: './ExcelBinOutput/DungeonPassExcelConfigData.json',
    columns: [
      { name: 'Id', type: 'integer', isPrimary: true },
      { name: 'LogicType', type: 'string', isIndex: true },
    ]
  },
  DungeonEntryExcelConfigData: <SchemaTable> {
    name: 'DungeonEntryExcelConfigData',
    jsonFile: './ExcelBinOutput/DungeonEntryExcelConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'Type', type: 'string', isIndex: true},
      {name: 'DungeonEntryId', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
      {name: 'SystemOpenUiId', type: 'integer', isIndex: true},
      {name: 'RewardDataId', type: 'integer', isIndex: true},
    ]
  },
  DungeonElementChallengeExcelConfigData: <SchemaTable> {
    name: 'DungeonElementChallengeExcelConfigData',
    jsonFile: './ExcelBinOutput/DungeonElementChallengeExcelConfigData.json',
    columns: [
      {name: 'DungeonId', type: 'integer', isPrimary: true},
      {name: 'TutorialId', type: 'integer', isIndex: true},
    ]
  },
  DungeonChallengeConfigData: <SchemaTable> {
    name: 'DungeonChallengeConfigData',
    jsonFile: './ExcelBinOutput/DungeonChallengeConfigData.json',
    columns: [
      {name: 'Id', type: 'integer', isPrimary: true},
      {name: 'ChallengeType', type: 'string', isIndex: true},
      {name: 'TargetTextTemplateTextMapHash', type: 'integer', isIndex: true},
      {name: 'SubTargetTextTemplateTextMapHash', type: 'integer', isIndex: true},
      {name: 'ProgressTextTemplateTextMapHash', type: 'integer', isIndex: true},
      {name: 'SubProgressTextTemplateTextMapHash', type: 'integer', isIndex: true},
      {name: 'InterruptButtonType', type: 'string', isIndex: true},
    ]
  },
  DungeonLevelEntityConfigData: <SchemaTable> {
    name: 'DungeonLevelEntityConfigData',
    jsonFile: './ExcelBinOutput/DungeonLevelEntityConfigData.json',
    columns: [
      {name: 'ClientId', type: 'integer', isPrimary: true},
      {name: 'Id', type: 'integer', isIndex: true},
      {name: 'DescTextMapHash', type: 'integer', isIndex: true},
      {name: 'SwitchTitleTextMapHash', type: 'integer', isIndex: true},
    ]
  },
};

export function normalizeRawJson(row: any, table?: SchemaTable) {
  if (typeof row === 'undefined' || typeof row === null || typeof row !== 'object') {
    return row;
  }
  if (Array.isArray(row)) {
    return row.map(item => normalizeRawJson(item, table));
  }
  let newRow = {};
  for (let key of Object.keys(row)) {
    let originalKey = key;
    if (key.startsWith('_')) {
      key = key.slice(1);
    }
    key = ucFirst(key);
    if (!(key.length === 11 && /^[A-Z]+$/.test(key))) {
      key = key.replace(/ID/g, 'Id');
    }
    key = key.replace(/TextText/g, 'Text');
    key = key.replace(/_(\w)/g, (fm: string, g: string) => g.toUpperCase()); // snake to camel
    if (table && table.normalizeFixFields) {
      if (key in table.normalizeFixFields) {
        key = table.normalizeFixFields[key];
      }
      if (key.toUpperCase() in table.normalizeFixFields) {
        key = table.normalizeFixFields[key.toUpperCase()];
      }
    }
    newRow[key] = normalizeRawJson(row[originalKey], table);
    if (table && table.singularize && table.singularize.includes(key) && Array.isArray(newRow[key])) {
      newRow[key] = newRow[key].find(x => !!x);
    }
  }
  return newRow;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const knex = openKnex();

    async function createTable(table: SchemaTable) {
      console.log('Creating table: ' + table.name);
      if (await knex.schema.hasTable(table.name)) {
        console.log('  Table already exists - dropping and recreating...')
      }
      await knex.schema.dropTableIfExists(table.name);
      await knex.schema.createTable(table.name, function(builder) {
        for (let col of table.columns) {
          builder[col.type](col.name);
          if (col.isPrimary) {
            builder.primary([col.name]);
          } else if (col.isIndex) {
            builder.index(col.name);
          }
        }
        if (!table.customRowResolve) {
          builder.json('json_data');
        }
      }).then();
      console.log('  (done)');
    }

    function createRowPayload(table: SchemaTable, row: any, allRows: any[]): any[] {
      row = normalizeRawJson(row, table);
      if (table.customRowResolve) {
        return table.customRowResolve(row, allRows);
      } else {
        let payload = {};
        payload['json_data'] = JSON.stringify(row);
        for (let col of table.columns) {
          if (col.resolve) {
            if (typeof col.resolve === 'string') {
              payload[col.name] = resolveObjectPath(row, col.resolve);
            } else if (typeof col.resolve === 'function') {
              payload[col.name] = col.resolve(row);
            }
          } else {
            payload[col.name] = row[col.name];
          }
          if (col.defaultValue && (typeof payload[col.name] === 'undefined' || payload[col.name] === null)) {
            payload[col.name] = col.defaultValue;
          }
        }
        return [payload];
      }
    }

    async function insertAll(table: SchemaTable) {
      let timeStart = Date.now();
      console.log('Inserting data for: ' + table.name + ' from: ' + table.jsonFile);
      console.log('  Starting at ' + timeConvert(timeStart));

      const spinner = ora('Processing...').start();
      spinner.indent = 2;

      const fileContents: string = await fs.readFile(getGenshinDataFilePath(table.jsonFile), {encoding: 'utf8'});
      const json: any[] = JSON.parse(fileContents);
      const totalRows: number = json.length;

      let batch: any[] = [];
      let batchNum = 1;
      let batchMax = 200;

      async function commitBatch() {
        await knex.transaction(function(tx) {
          return knex.batchInsert(table.name, batch).transacting(tx);
        }).then();
        batch = [];
        batchNum++;
      }

      let currentRow = 1;
      for (let row of json) {
        batch.push(... createRowPayload(table, row, json));
        if (batch.length >= batchMax) {
          await commitBatch();
        }

        let percent = ((currentRow / totalRows) * 100.0) | 0;
        spinner.text = `Processed ${currentRow} rows of ${totalRows} (${percent}%) (B${batchNum})`;
        currentRow++;
      }

      if (batch.length) {
        await commitBatch();
      }

      let timeEnd = Date.now();
      spinner.succeed('Finished at ' + timeConvert(timeEnd) + ' (took '+humanTiming(timeStart, '', timeEnd, '0 seconds')+')');
      console.log('  (done)');
    }

    const optionDefinitions: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
      {name: 'run-only', alias: 'o', type: String, multiple: true, description: 'Import only the specified tables (comma-separated).', typeLabel: '<tables>'},
      {name: 'run-includes', alias: 'i', type: String, multiple: true, description: 'Import only tables whose name contains any one of the specified texts (comma-separated, case-insensitive, not a regex).', typeLabel: '<texts>'},
      {name: 'run-all-except', alias: 'e', type: String, multiple: true, description: 'Import all tables except the specified (comma-separated).', typeLabel: '<tables>'},
      {name: 'run-all', alias: 'a', type: Boolean, description: 'Import all tables.'},
      {name: 'list', alias: 'l', type: Boolean, description: 'List all table names.'},
      {name: 'help', alias: 'h', type: Boolean, description: 'Display this usage guide.'},
    ];

    const options = commandLineArgs(optionDefinitions);

    if (Object.keys(options).filter(k => k.startsWith('run')).length > 1) {
      console.error(chalk.red('\nThese options are mutually exclusive: --run-only, --run-includes, --run-all-except, or --run-all'));
      options.help = true;
    } else if (!Object.keys(options).length) {
      console.warn(chalk.yellow('\nMust specify one of: --run-only, --run-includes, --run-all-except, or --run-all'));
      options.help = true;
    }

    if (options.list) {
      console.log();
      console.log(chalk.bold.underline('Available Tables:'));
      for (let tableName of Object.keys(schema)) {
        console.log('  ' + tableName);
      }
      console.log();
      return;
    }

    if (options.help) {
      const usage = commandLineUsage([
        {
          header: 'Genshin Data Importer',
          content: 'Imports Genshin Data json into a sqlite database for this application.'
        },
        {
          header: 'Options',
          optionList: optionDefinitions
        }
      ])
      console.log(usage);
      return;
    }

    let tablesToRun: string[];

    if (options['run-all']) {
      tablesToRun = Object.keys(schema);
    } else if (options['run-all-except']) {
      let input = (options['run-all-except'] as string[]).map(s => s.split(/[,;]/g)).flat(Infinity) as string[];
      for (let table of input) {
        if (!schema.hasOwnProperty(table)) {
          console.error(chalk.red('\nNot a valid table name: ' + table + '\n'));
          return;
        }
      }
      tablesToRun = Object.keys(schema).filter(x => !input.includes(x));
    } else if (options['run-only']) {
      let input = (options['run-only'] as string[]).map(s => s.split(/[,;]/g)).flat(Infinity) as string[];
      for (let table of input) {
        if (!schema.hasOwnProperty(table)) {
          console.error(chalk.red('\nNot a valid table name: ' + table + '\n'));
          return;
        }
      }
      tablesToRun = input;
    } else if (options['run-includes']) {
      let input = (options['run-includes'] as string[]).map(s => s.split(/[,;]/g)).flat(Infinity) as string[];
      tablesToRun = [];
      for (let text of input) {
        for (let table of Object.values(schema)) {
          if (table.name.toLowerCase().includes(text.toLowerCase())) {
            tablesToRun.push(table.name);
          }
        }
      }
    } else {
      throw 'Implementation exception.';
    }

    if (!tablesToRun || !tablesToRun.length) {
      console.error(chalk.yellow('No tables selected.'));
    }

    for (let tableName of tablesToRun) {
      let table: SchemaTable = schema[tableName];
      await createTable(table);
      await insertAll(table);
      console.log('-'.repeat(90));
    }

    console.log('Shutting down...');
    await knex.destroy();
  })();
}