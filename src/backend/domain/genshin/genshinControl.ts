// noinspection JSUnusedGlobalSymbols

import {
  CityConfigData,
  ConfigCondition,
  NpcExcelConfigData,
  WorldAreaConfigData,
  WorldAreaType,
} from '../../../shared/types/genshin/general-types.ts';
import SrtParser, { SrtLine } from '../../util/srtParser.ts';
import fs, { promises as fsp } from 'fs';
import {
  arrayFillRange,
  arrayIndexOf,
  arrayIntersect,
  arrayUnique,
  cleanEmpty,
  mapBy,
  pairArrays,
  sort,
  toMap,
} from '../../../shared/util/arrayUtil.ts';
import { isInt, toInt } from '../../../shared/util/numberUtil.ts';
import { normalizeRawJson, SchemaTable } from '../../importer/import_db.ts';
import {
  extractRomanNumeral,
  isStringBlank,
  replaceAsync,
  romanToInt,
  rtrim,
  SbOut,
} from '../../../shared/util/stringUtil.ts';
import {
  CodexQuestExcelConfigData,
  CodexQuestGroup,
  CodexQuestNarratageTypes,
  DialogExcelConfigData,
  DialogUnparented,
  ManualTextMapConfigData,
  OptionIconMap,
  ReminderExcelConfigData,
  TalkExcelConfigData,
  TalkLoadType,
  TalkRole,
  TalkRoleType,
} from '../../../shared/types/genshin/dialogue-types.ts';
import {
  ChapterCollection,
  ChapterExcelConfigData,
  MainQuestExcelConfigData,
  QuestExcelConfigData,
  QuestType,
  ReputationQuestExcelConfigData,
} from '../../../shared/types/genshin/quest-types.ts';
import {
  ADVENTURE_EXP_ID,
  CombineExcelConfigData,
  CompoundExcelConfigData,
  CookBonusExcelConfigData,
  CookRecipeExcelConfigData,
  ForgeExcelConfigData,
  ItemRelationMap,
  MaterialCodexExcelConfigData,
  MaterialExcelConfigData,
  MaterialLoadConf,
  MaterialRelation,
  MaterialSourceDataExcelConfigData,
  MaterialVecItem,
  MORA_ID,
  PRIMOGEM_ID,
  RewardExcelConfigData,
} from '../../../shared/types/genshin/material-types.ts';
import {
  FurnitureMakeExcelConfigData,
  FurnitureSuiteExcelConfigData,
  FurnitureSuiteLoadConf,
  HomeworldAnimalExcelConfigData,
  HomeWorldEventExcelConfigData,
  HomeWorldFurnitureExcelConfigData,
  HomeWorldFurnitureLoadConf,
  HomeWorldFurnitureTypeExcelConfigData,
  HomeWorldFurnitureTypeTree,
  HomeWorldNPCExcelConfigData,
  HomeWorldNPCLoadConf,
} from '../../../shared/types/genshin/homeworld-types.ts';
import { grepStream } from '../../util/shellutil.ts';
import {
  DATAFILE_GENSHIN_VOICE_ITEMS, GENSHIN_DISABLED,
  getGenshinDataFilePath,
  getReadableRelPath,
  IMAGEDIR_GENSHIN_EXT,
} from '../../loadenv.ts';
import {
  BooksCodexExcelConfigData,
  BookSuitExcelConfigData,
  DocumentExcelConfigData,
  LANG_CODE_TO_LOCALIZATION_PATH_PROP,
  LocalizationExcelConfigData,
  ReadableArchive,
  ReadableItem,
  ReadableSearchResult,
  Readable, ReadableText,
} from '../../../shared/types/genshin/readable-types.ts';
import {
  RELIC_EQUIP_TYPE_TO_NAME,
  ReliquaryCodexExcelConfigData,
  ReliquaryExcelConfigData,
  ReliquarySetExcelConfigData,
} from '../../../shared/types/genshin/artifact-types.ts';
import {
  EquipAffixExcelConfigData,
  WeaponExcelConfigData,
  WeaponLoadConf,
  WeaponType,
  WeaponTypeEN,
} from '../../../shared/types/genshin/weapon-types.ts';
import { AvatarExcelConfigData } from '../../../shared/types/genshin/avatar-types.ts';
import {
  AnimalCodexExcelConfigData,
  AnimalDescribeExcelConfigData,
  LivingBeingArchive,
  LivingBeingArchiveGroup,
  MonsterDescribeExcelConfigData,
  MonsterExcelConfigData,
  MonsterLoadConf,
} from '../../../shared/types/genshin/monster-types.ts';
import { defaultMap, isEmpty, isset } from '../../../shared/util/genericUtil.ts';
import { NewActivityExcelConfigData } from '../../../shared/types/genshin/activity-types.ts';
import { Marker } from '../../../shared/util/highlightMarker.ts';
import { ElementType, ManualTextMapHashes } from '../../../shared/types/genshin/manual-text-map.ts';
import { custom, logInitData } from '../../util/logger.ts';
import { DialogBranchingCache, orderChapterQuests } from './dialogue/dialogue_util.ts';
import { __normGenshinText, GenshinNormTextOpts } from './genshinText.ts';
import { AbstractControl } from '../abstract/abstractControl.ts';
import debug from 'debug';
import {
  LANG_CODE_TO_LOCALE,
  LangCode,
  TextMapHash,
  VoiceItem,
  VoiceItemArrayMap,
} from '../../../shared/types/lang-types.ts';
import { GCGTagElementType, GCGTagWeaponType } from '../../../shared/types/genshin/gcg-types.ts';
import path from 'path';
import { NormTextOptions } from '../abstract/genericNormalizers.ts';
import {
  AchievementExcelConfigData,
  AchievementGoalExcelConfigData,
  AchievementsByGoals,
} from '../../../shared/types/genshin/achievement-types.ts';
import { Request } from 'express';
import {
  InterAction,
  InterActionD2F,
  InterActionDialog,
  InterActionFile,
  InterActionGroup,
  InterActionNextDialogs,
} from '../../../shared/types/genshin/interaction-types.ts';
import { CommonLineId, DialogWikitextResult } from '../../../shared/types/common-types.ts';
import { genshin_i18n, GENSHIN_I18N_MAP, GENSHIN_MATERIAL_TYPE_DESC_PLURAL_MAP } from '../abstract/i18n.ts';
import * as console from 'console';
import {
  ChangeRecord,
  ChangeRecordRef,
  FullChangelog, TextMapChangeRef, TextMapChanges,
} from '../../../shared/types/changelog-types.ts';
import { GameVersion, GenshinVersions } from '../../../shared/types/game-versions.ts';
import { AbstractControlState } from '../abstract/abstractControlState.ts';

// region Control State
// --------------------------------------------------------------------------------------------------------------

/**
 * State/cache for only a single control
 */
export class GenshinControlState extends AbstractControlState {
  // Caches:
  dialogueIdCache: Set<number> = new Set();
  npcCache:      {[Id: number]: NpcExcelConfigData}    = {};
  avatarCache:   {[Id: number]: AvatarExcelConfigData} = {};
  bookSuitCache: {[Id: number]: BookSuitExcelConfigData} = {};
  mqNameCache:   {[Id: number]: string} = {};
  newActivityNameCache: {[Id: number]: string} = {};
  monsterCache:         {[Id: number]: MonsterExcelConfigData} = {};
  monsterDescribeCache: {[DescribeId: number]: MonsterDescribeExcelConfigData} = {};
  animalCodexCache:  {[Id: number]: AnimalCodexExcelConfigData} = {};
  animalCodexDCache: {[Id: number]: AnimalCodexExcelConfigData} = {};
  interActionCache: {[InterActionFile: string]: InterActionGroup[]} = {};
  codexQuestCache: {[mainQuestId: number]: CodexQuestGroup} = {};

  // Quest BG Metadata
  questBgPicCounter: {[mainQuestId: number]: number} = defaultMap('One');
  questBgPicSeen: {[mainQuestId: number]: {[imageName: string]: number}} = defaultMap('Object');
  questBgPicImageToWikiName: {[mainQuestId: number]: {[imageName: string]: string}} = defaultMap('Object');

  // In-Dialogue Readables
  inDialogueReadables: {[mainQuestId: number]: Readable[]} = defaultMap('Array');

  // Cache Preferences:
  DisableAvatarCache: boolean = false;
  DisableNpcCache: boolean = false;
  DisableMonsterCache: boolean = false;

  // Autoload Preferences:
  AutoloadText: boolean = true;
  AutoloadAvatar: boolean = true;

  get questStills(): {[mainQuestId: number]: {imageName: string, wikiName: string}[]} {
    if (!Object.keys(this.questBgPicImageToWikiName).length) {
      return null;
    }
    let out: {[mainQuestId: number]: {imageName: string, wikiName: string}[]} = defaultMap('Array');
    for (let [mqId, submap] of Object.entries(this.questBgPicImageToWikiName)) {
      for (let [imageName, wikiName] of Object.entries(submap)) {
        out[mqId].push({imageName, wikiName});
      }
    }
    return out;
  }

  override copy(): GenshinControlState {
    const state = new GenshinControlState(this.request);
    state.dialogueIdCache = new Set(this.dialogueIdCache);
    state.npcCache = Object.assign({}, this.npcCache);
    state.avatarCache = Object.assign({}, this.avatarCache);
    state.bookSuitCache = Object.assign({}, this.bookSuitCache);
    state.mqNameCache = Object.assign({}, this.mqNameCache);
    state.newActivityNameCache = Object.assign({}, this.newActivityNameCache);
    state.DisableAvatarCache = this.DisableAvatarCache;
    state.DisableNpcCache = this.DisableNpcCache;
    state.DisableMonsterCache = this.DisableMonsterCache;
    state.AutoloadText = this.AutoloadText;
    state.AutoloadAvatar = this.AutoloadAvatar;
    return undefined;
  }
}

export function getGenshinControl(request?: Request) {
  return new GenshinControl(request);
}
// endregion

// region Control Object
// --------------------------------------------------------------------------------------------------------------
export class GenshinControl extends AbstractControl<GenshinControlState> {
  // region Constructor
  readonly voice: GenshinVoice = new GenshinVoice();

  constructor(requestOrState?: Request|GenshinControlState) {
    super('genshin', 'genshin', 'Genshin', GenshinControlState, requestOrState);
    this.excelPath = './ExcelBinOutput';
  }

  static noDbConnectInstance() {
    const state = new GenshinControlState();
    state.NoDbConnect = true;
    return new GenshinControl(state);
  }

  override getDataFilePath(file: string): string {
    return getGenshinDataFilePath(file);
  }

  override normText(text: string, langCode: LangCode, opts: NormTextOptions<GenshinNormTextOpts> = {}): string {
    return __normGenshinText(text, langCode, opts);
  }

  override copy(): GenshinControl {
    return new GenshinControl(this.state.copy());
  }

  override i18n(key: keyof typeof GENSHIN_I18N_MAP, vars?: Record<string, string | number>): string {
    return genshin_i18n(key, this.outputLangCode, vars);
  }

  get travelerPageName() {
    switch (this.outputLangCode) {
      case 'CH':
      case 'CHS':
      case 'CHT':
        return '旅行者';
      case 'DE':
        return 'Reisende/r';
      case 'EN':
        return 'Traveler';
      case 'ES':
        return 'Viajero';
      case 'FR':
        return 'Voyageur';
      case 'ID':
        return 'Pengembara';
      case 'IT':
        return 'Viaggiatore';
      case 'JP':
        return '旅人';
      case 'KR':
        return '여행자';
      case 'PT':
        return 'Viajante';
      case 'RU':
        return 'Путешественник(ца)';
      case 'TH':
        return 'นักเดินทาง';
      case 'TR':
        return 'Gezgin';
      case 'VI':
        return 'Nhà Lữ Hành';
    }
  }
  // endregion

  // region Post Process
  postProcessCondProp(obj: any, prop: string) {
    if (!Array.isArray(obj[prop])) {
      return;
    }
    let condArray = obj[prop] as ConfigCondition[];
    let newCondArray: any[] = [];
    for (let cond of condArray) {
      if (!cond || typeof cond !== 'object' || Object.keys(cond).length === 0) {
        continue;
      }
      if (Array.isArray(cond.Param)) {
        cond.Param = cond.Param.filter(x => !!x);
        if (cond.Param.length) {
          newCondArray.push(cond);
        }
      } else {
        newCondArray.push(cond);
      }
    }
    if (newCondArray.length) {
      obj[prop] = newCondArray;
    } else {
      delete obj[prop];
    }
  }

  override async postProcess<T>(object: T, triggerNormalize?: SchemaTable | boolean, doNormText: boolean = false): Promise<T> {
    if (!object)
      return object;
    if (triggerNormalize) {
      object = normalizeRawJson(object, typeof triggerNormalize === 'boolean' ? null : triggerNormalize);
    }
    const objAsAny = object as any;
    for (let prop in object) {
      if (this.state.AutoloadText && (prop.endsWith('MapHash') || prop.endsWith('MapHashList'))) {
        let textProp = prop.endsWith('List') ? prop.slice(0, -11) + 'List' : prop.slice(0, -7);
        if (Array.isArray(object[prop])) {
          let newOriginalArray = [];
          object[textProp] = [];
          for (let id of <any[]>object[prop]) {
            let text = await this.getTextMapItem(this.outputLangCode, id);
            if (doNormText) {
              text = this.normText(text, this.outputLangCode);
            }
            if (text) {
              object[textProp].push(text);
              newOriginalArray.push(id);
            }
          }
          objAsAny[prop] = newOriginalArray;
        } else {
          let text = await this.getTextMapItem(this.outputLangCode, <TextMapHash> object[prop]);
          if (doNormText) {
            text = this.normText(text, this.outputLangCode);
          }
          if (!!text) {
            object[textProp] = text;
          }
        }
      }
      if (this.state.AutoloadText && prop.endsWith('Desc') && Array.isArray(object[prop]) && (<any[]>object[prop]).every(x => isInt(x))) {
        let textProp = 'Mapped' + prop;
        let newOriginalArray = [];
        object[textProp] = [];
        for (let id of <any[]>object[prop]) {
          let text = await this.getTextMapItem(this.outputLangCode, id);
          if (doNormText) {
            text = this.normText(text, this.outputLangCode);
          }
          if (text) {
            object[textProp].push(text);
            newOriginalArray.push(id);
          }
        }
        objAsAny[prop] = newOriginalArray;
      }
      if (this.state.AutoloadText && prop.endsWith('Tips') && Array.isArray(object[prop])) {
        let textProp = 'Mapped' + prop;
        let newOriginalArray = [];
        object[textProp] = [];
        for (let id of <any[]>object[prop]) {
          let text = await this.getTextMapItem(this.outputLangCode, id);
          if (doNormText) {
            text = this.normText(text, this.outputLangCode);
          }
          if (text) {
            object[textProp].push(text);
            newOriginalArray.push(id);
          }
        }
        objAsAny[prop] = newOriginalArray;
      }
      if (this.state.AutoloadText && prop.endsWith('ElementType') || prop.endsWith('ElementTypes')) {
        let newProp = prop.replace('ElementType', 'ElementName');
        if (typeof object[prop] === 'string') {
          object[newProp] = await this.getElementName(object[prop] as ElementType, this.outputLangCode);
        } else if (Array.isArray(object[prop])) {
          let newArray = [];
          for (let item of <any[]>object[prop]) {
            if (typeof item === 'string' && item !== 'None') {
              newArray.push(await this.getElementName(item as ElementType, this.outputLangCode));
            }
          }
          object[newProp] = newArray;
        }
      }
      if (prop.endsWith('Cond') && objAsAny[prop]) {
        this.postProcessCondProp(objAsAny, prop);
      }
      if (prop.endsWith('Exec') && objAsAny[prop]) {
        this.postProcessCondProp(objAsAny, prop);
      }
      if (this.state.AutoloadAvatar && prop === 'AvatarId' && typeof objAsAny[prop] === 'number') {
        objAsAny.Avatar = await this.selectAvatarById(objAsAny[prop]);
      }
      if (object[prop] === null || objAsAny[prop] === '') {
        delete object[prop];
      }
    }
    return object;
  }

  async getElementName(elementType: ElementType|GCGTagElementType, langCode: LangCode = 'EN'): Promise<string> {
    let hash = ManualTextMapHashes[elementType];
    if (!hash) {
      hash = ManualTextMapHashes['None'];
    }
    return await this.getTextMapItem(langCode, hash);
  }
  // endregion

  // region NPC
  async getNpc(npcId: number): Promise<NpcExcelConfigData> {
    if (!npcId) return null;
    return await this.getNpcList([ npcId ]).then(x => x && x.length ? x[0] : null);
  }

  async getNpcList(npcIds: number[], addToCache: boolean = true): Promise<NpcExcelConfigData[]> {
    if (!npcIds || !npcIds.length) return [];

    let notCachedIds = npcIds.filter(id => !this.state.npcCache[id]);
    let cachedList = npcIds.map(id => this.state.npcCache[id]).filter(x => !!x);

    let uncachedList: NpcExcelConfigData[] = await this.knex.select('*').from('NpcExcelConfigData')
      .whereIn('Id', notCachedIds).then(this.commonLoad);

    if (addToCache && !this.state.DisableNpcCache) {
      uncachedList.forEach(npc => this.state.npcCache[npc.Id] = npc);
    }

    return cachedList.concat(uncachedList);
  }

  async selectNpcListByName(nameOrTextMapHash: TextMapHash|TextMapHash[]): Promise<NpcExcelConfigData[]> {
    if (typeof nameOrTextMapHash === 'string') {
      nameOrTextMapHash = await this.findTextMapHashesByExactName(nameOrTextMapHash);
    }
    if (typeof nameOrTextMapHash === 'number') {
      nameOrTextMapHash = [ nameOrTextMapHash ];
    }
    return await this.knex.select('*').from('NpcExcelConfigData')
      .whereIn('NameTextMapHash', nameOrTextMapHash).then(this.commonLoad);
  }
  // endregion

  // region Chapters
  private async postProcessChapter(chapter: ChapterExcelConfigData, orderQuests: boolean): Promise<ChapterExcelConfigData> {
    if (!chapter)
      return chapter;
    chapter.Quests = await this.selectMainQuestsByChapterId(chapter.Id);
    chapter.Type = chapter.Quests.find(x => x.Type)?.Type;
    if (chapter.Id === 1105) {
      chapter.Type = 'AQ';
    }

    if (orderQuests) {
      chapter.OrderedQuests = await orderChapterQuests(this, chapter);
    }

    let ChapterNumTextEN = await this.getTextMapItem('EN', chapter.ChapterNumTextMapHash);

    if (chapter.ChapterNumText && (chapter.ChapterNumText.includes(':') || chapter.ChapterNumText.includes('-'))) {
      let chapterPart: string;
      let actPart: string;

      let chapterPartEN: string;
      let actPartEN: string;

      if (chapter.ChapterNumText.includes(':')) {
        [chapterPart, actPart]     = chapter.ChapterNumText.split(':', 2).map(x => x.trim());
        [chapterPartEN, actPartEN] = ChapterNumTextEN.split(':', 2).map(x => x.trim());
      } else if (chapter.ChapterNumText.includes('-')) {
        [chapterPart, actPart]     = chapter.ChapterNumText.split('-', 2).map(x => x.trim());
        [chapterPartEN, actPartEN] = ChapterNumTextEN.split('-', 2).map(x => x.trim());
      }

      chapter.Summary = {
        ChapterNum: romanToInt(extractRomanNumeral(chapterPart)),
        ChapterRoman: extractRomanNumeral(chapterPart),
        ChapterNumText: chapterPart,
        ChapterName: chapter.ChapterImageTitleText,

        ActNum: romanToInt(extractRomanNumeral(actPart)),
        ActRoman: extractRomanNumeral(actPart),
        ActNumText: actPart,
        ActName: chapter.ChapterTitleText,
        ActType: '',

        AQCode: '',
      };
      if (actPartEN && actPartEN.includes('Act')) {
        chapter.Summary.ActType = 'Act';
      } else if (actPartEN && actPartEN.includes('Part')) {
        chapter.Summary.ActType = 'Part';
      } else if (actPartEN && actPartEN.includes('Day')) {
        chapter.Summary.ActType = 'Day';
      } else if (actPartEN && actPartEN.includes('Round')) {
        chapter.Summary.ActType = 'Round';
      } else {
        chapter.Summary.ActType = 'None';
      }
      if (chapter.Type === 'AQ' && chapterPartEN && chapterPartEN.includes('Prologue')) {
        chapter.Summary.ChapterNum = 0;
      }
      if (chapter.Type === 'AQ' && chapterPartEN && chapterPartEN.includes('Interlude Chapter')) {
        chapter.Summary.AQCode += 'IC';
      } else if (chapter.Summary.ChapterNum >= 0) {
        chapter.Summary.AQCode += 'C' + chapter.Summary.ChapterNum;
      }
      if (chapter.Summary.ActNum >= 0) {
        chapter.Summary.AQCode += 'A' + chapter.Summary.ActNum;
      }
    } else {
      chapter.Summary = {
        ChapterNum: -1,
        ChapterRoman: null,
        ChapterNumText: null,
        ChapterName: chapter.ChapterImageTitleText,

        ActNum: -1,
        ActRoman: null,
        ActNumText: null,
        ActName: chapter.ChapterTitleText,
        ActType: null,

        AQCode: null,
      };
    }

    return chapter;
  }

  private async postProcessChapters(chapters: ChapterExcelConfigData[], orderQuests: boolean): Promise<ChapterExcelConfigData[]> {
    return Promise.all(chapters.map(x => this.postProcessChapter(x, orderQuests))).then(arr => arr.filter(item => !!item));
  }

  async selectAllChapters(): Promise<ChapterExcelConfigData[]> {
    return await this.knex.select('*').from('ChapterExcelConfigData')
      .then(this.commonLoad).then(x => this.postProcessChapters(x, false));
  }

  generateChapterCollection(chapters: ChapterExcelConfigData[]): ChapterCollection {
    let map: ChapterCollection = {
      AQ: {},
      SQ: {},
      EQ: {},
      WQ: {},
      IQ: {},
    };

    for (let chapter of chapters) {
      if (!chapter.Type || !chapter.ChapterTitleText) {
        continue;
      }

      let chapterName = chapter.Summary.ChapterNumText || 'No Chapter';
      let subChapterName = chapter.Summary.ChapterName || 'No Sub-Chapter';

      if (!map[chapter.Type][chapterName]) {
        map[chapter.Type][chapterName] = [];
      }

      if (chapter.Type === 'EQ' || chapter.Type === 'WQ') {
        map[chapter.Type][chapterName].push(chapter);
      } else {
        if (!map[chapter.Type][chapterName][subChapterName]) {
          map[chapter.Type][chapterName][subChapterName] = [];
        }
        map[chapter.Type][chapterName][subChapterName].push(chapter);
      }
    }

    return map;
  }

  async selectChapterCollection(): Promise<ChapterCollection> {
    return this.generateChapterCollection(await this.selectAllChapters());
  }

  async selectChapterById(id: number, orderQuests: boolean = true): Promise<ChapterExcelConfigData> {
    return await this.knex.select('*').from('ChapterExcelConfigData').where({Id: id})
      .first().then(this.commonLoadFirst).then(x => this.postProcessChapter(x, orderQuests));
  }

  async searchChapters(query: string|number): Promise<ChapterExcelConfigData[]> {
    if (typeof query === 'string') {
      const chapterIds: number[] = [];

      await this.streamTextMapMatchesWithIndex({
        inputLangCode: this.inputLangCode,
        outputLangCode: this.outputLangCode,
        searchText: query,
        textIndexName: 'Chapter',
        stream(entityId: number) {
          chapterIds.push(entityId);
        },
        flags: this.searchModeFlags
      });

      return await this.knex.select('*').from('ChapterExcelConfigData')
        .whereIn('Id', chapterIds)
        .then(this.commonLoad).then(ret => ret.asyncMap(x => this.postProcessChapter(x, true)));
    } else {
      const x = await this.selectChapterById(query, true);
      return x ? [x] : [];
    }
  }
  // endregion

  // region Main Quest Excel
  private postProcessMainQuest(mainQuest: MainQuestExcelConfigData): MainQuestExcelConfigData {
    if (!mainQuest) {
      return mainQuest;
    }
    let tempType: string = mainQuest.Type;

    if (!tempType && mainQuest.LuaPath && /Quest\/[ALEWMI]Q/.test(mainQuest.LuaPath)) {
      tempType = /Quest\/([ALEWMI]Q)/.exec(mainQuest.LuaPath)[1];
    }
    if (tempType === 'MQ') {
      tempType = 'AQ';
    }
    if (tempType === 'LQ') {
      tempType = 'SQ';
    }
    mainQuest.Type = tempType as QuestType;
    return mainQuest;
  }

  private postProcessMainQuests(mainQuestList: MainQuestExcelConfigData[]): MainQuestExcelConfigData[] {
    return mainQuestList.map(mainQuest => this.postProcessMainQuest(mainQuest)).filter(x => !!x);
  }

  async searchMainQuests(query: string|number): Promise<MainQuestExcelConfigData[]> {
    if (typeof query === 'string') {
      const mainQuestIds: number[] = [];
      await this.streamTextMapMatchesWithIndex({
        inputLangCode: this.inputLangCode,
        outputLangCode: this.outputLangCode,
        searchText: query,
        textIndexName: 'MainQuest',
        stream(entityId: number) {
          mainQuestIds.push(entityId);
        },
        flags: this.searchModeFlags
      });
      return await this.knex.select('*').from('MainQuestExcelConfigData')
        .whereIn('Id', mainQuestIds)
        .then(this.commonLoad).then(x => this.postProcessMainQuests(x));
    } else {
      const x = await this.selectMainQuestById(query);
      return x ? [x] : [];
    }
  }

  async doesQuestExist(id: number): Promise<boolean> {
    let result = await this.knex.select('*').from('MainQuestExcelConfigData')
      .where({Id: id}).first();
    return !!result;
  }

  async selectAllMainQuests(): Promise<MainQuestExcelConfigData[]> {
    return await this.knex.select('*').from('MainQuestExcelConfigData')
      .then(this.commonLoad).then(ret => ret.map((x) => this.postProcessMainQuest(x)));
  }

  async selectMainQuestById(id: number): Promise<MainQuestExcelConfigData> {
    return await this.knex.select('*').from('MainQuestExcelConfigData')
      .where({Id: id}).first().then(this.commonLoadFirst).then(x => this.postProcessMainQuest(x));
  }

  async selectMainQuestName(id: number): Promise<string> {
    if (!id) {
      return undefined;
    }
    if (!!this.state.mqNameCache[id]) {
      return this.state.mqNameCache[id];
    }
    let name = await this.knex.select('TitleTextMapHash').from('MainQuestExcelConfigData')
      .where({Id: id}).first().then(async res => res ? await this.getTextMapItem(this.outputLangCode, res.TitleTextMapHash) : undefined);
    this.state.mqNameCache[id] = name;
    return name;
  }

  async selectMainQuestsByChapterId(chapterId: number): Promise<MainQuestExcelConfigData[]> {
    return await this.knex.select('*').from('MainQuestExcelConfigData')
      .where({ChapterId: chapterId}).then(this.commonLoad).then(x => this.postProcessMainQuests(x));
  }

  async selectMainQuestsBySeries(series: number): Promise<MainQuestExcelConfigData[]> {
    return await this.knex.select('*').from('MainQuestExcelConfigData')
      .where({Series: series}).then(this.commonLoad).then(x => this.postProcessMainQuests(x));
  }

  async selectReputationQuestExcelConfigData(parentQuestId: number): Promise<ReputationQuestExcelConfigData> {
    let rep: ReputationQuestExcelConfigData = await this.knex.select('*')
      .from('ReputationQuestExcelConfigData')
      .where({ParentQuestId: parentQuestId})
      .first().then(this.commonLoadFirst);

    if (!rep) {
      return null;
    }

    rep.CityName = await this.selectCityNameById(rep.CityId);
    rep.Reward = await this.selectRewardExcelConfigData(rep.RewardId);
    return rep;
  }
  // endregion

  // region Chapter/Main Quest Combined Search

  async searchMainQuestsAndChapters(query: string|number): Promise<{
    mainQuests: MainQuestExcelConfigData[],
    chapters: ChapterExcelConfigData[],
  }> {
    if (typeof query === 'string') {
      const mainQuestIds: number[] = [];
      const chapterIds: number[] = [];

      await this.streamTextMapMatchesWithIndex({
        inputLangCode: this.inputLangCode,
        outputLangCode: this.outputLangCode,
        searchText: query,
        textIndexName: ['MainQuest', 'Chapter'],
        stream(entityId: number, entityIndexName: string) {
          if (entityIndexName === 'MainQuest') {
            mainQuestIds.push(entityId);
          }
          if (entityIndexName === 'Chapter') {
            chapterIds.push(entityId);
          }
        },
        flags: this.searchModeFlags
      });

      return {
        mainQuests: await this.knex.select('*').from('MainQuestExcelConfigData')
          .whereIn('Id', mainQuestIds)
          .then(this.commonLoad).then(x => this.postProcessMainQuests(x)),
        chapters: await this.knex.select('*').from('ChapterExcelConfigData')
          .whereIn('Id', chapterIds)
          .then(this.commonLoad).then(ret => ret.asyncMap(x => this.postProcessChapter(x, true)))
      }
    } else {
      const mainQuest = await this.selectMainQuestById(query);
      const chapter = await this.selectChapterById(query);
      return {
        mainQuests: mainQuest ? [mainQuest] : [],
        chapters: chapter ? [chapter] : [],
      }
    }
  }
  // endregion

  // region Quest Excel
  async selectAllQuestExcelConfigDataByMainQuestId(id: number): Promise<QuestExcelConfigData[]> {
    return await this.knex.select('*').from('QuestExcelConfigData')
      .where({MainId: id}).then(this.commonLoad)
      .then(quests => quests.sort(this.sortByOrder));
  }

  async selectQuestExcelConfigData(id: number|string): Promise<QuestExcelConfigData> {
    if (typeof id === 'string') {
      id = parseInt(id);
    }
    return await this.knex.select('*').from('QuestExcelConfigData')
      .where({SubId: id}).first().then(this.commonLoadFirst);
  }

  async selectMainQuestIdByQuestExcelId(id: number): Promise<number> {
    if (!id) {
      return undefined;
    }
    return await this.knex.select('MainId').from('QuestExcelConfigData')
      .where({SubId: id}).first().then(res => res.MainId);
  }
  // endregion

  // region Manual Text Map
  async selectManualTextMapConfigDataById(id: string): Promise<ManualTextMapConfigData> {
    return await this.knex.select('*').from('ManualTextMapConfigData')
      .where({TextMapId: id}).first().then(this.commonLoadFirst);
  }
  // endregion

  // region Talk Excel

  private async postProcessTalkExcel(talk: TalkExcelConfigData): Promise<TalkExcelConfigData> {
    if (!talk) {
      return talk;
    }
    if (!talk.LoadType) {
      talk.LoadType = 'TALK_DEFAULT';
    }
    if (talk.NpcId && talk.NpcId.length) {
      let dataList: NpcExcelConfigData[] = await this.getNpcList(talk.NpcId, false);
      talk.NpcDataList = dataList;
      talk.NpcNameList = dataList.map(x => x.NameText);
    }

    // Handle InterAction overloading InitDialog:
    if (talk.PerformCfg) {
      const iaFile = await this.loadInterActionFileByName(talk.PerformCfg);
      talk.InterActionFile = iaFile.Name;

      const initDialog = iaFile.findDialog(talk.InitDialog);
      const firstDialog = iaFile.findFirstDialog();

      if (firstDialog.isPresent() && (initDialog.isPresent() || firstDialog.DialogId < talk.InitDialog)) {
        // console.log('PerformCfg', talk.Id, iaFile.Name, talk.InitDialog, firstDialog.DialogId, talk.InitDialog === firstDialog.DialogId);
        talk.InitDialog = firstDialog.DialogId;
      }
    } else if (talk.InitDialog) {
      const iaFile = await this.loadInterActionFileByDialogId(talk.InitDialog);
      talk.InterActionFile = iaFile.Name;

      let curr: InterActionDialog = iaFile.findDialog(talk.InitDialog);
      if (curr.isPresent()) {
        let didBreak: boolean = false;
        let loopCount: number = 0;
        const loopLimit: number = 100;

        while (curr.isPresent()) {
          const prevDialogIds = curr.prev(true);
          // console.log('LOOP', curr.DialogId, prevDialogIds);
          if (!prevDialogIds || !prevDialogIds.length) {
            break;
          }
          curr = iaFile.findDialog(prevDialogIds[0]);

          if (++loopCount >= loopLimit) {
            didBreak = true;
            break;
          }
        }

        if (!didBreak) {
          // console.log('Talk: ', talk.Id, '; InitDialog:', talk.InitDialog, '; TrueInitDialog:', curr.DialogId, '; IsSame:', talk.InitDialog === curr.DialogId);
          talk.InitDialog = curr.DialogId;
        }
      }
    }
    return talk;
  }

  async selectTalkExcelConfigDataById(id: number, loadType: TalkLoadType = null): Promise<TalkExcelConfigData> {
    return await this.knex.select('*').from('TalkExcelConfigData')
      .where(cleanEmpty({Id: id, LoadType: loadType}))
      .orWhere(cleanEmpty({QuestCondStateEqualFirst: id, LoadType: loadType})).first()
      .then(this.commonLoadFirst)
      .then(x => this.postProcessTalkExcel(x));
  }

  async selectTalkExcelConfigDataByQuestSubId(id: number, loadType: TalkLoadType = null): Promise<TalkExcelConfigData> {
    return this.selectTalkExcelConfigDataById(id, loadType);
  }

  async selectTalkExcelConfigDataByFirstDialogueId(firstDialogueId: number, loadType: TalkLoadType = null): Promise<TalkExcelConfigData> {
    return await this.knex.select('*').from('TalkExcelConfigData')
      .where(cleanEmpty({InitDialog: firstDialogueId, LoadType: loadType})).first()
      .then(this.commonLoadFirst)
      .then(x => this.postProcessTalkExcel(x));
  }

  async selectTalkExcelConfigDataListByFirstDialogueId(firstDialogueId: number, loadType: TalkLoadType = null): Promise<TalkExcelConfigData[]> {
    return await this.knex.select('*').from('TalkExcelConfigData')
      .where(cleanEmpty({InitDialog: firstDialogueId, LoadType: loadType})).then(this.commonLoad)
      .then(rows => rows.asyncMap(x => this.postProcessTalkExcel(x)));
  }

  async selectTalkExcelConfigDataByQuestId(questId: number, loadType: TalkLoadType = null): Promise<TalkExcelConfigData[]> {
    return await this.knex.select('*').from('TalkExcelConfigData')
      .where(cleanEmpty({QuestId: questId, LoadType: loadType}))
      .orWhere(cleanEmpty({QuestCondStateEqualFirst: questId, LoadType: loadType})).then(this.commonLoad)
      .then(rows => rows.asyncMap(x => this.postProcessTalkExcel(x)));
  }

  async selectTalkExcelConfigDataByNpcId(npcId: number, loadType: TalkLoadType = null): Promise<TalkExcelConfigData[]> {
    let talkIds: number[] = await this.knex.select('TalkId').from('Relation_NpcToTalk')
      .where(cleanEmpty({NpcId: npcId, TalkLoadType: loadType})).pluck('TalkId').then();
    return Promise.all(talkIds.map(talkId => this.selectTalkExcelConfigDataById(talkId)));
  }
  // endregion

  // region Dialog Unparented Select
  async selectDialogUnparentedByMainQuestId(mainQuestId: number): Promise<DialogUnparented[]> {
    return await this.knex.select('*').from('DialogUnparentedExcelConfigData')
      .where({MainQuestId: mainQuestId}).then(this.commonLoad);
  }

  async selectDialogUnparentedByDialogId(dialogId: number): Promise<DialogUnparented> {
    return await this.knex.select('*').from('DialogUnparentedExcelConfigData')
      .where({DialogId: dialogId}).first().then(this.commonLoadFirst);
  }
  // endregion

  // region Dialog Excel Select
  private async postProcessDialog(dialog: DialogExcelConfigData): Promise<DialogExcelConfigData> {
    if (!dialog) {
      return dialog;
    }
    if (dialog.TalkRole) {
      let TalkRole: TalkRole = dialog.TalkRole;
      let TalkRoleId: number;

      if (TalkRole.Id === 'PLAYER') {
        delete TalkRole.Id;
      }

      if (typeof TalkRole.Id === 'string') {
        TalkRoleId = parseInt(TalkRole.Id);
        if (isNaN(TalkRoleId)) {
          TalkRole.NameText = TalkRole.Id as string;
        }
      } else {
        TalkRoleId = TalkRole.Id;
      }

      if (TalkRole.Type !== 'TALK_ROLE_PLAYER' && TalkRole.Type !== 'TALK_ROLE_MATE_AVATAR' && TalkRole.Type !== 'TALK_ROLE_WIKI_CUSTOM' && !this.isBlackScreenDialog(dialog) && !TalkRole.Id) {
        TalkRole.Type = 'TALK_ROLE_PLAYER';
      }

      if (TalkRole.Type === 'TALK_ROLE_PLAYER') {
        delete TalkRole.Id;
      } else {
        let npc = await this.getNpc(TalkRoleId);
        if (npc) {
          TalkRole.NameTextMapHash = npc.NameTextMapHash;
          TalkRole.NameText = npc.NameText;
        }
      }
    }
    if (!dialog.TalkRoleNameText && !!dialog.TalkRole) {
      dialog.TalkRoleNameText = dialog.TalkRole.NameText;
      dialog.TalkRoleNameTextMapHash = dialog.TalkRole.NameTextMapHash;
    }
    if (dialog.ActionAfter && this.givingDialogActions.has(dialog.ActionAfter)) {
      // TODO
    }
    return dialog;
  }

  // Must set NextDialogs on the returned DialogExcel at some point!
  private async makeFakeDialog(id: number|string, addon: Partial<DialogExcelConfigData>): Promise<DialogExcelConfigData> {
    if (typeof id === 'string') {
      // Simple hash to number:
      let hash = 0, len = id.length;
      for (let i = 0; i < len; i++) {
        hash  = ((hash << 5) - hash) + id.charCodeAt(i);
        hash |= 0; // to 32bit integer
      }
      if (hash < 0) {
        hash = parseInt('1'+String(hash).slice(1));
      }
      id = hash;
    }

    // Pad 9's up to 15 digits to not clash with any existing Dialogue IDs...
    // Using 15 digits because the MAX_SAFE_INTEGER has 16 digits
    id = parseInt(String(id).padStart(15, '9'));

    return await this.postProcessDialog(Object.assign({
      Id: id,
      NextDialogs: null,
      TalkRole: {
        Type: 'TALK_ROLE_WIKI_CUSTOM'
      }
    }, addon));
  }

  async selectDialogExcelConfigDataByTalkRoleId(talkRoleId: number, noAddCache: boolean = false): Promise<DialogExcelConfigData[]> {
    const dialogs: DialogExcelConfigData[] = await this.knex.select('*')
      .from('DialogExcelConfigData')
      .where({TalkRoleId: talkRoleId}).then(this.commonLoad);
    return dialogs.asyncMap(async d => {
      await this.postProcessDialog(d);
      this.saveToDialogIdCache(d, noAddCache);
      return d;
    });
  }

  async selectDialogExcelConfigDataByTalkId(talkId: number, noAddCache: boolean = false): Promise<DialogExcelConfigData[]> {
    const dialogs: DialogExcelConfigData[] = await this.knex.select('*')
      .from('DialogExcelConfigData')
      .where({TalkId: talkId}).then(this.commonLoad);
    return dialogs.asyncMap(async d => {
      await this.postProcessDialog(d);
      this.saveToDialogIdCache(d, noAddCache);
      return d;
    });
  }

  async selectPreviousDialogs(nextId: number, noAddCache: boolean = false): Promise<DialogExcelConfigData[]> {
    const ids: number[] = await this.knex.select('*')
      .from('Relation_DialogToNext')
      .where({NextId: nextId}).pluck('DialogId').then();
    return this.selectMultipleDialogExcelConfigData(arrayUnique(ids), noAddCache);
  }

  async selectSingleDialogExcelConfigData(id: number, noAddCache: boolean = false): Promise<DialogExcelConfigData> {
    let result: DialogExcelConfigData = await this.knex.select('*')
      .from('DialogExcelConfigData')
      .where({Id: id}).first().then(this.commonLoadFirst);
    if (!result) {
      return result;
    }
    result = await this.postProcessDialog(result);
    this.saveToDialogIdCache(result, noAddCache);
    return result && result.TalkContentText ? result : null;
  }

  async selectDialogsFromTextMapHash(textMapHash: TextMapHash, noAddCache: boolean = false): Promise<DialogExcelConfigData[]> {
    let results: DialogExcelConfigData[] = await this.knex.select('*')
      .from('DialogExcelConfigData')
      .where({TalkContentTextMapHash: textMapHash})
      .then(this.commonLoad);
    await results.asyncMap(async d => {
      await this.postProcessDialog(d);
      this.saveToDialogIdCache(d, noAddCache);
    });
    return results;
  }

  async selectMultipleDialogExcelConfigData(ids: number[], noAddCache: boolean = false): Promise<DialogExcelConfigData[]> {
    if (!ids.length) {
      return [];
    }
    let results: DialogExcelConfigData[] = await this.knex.select('*')
      .from('DialogExcelConfigData')
      .whereIn('Id', ids)
      .then(this.commonLoad);

    await results.asyncMap(async d => {
      await this.postProcessDialog(d);
      this.saveToDialogIdCache(d, noAddCache);
    });

    return results.filter(x => !!x && !!x.TalkContentText);
  }
  // endregion

  // region Dialog Cache Ops
  saveToDialogIdCache(x: DialogExcelConfigData, noAddCache: boolean = false): void {
    if (!noAddCache) {
      this.state.dialogueIdCache.add(x.Id);
    }
  }
  isInDialogIdCache(x: number|DialogExcelConfigData): boolean {
    return this.state.dialogueIdCache.has(typeof x === 'number' ? x : x.Id);
  }
  copyDialogForRecurse(node: DialogExcelConfigData) {
    let copy: DialogExcelConfigData = JSON.parse(JSON.stringify(node));
    copy.Recurse = true;
    return copy;
  }
  // endregion

  // region Dialog Checks
  isPlayerTalkRole(dialog: DialogExcelConfigData): boolean {
    if (!dialog)
      return false;
    return dialog.TalkRole.Type === 'TALK_ROLE_PLAYER' || !!dialog.OptionIcon;
  }

  private givingDialogActions: Set<string> = new Set<string>([
    'SimpleTalk/Open_giving_page_End',
    'UI/open_giving_page'
  ]);

  isPlayerDialogOption(dialog: DialogExcelConfigData): boolean {
    if (!dialog)
      return false;
    return this.isPlayerTalkRole(dialog) && !dialog.PlayerNonOption && !this.voice.hasVoiceItems('Dialog', dialog.Id);
  }

  isBlackScreenDialog(dialog: DialogExcelConfigData): boolean {
    if (!dialog)
      return false;
    return dialog.TalkRole.Type === 'TALK_ROLE_BLACK_SCREEN' || dialog.TalkRole.Type === 'TALK_ROLE_CONSEQUENT_BLACK_SCREEN'
      || dialog.TalkRole.Type === 'TALK_ROLE_NEED_CLICK_BLACK_SCREEN' || dialog.TalkRole.Type === 'TALK_ROLE_CONSEQUENT_NEED_CLICK_BLACK_SCREEN';
  }
  // endregion

  // region Dialog Logic
  async selectDialogBranch(mainQuestId: number, start: DialogExcelConfigData, cache?: DialogBranchingCache, debugSource?: string|number): Promise<DialogExcelConfigData[]> {
    if (!start)
      return [];
    if (!debugSource)
      debugSource = 'any';
    if (!cache)
      cache = new DialogBranchingCache(null, null);

    const debug: debug.Debugger = custom('dialog:' + debugSource+',dialog:' + start.Id);
    const detailedDebug: debug.Debugger = custom('dialog:' + debugSource+':detailed,dialog:' + start.Id+':detailed');
    const CQG: CodexQuestGroup = await this.selectCodexQuest(mainQuestId);
    const mqName: string = await this.selectMainQuestName(mainQuestId);

    const currBranch: DialogExcelConfigData[] = [];

    if (cache.dialogToBranch.hasOwnProperty(start.Id)) {
      debug('Selecting dialog branch for ' + start.Id + ' (already seen)', cache.dialogToBranch[start.Id]);
      return cache.dialogToBranch[start.Id];
    } else {
      debug('Selecting dialog branch for ' + start.Id);
      cache.dialogToBranch[start.Id] = currBranch;
    }

    let currNode: DialogExcelConfigData = start;

    // Loop over dialog nodes:
    while (currNode) {
      // Handle if seen already:
      if (cache.dialogSeenAlready.has(currNode.Id)) {
        currBranch.push(this.copyDialogForRecurse(currNode));
        break;
      } else {
        cache.dialogSeenAlready.add(currNode.Id);
      }

      // Load InterAction
      const iaFile: InterActionFile = await this.loadInterActionFileByDialogId(currNode.Id);
      const iaDialog: InterActionDialog = iaFile.findDialog(currNode.Id);

      if (iaDialog.isPresent() && this.isPlayerTalkRole(currNode) && iaDialog.Action.Type === 'DIALOG') {
        currNode.PlayerNonOption = true;
      }

      // Handle self:
      if (currNode.TalkContentText || currNode.CustomTravelLogMenuText
          || currNode.CustomImageName || currNode.CustomSecondImageName || currNode.CustomWikiTx
          || currNode.CustomWikiReadable) {
        currBranch.push(currNode);
      }

      // Fetch next nodes:
      const iaNextDialogs: InterActionNextDialogs = iaDialog.next();
      const nextNodes: DialogExcelConfigData[] = await this.selectMultipleDialogExcelConfigData(
        iaDialog.isPresent()
          ? iaNextDialogs.NextDialogs
          : currNode.NextDialogs
      );
      const fakeDialogs: DialogExcelConfigData[] = [];

      detailedDebug('Curr Node:', currNode.Id, '/ Next Nodes:', nextNodes.map(x => x.Id).join());

      // Handle InterAction intermediates
      if (iaNextDialogs.Intermediates.length) {
        for (let i = 0; i < iaNextDialogs.Intermediates.length; i++) {
          const action = iaNextDialogs.Intermediates[i];
          if (action.Type === 'SHOW_BG_PIC' || (action.Type === 'UI_TRIGGER' && action.ContextName === 'ShowCGDialog')) {
            const CustomImageName: string =
              action.ContextName === 'ShowCGDialog'
                ? path.basename(String(action.Param))
                : path.basename(action.PicPath);

            if (!CustomImageName) {
              continue;
            }

            let imageNumber: number;
            if (this.state.questBgPicSeen[mainQuestId][CustomImageName]) {
              imageNumber = this.state.questBgPicSeen[mainQuestId][CustomImageName];
            } else {
              imageNumber = this.state.questBgPicCounter[mainQuestId];
              this.state.questBgPicCounter[mainQuestId] = imageNumber + 1;
              this.state.questBgPicSeen[mainQuestId][CustomImageName] = imageNumber;
            }
            //console.log('IA', CustomImageName, imageNumber, iaNextDialogs.Intermediates); // TODO

            const genWikiName = (o: InterAction): string => {
              let wikiName = (mqName ? mqName + ' ' : '') + 'Quest Still ' + imageNumber;
              if (o.Flag === 1)
                wikiName += ' Aether';
              if (o.Flag === 2)
                wikiName += ' Lumine';
              return wikiName;
            };

            const addon: Partial<DialogExcelConfigData> = {};

            if (action.Flag === 2) {
              addon.CustomSecondImageName = CustomImageName;
              addon.CustomSecondImageWikiName = genWikiName(action);
              this.state.questBgPicImageToWikiName[mainQuestId][addon.CustomSecondImageName] = addon.CustomSecondImageWikiName;
            } else {
              addon.CustomImageName = CustomImageName;
              addon.CustomImageWikiName = genWikiName(action);
              this.state.questBgPicImageToWikiName[mainQuestId][addon.CustomImageName] = addon.CustomImageWikiName;
            }

            if (action.Flag === 1 || action.Flag === 2) {
              let nextAction = iaNextDialogs.Intermediates[i + 1];
              if (nextAction && nextAction.Type === 'SHOW_BG_PIC' && (nextAction.Flag === 1 || nextAction.Flag === 2)) {
                if (nextAction.Flag === 2) {
                  addon.CustomSecondImageName = path.basename(nextAction.PicPath);
                  addon.CustomSecondImageWikiName = genWikiName(nextAction);
                  this.state.questBgPicImageToWikiName[mainQuestId][addon.CustomSecondImageName] = addon.CustomSecondImageWikiName;
                } else {
                  addon.CustomImageName = path.basename(nextAction.PicPath);
                  addon.CustomImageWikiName = genWikiName(nextAction);
                  this.state.questBgPicImageToWikiName[mainQuestId][addon.CustomImageName] = addon.CustomImageWikiName;
                }
                i++; // skip next action as we've just handled it
              }
            }

            fakeDialogs.push(await this.makeFakeDialog(action.ActionId, addon));
          } else if (action.Type === 'CUTSCENE') {

          } else if (action.Type === 'VIDEO_PLAY') {

          } else if (action.Type === 'UI_TRIGGER' && action.ContextName === 'QuestPictureDialog') {
            fakeDialogs.push(await this.makeFakeDialog(action.ActionId, {
              CustomWikiTx: 'Missing quest item picture',
            }));
          } else if (action.Type === 'UI_TRIGGER' && action.ContextName === 'QuestReadingDialog' && isInt(action.Param)) {
            const readable = await this.selectReadable(toInt(action.Param), true);
            if (readable) {
              fakeDialogs.push(await this.makeFakeDialog(action.ActionId, {
                CustomWikiReadable: readable
              }));
              this.state.inDialogueReadables[mainQuestId].push(readable);
            }
          }
        }
      }

      // Handle codex quest (Travel Log):
      const selfCodexQuest = CQG.ByContentTextMapHash[currNode.TalkContentTextMapHash];
      if (selfCodexQuest) {
        let codexQuest = CQG.ByItemId[selfCodexQuest.NextItemId];

        while (!!codexQuest && !codexQuest.AssociatedDialogId && CodexQuestNarratageTypes.has(codexQuest.ContentTextType)) {
          const matchingDialogNode: DialogExcelConfigData = nextNodes.find(n => n.TalkContentTextMapHash === codexQuest.ContentTextMapHash);
          const isBlackScreen: boolean = this.isBlackScreenDialog(matchingDialogNode);

          if (!isBlackScreen) {
            fakeDialogs.push(await this.makeFakeDialog(codexQuest.Id, {
              CustomTravelLogMenuText: codexQuest.ContentText,
              CustomTravelLogMenuTextMapHash: codexQuest.ContentTextMapHash,
            }));
          }
          codexQuest = CQG.ByItemId[codexQuest.NextItemId];
        }
      }

      // Handle next nodes backfill for fake dialogs (if needed)
      if (fakeDialogs.length) {
        for (let i = 0; i < fakeDialogs.length; i++) {
          let fakeDialog = fakeDialogs[i];
          let nextFakeDialog = fakeDialogs[i+1];
          if (nextFakeDialog) {
            fakeDialog.NextDialogs = [nextFakeDialog.Id];
          } else {
            fakeDialog.NextDialogs = nextNodes.map(n => n.Id);
          }
        }
        currBranch.push(... fakeDialogs);
      }

      // Handle next nodes:
      if (nextNodes.length === 1) {
        // If only one next node -> same branch
        currNode = nextNodes[0];
      } else if (nextNodes.length > 1) {
        // If multiple next nodes -> branching

        const branches: DialogExcelConfigData[][] = [];
        for (let nextNode of nextNodes) {
          branches.push(await this.selectDialogBranch(mainQuestId, nextNode, DialogBranchingCache.from(cache), debugSource + ':' + start.Id));
        }

        const intersect: DialogExcelConfigData[] = arrayIntersect<DialogExcelConfigData>(branches, this.IdComparator)
          .filter(x => !this.isPlayerDialogOption(x)); // don't rejoin on player dialogue options

        if (!intersect.length) {
          // branches do not rejoin
          currNode.Branches = branches;
          currNode = null;
        } else {
          // branches rejoin
          let rejoinNode = intersect[0];
          for (let i = 0; i < branches.length; i++) {
            let branch = branches[i];
            branches[i] = branch.slice(0, arrayIndexOf(branch, rejoinNode, this.IdComparator));
          }
          currNode.Branches = branches;
          currNode = rejoinNode;
        }
      } else {
        // If zero next nodes -> no more dialog
        currNode = null;
      }
    }
    return currBranch;
  }

  async generateDialogueWikitext(dialogLines: DialogExcelConfigData[], dialogDepth = 1,
                                 originatorDialog: DialogExcelConfigData = null, originatorIsFirstOfBranch: boolean = false,
                                 firstDialogOfBranchVisited: Set<number> = new Set()): Promise<DialogWikitextResult> {
    let out = '';
    let outIds: CommonLineId[] = [];
    let numSubsequentNonBranchPlayerDialogOption = 0;

    if (dialogLines.length) {
      firstDialogOfBranchVisited.add(dialogLines[0].Id);
    }

    for (let i = 0; i < dialogLines.length; i++) {
      let dialog: DialogExcelConfigData = dialogLines[i];
      let previousDialog: DialogExcelConfigData = dialogLines[i - 1];

      // DIcon Prefix
      // ~~~~~~~~~~~~
      let diconPrefix: string;

      if (this.isPlayerDialogOption(dialog)) {
        if (originatorDialog && this.isPlayerDialogOption(originatorDialog) && !originatorIsFirstOfBranch) {
          diconPrefix = ':'.repeat(dialogDepth);
        } else if (i === 0 || arrayFillRange(0, i - 1).every(j => this.isPlayerDialogOption(dialogLines[j]))) {
          diconPrefix = ':'.repeat((dialogDepth - 1 ) || 1);
        } else {
          diconPrefix = ':'.repeat(dialogDepth);
        }
      } else {
        diconPrefix = ':'.repeat(dialogDepth);
      }

      let prefix: string = ':'.repeat(dialogDepth);
      let text: string = this.normText(dialog.TalkContentText, this.outputLangCode);

      if (dialog.CustomTravelLogMenuText) {
        text = '{{Color|menu|' + this.normText(dialog.CustomTravelLogMenuText, this.outputLangCode) + '}}';
      } else if (dialog.CustomImageName || dialog.CustomSecondImageName) {
        text = `<gallery widths="350">`;
        if (dialog.CustomImageWikiName) {
          text += `\n${dialog.CustomImageWikiName}.png`;
        }
        if (dialog.CustomSecondImageWikiName) {
          text += `\n${dialog.CustomSecondImageWikiName}.png`
        }
        text += `\n</gallery>`
      } else if (dialog.CustomWikiTx) {
        text = `{{tx|${dialog.CustomWikiTx}}}`;
        if (dialog.CustomWikiTxComment) {
          text += `<!-- ${dialog.CustomWikiTxComment} -->`
        }
      } else if (dialog.CustomWikiReadable) {
        let lines: string[] = [];
        for (let item of dialog.CustomWikiReadable.Items) {
          lines.push(item.ReadableText.AsTemplate);
        }
        text = lines.map(line => prefix + ':' + line).join('\n');
      }

      // Traveler SEXPRO
      // ~~~~~~~~~~~~~~~

      if (text && text.includes('SEXPRO')) {
        text = await replaceAsync(text, /\{(MATEAVATAR|PLAYERAVATAR)#SEXPRO\[(.*?)\|(.*?)]}/g, async (_fullMatch, g0, g1, g2) => {
          let g1e = await this.selectManualTextMapConfigDataById(g1);
          let g2e = await this.selectManualTextMapConfigDataById(g2);
          let extraParam = g0 === 'MATEAVATAR' ? '|mc=1' : '';
          if (g1.includes('FEMALE')) {
            return `{{MC|m=${g2e.TextMapContentText}|f=${g1e.TextMapContentText}${extraParam}}`;
          } else {
            return `{{MC|m=${g1e.TextMapContentText}|f=${g2e.TextMapContentText}${extraParam}}}`;
          }
        });
      }

      // Subsequent Non-Branch Dialogue Options
      // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

      // This is for if you have non-branch subsequent player dialogue options for the purpose of generating an output like:
      // :'''Paimon:''' Blah blah blah
      // :{{DIcon}} Paimon, you're sussy baka
      // ::{{DIcon}} And you're emergency food too
      // :'''Paimon:''' Nani!?!?
      // The second dialogue option is indented to show it is an option that follows the previous option rather than
      // the player being presented with two dialogue options at the same time.
      if (previousDialog

        // Both the previous and current dialogs must be dialog options:
        && this.isPlayerDialogOption(dialog)
        && this.isPlayerDialogOption(previousDialog) &&

        (
          // The previous dialog must only have had 1 next dialog
          previousDialog.NextDialogs.length === 1

          // Or the first dialog of every branch from the previous dialog must be a dialog option
          || previousDialog.Branches?.map(b => b[0]).every(x => this.isPlayerDialogOption(x))
        )

        // The previous dialog's next dialogs must contain current dialog:
        && previousDialog.NextDialogs.some(x => x === dialog.Id)) {
        numSubsequentNonBranchPlayerDialogOption++;
      } else {
        numSubsequentNonBranchPlayerDialogOption = 0;
      }

      // Special wiki descriptions
      // ~~~~~~~~~~~~~~~~~~~~~~~~~

      /*
      GCG Action Befores:
      'GCG/open_GcgBossChallengesPage',
      'GCG/open_GcgCardSettingPage',
      'GCG/open_GcgLevelPage',
      'GCG/open_GcgLevelPage_CatBar',
      'GCG/open_GcgLevelPage_CatBar_1',
      'GCG/open_GcgLevelPage_Invitation',
      'GCG/open_GcgLevelPage_Invitation_End',
      'GCG/open_GcgLevelPage_Invitation_Start',
      'GCG/open_GcgPVEInfinitePage',
      'GCG/open_GcgPVEPuzzlePage',
      'GCG/open_GcgPlayerLevelPage',
      'GCG/open_GcgPvePage',
      'GCG/open_GcgReplayPage',
      'GCG/open_GcgShopPage',
      'GCG/open_Ggccard_page',

      GCG Action Afters:
      'GCG/open_GcgLevelPage_Bigworld',
      'GCG/open_GcgLevelPage_Bigworld_1',
      'GCG/open_GcgLevelPage_CatBar',
      'GCG/open_GcgLevelPage_CatBar_2',
      'GCG/open_GcgQuestLevelPage_1',
      'GCG/open_GcgTestQuestChallengesPage_1',
      'GCG/open_GcgTestQuestChallengesPage_2',
       */

      if (this.isPlayerTalkRole(dialog) && this.isPlayerDialogOption(dialog)) {
        if (dialog.OptionIcon === 'UI_Icon_Intee_GcgZhanDou' && (
          dialog.ActionBefore === 'GCG/open_GcgLevelPage'
          || dialog.ActionBefore === 'GCG/open_GcgLevelPage_CatBar_1'
          || dialog.ActionBefore === 'GCG/open_GcgLevelPage_Invitation'
          || dialog.ActionAfter === 'GCG/open_GcgLevelPage_Bigworld'
          || dialog.ActionAfter === 'GCG/open_GcgLevelPage_Bigworld_1'
          || dialog.ActionAfter === 'GCG/open_GcgLevelPage_CatBar'
          || dialog.ActionAfter === 'GCG/open_GcgLevelPage_CatBar_2'
        )) {
          text += `\n${diconPrefix}${':'.repeat(numSubsequentNonBranchPlayerDialogOption)};(${this.i18n('TCG_OpenMatchInterface')})`;
        }

        if (dialog.ActionBefore === 'GCG/open_GcgCardSettingPage') {
          text += `\n${diconPrefix}${':'.repeat(numSubsequentNonBranchPlayerDialogOption)};(${this.i18n('TCG_OpenDeckInterface')})`;
        }
      }

      // Voice-Overs
      // ~~~~~~~~~~~
      let voPrefix = this.voice.getVoPrefix('Dialog', dialog.Id, text, dialog.TalkRole.Type);

      // Output Append
      // ~~~~~~~~~~~~~

      if (dialog.Id === 0) {
        if (dialog.CustomTravelLogMenuText) {
          outIds.push({textMapHash: dialog.CustomTravelLogMenuTextMapHash});
        } else {
          outIds.push(null);
        }
      } else {
        outIds.push({commonId: dialog.Id, textMapHash: dialog.TalkContentTextMapHash});
      }

      if (text && text.includes('\n')) {
        for (let _m of (text.match(/\n/g) || [])) {
          outIds.push(null);
        }
      }

      if (dialog.Recurse) {
        if (this.isPlayerTalkRole(dialog)) {
          out += `\n${diconPrefix};(${this.i18n('ReturnToDialogueOption')})`;
        } else {
          out += `\n${diconPrefix.slice(0,-1)};(${this.i18n('ReturnToDialogueOption')})`;
        }
      } else {
        if (dialog.CustomTravelLogMenuText || dialog.CustomImageName || dialog.CustomWikiTx) {
          out += `\n${prefix}${text}`;
        } else if (dialog.CustomWikiReadable) {
          out += `\n${text}`;
        } else if (this.isBlackScreenDialog(dialog)) {
          out += `\n${prefix}{{Black Screen|${voPrefix}${text}}}`;
        } else if (this.isPlayerTalkRole(dialog)) {
          if (!this.isPlayerDialogOption(dialog)) {
            let name = this.normText(dialog.TalkRoleNameText || '{NICKNAME}', this.outputLangCode);
            out += `\n${prefix}${voPrefix}'''${name}:''' ${text}`;
          } else {
            let dicon: string = '{{DIcon}}';
            if (OptionIconMap[dialog.OptionIcon]) {
              dicon = '{{DIcon|' + OptionIconMap[dialog.OptionIcon] + '}}';
            } else if (dialog.OptionIcon) {
              dicon = '{{DIcon|' + dialog.OptionIcon + '}}';
            }
            out += `\n${diconPrefix}${':'.repeat(numSubsequentNonBranchPlayerDialogOption)}${dicon} ${text}`;
          }
        } else if (dialog.TalkRole.Type === 'TALK_ROLE_NPC' || dialog.TalkRole.Type === 'TALK_ROLE_GADGET') {
          let name = this.normText(dialog.TalkRoleNameText, this.outputLangCode);
          out += `\n${prefix}${voPrefix}'''${name}:''' ${text}`;
        } else if (dialog.TalkRole.Type === 'TALK_ROLE_MATE_AVATAR') {
          out += `\n${prefix}${voPrefix}'''${this.i18n('TravelerSibling')}:''' ${text}`;
        } else {
          if (text) {
            out += `\n${prefix}:'''Cutscene_Character_Replace_me:''' ${text}`;
          } else {
            console.warn('Dialog with unknown TalkRole.Type "' + dialog.TalkRole.Type + '" and without text:', dialog);
          }
        }
      }

      // Next Branches
      // ~~~~~~~~~~~~~

      if (dialog.Branches && dialog.Branches.length) {
        let temp = new Set<number>(firstDialogOfBranchVisited);
        for (let dialogBranch of dialog.Branches) {
          if (!dialogBranch.length) {
            continue;
          }
          temp.add(dialogBranch[0].Id);
        }

        let excludedCount = 0;
        let includedCount = 0;
        for (let dialogBranch of dialog.Branches) {
          if (!dialogBranch.length) {
            continue;
          }
          if (firstDialogOfBranchVisited.has(dialogBranch[0].Id)) {
            excludedCount++;
            continue;
          }
          includedCount++;
          const branchRet = await this.generateDialogueWikitext(dialogBranch, dialogDepth + 1, dialog, i === 0, temp);
          out += '\n' + branchRet.wikitext;
          outIds.push(... branchRet.ids);
        }
        if (includedCount === 0 && excludedCount > 0) {
          out += `\n${diconPrefix};(${this.i18n('ReturnToDialogueOption')})`;
          outIds.push(null);
        }
      }
    }
    return {
      wikitext: out.trim(),
      ids: outIds,
    };
  }
  // endregion

  // region InterAction Loader
  async fetchInterActionD2F(): Promise<InterActionD2F> {
    return this.cached('InterActionD2F', 'json', async () => {
      return await this.readJsonFile("InterActionD2F.json");
    });
  }

  async loadInterActionFileByName(fileName: string): Promise<InterActionFile> {
    fileName = fileName.replace(/\\/g, '/').replace(/\//g, ';');

    if (fileName.startsWith('QuestDialogue;')) {
      fileName = fileName.slice('QuestDialogue;'.length);
    }

    if (!fileName.endsWith('.json')) {
      fileName += '.json';
    }

    let fileGroups: InterActionGroup[] = [];

    if (this.state.interActionCache[fileName]) {
      fileGroups = this.state.interActionCache[fileName];
    } else if (this.fileExists('./InterAction/' + fileName)) {
      const groups: InterActionGroup[] = await this.readJsonFile('./InterAction/' + fileName);
      this.state.interActionCache[fileName] = groups;
      fileGroups = groups;
    } else {
      return new InterActionFile();
    }

    return new InterActionFile(
      fileName,
      fileGroups,
      null);
  }

  async loadInterActionFileByDialogId(dialogueId: number): Promise<InterActionFile> {
    const refD2F = (await this.fetchInterActionD2F())[dialogueId];
    if (!refD2F || !refD2F.length) {
      return new InterActionFile();
    }

    const [fileName, groupId, groupIndex] = refD2F[0];
    let fileGroups: InterActionGroup[] = [];

    if (fileName) {
      if (this.state.interActionCache[fileName]) {
        fileGroups = this.state.interActionCache[fileName];
      } else {
        const groups: InterActionGroup[] = await this.readJsonFile('./InterAction/' + fileName);
        this.state.interActionCache[fileName] = groups;
        fileGroups = groups;
      }
    }
    return new InterActionFile(
      fileName,
      fileGroups,
      fileGroups[groupIndex]?.GroupId === groupId
        ? fileGroups[groupIndex]
        : fileGroups.find(g => g.GroupId === groupId));
  }
  // endregion

  // region CodexQuest Loader
  async selectCodexQuest(mainQuestId: number): Promise<CodexQuestGroup> {
    if (!mainQuestId) {
      return {
        Items: [],
        ByContentTextMapHash: {},
        ByItemId: {},
      }
    }
    if (this.state.codexQuestCache[mainQuestId]) {
      return this.state.codexQuestCache[mainQuestId];
    }
    const group: CodexQuestGroup = {
      Items: [],
      ByContentTextMapHash: {},
      ByItemId: {}
    };
    const array: CodexQuestExcelConfigData[] = await this.knex.select('*').from('CodexQuestExcelConfigData')
      .where({MainQuestId: mainQuestId}).then(this.commonLoad);
    group.Items = array;
    group.ByContentTextMapHash = toMap(array, 'ContentTextMapHash');
    group.ByItemId = toMap(array, 'ItemId');
    this.state.codexQuestCache[mainQuestId] = group;
    return group;
  }
  // endregion

  // region Monster
  private async postProcessMonster(monster: MonsterExcelConfigData, loadConf?: MonsterLoadConf): Promise<MonsterExcelConfigData> {
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
      monster.MonsterDescribe = await this.selectMonsterDescribe(monster.DescribeId);
      monster.AnimalDescribe = await this.selectAnimalDescribe(monster.DescribeId);
      monster.Describe = monster.MonsterDescribe || monster.AnimalDescribe;
      monster.AnimalCodex = await this.selectAnimalCodexByDescribeId(monster.DescribeId);
    }
    if (loadConf.LoadHomeWorldAnimal) {
      monster.HomeWorldAnimal = await this.selectHomeWorldAnimalByMonster(monster);
    }
    if (loadConf.LoadModelArtPath && !!monster?.AnimalCodex?.ModelPath) {
      let modelPath = monster.AnimalCodex.ModelPath;

      if (fs.existsSync(path.resolve(IMAGEDIR_GENSHIN_EXT, `./UI_${modelPath}.png`))) {
        monster.AnimalCodex.ModelArtPath = 'UI_' + modelPath;
      } else {
        modelPath = rtrim(monster.AnimalCodex.ModelPath, '_0123456789');
        if (fs.existsSync(path.resolve(IMAGEDIR_GENSHIN_EXT, `./UI_${modelPath}.png`))) {
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

    const describe: MonsterDescribeExcelConfigData = await this.knex.select('*').from('MonsterDescribeExcelConfigData')
      .where({Id: describeId}).first().then(this.commonLoadFirst);

    this.state.monsterDescribeCache[describeId] = describe;

    if (describe && describe.TitleId) {
      describe.Title = await this.knex.select('*').from('MonsterTitleExcelConfigData')
        .where({TitleId: describe.TitleId}).first().then(this.commonLoadFirst);
    }

    if (describe && describe.SpecialNameLabId) {
      describe.SpecialNameLabList = await this.knex.select('*').from('MonsterSpecialNameExcelConfigData')
        .where({SpecialNameLabId: describe.SpecialNameLabId}).then(this.commonLoad);
    }

    return describe;
  }

  async selectMonsterById(id: number, loadConf?: MonsterLoadConf): Promise<MonsterExcelConfigData> {
    if (this.state.monsterCache[id]) {
      return this.state.monsterCache[id];
    }
    let monster: MonsterExcelConfigData = await this.knex.select('*').from('MonsterExcelConfigData')
      .where({Id: id}).first();

    if (monster && !this.state.DisableMonsterCache) {
      this.state.monsterCache[monster.Id] = monster;
    }

    return this.commonLoadFirst(monster).then(x => this.postProcessMonster(x, loadConf));
  }

  async selectMonstersByDescribeId(describeId: number, loadConf?: MonsterLoadConf): Promise<MonsterExcelConfigData[]> {
    return await this.knex.select('*').from('MonsterExcelConfigData')
      .where({DescribeId: describeId}).then(this.commonLoad).then(ret => ret.asyncMap(x => this.postProcessMonster(x, loadConf)));
  }

  async selectAllMonster(loadConf?: MonsterLoadConf): Promise<MonsterExcelConfigData[]> {
    return await this.knex.select('*').from('MonsterExcelConfigData')
      .then(this.commonLoad).then(ret => ret.asyncMap(x => this.postProcessMonster(x, loadConf)));
  }
  // endregion

  // region Living Beings / Animals
  private async postProcessAnimalCodex(codex: AnimalCodexExcelConfigData): Promise<AnimalCodexExcelConfigData> {
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

    codex.AnimalDescribe = await this.selectAnimalDescribe(codex.DescribeId);
    codex.MonsterDescribe = await this.selectMonsterDescribe(codex.DescribeId);
    codex.Monsters = await this.selectMonstersByDescribeId(codex.DescribeId);

    const codexTextMap = await this.selectAnimalCodexManualTextMap();
    codex.SubTypeName = codexTextMap[codex.SubType.replace('CODEX_SUBTYPE', 'UI_CODEX_ANIMAL_CATEGORY')];

    if (codex.Type === 'CODEX_WILDLIFE') {
      codex.Icon = codex.AnimalDescribe.Icon;
      codex.NameText = codex.AnimalDescribe.NameText;
      codex.NameTextMapHash = codex.AnimalDescribe.NameTextMapHash;
      codex.TypeName = codexTextMap['UI_CODEX_ANIMAL_ANIMAL'];
    } else {
      codex.Icon = codex.MonsterDescribe.Icon;
      codex.NameText = codex.MonsterDescribe.NameText;
      codex.NameTextMapHash = codex.MonsterDescribe.NameTextMapHash;
      codex.TypeName = codexTextMap['UI_CODEX_ANIMAL_MONSTER'];
    }

    if (Array.isArray(codex.AltDescTextQuestCondIds)) {
      codex.AltDescTextQuestConds = [];
      for (let condId of codex.AltDescTextQuestCondIds) {
        const questExcel = await this.selectQuestExcelConfigData(condId);
        if (questExcel && questExcel.MainId) {
          const mainQuestName = await this.selectMainQuestName(questExcel.MainId);
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
    return await this.knex.select('*').from('AnimalDescribeExcelConfigData')
      .where({Id: id}).first().then(this.commonLoadFirst);
  }

  async selectAnimalCodex(id: number): Promise<AnimalCodexExcelConfigData> {
    if (this.state.animalCodexCache[id]) {
      return this.state.animalCodexCache[id];
    }
    return await this.knex.select('*').from('AnimalCodexExcelConfigData')
      .where({Id: id}).first().then(this.commonLoadFirst).then(x => this.postProcessAnimalCodex(x));
  }

  async selectAnimalCodexByDescribeId(describeId: number): Promise<AnimalCodexExcelConfigData> {
    if (this.state.animalCodexDCache[describeId]) {
      return this.state.animalCodexDCache[describeId];
    }
    return await this.knex.select('*').from('AnimalCodexExcelConfigData')
      .where({DescribeId: describeId}).first().then(this.commonLoadFirst).then(x => this.postProcessAnimalCodex(x));
  }

  async selectAllAnimalCodex(): Promise<AnimalCodexExcelConfigData[]> {
    return await this.knex.select('*').from('AnimalCodexExcelConfigData')
      .then(this.commonLoad).then(ret => ret.asyncMap(x => this.postProcessAnimalCodex(x)));
  }

  private async selectAnimalCodexManualTextMap(): Promise<{[manualTextMapId: string]: string}> {
    return this.cached('AnimalCodexManualTextMap:' + this.outputLangCode, 'json', async () => {
      const ret: {[lookup: string]: string} = {};
      await [
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
      ].asyncMap(async key => {
        ret[key] = (await this.selectManualTextMapConfigDataById(key)).TextMapContentText;
      });
      return ret;
    });
  }

  async selectLivingBeingArchive(): Promise<LivingBeingArchive> {
    const monsterList = await this.selectAllMonster();
    const codexList = await this.selectAllAnimalCodex();
    const codexManualTextMap: {[manualTextMapId: string]: string} = await this.selectAnimalCodexManualTextMap();

    const archive: LivingBeingArchive = {
      MonsterCodex: defaultMap((key: string): LivingBeingArchiveGroup => ({
        SubType: key,
        NameText: codexManualTextMap[key.replace('CODEX_SUBTYPE', 'UI_CODEX_ANIMAL_CATEGORY')],
        CodexList: [],
      })),
      WildlifeCodex: defaultMap((key: string): LivingBeingArchiveGroup => ({
        SubType: key,
        NameText: codexManualTextMap[key.replace('CODEX_SUBTYPE', 'UI_CODEX_ANIMAL_CATEGORY')],
        CodexList: [],
      })),
      NonCodexMonsters: {
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
      },
    };

    const monsterIdsInCodex: Set<number> = new Set();

    for (let codex of codexList) {
      if (codex.Type === 'CODEX_MONSTER') {
        archive.MonsterCodex[codex.SubType].CodexList.push(codex);
      } else {
        archive.WildlifeCodex[codex.SubType].CodexList.push(codex);
      }
      codex.Monsters.forEach(m => monsterIdsInCodex.add(m.Id));
    }

    for (let monster of monsterList) {
      if (!monsterIdsInCodex.has(monster.Id)) {
        if (monster.MonsterName.toLowerCase().includes('homeworld')) {
          archive.NonCodexMonsters.HOMEWORLD.MonsterList.push(monster);
        } else if (monster.NameText || monster.Describe?.NameText) {
          archive.NonCodexMonsters.NAMED.MonsterList.push(monster);
        } else {
          archive.NonCodexMonsters.UNNAMED.MonsterList.push(monster);
        }
      }
    }

    return archive;
  }
  // endregion

  // region Avatars
  async selectAllAvatars(): Promise<AvatarExcelConfigData[]> {
    return await this.knex.select('*').from('AvatarExcelConfigData').then(this.commonLoad);
  }

  async selectAvatarById(id: number): Promise<AvatarExcelConfigData> {
    if (this.state.avatarCache.hasOwnProperty(id)) {
      return this.state.avatarCache[id];
    }
    let avatar: AvatarExcelConfigData = await this.knex.select('*').from('AvatarExcelConfigData')
      .where({Id: id}).first().then(this.commonLoadFirst);
    if (!this.state.DisableAvatarCache) {
      this.state.avatarCache[id] = avatar;
    }
    return avatar;
  }
  // endregion

  // region Reminders
  async selectAllReminders(): Promise<ReminderExcelConfigData[]> {
    return await this.knex.select('*').from('ReminderExcelConfigData').then(this.commonLoad);
  }

  async selectReminderById(id: number): Promise<ReminderExcelConfigData> {
    return await this.knex.select('*').from('ReminderExcelConfigData')
      .where({Id: id}).first().then(this.commonLoadFirst);
  }

  async selectReminderBySpeakerTextMapHash(id: TextMapHash): Promise<ReminderExcelConfigData> {
    return await this.knex.select('*').from('ReminderExcelConfigData')
      .where({SpeakerTextMapHash: id}).first().then(this.commonLoadFirst);
  }

  async selectReminderByContentTextMapHash(id: TextMapHash): Promise<ReminderExcelConfigData> {
    return await this.knex.select('*').from('ReminderExcelConfigData')
      .where({ContentTextMapHash: id}).first().then(this.commonLoadFirst);
  }

  async selectPreviousReminder(reminderId: number): Promise<ReminderExcelConfigData> {
    let ret: {ReminderId: number, NextReminderId: number} = await this.knex.select('*').from('Relation_ReminderToNext')
      .where({NextReminderId: reminderId}).first().then();
    if (ret && ret.ReminderId) {
      return this.selectReminderById(ret.ReminderId);
    } else {
      return null;
    }
  }
  // endregion

  // region Cutscene & SRT
  async loadCutsceneSubtitlesByQuestId(questId: number): Promise<{[fileName: string]: string}> {
    let fileNames: string[] = await fsp.readdir(this.getDataFilePath('./Subtitle/'+this.outputLangCode));

    let targetFileNames: string[] = [];
    for (let fileName of fileNames) {
      if (fileName.includes(`Q${questId}`) || fileName.includes(`Q_${questId}`) || fileName.includes(`D${questId}`) || fileName.includes(`Cs_${questId}`)) {
        if (fileName.endsWith('.txt') && targetFileNames.includes(fileName.slice(0, -4)+'.srt')) {
          // If targetFileNames already contains the .srt version of the .txt file, then skip
          continue;
        }
        targetFileNames.push(fileName);
      }
    }

    if (!targetFileNames.length) {
      return {};
    }

    let inputs: {[genderlessFileName: string]: string[]} = {};
    for (let targetFileName of targetFileNames) {
      let genderlessFileName = targetFileName.replace('_Boy', '').replace('_Girl', '');
      if (!inputs.hasOwnProperty(genderlessFileName)) {
        inputs[genderlessFileName] = [];
      }
      inputs[genderlessFileName].push(targetFileName);
    }

    let parser = new SrtParser();
    let srtMap: {[fileNane: string]: SrtLine[]} = {};

    for (let inputKey of Object.keys(inputs)) {
      let input = inputs[inputKey];
      let filePath1: string = this.getDataFilePath('./Subtitle/'+this.outputLangCode+'/'+input[0]);
      let fileData1: string = await fsp.readFile(filePath1, {encoding: 'utf8'});

      let srt1: SrtLine[] = parser.fromSrt(fileData1);
      let srt2: SrtLine[] = [];

      if (input.length > 1) {
        let filePath2: string = this.getDataFilePath('./Subtitle/'+this.outputLangCode+'/'+input[1]);
        let fileData2: string = await fsp.readFile(filePath2, {encoding: 'utf8'});
        srt2 = parser.fromSrt(fileData2);
      }

      let allMatch = true;
      if (srt1.length === srt2.length) {
        for (let i = 0; i < srt1.length; i++) {
          let line1 = srt1[i];
          let line2 = srt2[i];
          if (line1.text !== line2.text) {
            allMatch = false;
          }
        }
      }

      if (!allMatch) {
        srtMap[input[0]] = srt1;
        if (input.length > 1) {
          srtMap[input[1]] = srt2;
        }
      } else {
        srtMap[inputKey] = srt1;
      }
    }

    let formattedResults: {[fileName: string]: string} = {};
    for (let srtFile of Object.keys(srtMap)) {
      let srtLines = srtMap[srtFile];
      let out = [];
      out.push(`;(${this.i18n('CinematicPlays')})`);
      for (let srtLine of srtLines) {
        out.push(`::'''CS_CHAR:''' ` + this.normText(srtLine.text, this.outputLangCode));
      }
      out.push(`:;(${this.i18n('CinematicEnds')})`);
      formattedResults[srtFile] = out.join('\n');
    }

    return formattedResults;
  }
  // endregion

  // region HomeWorld Events
  async selectAllHomeWorldEvents(): Promise<HomeWorldEventExcelConfigData[]> {
    const events: HomeWorldEventExcelConfigData[] = await this.knex.select('*').from('HomeWorldEventExcelConfigData').then(this.commonLoad);
    return events.asyncMap(event => this.postProcessHomeWorldEvent(event))
      .then(events => events.filter(x => !!x));
  }

  async selectHomeWorldEventById(eventId: number): Promise<HomeWorldEventExcelConfigData> {
    return await this.knex.select('*').from('HomeWorldEventExcelConfigData')
      .where({EventId: eventId}).then(this.commonLoadFirst).then(event => this.postProcessHomeWorldEvent(event));
  }

  async selectHomeWorldEventsByAvatarId(avatarId: number): Promise<HomeWorldEventExcelConfigData[]> {
    const events: HomeWorldEventExcelConfigData[] = await this.knex.select('*').from('HomeWorldEventExcelConfigData')
      .where({AvatarId: avatarId}).then(this.commonLoad);
    return events.asyncMap(event => this.postProcessHomeWorldEvent(event))
      .then(events => events.filter(x => !!x));
  }

  private async postProcessHomeWorldEvent(event: HomeWorldEventExcelConfigData): Promise<HomeWorldEventExcelConfigData> {
    if (event.EventId === 1 || event.EventId === 5) {
      return null;
    }
    if (event.RewardId) {
      event.Reward = await this.selectRewardExcelConfigData(event.RewardId);
    }
    return event;
  }
  // endregion

  // region HomeWorld NPC
  async selectHomeWorldNPCByFurnitureId(furnitureId: number, loadConf?: HomeWorldNPCLoadConf): Promise<HomeWorldNPCExcelConfigData> {
    return await this.knex.select('*').from('HomeWorldNPCExcelConfigData')
      .where({FurnitureId: furnitureId}).first().then(this.commonLoadFirst)
      .then((npc: HomeWorldNPCExcelConfigData) => this.postProcessHomeWorldNPC(npc, loadConf));
  }

  async selectHomeWorldNPCByNpcId(npcId: number, loadConf?: HomeWorldNPCLoadConf): Promise<HomeWorldNPCExcelConfigData> {
    return await this.knex.select('*').from('HomeWorldNPCExcelConfigData')
      .where({NpcId: npcId}).first().then(this.commonLoadFirst)
      .then((npc: HomeWorldNPCExcelConfigData) => this.postProcessHomeWorldNPC(npc, loadConf));
  }

  async selectHomeWorldNPCByAvatarId(avatarId: number, loadConf?: HomeWorldNPCLoadConf): Promise<HomeWorldNPCExcelConfigData> {
    return await this.knex.select('*').from('HomeWorldNPCExcelConfigData')
      .where({AvatarId: avatarId}).first().then(this.commonLoadFirst)
      .then((npc: HomeWorldNPCExcelConfigData) => this.postProcessHomeWorldNPC(npc, loadConf));
  }

  async selectAllHomeWorldNPCs(loadConf?: HomeWorldNPCLoadConf): Promise<HomeWorldNPCExcelConfigData[]> {
    return await this.knex.select('*').from('HomeWorldNPCExcelConfigData').then(this.commonLoad)
      .then((rows: HomeWorldNPCExcelConfigData[]) => rows.asyncMap(npc => this.postProcessHomeWorldNPC(npc, loadConf)));
  }

  private async postProcessHomeWorldNPC(npc: HomeWorldNPCExcelConfigData, loadConf: HomeWorldNPCLoadConf): Promise<HomeWorldNPCExcelConfigData> {
    if (npc.NpcId) {
      npc.Npc = await this.getNpc(npc.NpcId);
    }
    npc.SummonEvents = [];
    npc.RewardEvents = [];
    if (npc.Avatar) {
      npc.CommonId = npc.AvatarId;
      npc.CommonName = npc.Avatar.NameText;
      npc.CommonIcon = npc.Avatar.IconName;
      npc.CommonNameTextMapHash = npc.Avatar.NameTextMapHash;
      if (loadConf?.LoadHomeWorldEvents) {
        npc.RewardEvents = await this.selectHomeWorldEventsByAvatarId(npc.AvatarId);
      }
    } else {
      npc.CommonId = npc.NpcId;
      npc.CommonName = npc.Npc.NameText;
      npc.CommonIcon = npc.FrontIcon;
      npc.CommonNameTextMapHash = npc.Npc.NameTextMapHash;
    }

    if (npc.FurnitureId) {
      // npc.Furniture = await this.selectFurniture(npc.FurnitureId); // FIXME: trying to load furniture here causes it to hang for a really long time for some reason
    }
    return npc;
  }
  // endregion

  // region HomeWorld Furniture
  async selectFurniture(id: number, loadConf?: HomeWorldFurnitureLoadConf): Promise<HomeWorldFurnitureExcelConfigData> {
    const furn: HomeWorldFurnitureExcelConfigData = await this.knex.select('*')
      .from('HomeWorldFurnitureExcelConfigData')
      .where({Id: id}).first().then(this.commonLoadFirst);

    const [typeMap, makeMap] = await Promise.all([
      this.selectFurnitureTypeMap(),
      loadConf?.LoadMakeData ? this.selectFurnitureMakeMap() : Promise.resolve(undefined)
    ]);
    return this.postProcessFurniture(furn, typeMap, makeMap, loadConf);
  }

  async selectAllFurniture(loadConf?: HomeWorldFurnitureLoadConf): Promise<HomeWorldFurnitureExcelConfigData[]> {
    let furnList: HomeWorldFurnitureExcelConfigData[] = await this.knex.select('*').from('HomeWorldFurnitureExcelConfigData');

    const typeMap = await this.selectFurnitureTypeMap();
    const makeMap = loadConf?.LoadMakeData ? await this.selectFurnitureMakeMap() : null;

    furnList = await furnList.asyncMap(async furn => {
      furn = await this.commonLoadFirst(furn, null, true);
      await this.postProcessFurniture(furn, typeMap, makeMap, loadConf);
      return furn;
    });

    furnList = furnList.filter(x => !!x.NameText);
    sort(furnList, 'IsExterior', 'CategoryNameText', 'TypeNameText');

    return furnList;
  }

  private async postProcessFurniture(furn: HomeWorldFurnitureExcelConfigData,
                                     typeMap: {[typeId: number]: HomeWorldFurnitureTypeExcelConfigData},
                                     makeMap: {[furnId: number]: FurnitureMakeExcelConfigData},
                                     loadConf?: HomeWorldFurnitureLoadConf): Promise<HomeWorldFurnitureExcelConfigData> {
    if (!furn) {
      return furn;
    }
    if (!loadConf) {
      loadConf = {};
    }

    if (furn.Icon || furn.ItemIcon) {
      furn.DownloadIconUrl = '/serve-image/genshin/' + (furn.Icon || furn.ItemIcon)
        + '/Item ' + this.sanitizeFileName(furn.NameText) + '.png?download=1';
    }

    furn.MappedFurnType = [];
    furn.MappedSourceTextList = [];
    furn.FilterTokens = [];
    furn.IsInterior = false;
    furn.IsExterior = false;

    if (furn.SourceTextList && furn.SourceTextList.length) {
      for (let textMapHash of furn.SourceTextList) {
        const text = await this.getTextMapItem(this.outputLangCode, textMapHash);
        if (text) {
          furn.MappedSourceTextList.push(text);
        }
      }
    }

    for (let furnTypeId of furn.FurnType) {
      if (!furnTypeId)
        continue;
      const furnType = typeMap[furnTypeId];
      if (!furnType)
        continue;
      furn.MappedFurnType.push(furnType);
      if (furnType.SceneType !== 'Exterior') {
        furn.IsInterior = true;
      }
      if (furnType.SceneType === 'Exterior') {
        furn.IsExterior = true;
      }
      furn.FilterTokens.push('category-'+furnType.TypeCategoryId);
      furn.FilterTokens.push('subcategory-'+furnType.TypeId);
    }

    if (furn.IsInterior) furn.FilterTokens.unshift('Interior');
    if (furn.IsExterior) furn.FilterTokens.unshift('Exterior');

    if (makeMap && loadConf.LoadMakeData) {
      furn.MakeData = makeMap[furn.Id];
    }

    if (loadConf?.LoadRelatedMaterial) {
      furn.RelatedMaterialId = await this.selectMaterialIdFromFurnitureId(furn.Id);
      if (furn.RelatedMaterialId) {
        furn.RelatedMaterial = await this.selectMaterialExcelConfigData(furn.RelatedMaterialId);
      }
    }

    if (furn.MappedFurnType[0]) {
      furn.CategoryId = furn.MappedFurnType[0].TypeCategoryId;
      furn.CategoryNameText = furn.MappedFurnType[0].TypeNameText;

      furn.TypeId = furn.MappedFurnType[0].TypeId;
      furn.TypeNameText = furn.MappedFurnType[0].TypeName2Text;
    }

    if (loadConf.LoadHomeWorldNPC && furn.SurfaceType === 'NPC') {
      furn.HomeWorldNPC = await this.selectHomeWorldNPCByFurnitureId(furn.Id);
      if (furn.HomeWorldNPC) {
        furn.Icon = furn.HomeWorldNPC.CommonIcon;
        furn.ItemIcon = furn.HomeWorldNPC.CommonIcon;
      }
    }

    if (loadConf.LoadHomeWorldAnimal) {
      furn.HomeWorldAnimal = await this.selectHomeWorldAnimalByFurniture(furn);
    }

    return furn;
  }
  //endregion

  // region HomeWorld Furniture Suite
  async selectFurnitureSuite(suiteId: number, loadConf?: FurnitureSuiteLoadConf): Promise<FurnitureSuiteExcelConfigData> {
    return await this.knex.select('*').from('FurnitureSuiteExcelConfigData')
      .where({SuiteId: suiteId}).first().then(this.commonLoadFirst).then(suite => this.postProcessFurnitureSuite(suite, loadConf));
  }

  async selectAllFurnitureSuite(loadConf?: FurnitureSuiteLoadConf): Promise<FurnitureSuiteExcelConfigData[]> {
    const suites: FurnitureSuiteExcelConfigData[] = await this.knex.select('*').from('FurnitureSuiteExcelConfigData').then(this.commonLoad);
    return (await suites.asyncMap(suite => this.postProcessFurnitureSuite(suite, loadConf))).filter(x => !!x);
  }

  private async postProcessFurnitureSuite(suite: FurnitureSuiteExcelConfigData, loadConf?: FurnitureSuiteLoadConf): Promise<FurnitureSuiteExcelConfigData> {
    if (!suite) {
      return suite;
    }
    if (suite.SuiteId === 31 || suite.SuiteId === 32) { // internal test suites
      return null;
    }
    suite.RelatedMaterialId = await this.selectMaterialIdFromFurnitureSuiteId(suite.SuiteId);
    if (suite.RelatedMaterialId) {
      suite.RelatedMaterial = await this.selectMaterialExcelConfigData(suite.RelatedMaterialId);
    }
    if (suite.FavoriteNpcExcelIdVec && suite.FavoriteNpcExcelIdVec.length) {
      suite.FavoriteNpcVec = await suite.FavoriteNpcExcelIdVec.asyncMap(id => this.selectHomeWorldNPCByAvatarId(id, { LoadHomeWorldEvents: true }));
      suite.FavoriteNpcVec = suite.FavoriteNpcVec.filter(npc =>
        npc.RewardEvents.some(evt => evt.FurnitureSuitId === suite.SuiteId && evt.TalkId));
      suite.FavoriteNpcExcelIdVec = suite.FavoriteNpcVec.map(npc => npc.AvatarId);
    } else {
      suite.FavoriteNpcVec = [];
    }
    if (suite.FurnType && suite.FurnType.length) {
      suite.MappedFurnType = await suite.FurnType.filter(x => !!x).asyncMap(id => this.selectFurnitureType(id));
    }
    if (!suite.MappedFurnType || !suite.MappedFurnType.length) {
      suite.MappedFurnType = [await this.selectFurnitureType(771)]; // outdoor set (non gift)
    }
    suite.MainFurnType = suite.MappedFurnType[0];
    suite.Units = [];
    if (loadConf?.LoadUnits && suite.JsonName) {
      const path = `./BinOutput/HomeworldFurnitureSuit/${suite.JsonName}.json`;
      if (this.fileExists(path)) {
        const data: any = await this.readJsonFile(path);
        if (data && Array.isArray(data.furnitureUnits)) {
          const unitMap: Map<number, {furn: HomeWorldFurnitureExcelConfigData, count: number}> = new Map();
          for (let furnUnit of data.furnitureUnits) {
            const furnId = furnUnit.furnitureID;
            if (!unitMap.has(furnId)) {
              unitMap.set(furnId, {furn: await this.selectFurniture(furnId), count: 0});
            }
            unitMap.get(furnId).count++;
          }
          for (let [furnId, unitInfo] of unitMap) {
            suite.Units.push({
              FurnitureId: toInt(furnId),
              Furniture: unitInfo.furn,
              Count: unitInfo.count,
            })
          }
        }
      }
    }
    return suite;
  }
  //endregion

  // region HomeWorld Furniture Type & Make
  async selectFurnitureType(typeId: number): Promise<HomeWorldFurnitureTypeExcelConfigData> {
    return await this.knex.select('*').from('HomeWorldFurnitureTypeExcelConfigData')
      .where({TypeId: typeId}).first().then(this.commonLoadFirst);
  }

  async selectAllFurnitureType(): Promise<HomeWorldFurnitureTypeExcelConfigData[]> {
    return await this.knex.select('*').from('HomeWorldFurnitureTypeExcelConfigData').then(this.commonLoad);
  }

  async selectFurnitureTypeTree(): Promise<HomeWorldFurnitureTypeTree> {
    const types = await this.selectAllFurnitureType();
    const tree: HomeWorldFurnitureTypeTree = {
      Interior: {},
      Exterior: {},
      InteriorAndExterior: {},
    };

    for (let type of types) {
      let subTree = type.SceneType === 'Exterior' ? tree.Exterior : tree.Interior;

      if (type.TypeCategoryId === 10) { // companion
        subTree = tree.InteriorAndExterior;
      }

      if (!subTree[type.TypeCategoryId]) {
        subTree[type.TypeCategoryId] = {
          categoryId: type.TypeCategoryId,
          categoryName: type.TypeNameText,
          types: {}
        };
      }

      const isDupe: boolean = subTree === tree.InteriorAndExterior &&
        Object.values(subTree[type.TypeCategoryId].types).some(t => t.typeName === type.TypeName2Text);

      if (isDupe) {
        continue;
      }

      subTree[type.TypeCategoryId].types[type.TypeId] = {
        typeId: type.TypeId,
        typeName: type.TypeName2Text,
        typeIcon: type.TabIcon
      };
    }
    return tree;
  }

  async selectFurnitureTypeMap(): Promise<{[typeId: number]: HomeWorldFurnitureTypeExcelConfigData}> {
    return await this.cached('HomeWorld:FurnitureTypeMap:' + this.outputLangCode, 'json', async () => {
      return mapBy(await this.selectAllFurnitureType(), 'TypeId');
    });
  }

  generateFurnitureMakeRecipe(makeData: FurnitureMakeExcelConfigData): string {
    const sb = new SbOut();
    sb.line(`First time creation grants {{Item|Trust|24|x=${makeData.Exp}}}.`);
    sb.setPropPad(1);
    sb.line('{{Recipe');
    sb.prop('type', 'Creation');
    sb.prop('time', Math.floor(makeData.MakeTime / 60 / 60)+'h');
    for (let vec of makeData.MaterialItems) {
      sb.prop(vec.Material.NameText, vec.Count);
    }
    sb.prop('sort', makeData.MaterialItems.map(vec => vec.Material.NameText).join(';'));
    sb.line('}}');
    return sb.toString();
  }

  async selectFurnitureMakeMap(): Promise<{[furnId: number]: FurnitureMakeExcelConfigData}> {
    return await this.cached('HomeWorld:FurnitureMakeMap_' + this.outputLangCode, 'json', async () => {
      const makeArr: FurnitureMakeExcelConfigData[] = await this.readExcelDataFile('FurnitureMakeExcelConfigData.json', true);
      const makeMap: {[furnId: number]: FurnitureMakeExcelConfigData} = {};

      await makeArr.asyncMap(async (make) => {
        makeMap[make.FurnitureItemId] = make;
        if (make.MaterialItems) {
          make.MaterialItems = await make.MaterialItems
            .filter(x => !!Object.keys(x).length)
            .asyncMap(async x => {
              x.Material = await this.selectMaterialExcelConfigData(x.Id);
              return x;
            });
        }
      });

      return makeMap;
    });
  }
  //endregion

  // region HomeWorld Furniture Animal
  async selectHomeWorldAnimalByFurniture(furniture: HomeWorldFurnitureExcelConfigData): Promise<HomeworldAnimalExcelConfigData> {
    const ret: HomeworldAnimalExcelConfigData = await this.knex.select('*').from('HomeworldAnimalExcelConfigData')
      .where({FurnitureId: furniture.Id}).first().then(this.commonLoadFirst);
    if (ret) {
      ret.Furniture = furniture;
      ret.Monster = await this.selectMonsterById(ret.MonsterId);
    }
    return ret;
  }

  async selectHomeWorldAnimalByMonster(monster: MonsterExcelConfigData): Promise<HomeworldAnimalExcelConfigData> {
    const ret: HomeworldAnimalExcelConfigData = await this.knex.select('*').from('HomeworldAnimalExcelConfigData')
      .where({MonsterId: monster.Id}).first().then(this.commonLoadFirst);
    if (ret) {
      ret.Monster = monster;
      ret.Furniture = await this.selectFurniture(ret.FurnitureId);
    }
    return ret;
  }
  // endregion

  // region Materials & Items
  async selectMaterialIdFromFurnitureSuiteId(furnitureSuitId: number): Promise<number> {
    return await this.knex.select('MaterialId').from('Relation_FurnitureSuiteToMaterial')
      .where({FurnitureSuiteId: furnitureSuitId}).first().then(x => x.MaterialId);
  }

  async selectMaterialIdFromFurnitureId(furnitureId: number): Promise<number> {
    return await this.knex.select('MaterialId').from('Relation_FurnitureToMaterial')
      .where({FurnitureId: furnitureId}).first().then(x => x?.MaterialId);
  }

  async selectMaterialSourceDataExcelConfigData(id: number): Promise<MaterialSourceDataExcelConfigData> {
    let sourceData: MaterialSourceDataExcelConfigData = await this.knex.select('*')
      .from('MaterialSourceDataExcelConfigData').where({Id: id}).first().then(this.commonLoadFirst);
    if (!sourceData) {
      return sourceData;
    }
    sourceData.MappedTextList = [];
    for (let textMapHash of sourceData.TextList) {
      let text = await this.getTextMapItem(this.outputLangCode, textMapHash);
      if (text) {
        sourceData.MappedTextList.push(text);
      }
    }
    sourceData.MappedJumpDescs = [];
    for (let textMapHash of sourceData.JumpDescs) {
      let text = await this.getTextMapItem(this.outputLangCode, textMapHash);
      if (text) {
        sourceData.MappedJumpDescs.push(text);
      }
    }
    return sourceData;
  }

  async selectItemRelations(id: number): Promise<ItemRelationMap> {
    const relationMap: ItemRelationMap = {
      Combine: [],
      Compound: [],
      CookRecipe: [],
      CookBonus: [],
      Forge: [],
      FurnitureMake: []
    };

    // [table name, ID field, output prop, single result prop, material vec props]
    const relationConf: [string, string, keyof ItemRelationMap, string, string[]][] = [
      ['CombineExcelConfigData',        'CombineId',  'Combine',        'ResultItemId',     ['MaterialItems']],
      ['CompoundExcelConfigData',       'Id',         'Compound',       null,               ['InputVec', 'OutputVec']],
      ['CookRecipeExcelConfigData',     'Id',         'CookRecipe',     null,               ['InputVec', 'QualityOutputVec']],
      ['CookBonusExcelConfigData',      'RecipeId',   'CookBonus',      'ResultItemId',     []],
      ['ForgeExcelConfigData',          'Id',         'Forge',          'ResultItemId',     ['MaterialItems']],
      ['FurnitureMakeExcelConfigData',  'ConfigId',   'FurnitureMake',  'FurnitureItemId',  ['MaterialItems']],
    ];

    const pList: Promise<void>[] = [];

    for (let conf of relationConf) {
      const [table, idProp, outProp, singleResultProp, materialVecProps] = conf;
      pList.push((async () => {
        const relations: MaterialRelation[] = await this.knex.select('*').from(`Relation_${table}`)
          .where({RoleId: id}).then();

        if (!relations.length) {
          relationMap[outProp] = [];
          return;
        }

        const queryIds: number[] = relations.map(rel => rel.RelationId);
        const rows: any[] = await this.knex.select('*').from(table).whereIn(idProp, queryIds).then(this.commonLoad);

        for (let row of rows) {
          const relation = relations.find(rel => rel.RelationId === row[idProp]);
          relation.RelationData = row;

          if (row['ScoinCost']) {
            row.MaterialItems.push(<MaterialVecItem> {
              Id: MORA_ID,
              Count: row['ScoinCost']
            });
          }

          if (singleResultProp) {
            let outProp = singleResultProp.slice(0, -2); // remove "Id" suffix
            if (row[singleResultProp]) {
              if (table === 'FurnitureMakeExcelConfigData') {
                row[outProp] = await this.selectFurniture(row[singleResultProp]);
              } else {
                row[outProp] = await this.selectMaterialExcelConfigData(row[singleResultProp], {LoadRelations: false, LoadSourceData: false});
              }
              if (table === 'ForgeExcelConfigData' && !row[outProp]) {
                row[outProp] = await this.selectWeaponById(row[singleResultProp]);
              }
            }
          }

          for (let vecProp of materialVecProps) {
            row[vecProp] = row[vecProp].filter(x => !!x.Id);
            for (let vecItem of (row[vecProp] as MaterialVecItem[])) {
              if (vecItem.Id) {
                vecItem.Material = await this.selectMaterialExcelConfigData(vecItem.Id, {LoadRelations: false, LoadSourceData: false});
              }
            }
          }

          relation.RecipeWikitext = [];

          switch (table) {
            case 'CookBonusExcelConfigData': {
              const record: CookBonusExcelConfigData = row;
              record.Avatar = await this.selectAvatarById(record.AvatarId);
              record.Recipe = await this.knex.select('*').from('CookRecipeExcelConfigData')
                .where({Id: record.RecipeId}).first().then(this.commonLoadFirst);
              record.Recipe.InputVec = record.Recipe.InputVec.filter(x => !!x.Id);
              record.Recipe.QualityOutputVec = record.Recipe.QualityOutputVec.filter(x => !!x.Id);
              for (let vecItem of record.Recipe.InputVec) {
                if (vecItem.Id) {
                  vecItem.Material = await this.selectMaterialExcelConfigData(vecItem.Id, {LoadRelations: false, LoadSourceData: false});
                }
              }
              for (let vecItem of record.Recipe.QualityOutputVec) {
                if (vecItem.Id) {
                  vecItem.Material = await this.selectMaterialExcelConfigData(vecItem.Id, {LoadRelations: false, LoadSourceData: false});
                }
              }
              record.RecipeOrdinaryResult = record.Recipe.QualityOutputVec.find(vecItem => vecItem?.Material?.FoodQuality === 'FOOD_QUALITY_ORDINARY');
              break;
            }
            case 'CombineExcelConfigData': {
              const record: CombineExcelConfigData = row;
              const sb = new SbOut();
              sb.setPropPad(1);

              sb.line('{{Recipe');
              sb.prop('type', 'Crafting');
              for (let vec of record.MaterialItems) {
                sb.prop(vec.Material.NameText, vec.Count);
              }
              sb.prop('sort', record.MaterialItems.map(vec => vec.Material.NameText).join(';'));
              if (record.ResultItemCount > 1) {
                sb.prop('yield', record.ResultItemCount);
              }
              sb.line('}}');

              relation.RecipeWikitext.push(sb.toString());
              break;
            }
            case 'CompoundExcelConfigData': {
              const record: CompoundExcelConfigData = row;
              for (let outVecItem of record.OutputVec) {
                const sb = new SbOut();
                sb.setPropPad(1);

                sb.line('{{Recipe');
                sb.prop('type', 'Processing');
                for (let vec of record.InputVec) {
                  sb.prop(vec.Material.NameText, vec.Count);
                }
                sb.prop('sort', record.InputVec.map(vec => vec.Material.NameText).join(';'));
                if (outVecItem.Count > 1) {
                  sb.prop('yield', outVecItem.Count);
                }
                sb.prop('yield', Math.floor(record.CostTime / 60));
                sb.line('}}');

                relation.RecipeWikitext.push(sb.toString());
              }
              break;
            }
            case 'CookRecipeExcelConfigData': {
              const record: CookRecipeExcelConfigData = row;
              const sb = new SbOut();
              sb.setPropPad(1);

              sb.line('{{Recipe');
              sb.prop('type', 'Cooking');
              for (let vec of record.InputVec) {
                sb.prop(vec.Material.NameText, vec.Count);
              }
              sb.prop('sort', record.InputVec.map(vec => vec.Material.NameText).join(';'));
              sb.line('}}');

              relation.RecipeWikitext.push(sb.toString());
              break;
            }
            case 'ForgeExcelConfigData': {
              const record: ForgeExcelConfigData = row;
              const sb = new SbOut();
              sb.setPropPad(1);

              sb.line('{{Recipe');
              sb.prop('type', 'Forging');
              for (let vec of record.MaterialItems) {
                sb.prop(vec.Material.NameText, vec.Count);
              }
              sb.prop('sort', record.MaterialItems.map(vec => vec.Material.NameText).join(';'));
              if (record.ResultItemCount > 1) {
                sb.prop('yield', record.ResultItemCount);
              }
              if (record.ForgeTime >= 60) {
                sb.prop('time', Math.floor(record.ForgeTime / 60));
              } else {
                sb.prop('time', record.ForgeTime + 's');
              }
              sb.line('}}');

              relation.RecipeWikitext.push(sb.toString())
              break;
            }
            case 'FurnitureMakeExcelConfigData': {
              relation.RecipeWikitext.push(this.generateFurnitureMakeRecipe(row))
              break;
            }
          }
        }
        relationMap[outProp] = relations;
      })());
    }

    await Promise.all(pList);

    return relationMap;
  }

  private async postProcessMaterial(material: MaterialExcelConfigData, loadConf: MaterialLoadConf): Promise<MaterialExcelConfigData> {
    if (!material) {
      return material;
    }
    if (material.TypeDescText) {
      material.WikiTypeDescText = GENSHIN_MATERIAL_TYPE_DESC_PLURAL_MAP[material.TypeDescText] || material.TypeDescText;
    } else {
      material.WikiTypeDescText = material.TypeDescText;
    }
    if (!loadConf) {
      return material;
    }
    if (material.Icon) {
      if (material.FoodQuality) {
        material.IconUrl = '/serve-image/genshin/' + material.Icon + '?convert=' + material.FoodQuality;
      } else {
        material.IconUrl = '/images/genshin/' + material.Icon + '.png';
      }

      material.DownloadIconUrl = '/serve-image/genshin/' + material.Icon + '/Item ' + this.sanitizeFileName(material.NameText) + '.png?download=1';
      if (material.FoodQuality) {
        material.DownloadIconUrl += '&convert=' + material.FoodQuality;
      }
    }
    if (material.ItemUse) {
      material.ItemUse = material.ItemUse.map(use => {
        if (use.UseParam) {
          use.UseParam = use.UseParam.filter(x => isset(x) && x !== '');
        }
        return use;
      }).filter(use => !!use.UseOp || (use.UseParam && use.UseParam.length));
    }
    if (loadConf.LoadSourceData) {
      material.SourceData = await this.selectMaterialSourceDataExcelConfigData(material.Id);
    }
    if (loadConf.LoadRelations) {
      material.Relations = await this.selectItemRelations(material.Id);
    }
    if (loadConf.LoadItemUse) {
      material.LoadedItemUse = {};

      const furnId = toInt(material.ItemUse
        .find(x => x.UseOp === 'ITEM_USE_UNLOCK_FURNITURE_FORMULA')?.UseParam[0]);
      if (furnId) {
        material.LoadedItemUse.Furniture = await this.selectFurniture(furnId);
      }

      const furnSuiteId = toInt(material.ItemUse
        .find(x => x.UseOp === 'ITEM_USE_UNLOCK_FURNITURE_SUITE')?.UseParam[0])
      if (furnSuiteId) {
        material.LoadedItemUse.FurnitureSet = await this.selectFurnitureSuite(furnSuiteId);
      }
    }
    if (loadConf.LoadCodex) {
      material.Codex = await this.selectMaterialCodexByMaterialId(material.Id);
    }
    return material;
  }

  async selectMaterialExcelConfigData(id: number, loadConf: MaterialLoadConf = {}): Promise<MaterialExcelConfigData> {
    return await this.knex.select('*').from('MaterialExcelConfigData')
      .where({ Id: id }).first().then(this.commonLoadFirst).then(material => this.postProcessMaterial(material, loadConf));
  }

  async selectMaterialCodexByMaterialId(materialId: number): Promise<MaterialCodexExcelConfigData> {
    return await this.knex.select('*').from('MaterialCodexExcelConfigData')
      .where({ MaterialId: materialId }).first().then(this.commonLoadFirst);
  }

  async selectMaterialsBySearch(searchText: string, searchFlags: string, loadConf: MaterialLoadConf = {}): Promise<MaterialExcelConfigData[]> {
    if (!searchText || !searchText.trim()) {
      return []
    } else {
      searchText = searchText.trim();
    }

    const ids: number[] = [];

    if (isInt(searchText)) {
      ids.push(toInt(searchText));
    }

    await this.streamTextMapMatchesWithIndex({
      inputLangCode: this.inputLangCode,
      outputLangCode: this.outputLangCode,
      searchText,
      textIndexName: 'Material',
      stream: (id: number) => {
        if (!ids.includes(id))
          ids.push(id);
      },
      flags: searchFlags
    });

    const materials: MaterialExcelConfigData[] = await this.knex.select('*').from('MaterialExcelConfigData')
      .whereIn('Id', ids).then(this.commonLoad);
    await materials.asyncMap(material => this.postProcessMaterial(material, loadConf));
    return materials;
  }

  async selectAllMaterialExcelConfigData(loadConf: MaterialLoadConf = {}): Promise<MaterialExcelConfigData[]> {
    const materials: MaterialExcelConfigData[] = await this.knex.select('*').from('MaterialExcelConfigData')
      .then(this.commonLoad);
    await materials.asyncMap(material => this.postProcessMaterial(material, loadConf));
    return materials;
  }
  // endregion

  // region Rewards
  async selectRewardExcelConfigData(rewardId: number): Promise<RewardExcelConfigData> {
    let reward: RewardExcelConfigData = await this.knex.select('*').from('RewardExcelConfigData')
      .where({RewardId: rewardId}).first().then(this.commonLoadFirst);

    if (!reward) {
      return reward;
    }

    await reward.RewardItemList.asyncMap(async (rewardItem) => {
      if (rewardItem.ItemId) {
        rewardItem.Material = await this.selectMaterialExcelConfigData(rewardItem.ItemId);
      }
    });

    reward.RewardItemList = reward.RewardItemList.filter(x => !isEmpty(x));

    return this.generateRewardSummary(reward);
  }

  combineRewardExcelConfigData(...rewardArray: RewardExcelConfigData[]): RewardExcelConfigData {
    if (!rewardArray.length) {
      return null;
    }
    if (rewardArray.length === 1) {
      return rewardArray[0];
    }
    rewardArray = rewardArray.filter(x => !!x);
    let primary = rewardArray[0];
    for (let i = 1; i < rewardArray.length; i++) {
      for (let otherItem of rewardArray[i].RewardItemList) {
        let primaryItem = primary.RewardItemList.find(r => r.ItemId === otherItem.ItemId);
        if (primaryItem) {
          primaryItem.ItemCount += otherItem.ItemCount;
        } else {
          primary.RewardItemList.push(otherItem);
        }
      }
    }
    return this.generateRewardSummary(primary);
  }

  private generateRewardSummary(reward: RewardExcelConfigData): RewardExcelConfigData {
    if (!reward) {
      return reward;
    }

    reward.RewardSummary = {
      // Specific:
      ExpCount: '',
      MoraCount: '',
      PrimogemCount: '',

      // All:
      CombinedStrings: '',
      CombinedStringsNoLocale: '',
      CombinedCards: ''
    };

    for (let item of reward.RewardItemList) {
      if (!item.Material) {
        continue;
      }

      let count = (item.ItemCount || 1);
      let localeCount: string = count.toLocaleString(LANG_CODE_TO_LOCALE[this.outputLangCode]);

      if (this.outputLangCode === 'RU') {
        localeCount = count.toLocaleString(LANG_CODE_TO_LOCALE[this.outputLangCode]).replace(/\s/g, '');
      }

      let cardForm = `{{Card|${item.Material.NameText}|${localeCount}}}`;
      let stringForm = `${item.Material.NameText}*${localeCount}`;
      let stringFormNoLocale = `${item.Material.NameText}*${count}`;

      if (item.ItemId === ADVENTURE_EXP_ID) {
        reward.RewardSummary.ExpCount = localeCount;
      } else if (item.ItemId === MORA_ID) {
        reward.RewardSummary.MoraCount = localeCount;
      } else if (item.ItemId === PRIMOGEM_ID) {
        reward.RewardSummary.PrimogemCount = localeCount;
      }

      reward.RewardSummary.CombinedCards += cardForm;
      reward.RewardSummary.CombinedStrings += (reward.RewardSummary.CombinedStrings.length ? ';' : '') + stringForm;
      reward.RewardSummary.CombinedStringsNoLocale += (reward.RewardSummary.CombinedStringsNoLocale.length ? ';' : '') + stringFormNoLocale;
    }

    return reward;
  }
  // endregion

  // region City & World Area
  async selectCityNameById(cityId: number, forceLangCode?: LangCode): Promise<string> {
    let textMapHash: TextMapHash = await this.knex.select('CityNameTextMapHash')
      .from('CityConfigData').where({CityId: cityId}).first().then(x => x && x.CityNameTextMapHash);
    return textMapHash ? await this.getTextMapItem(forceLangCode || this.outputLangCode, textMapHash) : 'n/a';
  }

  async selectAllCities(filter?: (city: CityConfigData) => boolean): Promise<CityConfigData[]> {
    let cities: CityConfigData[] = await this.knex.select('*').from('CityConfigData').then(this.commonLoad);
    return sort(cities, 'CityId')
      .filter(row => !!row.CityNameText && (!filter || filter(row)))
      .asyncMap(async row => {
        row.CityNameTextEN = await this.getTextMapItem('EN', row.CityNameTextMapHash);
        return row;
      });
  }

  async selectWorldAreas(criteria: { AreaType?: WorldAreaType, AreaId1?: number, AreaId2?: number } = {}): Promise<WorldAreaConfigData[]> {
    let builder = this.knex.select('*').from('WorldAreaConfigData');
    if (criteria.AreaType) {
      builder = builder.where('AreaType', criteria.AreaType)
    }
    if (criteria.AreaId1) {
      builder = builder.where('AreaId1', criteria.AreaId1)
    }
    if (criteria.AreaId2) {
      builder = builder.where('AreaId2', criteria.AreaId2)
    }

    const cities = await this.selectAllCities();
    const worldAreas: WorldAreaConfigData[] = await builder.then(this.commonLoad);

    for (let worldArea of worldAreas) {
      for (let city of cities) {
        if (city.AreaIdVec.includes(worldArea.AreaId1)) {
          worldArea.ParentCity = city;
        }
      }
    }

    return worldAreas;
  }

  async getCityIdFromName(cityNameOrId: string|number): Promise<number> {
    if (!cityNameOrId) {
      return 0;
    }
    if (typeof cityNameOrId === 'number' || isInt(cityNameOrId)) {
      cityNameOrId = toInt(cityNameOrId);
    }
    if (typeof cityNameOrId === 'string') {
      cityNameOrId = cityNameOrId.trim().toLowerCase().replaceAll(/_/g, ' ');
    }

    let cities = await this.knex.select(['CityId', 'CityNameTextMapHash']).from('CityConfigData').then();
    for (let city of cities) {
      if (city.CityId === cityNameOrId) {
        return city.CityId;
      }
      let map = await this.createLangCodeMap(city.CityNameTextMapHash, false);
      for (let text of Object.values(map)) {
        if (!!text && text.toLowerCase() === cityNameOrId) {
          return city.CityId;
        }
      }
    }
    return 0;
  }
  // endregion

  // region Weapons
  private async postProcessWeapon(weapon: WeaponExcelConfigData, loadConf: WeaponLoadConf): Promise<WeaponExcelConfigData> {
    if (!weapon || !loadConf) {
      return weapon;
    }
    if (loadConf.LoadRelations) {
      weapon.Relations = await this.selectItemRelations(weapon.Id);
    }
    if (loadConf.LoadReadable && weapon.StoryId) {
      weapon.Story = await this.selectReadable(weapon.StoryId, true);
    }
    if (loadConf.LoadEquipAffix && weapon.SkillAffix && weapon.SkillAffix.length && isInt(weapon.SkillAffix[0]) && weapon.SkillAffix[0] !== 0) {
      weapon.EquipAffixList = await this.selectEquipAffixListById(weapon.SkillAffix[0]);
    }
    return weapon;
  }

  async selectEquipAffixListById(id: number): Promise<EquipAffixExcelConfigData[]> {
    return await this.knex.select('*').from('EquipAffixExcelConfigData')
      .where({Id: id}).then(this.commonLoad);
  }

  async getWeaponType(weaponType: WeaponType|WeaponTypeEN|GCGTagWeaponType, langCode: LangCode = 'EN'): Promise<string> {
    let hash = ManualTextMapHashes[weaponType];
    if (!hash) {
      hash = ManualTextMapHashes['None'];
    }
    return await this.getTextMapItem(langCode, hash);
  }

  async selectWeaponById(id: number, loadConf: WeaponLoadConf = {}): Promise<WeaponExcelConfigData> {
    return await this.knex.select('*').from('WeaponExcelConfigData')
      .where({Id: id}).first().then(this.commonLoadFirst).then(weapon => this.postProcessWeapon(weapon, loadConf));
  }

  async selectAllWeapons(): Promise<WeaponExcelConfigData[]> {
    return await this.knex.select('*').from('WeaponExcelConfigData').then(this.commonLoad);
  }

  async selectWeaponByStoryId(storyId: number): Promise<WeaponExcelConfigData> {
    return await this.knex.select('*').from('WeaponExcelConfigData')
      .where({StoryId: storyId}).first().then(this.commonLoadFirst);
  }

  async selectWeaponsBySearch(searchText: string, searchFlags: string): Promise<WeaponExcelConfigData[]> {
    if (!searchText || !searchText.trim()) {
      return []
    } else {
      searchText = searchText.trim();
    }

    const ids: number[] = [];

    if (isInt(searchText)) {
      ids.push(toInt(searchText));
    }

    await this.streamTextMapMatchesWithIndex({
      inputLangCode: this.inputLangCode,
      outputLangCode: this.outputLangCode,
      searchText,
      textIndexName: 'Weapon',
      stream: (id: number) => {
        if (!ids.includes(id))
          ids.push(id);
      },
      flags: searchFlags
    });

    return await this.knex.select('*').from('WeaponExcelConfigData')
      .whereIn('Id', ids).then(this.commonLoad);
  }
  // endregion

  // region Artifacts
  async selectArtifactById(id: number): Promise<ReliquaryExcelConfigData> {
    let artifact: ReliquaryExcelConfigData = await this.knex.select('*').from('ReliquaryExcelConfigData')
      .where({Id: id}).first().then(this.commonLoadFirst);
    if (!artifact) {
      return artifact;
    }
    artifact.EquipName = RELIC_EQUIP_TYPE_TO_NAME[artifact.EquipType];
    return artifact;
  }

  async selectArtifactByStoryId(storyId: number): Promise<ReliquaryExcelConfigData> {
    let artifact: ReliquaryExcelConfigData = await this.knex.select('*').from('ReliquaryExcelConfigData')
      .where({StoryId: storyId}).first().then(this.commonLoadFirst);
    if (!artifact) {
      return artifact;
    }
    artifact.EquipName = RELIC_EQUIP_TYPE_TO_NAME[artifact.EquipType];
    return artifact;
  }

  async selectArtifactCodexById(id: number): Promise<ReliquaryCodexExcelConfigData> {
    return await this.knex.select('*').from('ReliquaryCodexExcelConfigData')
      .where({Id: id}).first().then(this.commonLoadFirst);
  }

  async selectArtifactSetById(id: number): Promise<ReliquarySetExcelConfigData> {
    return await this.knex.select('*').from('ReliquarySetExcelConfigData')
      .where({SetId: id}).first().then(this.commonLoadFirst);
  }
  // endregion

  // region Readables
  // region Book Suit/Codex
  private async selectBookSuitById(id: number): Promise<BookSuitExcelConfigData> {
    if (this.state.bookSuitCache[id]) {
      return this.state.bookSuitCache[id];
    }
    let res: BookSuitExcelConfigData = await this.knex.select('*').from('BookSuitExcelConfigData')
      .where({Id: id}).first().then(this.commonLoadFirst);
    res.Books = [];
    this.state.bookSuitCache[id] = res;
    return res;
  }

  private async selectBookCodexByMaterialId(id: number): Promise<BooksCodexExcelConfigData> {
    return await this.knex.select('*').from('BooksCodexExcelConfigData')
      .where({MaterialId: id}).first().then(this.commonLoadFirst);
  }

  async selectBookCollection(suitId: number): Promise<BookSuitExcelConfigData> {
    let archive: ReadableArchive = await this.selectReadableArchive(readable => readable?.BookSuit?.Id === toInt(suitId));
    return archive.BookCollections[suitId];
  }
  // endregion

  // region Readable Search Logic
  private async getDocumentIdsByTitleMatch(langCode: LangCode, searchText: string, flags?: string): Promise<number[]> {
    if (isStringBlank(searchText)) {
      return [];
    }
    let ids: number[] = [];
    await this.streamTextMapMatchesWithIndex({
      inputLangCode: langCode,
      outputLangCode: langCode,
      searchText,
      textIndexName: 'Readable',
      stream: (id: number) => {
        if (!ids.includes(id))
          ids.push(id);
      },
      flags
    });
    return ids;
  }

  private async getReadableFileNamesByContentMatch(langCode: LangCode, searchText: string, flags?: string): Promise<string[]> {
    if (isStringBlank(searchText)) {
      return [];
    }

    let out: string[] = [];

    await grepStream(searchText, this.getDataFilePath(getReadableRelPath(langCode)), line => {
      let exec = /\/([^\/]+)\.txt/.exec(line);
      if (exec) {
        out.push(exec[1]);
      }
    }, { flags: flags || '' });

    return out;
  }

  async searchReadables(searchText: string): Promise<ReadableSearchResult> {
    const contentMatchFileNames = await this.getReadableFileNamesByContentMatch(this.inputLangCode, searchText, this.searchModeFlags);
    const titleMatchDocumentIds = await this.getDocumentIdsByTitleMatch(this.inputLangCode, searchText, this.searchModeFlags);
    const ret: ReadableSearchResult = { ContentResults: [], TitleResults: [] }

    if (contentMatchFileNames.length) {
      const pathVar = LANG_CODE_TO_LOCALIZATION_PATH_PROP[this.inputLangCode];
      const pathVarSearch = contentMatchFileNames.map(f => 'ART/UI/Readable/' + this.inputLangCode + '/' + f.split('.txt')[0]);

      const localizations: LocalizationExcelConfigData[] = await this.knex.select('*')
        .from('LocalizationExcelConfigData')
        .whereIn(pathVar, pathVarSearch)
        .then(this.commonLoad);

      const normSearchText: string = this.normText(searchText, this.inputLangCode);

      ret.ContentResults = await localizations.asyncMap(async localization => {
        return await this.selectReadableByLocalizationId(localization.Id, true);
      });

      for (let view of ret.ContentResults) {
        for (let item of view.Items) {
          item.ReadableText.Markers = {
            AsNormal: Marker.create(normSearchText, item.ReadableText.AsNormal),
            AsDialogue: Marker.create(normSearchText, item.ReadableText.AsDialogue),
            AsTemplate: Marker.create(normSearchText, item.ReadableText.AsTemplate),
          };
        }
      }
    }

    if (titleMatchDocumentIds.length) {
      ret.TitleResults = await titleMatchDocumentIds.asyncMap(async id => await this.selectReadable(id, false));
    }

    return ret;
  }
  // endregion

  // region Select Readable by Localization ID
  private async selectDocumentIdByLocalizationId(localizationId: number): Promise<number> {
    return await this.knex.select('DocumentId').from('Relation_LocalizationIdToDocumentId')
      .where({LocalizationId: localizationId})
      .first()
      .then(res => res ? res.DocumentId : undefined);
  }

  async selectReadableByLocalizationId(localizationId: number, loadReadableItems: boolean = true): Promise<Readable> {
    return await this.selectDocumentIdByLocalizationId(localizationId)
      .then(docId => isset(docId) ? this.selectReadable(docId, loadReadableItems) : null);
  }
  // endregion

  // region Select Document
  private async postProcessDocument(document: DocumentExcelConfigData): Promise<DocumentExcelConfigData> {
    if (!document)
      return document;
    document.TitleTextMap = await this.createLangCodeMap(document.TitleTextMapHash);
    return document;
  }

  async selectDocument(documentId: number): Promise<DocumentExcelConfigData> {
    return await this.knex.select('*').from('DocumentExcelConfigData')
      .where({Id: documentId}).first().then(this.commonLoadFirst).then(x => this.postProcessDocument(x));
  }

  async selectAllDocument(): Promise<DocumentExcelConfigData[]> {
    return await this.knex.select('*').from('DocumentExcelConfigData')
      .then(this.commonLoad).then(ret => ret.asyncMap(x => this.postProcessDocument(x)));
  }
  // endregion

  // region Select Readable
  private async loadLocalization(document: DocumentExcelConfigData,
                                 pageNumber: number,
                                 itemIsAlt: boolean,
                                 contentLocalizedId: number,
                                 triggerCond?: number): Promise<ReadableItem> {
    const localization: LocalizationExcelConfigData = await this.knex.select('*').from('LocalizationExcelConfigData')
      .where({Id: contentLocalizedId}).first().then(this.commonLoadFirst);

    const ret: ReadableItem = {
      Page: pageNumber,
      IsAlternate: itemIsAlt,
      Localization: localization,
      ReadableText: {
        LangCode: this.outputLangCode,
        LangPath: null,
        AsNormal: null,
        AsTemplate: null,
        AsDialogue: null,
      },
      Expanded: [],
      ReadableImages: []
    };

    if (triggerCond) {
      let quest = await this.selectQuestExcelConfigData(triggerCond);
      if (quest) {
        ret.MainQuestTrigger = await this.selectMainQuestById(quest.MainId);
      }
    }

    if (localization && localization.AssetType === 'LOC_TEXT') {
      for (let [_langCode, pathVar] of Object.entries(LANG_CODE_TO_LOCALIZATION_PATH_PROP)) {
        const langCode: LangCode = _langCode as LangCode;
        if (typeof localization[pathVar] === 'string' && localization[pathVar].includes('/Readable/')) {
          const fileName = path.basename(localization[pathVar].split('/Readable/')[1]);
          const filePath = './Readable/' + localization[pathVar].split('/Readable/')[1] + '.txt';
          try {
            const fileText = await fsp.readFile(this.getDataFilePath(filePath), { encoding: 'utf8' });

            const fileNormText = this.normText(fileText, this.outputLangCode)
              .replace(/<br \/>/g, '<br />\n')
              .replace(/^\n\n+/gm, fm => {
                return '<br />\n'.repeat(fm.length);
              })
              .replace(/[ \t]+<br \/>/g, '<br />')
              .replace(/[ \t]+$/gm, '');

            const readableText: ReadableText = {
              LangCode: langCode,
              LangPath: fileName,
              AsNormal: fileNormText
                .replace(/\n\n+/g, '<br /><br />\n')
                .replace(/\n/g, '<!--\n-->'),
              AsTemplate: `{{Readable|title=${document.TitleTextMap[langCode] || ''}\n|text=<!--\n-->`
                + fileNormText
                  .replace(/\n\n+/g, '<br /><br />\n')
                  .replace(/\n/g, '<!--\n-->') + '}}',
              AsDialogue: fileNormText.split(/\n/g).map(line => {
                if (line.endsWith('<br />')) {
                  line = line.slice(0, -6);
                }
                if (!line) {
                  return '::&nbsp;'
                }
                return '::' + line;
              }).join('\n'),
            };

            ret.Expanded.push(readableText);

            if (langCode === this.outputLangCode) {
              ret.ReadableText = readableText;

              for (let match of fileNormText.matchAll(/\{\{tx\|Image: ([^}]+)}}/ig)) {
                ret.ReadableImages.push(match[1]);
              }
            }
          } catch (ignore) {}
        }
      }
    }

    return ret;
  }

  async selectReadable(documentInput: number|DocumentExcelConfigData, loadReadableItems: boolean|((readable: Readable) => boolean) = true): Promise<Readable> {
    const document: DocumentExcelConfigData = typeof documentInput === 'number' ? await this.selectDocument(documentInput) : documentInput;

    if (!document) {
      return null;
    }

    const view: Readable = {
      Id: document.Id,
      Document: document,
      Items: []
    };

    view.BookCodex = await this.selectBookCodexByMaterialId(document.Id);
    view.Material = await this.selectMaterialExcelConfigData(document.Id);
    view.Artifact = await this.selectArtifactByStoryId(document.Id);
    view.Weapon = await this.selectWeaponByStoryId(document.Id);

    if (view.Material && view.Material.SetId) {
      view.BookSuit = await this.selectBookSuitById(view.Material.SetId);
    }

    if (view.Artifact) {
      view.ArtifactSet = await this.selectArtifactSetById(view.Artifact.SetId);
      view.ArtifactCodex = await this.selectArtifactCodexById(view.Artifact.Id);
    }

    if (view.Material) {
      view.TitleText = view.Material.NameText;
      view.TitleTextMapHash = view.Material.NameTextMapHash;
      view.Icon = view.Material.Icon;
      if (!view.TitleText)
        view.TitleText = '(Unnamed item)';
    } else if (view.Artifact) {
      view.TitleText = view.Artifact.NameText;
      view.TitleTextMapHash = view.Artifact.NameTextMapHash;
      view.Icon = view.Artifact.Icon;
      if (!view.TitleText)
        view.TitleText = '(Unnamed artifact)';
    } else if (view.Weapon) {
      view.TitleText = view.Weapon.NameText;
      view.TitleTextMapHash = view.Weapon.NameTextMapHash;
      view.Icon = view.Weapon.Icon;
      if (!view.TitleText)
        view.TitleText = '(Unnamed weapon)';
    } else {
      view.TitleText = '(Unidentifiable readable)';
    }

    const shouldLoadItems: boolean = (typeof loadReadableItems === 'function' ? loadReadableItems(view) : loadReadableItems) === true;
    if (shouldLoadItems) {
      view.Items = [
        ...await view.Document.ContentLocalizedIds.asyncMap((id: number, idx: number) => this.loadLocalization(view.Document, idx + 1, false, id)),
        ...await pairArrays(view.Document.QuestContentLocalizedIds, view.Document.QuestIdList).asyncMap(
          async ([id, triggerCond], idx: number) => await this.loadLocalization(view.Document, idx + 1, true, id, triggerCond)
        )
      ];
    }

    return view;
  }
  // endregion

  // region Readable Archive
  generateReadableArchive(views: Readable[]): ReadableArchive {
    const archive: ReadableArchive = {
      BookCollections: {},
      Materials: [],
      Artifacts: [],
      Weapons: [],
    };

    for (let view of views) {
      if (view.BookSuit) {
        if (!archive.BookCollections[view.BookSuit.Id]) {
          archive.BookCollections[view.BookSuit.Id] = view.BookSuit;
        }
        archive.BookCollections[view.BookSuit.Id].Books.push(view);
      } else if (view.Artifact) {
        archive.Artifacts.push(view);
      } else if (view.Weapon) {
        archive.Weapons.push(view);
      } else {
        archive.Materials.push(view);
      }
    }

    for (let collection of Object.values(archive.BookCollections)) {
      sort(collection.Books, 'BookCodex.SortOrder');
    }

    return archive;
  }

  async selectReadableArchive(loadReadableItems: boolean|((readable: Readable) => boolean) = false): Promise<ReadableArchive> {
    const views: Readable[] = [];

    const allDocuments: DocumentExcelConfigData[] = await this.selectAllDocument();

    for (let document of allDocuments) {
      let view: Readable = await this.selectReadable(document, loadReadableItems);
      if (view) {
        views.push(view);
      }
    }

    return this.generateReadableArchive(views);
  }
  // endregion
  // endregion

  // region New Activity
  async selectNewActivityById(id: number) {
    const activity: NewActivityExcelConfigData = await this.knex.select('*').from('NewActivityExcelConfigData')
      .where({ActivityId: id}).first().then(this.commonLoadFirst);

    if (activity) {
      activity.Entry = await this.knex.select('*').from('NewActivityEntryConfigData')
        .where({Id: id}).first().then(this.commonLoadFirst);
    }

    return activity;
  }

  async selectNewActivityName(id: number): Promise<string> {
    if (!!this.state.newActivityNameCache[id]) {
      return this.state.newActivityNameCache[id];
    }
    let name = await this.knex.select('NameTextMapHash').from('NewActivityExcelConfigData')
      .where({ActivityId: id}).first().then(async res => res ? await this.getTextMapItem(this.outputLangCode, res.NameTextMapHash) : undefined);
    this.state.newActivityNameCache[id] = name;
    return name;
  }
  // endregion

  // region Changelog
  override async selectAllChangelogs(): Promise<Record<string, FullChangelog>> {
    let changelogs = await GenshinVersions.filter(v => v.showChangelog).asyncMap(v => this.selectChangelog(v));
    let map: Record<string, FullChangelog> = {};
    for (let changelog of changelogs) {
      map[changelog.version.number] = changelog;
    }
    return map;
  }

  override async selectChangelog(version: GameVersion): Promise<FullChangelog> {
    if (!version || !version.showChangelog) {
      return null;
    }
    return this.cached('FullChangelog:' + version.number, 'json', async () => {
      const textmapChangelogFileName = path.resolve(process.env.GENSHIN_CHANGELOGS, `./TextMapChangeLog.${version.number}.json`);
      const excelChangelogFileName = path.resolve(process.env.GENSHIN_CHANGELOGS, `./ExcelChangeLog.${version.number}.json`);

      const textmapChangelog = JSON.parse(fs.readFileSync(textmapChangelogFileName, {encoding: 'utf-8'}));
      const excelChangelog = JSON.parse(fs.readFileSync(excelChangelogFileName, {encoding: 'utf-8'}));
      return <FullChangelog> {version: version, textmapChangelog, excelChangelog};
    });
  }

  override async selectChangeRecordAdded(id: string|number): Promise<ChangeRecordRef[]>
  override async selectChangeRecordAdded(id: string|number, excelFile: string): Promise<ChangeRecordRef>

  override async selectChangeRecordAdded(id: string|number, excelFile?: string): Promise<ChangeRecordRef|ChangeRecordRef[]> {
    if (excelFile) {
      return (await this.selectChangeRecords(id, excelFile)).find(r => r.record.changeType === 'added');
    } else {
      return (await this.selectChangeRecords(id)).filter(r => r.record.changeType === 'added');
    }
  }

  override async selectChangeRecords(id: string|number, excelFile?: string): Promise<ChangeRecordRef[]> {
    if (excelFile && excelFile.endsWith('.json')) {
      excelFile = excelFile.slice(0, -5);
    }

    const changeRecordRefs: ChangeRecordRef[] = [];

    const changelogs = await this.selectAllChangelogs();
    for (let [versionNum, fullChangelog] of Object.entries(changelogs)) {
      if (excelFile) {
        if (fullChangelog.excelChangelog[excelFile]?.changedRecords[id]) {
          let record: ChangeRecord = fullChangelog.excelChangelog[excelFile]?.changedRecords[id];
          changeRecordRefs.push({
            version: versionNum,
            excelFile,
            recordKey: String(id),
            record
          });
        }
      } else {
        for (let excelFileChanges of Object.values(fullChangelog.excelChangelog)) {
          if (excelFileChanges.changedRecords[id]) {
            changeRecordRefs.push({
              version: versionNum,
              excelFile: excelFileChanges.name,
              recordKey: String(id),
              record: excelFileChanges.changedRecords[id]
            });
          }
        }
      }
    }

    return changeRecordRefs;
  }

  override async selectTextMapChangeRefAdded(hash: TextMapHash, langCode: LangCode): Promise<TextMapChangeRef> {
    return (await this.selectTextMapChangeRefs(hash, langCode)).find(r => r.changeType === 'added');
  }

  override async selectTextMapChangeRefs(hash: TextMapHash, langCode: LangCode): Promise<TextMapChangeRef[]> {
    const refs: TextMapChangeRef[] = [];

    const changelogs = await this.selectAllChangelogs();
    for (let [versionNum, fullChangelog] of Object.entries(changelogs)) {
      if (fullChangelog?.textmapChangelog?.[langCode]) {
        let changes: TextMapChanges = fullChangelog?.textmapChangelog?.[langCode];
        if (changes.added[hash]) {
          refs.push({
            version: versionNum,
            changeType: 'added',
            value: changes.added[hash]
          });
        } else if (changes.updated[hash]) {
          refs.push({
            version: versionNum,
            changeType: 'updated',
            value: changes.updated[hash].newValue,
            prevValue: changes.updated[hash].oldValue
          });
        } else if (changes.removed[hash]) {
          refs.push({
            version: versionNum,
            changeType: 'removed',
            value: changes.removed[hash]
          });
        }
      }
    }

    return refs;
  }
  // endregion

  // region Achievements
  async selectAchievementGoals(): Promise<AchievementGoalExcelConfigData[]> {
    return await this.cached('AchievementGoals:' + this.outputLangCode, 'json', async () => {
      let goals: AchievementGoalExcelConfigData[] = await this.readDataFile('./ExcelBinOutput/AchievementGoalExcelConfigData.json');
      sort(goals, 'OrderId');
      for (let goal of goals) {
        if (!goal.Id) {
          goal.Id = 0;
        }
        if (goal.FinishRewardId) {
          goal.FinishReward = await this.selectRewardExcelConfigData(goal.FinishRewardId);
        }
        goal.NameTextEN = await this.getTextMapItem('EN', goal.NameTextMapHash);
      }
      return goals;
    });
  }

  async selectAchievements(goalIdConstraint?: number): Promise<AchievementsByGoals> {
    const goals: AchievementGoalExcelConfigData[] = await this.selectAchievementGoals();

    const achievements: AchievementExcelConfigData[] = await this.readDataFile('./ExcelBinOutput/AchievementExcelConfigData.json');
    sort(achievements, 'OrderId');

    const ret: AchievementsByGoals = defaultMap((goalId: number) => ({
      Goal: goals.find(g => g.Id === toInt(goalId)),
      Achievements: []
    }));

    for (let achievement of achievements) {
      achievement = await this.postProcessAchievement(achievement, goalIdConstraint);
      if (achievement) {
        ret[achievement.GoalId].Achievements.push(achievement);
      }
    }

    return ret;
  }

  async selectAchievement(id: number): Promise<AchievementExcelConfigData> {
    let achievement: AchievementExcelConfigData = await this.knex.select('*').from('AchievementExcelConfigData')
      .where({Id: id}).first().then(this.commonLoadFirst);
    return this.postProcessAchievement(achievement);
  }

  async selectAchievementsBySearch(searchText: string, searchFlags: string): Promise<AchievementExcelConfigData[]> {
    if (!searchText || !searchText.trim()) {
      return []
    } else {
      searchText = searchText.trim();
    }

    const ids: number[] = [];

    if (isInt(searchText)) {
      ids.push(toInt(searchText));
    }

    await this.streamTextMapMatchesWithIndex({
      inputLangCode: this.inputLangCode,
      outputLangCode: this.outputLangCode,
      searchText,
      textIndexName: 'Achievement',
      stream: (id) => {
        if (!ids.includes(id))
          ids.push(id);
      },
      flags: searchFlags
    });

    let achievements: AchievementExcelConfigData[] = await this.knex.select('*').from('AchievementExcelConfigData')
      .whereIn('Id', ids).then(this.commonLoad);

    achievements = await achievements.asyncMap(a => this.postProcessAchievement(a));
    achievements = achievements.filter(a => !!a);

    return achievements;
  }

  async postProcessAchievement(achievement: AchievementExcelConfigData, goalIdConstraint?: number) {
    if (!achievement || !achievement.TitleText) {
      return null;
    }
    if (!achievement.GoalId) {
      achievement.GoalId = 0;
    }
    if (isset(goalIdConstraint) && achievement.GoalId !== goalIdConstraint) {
      return null;
    }

    const goals: AchievementGoalExcelConfigData[] = await this.selectAchievementGoals();
    achievement.Goal = goals.find(g => g.Id === achievement.GoalId);

    if (achievement.Progress) {
      achievement.DescText = achievement.DescText.replace(/\{param0}/g, String(achievement.Progress));
    }
    if (achievement.FinishRewardId) {
      achievement.FinishReward = await this.selectRewardExcelConfigData(achievement.FinishRewardId);
    }
    if (achievement.IsShow === 'SHOWTYPE_HIDE') {
      achievement.IsHidden = true;
    }
    if (achievement.TriggerConfig) {
      achievement.TriggerConfig.ParamList = achievement.TriggerConfig.ParamList.filter(s => s !== '');
      achievement.TriggerConfig.TriggerQuests = [];
      if (achievement.TriggerConfig.TriggerType === 'TRIGGER_FINISH_PARENT_QUEST_AND' || achievement.TriggerConfig.TriggerType == 'TRIGGER_FINISH_PARENT_QUEST_OR') {
        for (let qid of achievement.TriggerConfig.ParamList.flatMap(p => p.split(','))) {
          let mainQuest = await this.selectMainQuestById(toInt(qid));
          if (mainQuest) {
            achievement.TriggerConfig.TriggerQuests.push(mainQuest);
          }
        }
      }
      if (achievement.TriggerConfig.TriggerType === 'TRIGGER_FINISH_QUEST_AND' || achievement.TriggerConfig.TriggerType == 'TRIGGER_FINISH_QUEST_OR') {
        for (let qid of achievement.TriggerConfig.ParamList.flatMap(p => p.split(','))) {
          let quest = await this.selectQuestExcelConfigData(toInt(qid));
          if (quest) {
            let mainQuest = await this.selectMainQuestById(quest.MainId);
            if (mainQuest) {
              achievement.TriggerConfig.TriggerQuests.push(mainQuest);
            }
          }
        }
      }
      if (achievement.TriggerConfig.TriggerType.startsWith('TRIGGER_CITY')) {
        achievement.TriggerConfig.CityNameText = await this.selectCityNameById(toInt(achievement.TriggerConfig.ParamList[0]));
      }
    }
    return achievement;
  }
  // endregion
}
// endregion

// region Voice Items
// --------------------------------------------------------------------------------------------------------------

const GENSHIN_VOICE_ITEMS: VoiceItemArrayMap = {};

export async function loadGenshinVoiceItems(): Promise<void> {
  if (GENSHIN_DISABLED)
    return;
  logInitData('Loading Genshin Voice Items -- starting...');

  const voiceItemsFilePath = path.resolve(process.env.GENSHIN_DATA_ROOT, DATAFILE_GENSHIN_VOICE_ITEMS);
  const result: VoiceItemArrayMap = await fsp.readFile(voiceItemsFilePath, {encoding: 'utf8'}).then(data => JSON.parse(data));

  Object.assign(GENSHIN_VOICE_ITEMS, result);
  Object.freeze(GENSHIN_VOICE_ITEMS);
  logInitData('Loading Genshin Voice Items -- done!');
}

export type GenshinVoiceItemType = 'Dialog'|'Reminder'|'Fetter'|'AnimatorEvent'|'WeatherMonologue'|'JoinTeam'|'Card';

export class GenshinVoice {

  getVoiceItemsByType(type: GenshinVoiceItemType, avatar?: string): VoiceItem[] {
    let resultItems: VoiceItem[] = [];
    for (let [key, items] of Object.entries(GENSHIN_VOICE_ITEMS)) {
      if (key.startsWith(type)) {
        if (avatar) {
          for (let item of items) {
            if (item.avatar === avatar) {
              resultItems.push(item);
            }
          }
        } else {
          resultItems.push(... items);
        }
      }
    }
    return resultItems;
  }

  getVoiceItemByFile(voFile: string): VoiceItem {
    voFile = voFile.toLowerCase();
    for (let key of Object.keys(GENSHIN_VOICE_ITEMS)) {
      let voiceItemArray = GENSHIN_VOICE_ITEMS[key];
      for (let voiceItem of voiceItemArray) {
        if (voiceItem.fileName.toLowerCase() == voFile) {
          return voiceItem;
        }
      }
    }
    return null;
  }

  getVoiceItems(type: GenshinVoiceItemType, id: number|string): VoiceItem[] {
    return GENSHIN_VOICE_ITEMS[type+'_'+id];
  }

  hasVoiceItems(type: GenshinVoiceItemType, id: number|string): boolean {
    return !!GENSHIN_VOICE_ITEMS[type+'_'+id] && !!GENSHIN_VOICE_ITEMS[type+'_'+id].length;
  }

  getVoPrefix(type: GenshinVoiceItemType, id: number|string, text?: string, talkRoleType?: TalkRoleType, commentOutDupes: boolean = true): string {
    let voItems = GENSHIN_VOICE_ITEMS[type+'_'+id];
    let voPrefix = '';
    if (voItems) {
      let maleVo = voItems.find(voItem => voItem.gender === 'M');
      let femaleVo = voItems.find(voItem => voItem.gender === 'F');
      let noGenderVo = voItems.filter(voItem => !voItem.gender);
      let tmp = [];

      if (maleVo) {
        tmp.push(`{{A|${maleVo.fileName}}}`);
      }
      if (femaleVo) {
        tmp.push(`{{A|${femaleVo.fileName}}}`);
      }
      if (noGenderVo) {
        noGenderVo.forEach(x => tmp.push(`{{A|${x.fileName}}}`));
      }
      if (tmp.length) {
        if (!commentOutDupes) {
          voPrefix = tmp.join(' ') + ' ';
        } else if (text && (/{{MC/i.test(text) || talkRoleType === 'TALK_ROLE_PLAYER' || talkRoleType === 'TALK_ROLE_MATE_AVATAR')) {
          voPrefix = tmp.join(' ') + ' ';
        } else {
          voPrefix = tmp.shift() + tmp.map(x => `<!--${x}-->`).join('') + ' ';
        }
      }
    }
    return voPrefix;
  }
}
// endregion
