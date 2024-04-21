import { AvatarExcelConfigData } from '../../../../shared/types/genshin/avatar-types.ts';
import { WeaponExcelConfigData } from '../../../../shared/types/genshin/weapon-types.ts';
import { MaterialExcelConfigData } from '../../../../shared/types/genshin/material-types.ts';
import { HomeWorldFurnitureExcelConfigData, FurnitureSuiteExcelConfigData } from '../../../../shared/types/genshin/homeworld-types.ts';
import {
  GCGCardExcelConfigData, GCGCharExcelConfigData,
  GCGGameExcelConfigData,
} from '../../../../shared/types/genshin/gcg-types.ts';
import { ReadableArchiveView } from '../../../../shared/types/genshin/readable-types.ts';
import {
  ChapterCollection,
  ChapterExcelConfigData,
  MainQuestExcelConfigData,
} from '../../../../shared/types/genshin/quest-types.ts';
import { ChangeRecord, FullChangelog } from '../../../../shared/types/changelog-types.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { GenshinSchemaNames } from '../../../importer/genshin/genshin.schema.ts';
import { GenshinControl } from '../genshinControl.ts';
import { MonsterExcelConfigData } from '../../../../shared/types/genshin/monster-types.ts';
import { GCGControl, getGCGControl } from '../gcg/gcg_control.ts';
import { AchievementExcelConfigData } from '../../../../shared/types/genshin/achievement-types.ts';
import { LoadingCat, LoadingTipsExcelConfigData } from '../../../../shared/types/genshin/loading-types.ts';
import { TutorialExcelConfigData } from '../../../../shared/types/genshin/tutorial-types.ts';
import { ViewCodexExcelConfigData } from '../../../../shared/types/genshin/viewpoint-types.ts';
import { selectViewpointsByIds } from '../archive/viewpoints.ts';
import { selectLoadingTips } from '../archive/loadingTips.ts';
import { selectTutorials } from '../archive/tutorials.ts';

export type GenshinChangelogNewRecordSummary = {
  avatars: AvatarExcelConfigData[],
  weapons: WeaponExcelConfigData[],
  foods: MaterialExcelConfigData[],
  tcgItems: MaterialExcelConfigData[],
  blueprints: MaterialExcelConfigData[],
  avatarItems: MaterialExcelConfigData[],
  items: MaterialExcelConfigData[],

  furnishings: HomeWorldFurnitureExcelConfigData[],
  furnishingSets: FurnitureSuiteExcelConfigData[],
  monsters: MonsterExcelConfigData[],
  wildlife: MonsterExcelConfigData[],

  tcgCharacterCards: GCGCharExcelConfigData[],
  tcgActionCards: GCGCardExcelConfigData[],
  tcgStages: GCGGameExcelConfigData[],

  readables: ReadableArchiveView,

  chapters: ChapterCollection,
  nonChapterQuests: MainQuestExcelConfigData[],
  hiddenQuests: MainQuestExcelConfigData[],

  achievements: AchievementExcelConfigData[],
  loadingTips: LoadingTipsExcelConfigData[],
  tutorials: TutorialExcelConfigData[],
  viewpoints: ViewCodexExcelConfigData[],

  // TODO: achievements, loading tips, tutorials, viewpoints
}

export async function generateGenshinChangelogNewRecordSummary(ctrl: GenshinControl, fullChangelog: FullChangelog): Promise<GenshinChangelogNewRecordSummary> {
  function newRecordsOf(excelFileName: GenshinSchemaNames): ChangeRecord[] {
    if (fullChangelog.excelChangelog?.[excelFileName]?.changedRecords) {
      return Object.values(fullChangelog.excelChangelog[excelFileName].changedRecords).filter(r => r.changeType === 'added');
    } else {
      return [];
    }
  }

  function newIntKeysOf(excelFileName: GenshinSchemaNames): number[] {
    return newRecordsOf(excelFileName).map(r => toInt(r.key));
  }

  const materials: MaterialExcelConfigData[] = await newIntKeysOf('MaterialExcelConfigData')
    .asyncMap(id => ctrl.selectMaterialExcelConfigData(id));

  const monsters: MonsterExcelConfigData[] = await newIntKeysOf('MonsterExcelConfigData')
    .asyncMap(monsterId => ctrl.selectMonsterById(monsterId));

  const loadingTips: LoadingTipsExcelConfigData[] = [];
  {
    const loadingCat: LoadingCat = await selectLoadingTips(ctrl);
    const loadingTipIds: number[] = newIntKeysOf('LoadingTipsExcelConfigData');
    let loadingCatQueue = [loadingCat];
    while (loadingCatQueue.length) {
      let currCat = loadingCatQueue.shift();
      for (let tip of currCat.tips) {
        if (loadingTipIds.includes(tip.Id)) {
          loadingTips.push(tip);
        }
      }
      loadingCatQueue.push(... currCat.subCats);
    }
  }

  const gcg: GCGControl = getGCGControl(ctrl);
  gcg.disableSkillSelect = true;
  gcg.disableNpcLoad = true;
  gcg.disableRelatedCharacterLoad = true;
  gcg.disableVoiceItemsLoad = true;
  await gcg.init();

  const chapters: ChapterExcelConfigData[] = await newIntKeysOf('ChapterExcelConfigData').asyncMap(id => ctrl.selectChapterById(id, true));
  const chapterCollection: ChapterCollection = ctrl.generateChapterCollection(chapters);
  const chapterQuestIds: Set<number> = new Set(chapters.map(c => c.Quests.map(q => q.Id)).flat());
  const nonChapterQuestIds: number[] = newIntKeysOf('MainQuestExcelConfigData').filter(mqId => !chapterQuestIds.has(mqId));

  const quests: MainQuestExcelConfigData[] = await nonChapterQuestIds.asyncMap(mqId => ctrl.selectMainQuestById(mqId));

  return {
    avatars: await newIntKeysOf('AvatarExcelConfigData').asyncMap(avatarId => ctrl.selectAvatarById(avatarId)),
    weapons: await newIntKeysOf('WeaponExcelConfigData').asyncMap(weaponId => ctrl.selectWeaponById(weaponId)),
    foods: materials.filter(item => !!item.FoodQuality || item.MaterialType === 'MATERIAL_FOOD' || item.MaterialType === 'MATERIAL_NOTICE_ADD_HP'),
    tcgItems: materials.filter(item => item.MaterialType && item.MaterialType.startsWith('MATERIAL_GCG')),
    avatarItems: materials.filter(item => item.MaterialType === 'MATERIAL_NAMECARD'
      || item.MaterialType === 'MATERIAL_TALENT' || item.MaterialType === 'MATERIAL_AVATAR'),
    blueprints: materials.filter(item => item.MaterialType === 'MATERIAL_FURNITURE_FORMULA' || item.MaterialType === 'MATERIAL_FURNITURE_SUITE_FORMULA'),
    items: materials.filter(item => (
      !(!!item.FoodQuality || item.MaterialType === 'MATERIAL_FOOD' || item.MaterialType === 'MATERIAL_NOTICE_ADD_HP')
      && !(item.MaterialType && item.MaterialType.startsWith('MATERIAL_GCG'))
      && !(item.MaterialType === 'MATERIAL_FURNITURE_FORMULA' || item.MaterialType === 'MATERIAL_FURNITURE_SUITE_FORMULA')
      && !(item.MaterialType === 'MATERIAL_NAMECARD' || item.MaterialType === 'MATERIAL_TALENT' || item.MaterialType === 'MATERIAL_AVATAR')
    )),

    furnishings: await newIntKeysOf('HomeWorldFurnitureExcelConfigData').asyncMap(id => ctrl.selectFurniture(id, {LoadHomeWorldNPC: true})),
    furnishingSets: await newIntKeysOf('FurnitureSuiteExcelConfigData').asyncMap(id => ctrl.selectFurnitureSuite(id)),

    monsters: monsters.filter(m => !m.AnimalDescribe),
    wildlife: monsters.filter(m => !!m.AnimalDescribe),

    tcgCharacterCards: await newIntKeysOf('GCGCharExcelConfigData').asyncMap(id => gcg.selectCharacterCard(id)),
    tcgActionCards: await newIntKeysOf('GCGCardExcelConfigData').asyncMap(id => gcg.selectActionCard(id)),
    tcgStages: await newIntKeysOf('GCGGameExcelConfigData').asyncMap(id => gcg.selectStage(id, {
      disableDeckLoad: true,
      disableTalkLoad: true,
    })),

    viewpoints: await selectViewpointsByIds(ctrl, newIntKeysOf('ViewCodexExcelConfigData')),
    loadingTips: loadingTips,
    achievements: await newIntKeysOf('AchievementExcelConfigData').asyncMap(id => ctrl.selectAchievement(id)),
    tutorials: Object.values(await selectTutorials(ctrl, null, newIntKeysOf('TutorialExcelConfigData'))).flat(),

    readables: ctrl.generateReadableArchiveView(
      await newIntKeysOf('DocumentExcelConfigData').asyncMap(id => ctrl.selectReadableView(id, false))
    ),

    chapters: chapterCollection,
    nonChapterQuests: quests.filter(mq => !!mq.TitleText),
    hiddenQuests: quests.filter(mq => !mq.TitleText),
  };
}
