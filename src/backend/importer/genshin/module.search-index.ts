import fs from 'fs';
import { getGenshinDataFilePath } from '../../loadenv.ts';
import { GenshinControl, getGenshinControl } from '../../domain/genshin/genshinControl.ts';
import chalk from 'chalk';
import { Readable } from '../../../shared/types/genshin/readable-types.ts';
import { AchievementExcelConfigData } from '../../../shared/types/genshin/achievement-types.ts';
import { selectTutorials } from '../../domain/genshin/archive/tutorials.ts';
import { TutorialsByType } from '../../../shared/types/genshin/tutorial-types.ts';
import { getGCGControl } from '../../domain/genshin/gcg/gcg_control.ts';
import { closeKnex, openPgGamedata } from '../../util/db.ts';
import { TextmapSearchIndexRow } from '../../../shared/types/common-types.ts';
import { TextMapHash } from '../../../shared/types/lang-types.ts';
import { toString } from '../../../shared/util/stringUtil.ts';
import { isUnset } from '../../../shared/util/genericUtil.ts';

class IndexAccumulator {
  index: TextmapSearchIndexRow[] = [];

  constructor(readonly indexName: string) {}

  add(hash: TextMapHash, key: number, role?: string) {
    if (isUnset(key) || isUnset(hash) || hash === 0) {
      return;
    }
    this.index.push({
      index_name: this.indexName,
      hash: toString(hash),
      key: key,
      role: role,
    });
  }

  async write() {

    const knex = openPgGamedata().genshin;

    process.stdout.write(chalk.blue('Clearing existing data for ' + this.indexName + ' from database... '));
    await knex.delete().from('textmap_search_index').where({ index_name: this.indexName }).then();

    console.log(chalk.gray('(done)'));

    process.stdout.write(chalk.blue('Inserting index for ' + this.indexName + ' into database... '));
    await knex.transaction(tx => {
      return knex.batchInsert('textmap_search_index', this.index, 1000).transacting(tx);
    }).then();

    console.log(chalk.gray('(done)'));
  }

  flush() {
    this.index = [];
  }

  async writeAndFlush() {
    await this.write();
    this.flush();
  }
}

export async function importSearchIndex() {
  if (!fs.existsSync(getGenshinDataFilePath('./TextMap/Index/'))) {
    fs.mkdirSync(getGenshinDataFilePath('./TextMap/Index/'));
  }

  const ctrl: GenshinControl = getGenshinControl();

  // Main Quest Index
  // --------------------------------------------------------------------------------------------------------------
  {
    console.log(chalk.bold('Generating main quest index...'));
    const mainQuestList = await ctrl.selectAllMainQuests();
    const mainQuestIndex: IndexAccumulator = new IndexAccumulator('MainQuest');

    for (let mainQuest of mainQuestList) {
      mainQuestIndex.add(mainQuest.TitleTextMapHash, mainQuest.Id);
    }
    await mainQuestIndex.writeAndFlush();
  }
  // Chapter Index
  // --------------------------------------------------------------------------------------------------------------
  {
    console.log(chalk.bold('Generating chapter index...'));
    const chapterList = await ctrl.selectAllChapters();
    const chapterIndex: IndexAccumulator = new IndexAccumulator('Chapter');

    for (let chapter of chapterList) {
      chapterIndex.add(chapter.ChapterTitleTextMapHash, chapter.Id);
    }
    await chapterIndex.writeAndFlush();
  }
  // Readable Index
  // --------------------------------------------------------------------------------------------------------------
  {
    console.log(chalk.bold('Generating readable index...'));
    const archive = await ctrl.readables.selectArchive();
    const readableList: Readable[] = [
      ...archive.Artifacts,
      ...archive.Weapons,
      ...archive.Materials,
      ...Object.values(archive.BookCollections).flatMap(bookSuit => bookSuit.Books),
    ];
    const readableIndex: IndexAccumulator = new IndexAccumulator('Readable');

    for (let view of readableList) {
      readableIndex.add(view.TitleTextMapHash, view.Id, 'Title');
      if (view.Document && view.Document.TitleTextMapHash) {
        readableIndex.add(view.Document.TitleTextMapHash, view.Id, 'DocTitle');
      }
    }
    await readableIndex.writeAndFlush();
  }
  // Material Index
  // --------------------------------------------------------------------------------------------------------------
  {
    console.log(chalk.bold('Generating material index...'));
    const materialList = await ctrl.selectAllMaterialExcelConfigData({ LoadRelations: false, LoadSourceData: false });
    const materialIndex: IndexAccumulator = new IndexAccumulator('Material');

    for (let material of materialList) {
      materialIndex.add(material.NameTextMapHash, material.Id, 'Name');
      materialIndex.add(material.DescTextMapHash, material.Id, 'Desc');
    }
    await materialIndex.writeAndFlush();
  }
  // BYD Material Index
  // --------------------------------------------------------------------------------------------------------------
  {
    console.log(chalk.bold('Generating byd material index...'));
    const materialList = await ctrl.selectAllBydMaterialExcelConfigData();
    const materialIndex: IndexAccumulator = new IndexAccumulator('BydMaterial');

    for (let material of materialList) {
      materialIndex.add(material.NameTextMapHash, material.Id, 'Name');
      materialIndex.add(material.DescTextMapHash, material.Id, 'Desc');
    }
    await materialIndex.writeAndFlush();
  }
  // Furniture Index
  // --------------------------------------------------------------------------------------------------------------
  {
    console.log(chalk.bold('Generating furniture index...'));
    const furnitureList = await ctrl.selectAllFurniture();
    const furnitureIndex: IndexAccumulator = new IndexAccumulator('Furniture');

    for (let furniture of furnitureList) {
      furnitureIndex.add(furniture.NameTextMapHash, furniture.Id, 'Name');
      furnitureIndex.add(furniture.DescTextMapHash, furniture.Id, 'Desc');
    }
    await furnitureIndex.writeAndFlush();
  }
  // Furniture Suite Index
  // --------------------------------------------------------------------------------------------------------------
  {
    console.log(chalk.bold('Generating furniture suite index...'));
    const furnitureSuiteList = await ctrl.selectAllFurnitureSuite();
    const furnitureSuiteIndex: IndexAccumulator = new IndexAccumulator('FurnitureSuite');

    for (let furniture of furnitureSuiteList) {
      furnitureSuiteIndex.add(furniture.SuiteNameTextMapHash, furniture.SuiteId, 'Name');
      furnitureSuiteIndex.add(furniture.SuiteDescTextMapHash, furniture.SuiteId, 'Desc');
    }
    await furnitureSuiteIndex.writeAndFlush();
  }
  // Weapon Index
  // --------------------------------------------------------------------------------------------------------------
  {
    console.log(chalk.bold('Generating weapon index...'));
    const weaponList = await ctrl.selectAllWeapons();
    const weaponIndex: IndexAccumulator = new IndexAccumulator('Weapon');

    for (let weapon of weaponList) {
      weaponIndex.add(weapon.NameTextMapHash, weapon.Id, 'Name');
      weaponIndex.add(weapon.DescTextMapHash, weapon.Id, 'Desc');
    }
    await weaponIndex.writeAndFlush();
  }
  // Achievement Index
  // --------------------------------------------------------------------------------------------------------------
  {
    console.log(chalk.bold('Generating achievement index...'));
    const achievementList: AchievementExcelConfigData[] = await ctrl.readDataFile('./ExcelBinOutput/AchievementExcelConfigData.json');
    const achievementIndex: IndexAccumulator = new IndexAccumulator('Achievement');

    for (let achievement of achievementList) {
      if (!achievement.TitleText) {
        continue;
      }
      achievementIndex.add(achievement.TitleTextMapHash, achievement.Id, 'Title');
      achievementIndex.add(achievement.DescTextMapHash, achievement.Id, 'Desc');
    }
    await achievementIndex.writeAndFlush();
  }
  // Tutorial Index
  // --------------------------------------------------------------------------------------------------------------
  {
    console.log(chalk.bold('Generating tutorial index...'));
    const tutorialsByType: TutorialsByType = await selectTutorials(ctrl);
    const tutorialIndex: IndexAccumulator = new IndexAccumulator('Tutorial');

    for (let tutorials of Object.values(tutorialsByType)) {
      for (let tutorial of tutorials) {
        if (tutorial.PushTip?.TitleTextMapHash) {
          tutorialIndex.add(tutorial.PushTip.TitleTextMapHash, tutorial.Id, 'Title');
        }
        if (tutorial.DetailList) {
          for (let detail of tutorial.DetailList) {
            if (detail) {
              tutorialIndex.add(detail.DescriptTextMapHash, tutorial.Id, 'Desc');
            }
          }
        }
      }
    }
    await tutorialIndex.writeAndFlush();
  }
  // TCG Stage Index
  // --------------------------------------------------------------------------------------------------------------
  {
    console.log(chalk.bold('Generating TCG stage index...'));
    const gcg = getGCGControl(ctrl);

    const tcgStageIndex: IndexAccumulator = new IndexAccumulator('TCGStage');
    const stages = await gcg.selectAllStage();
    for (let stage of stages) {
      if (stage.OppoPlayerNameText) {
        tcgStageIndex.add(stage.OppoPlayerNameTextMapHash, stage.Id);
      }
      if (stage.Reward?.LevelNameText) {
        tcgStageIndex.add(stage.Reward.LevelNameTextMapHash, stage.Id);
      }
    }
    await tcgStageIndex.writeAndFlush();
  }
  await closeKnex();
}
