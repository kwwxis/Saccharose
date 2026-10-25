import { GenshinControl, GenshinControlState } from '../genshinControl.ts';
import {
  AnimalCodexExcelConfigData, AnimalCodexType, AnimalDescribeExcelConfigData, LivingBeingArchive, LivingBeingArchiveGroup,
  LivingBeingLoadConf, LivingBeingTable,
  MonsterDescribeExcelConfigData,
  MonsterExcelConfigData, MonsterSpecialNameExcelConfigData, MonsterTitleExcelConfigData,
} from '../../../../shared/types/genshin/living-being-types.ts';
import { defaultMap } from '../../../../shared/util/genericUtil.ts';
import { LangCode } from '../../../../shared/types/lang-types.ts';
import { fsExists } from '../../../util/fsutil.ts';
import { rtrim } from '../../../../shared/util/stringUtil.ts';
import { IMAGEDIR_GENSHIN_EXT } from '../../../loadenv.ts';
import path from 'node:path';
import cloneDeep from 'clone-deep';

export class GenshinLivingBeingModule {
  private animalDescribeData: Record<number, AnimalDescribeExcelConfigData>;
  private monsterDescribeData: Record<number, MonsterDescribeExcelConfigData>;
  private monsterTitleData: Record<number, MonsterTitleExcelConfigData>;
  private monsterSpecialNameData: Record<number, MonsterSpecialNameExcelConfigData[]>;

  // Bulk (process-wide, language-independent) indexes of raw DB rows, keyed by DescribeId. These exist so
  // that the "by describe ID" lookups (`selectAnimalCodexByDescribeId`, `selectMonstersByDescribeId`) don't
  // each have to issue their own single-row DB query when called many times in a row (e.g. once per monster
  // or once per codex entry while building the full living being archive) - instead the whole table is
  // fetched once (ever, across all requests/languages) and every subsequent lookup is an in-memory map read.
  private animalCodexRowsByDescribeId: Record<number, any[]>;
  private monsterRowsByDescribeId: Record<number, any[]>;

  // Memoized preload promise - lets `preload()` be safely called (and awaited) from every public method
  // without redoing the work: the first caller kicks off the loading, every later call (whether from the
  // original external caller or from another public method on this same instance) just awaits the same promise.
  private preloadPromise: Promise<void>;

  constructor(readonly ctrl: GenshinControl) {
  }

  get knex() {
    return this.ctrl.knex;
  }

  get outputLangCode(): LangCode {
    return this.ctrl.outputLangCode;
  }

  get state(): GenshinControlState {
    return this.ctrl.state;
  }

  async preload(): Promise<void> {
    if (!this.preloadPromise) {
      this.preloadPromise = this.doPreload();
    }
    return this.preloadPromise;
  }

  private async doPreload(): Promise<void> {
    await Promise.all([
      (async () => {
        this.animalDescribeData = await this.ctrl.cached('AnimalDescribeExcelConfigData:' + this.outputLangCode, 'json', async () => {
          return await this.ctrl.readExcelDataFileToStream<AnimalDescribeExcelConfigData>('./AnimalDescribeExcelConfigData.json').toMap('Id');
        });
      })(),
      (async () => {
        this.monsterDescribeData = await this.ctrl.cached('MonsterDescribeExcelConfigData:' + this.outputLangCode, 'json', async () => {
          return await this.ctrl.readExcelDataFileToStream<MonsterDescribeExcelConfigData>('./MonsterDescribeExcelConfigData.json').toMap('Id');
        });
      })(),
      (async () => {
        this.monsterTitleData = await this.ctrl.cached('MonsterTitleExcelConfigData:' + this.outputLangCode, 'json', async () => {
          return await this.ctrl.readExcelDataFileToStream<MonsterTitleExcelConfigData>('./MonsterTitleExcelConfigData.json').toMap('TitleId');
        });
      })(),
      (async () => {
        this.monsterSpecialNameData = await this.ctrl.cached('MonsterSpecialNameExcelConfigData:' + this.outputLangCode, 'json', async () => {
          const rawData = await this.ctrl.readExcelDataFile<MonsterSpecialNameExcelConfigData>('./MonsterSpecialNameExcelConfigData.json');
          const retData: Record<number, MonsterSpecialNameExcelConfigData[]> = defaultMap('Array');
          for (let item of rawData) {
            retData[item.SpecialNameLabId].push(item);
          }
          return retData;
        });
      })(),
      this.loadAnimalCodexRowsByDescribeId(),
      this.loadMonsterRowsByDescribeId(),
    ]);
  }

  /**
   * Lazily loads (and caches process-wide, forever) every row of `AnimalCodexExcelConfigData` grouped by
   * `DescribeId`. Backs `selectAnimalCodexByDescribeId` so that it doesn't need a per-call DB round trip.
   */
  private async loadAnimalCodexRowsByDescribeId(): Promise<Record<number, any[]>> {
    if (!this.animalCodexRowsByDescribeId) {
      this.animalCodexRowsByDescribeId = await this.ctrl.cached('AnimalCodexExcelConfigData:RowsByDescribeId', 'json', async () => {
        const rows = await this.knex.select('*').from('AnimalCodexExcelConfigData');
        const map: Record<number, any[]> = defaultMap('Array');
        for (let row of rows) {
          map[row.DescribeId].push(row);
        }
        return map;
      });
    }
    return this.animalCodexRowsByDescribeId;
  }

  /**
   * Lazily loads (and caches process-wide, forever) every row of `MonsterExcelConfigData` grouped by
   * `DescribeId`. Backs `selectMonstersByDescribeId` so that it doesn't need a per-call DB round trip.
   */
  private async loadMonsterRowsByDescribeId(): Promise<Record<number, any[]>> {
    if (!this.monsterRowsByDescribeId) {
      this.monsterRowsByDescribeId = await this.ctrl.cached('MonsterExcelConfigData:RowsByDescribeId', 'json', async () => {
        const rows = await this.knex.select('*').from('MonsterExcelConfigData');
        const map: Record<number, any[]> = defaultMap('Array');
        for (let row of rows) {
          map[row.DescribeId].push(row);
        }
        return map;
      });
    }
    return this.monsterRowsByDescribeId;
  }

  // region Monster
  private async postProcessMonster(monster: MonsterExcelConfigData, loadConf?: LivingBeingLoadConf): Promise<MonsterExcelConfigData> {
    if (!monster) {
      return monster;
    }
    if (!loadConf) {
      loadConf = {};
    }
    if (!this.state.DisableMonsterCache) {
      this.state.monsterCache[monster.Id] = monster;
    }
    if (monster.DescribeId) {
      const [r1, r2, r3] = await Promise.all([
        this.selectMonsterDescribe(monster.DescribeId),
        this.selectAnimalDescribe(monster.DescribeId),
        this.selectAnimalCodexByDescribeId(monster.DescribeId, loadConf)
      ]);
      monster.MonsterDescribe = r1;
      monster.AnimalDescribe = r2;
      monster.AnimalCodex = r3;

      monster.Describe = monster.MonsterDescribe || monster.AnimalDescribe;
    }
    if (loadConf.LoadHomeWorldAnimal) {
      monster.HomeWorldAnimal = await this.ctrl.selectHomeWorldAnimalByMonster(monster);
    }
    if (loadConf.LoadModelArtPath && !!monster?.AnimalCodex?.ModelPath) {
      let modelPath = monster.AnimalCodex.ModelPath;

      if (await fsExists(path.resolve(IMAGEDIR_GENSHIN_EXT, `./UI_${modelPath}.png`))) {
        monster.AnimalCodex.ModelArtPath = 'UI_' + modelPath;
      } else {
        modelPath = rtrim(monster.AnimalCodex.ModelPath, '_0123456789');
        if (await fsExists(path.resolve(IMAGEDIR_GENSHIN_EXT, `./UI_${modelPath}.png`))) {
          monster.AnimalCodex.ModelArtPath = 'UI_' + modelPath;
        }
      }
    }
    return monster;
  }

  private async selectMonsterDescribe(describeId: number): Promise<MonsterDescribeExcelConfigData> {
    if (this.state.monsterDescribeCache[describeId]) {
      return this.state.monsterDescribeCache[describeId];
    }

    let describe: MonsterDescribeExcelConfigData;

    if (this.monsterDescribeData[describeId]) {
      describe = cloneDeep(this.monsterDescribeData[describeId]);
    } else {
      describe = await this.knex.select('*').from('MonsterDescribeExcelConfigData')
        .where({Id: describeId})
        .first().then(this.ctrl.commonLoadFirst)
    }

    this.state.monsterDescribeCache[describeId] = describe;

    if (describe && describe.TitleId) {
      if (this.monsterTitleData[describe.TitleId]) {
        describe.Title = cloneDeep(this.monsterTitleData[describe.TitleId]);
      } else {
        describe.Title = await this.knex.select('*').from('MonsterTitleExcelConfigData')
          .where({TitleId: describe.TitleId})
          .first().then(this.ctrl.commonLoadFirst);
      }
    }

    if (describe && describe.SpecialNameLabId) {
      if (this.monsterSpecialNameData[describe.SpecialNameLabId]) {
        describe.SpecialNameLabList = cloneDeep(this.monsterSpecialNameData[describe.SpecialNameLabId]);
      } else {
        describe.SpecialNameLabList = await this.knex.select('*').from('MonsterSpecialNameExcelConfigData')
          .where({SpecialNameLabId: describe.SpecialNameLabId})
          .then(this.ctrl.commonLoad);
      }
    }

    return describe;
  }

  async selectMonsterById(id: number, loadConf?: LivingBeingLoadConf): Promise<MonsterExcelConfigData> {
    await this.preload();
    if (this.state.monsterCache[id]) {
      return this.state.monsterCache[id];
    }

    let monster: MonsterExcelConfigData = await this.knex.select('*').from('MonsterExcelConfigData')
      .where({Id: id})
      .first().then(this.ctrl.commonLoadFirst)
      .then(x => this.postProcessMonster(x, loadConf));

    if (monster && !this.state.DisableMonsterCache) {
      this.state.monsterCache[monster.Id] = monster;
    }

    return monster;
  }

  async selectMonstersByDescribeId(describeId: number, loadConf?: LivingBeingLoadConf): Promise<MonsterExcelConfigData[]> {
    await this.preload();
    const rowsByDescribeId = await this.loadMonsterRowsByDescribeId();
    const rows = rowsByDescribeId[describeId] || [];
    return await this.ctrl.commonLoad(rows).then(ret => ret.asyncMap(x => this.postProcessMonster(x, loadConf)));
  }

  async selectAllMonster(loadConf?: LivingBeingLoadConf): Promise<MonsterExcelConfigData[]> {
    await this.preload();
    return await this.knex.select('*').from('MonsterExcelConfigData')
      .then(this.ctrl.commonLoad).then(ret => ret.asyncMap(x => this.postProcessMonster(x, loadConf)));
  }
  // endregion

  // region Living Beings / Animals
  private async postProcessAnimalCodex(codex: AnimalCodexExcelConfigData, loadConf: LivingBeingLoadConf): Promise<AnimalCodexExcelConfigData> {
    if (!codex) {
      return codex;
    }
    this.state.animalCodexCache[codex.Id] = codex;
    this.state.animalCodexDCache[codex.DescribeId] = codex;

    if (!codex.Type) {
      codex.Type = 'CODEX_WILDLIFE';
    }
    if (!codex.SubType) {
      codex.SubType = 'CODEX_SUBTYPE_ELEMENTAL';
    }

    const [r1, r2, r3] = await Promise.all([
      this.selectAnimalDescribe(codex.DescribeId),
      this.selectMonsterDescribe(codex.DescribeId),
      // Note: intentionally NOT passing `loadConf` through here. `codex.Monsters` is the list of sibling/variant
      // monsters for this codex entry (used only for their Icon/NameText/Id wherever rendered), not the single
      // directly-requested monster - so the heavy loadConf options (LoadHomeWorldAnimal/LoadModelArtPath/
      // LoadAltDescTextQuestConds) would otherwise be needlessly computed (extra DB queries + filesystem checks)
      // once per sibling monster for data that's never used.
      this.selectMonstersByDescribeId(codex.DescribeId, {})
    ]);

    codex.AnimalDescribe = r1;
    codex.MonsterDescribe = r2;
    codex.Monsters = r3;

    const codexTextMap = await this.selectAnimalCodexManualTextMap();
    codex.SubTypeName = codexTextMap[codex.SubType.replace('CODEX_SUBTYPE', 'UI_CODEX_ANIMAL_CATEGORY')];

    if (codex.Type === 'CODEX_WILDLIFE') {
      codex.Icon = codex.AnimalDescribe?.Icon;
      codex.NameText = codex.AnimalDescribe?.NameText;
      codex.NameTextMapHash = codex.AnimalDescribe?.NameTextMapHash;
      codex.TypeName = codexTextMap['UI_CODEX_ANIMAL_ANIMAL'];
    } else {
      codex.Icon = codex.MonsterDescribe?.Icon;
      codex.NameText = codex.MonsterDescribe?.NameText;
      codex.NameTextMapHash = codex.MonsterDescribe?.NameTextMapHash;
      codex.TypeName = codexTextMap['UI_CODEX_ANIMAL_MONSTER'];
    }

    if (loadConf.LoadAltDescTextQuestConds && Array.isArray(codex.AltDescTextQuestCondIds)) {
      codex.AltDescTextQuestConds = [];
      for (let condId of codex.AltDescTextQuestCondIds) {
        const questExcel = await this.ctrl.selectQuestExcelConfigData(condId);
        if (questExcel && questExcel.MainId) {
          const mainQuestName = await this.ctrl.selectMainQuestName(questExcel.MainId);
          codex.AltDescTextQuestConds.push({
            NameText: mainQuestName,
            MainQuestId: questExcel.MainId
          });
        } else {
          codex.AltDescTextQuestConds.push({NameText: undefined, MainQuestId: undefined});
        }
      }
    }

    return codex;
  }

  private async selectAnimalDescribe(id: number): Promise<AnimalDescribeExcelConfigData> {
    if (this.animalDescribeData[id]) {
      return this.animalDescribeData[id];
    }
    return await this.knex.select('*').from('AnimalDescribeExcelConfigData')
      .where({Id: id})
      .first().then(this.ctrl.commonLoadFirst);
  }

  async selectAnimalCodex(id: number, loadConf: LivingBeingLoadConf = {}): Promise<AnimalCodexExcelConfigData> {
    await this.preload();
    if (this.state.animalCodexCache[id]) {
      return this.state.animalCodexCache[id];
    }
    return await this.knex.select('*').from('AnimalCodexExcelConfigData')
      .where({Id: id})
      .first().then(this.ctrl.commonLoadFirst)
      .then(x => this.postProcessAnimalCodex(x, loadConf));
  }

  async selectAnimalCodexByDescribeId(describeId: number, loadConf: LivingBeingLoadConf = {}): Promise<AnimalCodexExcelConfigData> {
    await this.preload();
    if (this.state.animalCodexDCache[describeId]) {
      return this.state.animalCodexDCache[describeId];
    }
    const rowsByDescribeId = await this.loadAnimalCodexRowsByDescribeId();
    const row = rowsByDescribeId[describeId]?.[0];
    return await this.ctrl.commonLoadFirst(row)
      .then(x => this.postProcessAnimalCodex(x, loadConf));
  }

  async selectAllAnimalCodex(loadConf: LivingBeingLoadConf = {}): Promise<AnimalCodexExcelConfigData[]> {
    await this.preload();
    return await this.knex.select('*').from('AnimalCodexExcelConfigData')
      .then(this.ctrl.commonLoad)
      .then(ret => ret.asyncMap(x => this.postProcessAnimalCodex(x, loadConf)));
  }

  /**
   * Same as {@link selectAllAnimalCodex} but filtered to a single codex `Type` at the DB query level, so
   * that rows belonging to the other type never get fetched or post-processed at all. Used to build just
   * one of the `MonsterCodex`/`WildlifeCodex` archive tables without paying for the other.
   *
   * Note: rows with a null/missing `Type` default to `CODEX_WILDLIFE` in {@link postProcessAnimalCodex},
   * so those rows must be included in the `CODEX_WILDLIFE` filter to match `selectAllAnimalCodex`'s behavior.
   */
  private async selectAllAnimalCodexByType(type: AnimalCodexType, loadConf: LivingBeingLoadConf = {}): Promise<AnimalCodexExcelConfigData[]> {
    let query = this.knex.select('*').from('AnimalCodexExcelConfigData');
    if (type === 'CODEX_WILDLIFE') {
      query = query.where({Type: 'CODEX_WILDLIFE'}).orWhereNull('Type');
    } else {
      query = query.where({Type: type});
    }
    return await query
      .then(this.ctrl.commonLoad)
      .then(ret => ret.asyncMap(x => this.postProcessAnimalCodex(x, loadConf)));
  }

  private async selectAnimalCodexManualTextMap(): Promise<{[manualTextMapId: string]: string}> {
    return this.ctrl.cached('AnimalCodexManualTextMap:' + this.outputLangCode, 'json', async () => {
      return await this.ctrl.manualtm.selectMultiRecordWithTextContentResult([
        'UI_CODEX_ANIMAL_MONSTER',
        'UI_CODEX_ANIMAL_ANIMAL',
        'UI_CODEX_ANIMAL_MONSTER_NONE',
        'UI_CODEX_ANIMAL_ANIMAL_NONE',
        'UI_CODEX_ANIMAL_CATEGORY_ABYSS',
        'UI_CODEX_ANIMAL_CATEGORY_ANIMAL',
        'UI_CODEX_ANIMAL_CATEGORY_AUTOMATRON',
        'UI_CODEX_ANIMAL_CATEGORY_AVIARY',
        'UI_CODEX_ANIMAL_CATEGORY_BEAST',
        'UI_CODEX_ANIMAL_CATEGORY_BOSS',
        'UI_CODEX_ANIMAL_CATEGORY_CRITTER',
        'UI_CODEX_ANIMAL_CATEGORY_FATUI',
        'UI_CODEX_ANIMAL_CATEGORY_FISH',
        'UI_CODEX_ANIMAL_CATEGORY_HILICHURL',
        'UI_CODEX_ANIMAL_CATEGORY_HUMAN',
        'UI_CODEX_ANIMAL_CATEGORY_ELEMENTAL',
        'UI_CODEX_ANIMAL_NAME_LOCKED',
      ]);
    });
  }

  /**
   * Builds the `MonsterCodex` archive table (i.e. "Enemies and Monsters"). Only queries/post-processes
   * `AnimalCodexExcelConfigData` rows of type `CODEX_MONSTER` - does not touch `MonsterExcelConfigData` at all.
   */
  async selectMonsterCodexArchive(): Promise<LivingBeingTable> {
    await this.preload();
    return this.buildCodexArchiveTable('CODEX_MONSTER');
  }

  /**
   * Builds the `WildlifeCodex` archive table (i.e. "Wildlife"). Only queries/post-processes
   * `AnimalCodexExcelConfigData` rows of type `CODEX_WILDLIFE` - does not touch `MonsterExcelConfigData` at all.
   */
  async selectWildlifeCodexArchive(): Promise<LivingBeingTable> {
    await this.preload();
    return this.buildCodexArchiveTable('CODEX_WILDLIFE');
  }

  private async buildCodexArchiveTable(type: AnimalCodexType): Promise<LivingBeingTable> {
    const [codexList, codexManualTextMap] = await Promise.all([
      this.selectAllAnimalCodexByType(type),
      this.selectAnimalCodexManualTextMap(),
    ]);

    const table: LivingBeingTable = defaultMap((key: string|number): LivingBeingArchiveGroup => ({
      SubType: String(key),
      NameText: codexManualTextMap[String(key).replace('CODEX_SUBTYPE', 'UI_CODEX_ANIMAL_CATEGORY')],
      CodexList: [],
    }));

    for (let codex of codexList) {
      table[codex.SubType].CodexList.push(codex);
    }

    return table;
  }

  /**
   * Builds the `NonCodexMonsters` archive table (living beings with no in-game archive entry). Needs the full
   * monster list (to know what exists), but only needs the *set* of codex `DescribeId`s (to know what's
   * already codified) rather than the fully post-processed codex entries themselves.
   */
  async selectNonCodexMonsterArchive(): Promise<LivingBeingTable> {
    await this.preload();
    const [monsterList, codexDescribeIds] = await Promise.all([
      this.selectAllMonster(),
      this.selectAnimalCodexDescribeIdSet(),
    ]);

    const table: LivingBeingTable = {
      HOMEWORLD: {
        SubType: 'CUSTOM_HOMEWORLD',
        NameText: 'HomeWorld',
        CodexList: [],
        MonsterList: []
      },
      NAMED: {
        SubType: 'CUSTOM_NAMED',
        NameText: 'Named',
        CodexList: [],
        MonsterList: []
      },
      UNNAMED: {
        SubType: 'CUSTOM_UNNAMED',
        NameText: 'Unnamed',
        CodexList: [],
        MonsterList: []
      },
    };

    for (let monster of monsterList) {
      if (!codexDescribeIds.has(monster.DescribeId)) {
        if (monster.MonsterName.toLowerCase().includes('homeworld')) {
          table.HOMEWORLD.MonsterList.push(monster);
        } else if (monster.NameText || monster.Describe?.NameText) {
          table.NAMED.MonsterList.push(monster);
        } else {
          table.UNNAMED.MonsterList.push(monster);
        }
      }
    }

    return table;
  }

  private async selectAnimalCodexDescribeIdSet(): Promise<Set<number>> {
    const rowsByDescribeId = await this.loadAnimalCodexRowsByDescribeId();
    return new Set(Object.keys(rowsByDescribeId).map(Number));
  }

  async selectLivingBeingArchive(): Promise<LivingBeingArchive> {
    await this.preload();
    const [MonsterCodex, WildlifeCodex, NonCodexMonsters] = await Promise.all([
      this.selectMonsterCodexArchive(),
      this.selectWildlifeCodexArchive(),
      this.selectNonCodexMonsterArchive(),
    ]);

    return { MonsterCodex, WildlifeCodex, NonCodexMonsters };
  }
  // endregion
}
