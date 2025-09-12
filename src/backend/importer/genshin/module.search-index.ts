import fs from 'fs';
import { getGenshinDataFilePath } from '../../loadenv.ts';
import { getGenshinControl } from '../../domain/genshin/genshinControl.ts';
import chalk from 'chalk';
import { Readable } from '../../../shared/types/genshin/readable-types.ts';
import { AchievementExcelConfigData } from '../../../shared/types/genshin/achievement-types.ts';
import { selectTutorials } from '../../domain/genshin/archive/tutorials.ts';
import { TutorialsByType } from '../../../shared/types/genshin/tutorial-types.ts';
import { getGCGControl } from '../../domain/genshin/gcg/gcg_control.ts';
import { closeKnex } from '../../util/db.ts';

export async function importSearchIndex() {
  if (!fs.existsSync(getGenshinDataFilePath('./TextMap/Index/'))) {
    fs.mkdirSync(getGenshinDataFilePath('./TextMap/Index/'));
  }

  const ctrl = getGenshinControl();

  const writeOutput = (file: string, data: any) => {
    fs.writeFileSync(getGenshinDataFilePath(`./TextMap/Index/TextIndex_${file}.json`), JSON.stringify(data, null, 2), 'utf8');
    console.log(chalk.blue(' (done)'));
  };

  // Main Quest Index
  // --------------------------------------------------------------------------------------------------------------
  {
    process.stdout.write(chalk.bold('Generating main quest index...'));
    const mainQuestList = await ctrl.selectAllMainQuests();
    const mainQuestIndex: { [textMapHash: number]: number } = {};

    for (let mainQuest of mainQuestList) {
      mainQuestIndex[mainQuest.TitleTextMapHash] = mainQuest.Id;
    }
    writeOutput('MainQuest', mainQuestIndex);
  }
  // Chapter Index
  // --------------------------------------------------------------------------------------------------------------
  {
    process.stdout.write(chalk.bold('Generating chapter index...'));
    const chapterList = await ctrl.selectAllChapters();
    const chapterIndex: { [textMapHash: number]: number } = {};

    for (let chapter of chapterList) {
      chapterIndex[chapter.ChapterTitleTextMapHash] = chapter.Id;
    }
    writeOutput('Chapter', chapterIndex);
  }
  // Readable Index
  // --------------------------------------------------------------------------------------------------------------
  {
    process.stdout.write(chalk.bold('Generating readable index...'));
    const archive = await ctrl.readables.selectArchive();
    const readableList: Readable[] = [
      ...archive.Artifacts,
      ...archive.Weapons,
      ...archive.Materials,
      ...Object.values(archive.BookCollections).flatMap(bookSuit => bookSuit.Books),
    ];
    const readableIndex: { [viewId: number]: number } = {};

    for (let view of readableList) {
      readableIndex[view.TitleTextMapHash] = view.Id;
      if (view.Document && view.Document.TitleTextMapHash) {
        readableIndex[view.Document.TitleTextMapHash] = view.Id;
      }
    }
    writeOutput('Readable', readableIndex);
  }
  // Material Index
  // --------------------------------------------------------------------------------------------------------------
  {
    process.stdout.write(chalk.bold('Generating material index...'));
    const materialList = await ctrl.selectAllMaterialExcelConfigData({ LoadRelations: false, LoadSourceData: false });
    const materialIndex: { [textMapHash: number]: number } = {};

    for (let material of materialList) {
      materialIndex[material.NameTextMapHash] = material.Id;
      materialIndex[material.DescTextMapHash] = material.Id;
    }
    writeOutput('Material', materialIndex);
  }
  // Furniture Index
  // --------------------------------------------------------------------------------------------------------------
  {
    process.stdout.write(chalk.bold('Generating furniture index...'));
    const furnitureList = await ctrl.selectAllFurniture();
    const furnitureIndex: { [textMapHash: number]: number } = {};

    for (let furniture of furnitureList) {
      furnitureIndex[furniture.NameTextMapHash] = furniture.Id;
      furnitureIndex[furniture.DescTextMapHash] = furniture.Id;
    }
    writeOutput('Furniture', furnitureIndex);
  }
  // Furniture Suite Index
  // --------------------------------------------------------------------------------------------------------------
  {
    process.stdout.write(chalk.bold('Generating furniture suite index...'));
    const furnitureSuiteList = await ctrl.selectAllFurnitureSuite();
    const furnitureSuiteIndex: { [textMapHash: number]: number } = {};

    for (let furniture of furnitureSuiteList) {
      furnitureSuiteIndex[furniture.SuiteNameTextMapHash] = furniture.SuiteId;
      furnitureSuiteIndex[furniture.SuiteDescTextMapHash] = furniture.SuiteId;
    }
    writeOutput('FurnitureSuite', furnitureSuiteIndex);
  }
  // Weapon Index
  // --------------------------------------------------------------------------------------------------------------
  {
    process.stdout.write(chalk.bold('Generating weapon index...'));
    const weaponList = await ctrl.selectAllWeapons();
    const weaponIndex: { [textMapHash: number]: number } = {};

    for (let weapon of weaponList) {
      weaponIndex[weapon.NameTextMapHash] = weapon.Id;
      weaponIndex[weapon.DescTextMapHash] = weapon.Id;
    }
    writeOutput('Weapon', weaponIndex);
  }
  // Achievement Index
  // --------------------------------------------------------------------------------------------------------------
  {
    process.stdout.write(chalk.bold('Generating achievement index...'));
    const achievementList: AchievementExcelConfigData[] = await ctrl.readDataFile('./ExcelBinOutput/AchievementExcelConfigData.json');
    const achievementIndex: { [textMapHash: number]: number } = {};

    for (let achievement of achievementList) {
      if (!achievement.TitleText) {
        continue;
      }
      achievementIndex[achievement.TitleTextMapHash] = achievement.Id;
      achievementIndex[achievement.DescTextMapHash] = achievement.Id;
    }
    writeOutput('Achievement', achievementIndex);
  }
  // Tutorial Index
  // --------------------------------------------------------------------------------------------------------------
  {
    process.stdout.write(chalk.bold('Generating tutorial index...'));
    const tutorialsByType: TutorialsByType = await selectTutorials(ctrl);
    const tutorialIndex: { [textMapHash: number]: number } = {};
    for (let tutorials of Object.values(tutorialsByType)) {
      for (let tutorial of tutorials) {
        if (tutorial.PushTip?.TitleTextMapHash) {
          tutorialIndex[tutorial.PushTip.TitleTextMapHash] = tutorial.Id;
        }
        if (tutorial.DetailList) {
          for (let detail of tutorial.DetailList) {
            if (detail) {
              tutorialIndex[detail.DescriptTextMapHash] = tutorial.Id;
            }
          }
        }
      }
    }
    writeOutput('Tutorial', tutorialIndex);
  }
  // TCG Stage Index
  // --------------------------------------------------------------------------------------------------------------
  {
    process.stdout.write(chalk.bold('Generating TCG stage index...'));
    const gcg = getGCGControl(ctrl);

    const tcgStageIndex: { [textMapHash: number]: number } = {};
    const stages = await gcg.selectAllStage();
    for (let stage of stages) {
      if (stage.OppoPlayerNameText) {
        tcgStageIndex[stage.OppoPlayerNameTextMapHash] = stage.Id;
      }
      if (stage.Reward?.LevelNameText) {
        tcgStageIndex[stage.Reward.LevelNameTextMapHash] = stage.Id;
      }
    }
    writeOutput('TCGStage', tcgStageIndex);
  }
  await closeKnex();
}
