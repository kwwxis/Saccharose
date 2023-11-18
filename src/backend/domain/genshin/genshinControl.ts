// noinspection JSUnusedGlobalSymbols

import {
  CityConfigData,
  ConfigCondition,
  NpcExcelConfigData,
  WorldAreaConfigData,
  WorldAreaType,
} from '../../../shared/types/genshin/general-types';
import SrtParser, { SrtLine } from '../../util/srtParser';
import fs, { promises as fsp } from 'fs';
import {
  arrayIndexOf,
  arrayIntersect,
  arrayUnique,
  cleanEmpty,
  pairArrays,
  sort, toMap,
} from '../../../shared/util/arrayUtil';
import { isInt, toInt } from '../../../shared/util/numberUtil';
import { normalizeRawJson, SchemaTable } from '../../importer/import_db';
import { extractRomanNumeral, isStringBlank, replaceAsync, romanToInt, rtrim } from '../../../shared/util/stringUtil';
import {
  CodexQuestExcelConfigData, CodexQuestGroup, CodexQuestNarratageTypes,
  DialogExcelConfigData,
  DialogUnparented,
  ManualTextMapConfigData,
  ReminderExcelConfigData,
  TalkExcelConfigData,
  TalkLoadType, TalkRole,
  TalkRoleType,
} from '../../../shared/types/genshin/dialogue-types';
import {
  ChapterCollection,
  ChapterExcelConfigData,
  MainQuestExcelConfigData,
  QuestExcelConfigData,
  QuestType,
  ReputationQuestExcelConfigData,
} from '../../../shared/types/genshin/quest-types';
import {
  ADVENTURE_EXP_ID,
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
} from '../../../shared/types/genshin/material-types';
import {
  FurnitureMakeExcelConfigData,
  FurnitureSuiteExcelConfigData,
  HomeworldAnimalExcelConfigData,
  HomeWorldEventExcelConfigData,
  HomeWorldFurnitureExcelConfigData, HomeWorldFurnitureLoadConf,
  HomeWorldFurnitureTypeExcelConfigData,
  HomeWorldFurnitureTypeTree,
  HomeWorldNPCExcelConfigData,
} from '../../../shared/types/genshin/homeworld-types';
import { grepIdStartsWith, grepStream } from '../../util/shellutil';
import {
  DATAFILE_GENSHIN_VOICE_ITEMS,
  getGenshinDataFilePath,
  getReadableRelPath,
  IMAGEDIR_GENSHIN_EXT,
} from '../../loadenv';
import {
  BooksCodexExcelConfigData,
  BookSuitExcelConfigData,
  DocumentExcelConfigData,
  LANG_CODE_TO_LOCALIZATION_PATH_PROP,
  LocalizationExcelConfigData,
  Readable,
  ReadableArchiveView,
  ReadableItem,
  ReadableSearchView,
  ReadableView,
} from '../../../shared/types/genshin/readable-types';
import {
  RELIC_EQUIP_TYPE_TO_NAME,
  ReliquaryCodexExcelConfigData,
  ReliquaryExcelConfigData,
  ReliquarySetExcelConfigData,
} from '../../../shared/types/genshin/artifact-types';
import {
  EquipAffixExcelConfigData,
  WeaponExcelConfigData,
  WeaponLoadConf,
  WeaponType,
  WeaponTypeEN,
} from '../../../shared/types/genshin/weapon-types';
import { AvatarExcelConfigData } from '../../../shared/types/genshin/avatar-types';
import {
  AnimalCodexExcelConfigData,
  AnimalDescribeExcelConfigData, LivingBeingArchive, LivingBeingArchiveGroup, MonsterDescribeExcelConfigData,
  MonsterExcelConfigData, MonsterLoadConf,
} from '../../../shared/types/genshin/monster-types';
import { defaultMap, isEmpty, isset } from '../../../shared/util/genericUtil';
import { NewActivityExcelConfigData } from '../../../shared/types/genshin/activity-types';
import { Marker } from '../../../shared/util/highlightMarker';
import { ElementType, ManualTextMapHashes } from '../../../shared/types/genshin/manual-text-map';
import { custom, logInitData } from '../../util/logger';
import { DialogBranchingCache } from './dialogue/dialogue_util';
import { __normGenshinText } from './genshinText';
import { AbstractControl, AbstractControlState } from '../abstractControl';
import debug from 'debug';
import { LangCode, TextMapHash, VoiceItem, VoiceItemArrayMap } from '../../../shared/types/lang-types';
import { GCGTagElementType, GCGTagWeaponType } from '../../../shared/types/genshin/gcg-types';
import path from 'path';
import { RAW_MANUAL_TEXTMAP_ID_PROP } from '../../importer/genshin/genshin.schema';
import { cached } from '../../util/cache';
import { NormTextOptions } from '../generic/genericNormalizers';
import {
  AchievementExcelConfigData,
  AchievementGoalExcelConfigData,
  AchievementsByGoals,
} from '../../../shared/types/genshin/achievement-types';
import { Request } from 'express';
import {
  InterAction,
  InterActionD2F,
  InterActionFile,
  InterActionGroup,
} from '../../../shared/types/genshin/interaction-types';

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

  // Cache Preferences:
  DisableAvatarCache: boolean = false;
  DisableNpcCache: boolean = false;
  DisableMonsterCache: boolean = false;

  // Autoload Preferences:
  AutoloadText: boolean = true;
  AutoloadAvatar: boolean = true;

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
// TODO: Make this not a god object
export class GenshinControl extends AbstractControl<GenshinControlState> {
  // region Constructor
  readonly voice: GenshinVoice = new GenshinVoice();

  constructor(requestOrState?: Request|GenshinControlState) {
    super('genshin', GenshinControlState, requestOrState);
    this.excelPath = './ExcelBinOutput';
  }

  override getDataFilePath(file: string): string {
    return getGenshinDataFilePath(file);
  }

  override normText(text: string, langCode: LangCode, opts: NormTextOptions = {}): string {
    return __normGenshinText(text, langCode, opts);
  }

  override copy(): GenshinControl {
    return new GenshinControl(this.state.copy());
  }
  // endregion

  // region Post Process
  postProcessCondProp(obj: any, prop: string) {
    if (!Array.isArray(obj[prop])) {
      return;
    }
    let condArray = obj[prop] as ConfigCondition[];
    let newCondArray = [];
    for (let cond of condArray) {
      if (cond.Param) {
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

  override async postProcess<T>(object: T, triggerNormalize?: SchemaTable, doNormText: boolean = false): Promise<T> {
    if (!object)
      return object;
    if (triggerNormalize) {
      object = normalizeRawJson(object, triggerNormalize);
    }
    const objAsAny = object as any;
    for (let prop in object) {
      if (this.state.AutoloadText && (prop.endsWith('MapHash') || prop.endsWith('MapHashList'))) {
        let textProp = prop.endsWith('List') ? prop.slice(0, -11) + 'List' : prop.slice(0, -7);
        if (Array.isArray(object[prop])) {
          let newOriginalArray = [];
          object[textProp] = [];
          for (let id of <any[]> object[prop]) {
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
      if (this.state.AutoloadText && prop.endsWith('Desc') && Array.isArray(object[prop]) && (<any[]> object[prop]).every(x => isInt(x))) {
        let textProp = 'Mapped' + prop;
        let newOriginalArray = [];
        object[textProp] = [];
        for (let id of <any[]> object[prop]) {
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
        for (let id of <any[]> object[prop]) {
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
          for (let item of <any[]> object[prop]) {
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

  // region Main Quest Excel
  private postProcessMainQuest(mainQuest: MainQuestExcelConfigData): MainQuestExcelConfigData {
    if (!mainQuest) {
      return mainQuest;
    }
    let tempType: string = mainQuest.Type;

    if (!tempType && mainQuest.LuaPath && /Quest\/[ALEWM]Q/.test(mainQuest.LuaPath)) {
      tempType = /Quest\/([ALEWM]Q)/.exec(mainQuest.LuaPath)[1];
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

  async selectMainQuestsByNameOrId(name: string|number, limit: number = 25): Promise<MainQuestExcelConfigData[]> {
    if (typeof name === 'string') {
      let textMapHashes: TextMapHash[] = (await this.getTextMapMatches(this.inputLangCode, name, '-i')).map(x => x.hash);
      return await this.knex.select('*').from('MainQuestExcelConfigData')
        .whereIn('TitleTextMapHash', textMapHashes)
        .limit(limit).then(this.commonLoad).then(x => this.postProcessMainQuests(x));
    } else {
      return [await this.selectMainQuestById(name)];
    }
  }

  async doesQuestExist(id: number): Promise<boolean> {
    let result = await this.knex.select('*').from('MainQuestExcelConfigData')
      .where({Id: id}).first();
    return !!result;
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
    if (talk.NpcId && talk.NpcId.length) {
      let dataList: NpcExcelConfigData[] = await this.getNpcList(talk.NpcId, false);
      talk.NpcDataList = dataList;
      talk.NpcNameList = dataList.map(x => x.NameText);
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
    return await this.knex.select('*').from('TalkExcelConfigData')
      .where(cleanEmpty({Id: id, LoadType: loadType}))
      .orWhere(cleanEmpty({QuestCondStateEqualFirst: id, LoadType: loadType})).first()
      .then(this.commonLoadFirst)
      .then(x => this.postProcessTalkExcel(x));
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

  async selectTalkExcelConfigDataByNpcId(npcId: number): Promise<TalkExcelConfigData[]> {
    let talkIds: number[] = await this.knex.select('TalkId').from('Relation_NpcToTalk')
      .where({NpcId: npcId}).pluck('TalkId').then();
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

      if (typeof TalkRole.Id === 'string') {
        TalkRoleId = parseInt(TalkRole.Id);
        if (isNaN(TalkRoleId)) {
          TalkRole.NameText = TalkRole.Id as string;
        }
      } else {
        TalkRoleId = TalkRole.Id;
      }

      if (TalkRole.Type !== 'TALK_ROLE_PLAYER' && TalkRole.Type !== 'TALK_ROLE_WIKI_CUSTOM' && !this.isBlackScreenDialog(dialog) && !TalkRole.Id) {
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
    return dialog;
  }

  private async makeFakeDialog(addon: Partial<DialogExcelConfigData>): Promise<DialogExcelConfigData> {
    return await this.postProcessDialog(Object.assign({
      Id: 0,
      NextDialogs: [],
      TalkRole: {
        Type: 'TALK_ROLE_WIKI_CUSTOM',
        Id: 0
      }
    }, addon));
  }

  async selectDialogExcelConfigDataByTalkRoleId(talkRoleId: number): Promise<DialogExcelConfigData[]> {
    const dialogs: DialogExcelConfigData[] = await this.knex.select('*')
      .from('DialogExcelConfigData')
      .where({TalkRoleId: talkRoleId}).then(this.commonLoad);
    return dialogs.asyncMap(d => this.postProcessDialog(d));
  }

  async selectDialogExcelConfigDataByTalkId(talkId: number): Promise<DialogExcelConfigData[]> {
    const dialogs: DialogExcelConfigData[] = await this.knex.select('*')
      .from('DialogExcelConfigData')
      .where({TalkId: talkId}).then(this.commonLoad);
    return dialogs.asyncMap(d => this.postProcessDialog(d));
  }

  async selectPreviousDialogs(nextId: number): Promise<DialogExcelConfigData[]> {
    const ids: number[] = await this.knex.select('*')
      .from('Relation_DialogToNext')
      .where({NextId: nextId}).pluck('DialogId').then();
    return this.selectMultipleDialogExcelConfigData(arrayUnique(ids));
  }

  async selectSingleDialogExcelConfigData(id: number): Promise<DialogExcelConfigData> {
    let result: DialogExcelConfigData = await this.knex.select('*')
      .from('DialogExcelConfigData')
      .where({Id: id}).first().then(this.commonLoadFirst);
    if (!result) {
      return result;
    }
    result = await this.postProcessDialog(result);
    this.saveToDialogIdCache(result);
    return result && result.TalkContentText ? result : null;
  }

  async selectDialogsFromTextMapHash(textMapHash: TextMapHash): Promise<DialogExcelConfigData[]> {
    let results: DialogExcelConfigData[] = await this.knex.select('*')
      .from('DialogExcelConfigData')
      .where({TalkContentTextMapHash: textMapHash})
      .then(this.commonLoad);
    await results.asyncMap(async d => {
      await this.postProcessDialog(d);
      this.saveToDialogIdCache(d);
    });
    return results;
  }

  async selectMultipleDialogExcelConfigData(ids: number[]): Promise<DialogExcelConfigData[]> {
    if (!ids.length) {
      return [];
    }
    let results: DialogExcelConfigData[] = await this.knex.select('*')
      .from('DialogExcelConfigData')
      .whereIn('Id', ids)
      .then(this.commonLoad);

    await results.asyncMap(async d => {
      await this.postProcessDialog(d);
      this.saveToDialogIdCache(d);
    });

    return results.filter(x => !!x && !!x.TalkContentText);
  }
  // endregion

  // region Dialog Cache Ops
  saveToDialogIdCache(x: DialogExcelConfigData): void {
    this.state.dialogueIdCache.add(x.Id);
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
    return dialog.TalkRole.Type === 'TALK_ROLE_PLAYER';
  }

  isPlayerDialogOption(dialog: DialogExcelConfigData): boolean {
    if (!dialog)
      return false;
    return this.isPlayerTalkRole(dialog) && (!dialog.TalkRoleNameText || dialog.TalkShowType === 'TALK_SHOW_FORCE_SELECT')
      && !this.voice.hasVoiceItems('Dialog', dialog.Id);
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

    const debug: debug.Debugger = custom('dialog:' + debugSource);
    const CQG: CodexQuestGroup = await this.selectCodexQuest(mainQuestId);

    const currBranch: DialogExcelConfigData[] = [];

    if (cache.dialogToBranch.hasOwnProperty(start.Id)) {
      debug('Selecting dialog branch for ' + start.Id + ' (already seen)');
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
      const IAF: InterActionFile = await this.loadInterActionFile(currNode.Id);
      const IA: InterAction = IAF.findForDialog(currNode.Id);
      //console.log(IA);

      // Handle self:
      if (currNode.TalkContentText) {
        currBranch.push(currNode);
      }

      // Fetch next nodes:
      const nextNodes: DialogExcelConfigData[] = await this.selectMultipleDialogExcelConfigData(currNode.NextDialogs);

      // Handle special:
      const selfCodexQuest = CQG.ByContentTextMapHash[currNode.TalkContentTextMapHash];
      if (selfCodexQuest) {
        let nextCodexQuest = CQG.ByItemId[selfCodexQuest.NextItemId];
        while (!!nextCodexQuest && CodexQuestNarratageTypes.has(nextCodexQuest.ContentTextType)) {
          const isBlackScreen = this.isBlackScreenDialog(nextNodes.find(n => n.TalkContentTextMapHash === nextCodexQuest.ContentTextMapHash));
          if (!isBlackScreen) {
            currBranch.push(await this.makeFakeDialog({
              CustomTravelLogMenuText: nextCodexQuest.ContentText
            }));
          }
          nextCodexQuest = CQG.ByItemId[nextCodexQuest.NextItemId];
        }
      }

      // Handle next nodes:
      if (nextNodes.length === 1) {
        // If only one next node -> same branch
        currNode = nextNodes[0];
      } else if (nextNodes.length > 1) {
        // If multiple next nodes -> branching

        const branches: DialogExcelConfigData[][] = await Promise.all(
          nextNodes.map((node: DialogExcelConfigData) => {
            return this.selectDialogBranch(mainQuestId, node, DialogBranchingCache.from(cache), debugSource + ':' + start.Id);
          })
        );

        const intersect: DialogExcelConfigData[] = arrayIntersect<DialogExcelConfigData>(branches, this.IdComparator)
          .filter(x => x.TalkRole.Type !== 'TALK_ROLE_PLAYER'); // do not rejoin on a player talk

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

  async generateDialogueWikiText(dialogLines: DialogExcelConfigData[], dialogDepth = 1,
                                 originatorDialog: DialogExcelConfigData = null, originatorIsFirstOfBranch: boolean = false,
                                 firstDialogOfBranchVisited: Set<number> = new Set()): Promise<string> {
    let out = '';
    let numSubsequentNonBranchPlayerDialogOption = 0;
    let previousDialog: DialogExcelConfigData = null;

    if (dialogLines.length) {
      firstDialogOfBranchVisited.add(dialogLines[0].Id);
    }

    for (let i = 0; i < dialogLines.length; i++) {
      let dialog: DialogExcelConfigData = dialogLines[i];

      // DIcon Prefix
      // ~~~~~~~~~~~~
      let diconPrefix: string;

      if (i == 0 && dialog.TalkRole.Type === 'TALK_ROLE_PLAYER') {
        if (originatorDialog && originatorDialog.TalkRole.Type === 'TALK_ROLE_PLAYER' && !originatorIsFirstOfBranch) {
          diconPrefix = ':'.repeat(dialogDepth);
          dialogDepth += 1;
        } else {
          diconPrefix = ':'.repeat((dialogDepth - 1 ) || 1);
        }
      } else {
        diconPrefix = ':'.repeat(dialogDepth);
      }

      let prefix: string = ':'.repeat(dialogDepth);
      let text: string = dialog.CustomTravelLogMenuText
        ? this.normText(dialog.CustomTravelLogMenuText, this.outputLangCode)
        : this.normText(dialog.TalkContentText, this.outputLangCode);

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

      if (previousDialog && this.isPlayerDialogOption(dialog) && this.isPlayerDialogOption(previousDialog) &&
        (previousDialog.NextDialogs.length === 1 || previousDialog.Branches.map(b => b[0]).every(x => this.isPlayerTalkRole(x))) &&
        previousDialog.NextDialogs.some(x => x === dialog.Id)) {
        // This is for if you have non-branch subsequent player dialogue options for the purpose of generating an output like:
        // :'''Paimon:''' Blah blah blah
        // :{{DIcon}} Paimon, you're sussy baka
        // ::{{DIcon}} And you're emergency food too
        // :'''Paimon:''' Nani!?!?
        // The second dialogue option is indented to show it is an option that follows the previous option rather than
        // the player being presented with two dialogue options at the same time.
        numSubsequentNonBranchPlayerDialogOption++;
      } else {
        numSubsequentNonBranchPlayerDialogOption = 0;
      }

      // Voice-Overs
      // ~~~~~~~~~~~
      let voPrefix = this.voice.getVoPrefix('Dialog', dialog.Id, text, dialog.TalkRole.Type);

      // Output Append
      // ~~~~~~~~~~~~~

      if (dialog.Recurse) {
        if (this.isPlayerTalkRole(dialog)) {
          out += `\n${diconPrefix};(Return to option selection)`;
        } else {
          out += `\n${diconPrefix.slice(0,-1)};(Return to option selection)`;
        }
      } else {
        if (dialog.CustomTravelLogMenuText) {
          out += `\n${prefix}{{Color|menu|${text}}}`;
        } else if (this.isBlackScreenDialog(dialog)) {
          // if (!previousDialog || !this.isBlackScreenDialog(previousDialog)) {
          //   out += '\n';
          // }
          out += `\n${prefix}{{Black Screen|${voPrefix}${text}}}`;
          // out += '\n';
        } else if (this.isPlayerTalkRole(dialog)) {
          if (!this.isPlayerDialogOption(dialog)) {
            let name = this.normText(dialog.TalkRoleNameText || '{NICKNAME}', this.outputLangCode);
            out += `\n${prefix}${voPrefix}'''${name}:''' ${text}`;
          } else {
            out += `\n${diconPrefix}${':'.repeat(numSubsequentNonBranchPlayerDialogOption)}{{DIcon}} ${text}`;
          }
        } else if (dialog.TalkRole.Type === 'TALK_ROLE_NPC' || dialog.TalkRole.Type === 'TALK_ROLE_GADGET') {
          let name = this.normText(dialog.TalkRoleNameText, this.outputLangCode);
          out += `\n${prefix}${voPrefix}'''${name}:''' ${text}`;
        } else if (dialog.TalkRole.Type === 'TALK_ROLE_MATE_AVATAR') {
          out += `\n${prefix}${voPrefix}'''(Traveler's Sibling):''' ${text}`;
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
          out += '\n' + await this.generateDialogueWikiText(dialogBranch, dialogDepth + 1, dialog, i === 0, temp);
        }
        if (includedCount === 0 && excludedCount > 0) {
          out += `\n${diconPrefix};(Return to option selection)`;
        }
      }

      previousDialog = dialog;
    }
    return out.trim();
  }
  // endregion

  // region InterAction Loader
  private async fetchInterActionD2F(): Promise<InterActionD2F> {
    return cached('InterActionD2F', async () => {
      return await this.readJsonFile("InterActionD2F.json");
    });
  }

  async loadInterActionFile(dialogueId: number): Promise<InterActionFile> {
    const refD2F = (await this.fetchInterActionD2F())[dialogueId];
    if (!refD2F) {
      return new InterActionFile();
    }

    const [fileName, groupId, groupIndex] = refD2F;
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
    return new InterActionFile(fileGroups, fileGroups[groupIndex]?.GroupId === groupId ? fileGroups[groupIndex] : fileGroups.find(g => g.GroupId === groupId));
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
    return cached('AnimalCodexManualTextMap_' + this.outputLangCode, async () => {
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

  // region Quest Chapters
  private async postProcessChapter(chapter: ChapterExcelConfigData): Promise<ChapterExcelConfigData> {
    if (!chapter)
      return chapter;
    chapter.Quests = await this.selectMainQuestsByChapterId(chapter.Id);
    chapter.Type = chapter.Quests.find(x => x.Type)?.Type;
    if (chapter.Id === 1105) {
      chapter.Type = 'AQ';
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

  private async postProcessChapters(chapters: ChapterExcelConfigData[]): Promise<ChapterExcelConfigData[]> {
    return Promise.all(chapters.map(x => this.postProcessChapter(x))).then(arr => arr.filter(item => !!item));
  }

  async selectAllChapters(): Promise<ChapterExcelConfigData[]> {
    return await this.knex.select('*').from('ChapterExcelConfigData')
      .then(this.commonLoad).then(x => this.postProcessChapters(x));
  }

  async selectChapterCollection(): Promise<ChapterCollection> {
    let map: ChapterCollection = {
      AQ: {},
      SQ: {},
      EQ: {},
      WQ: {},
    };

    let chapters = await this.selectAllChapters();
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

  async selectChapterById(id: number): Promise<ChapterExcelConfigData> {
    return await this.knex.select('*').from('ChapterExcelConfigData').where({Id: id})
      .first().then(this.commonLoadFirst).then(x => this.postProcessChapter(x));
  }
  // endregion

  // region Cutscene & SRT
  async loadCutsceneSubtitlesByQuestId(questId: number): Promise<{[fileName: string]: string}> {
    let fileNames: string[] = await fsp.readdir(this.getDataFilePath('./Subtitle/'+this.outputLangCode));

    let targetFileNames: string[] = [];
    for (let fileName of fileNames) {
      if (fileName.includes(`Q${questId}`) || fileName.includes(`Q_${questId}`) || fileName.includes(`D${questId}`)) {
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
      out.push(';(A cinematic plays)');
      for (let srtLine of srtLines) {
        out.push(`::'''CS_CHAR:''' ` + this.normText(srtLine.text, this.outputLangCode));
      }
      out.push(':;(Cinematic ends)');
      formattedResults[srtFile] = out.join('\n');
    }

    return formattedResults;
  }
  // endregion

  // region HomeWorld NPC & Events
  async selectAllHomeWorldEvents(): Promise<HomeWorldEventExcelConfigData[]> {
    return await this.knex.select('*').from('HomeWorldEventExcelConfigData').then(this.commonLoad);
  }

  async selectHomeWorldNPC(furnitureId: number): Promise<HomeWorldNPCExcelConfigData> {
    return await this.knex.select('*').from('HomeWorldNPCExcelConfigData')
      .where({FurnitureId: furnitureId}).first().then(this.commonLoadFirst)
      .then((npc: HomeWorldNPCExcelConfigData) => this.postProcessHomeWorldNPC(npc));
  }

  async selectAllHomeWorldNPCs(): Promise<HomeWorldNPCExcelConfigData[]> {
    return await this.knex.select('*').from('HomeWorldNPCExcelConfigData').then(this.commonLoad)
      .then((rows: HomeWorldNPCExcelConfigData[]) => rows.asyncMap(npc => this.postProcessHomeWorldNPC(npc)));
  }

  private async postProcessHomeWorldNPC(npc: HomeWorldNPCExcelConfigData): Promise<HomeWorldNPCExcelConfigData> {
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
    const typeMap = await this.selectFurnitureTypeMap();
    const makeMap = await this.selectFurnitureMakeMap();
    return this.postProcessFurniture(furn, typeMap, makeMap, loadConf);
  }

  async selectFurnitureType(typeId: number): Promise<HomeWorldFurnitureTypeExcelConfigData> {
    return await this.knex.select('*').from('HomeWorldFurnitureTypeExcelConfigData')
      .where({TypeId: typeId}).first().then(this.commonLoadFirst);
  }
  async selectFurnitureSuite(suiteId: number): Promise<FurnitureSuiteExcelConfigData> {
    return await this.knex.select('*').from('FurnitureSuiteExcelConfigData')
      .where({SuiteId: suiteId}).first().then(this.commonLoadFirst);
  }

  async selectAllFurniture(): Promise<HomeWorldFurnitureExcelConfigData[]> {
    let arr: HomeWorldFurnitureExcelConfigData[] = await this.readExcelDataFile('HomeWorldFurnitureExcelConfigData.json', true);
    arr = arr.filter(x => !!x.NameText);

    const typeMap = await this.selectFurnitureTypeMap();
    const makeMap = await this.selectFurnitureMakeMap();
    await Promise.all(arr.map(furn => this.postProcessFurniture(furn, typeMap, makeMap)));
    sort(arr, 'IsExterior', 'CategoryNameText', 'TypeNameText');
    return arr
  }

  async selectAllFurnitureSuite(): Promise<FurnitureSuiteExcelConfigData[]> {
    return await this.knex.select('*').from('FurnitureSuiteExcelConfigData').then(this.commonLoad);
  }

  async selectAllFurnitureType(): Promise<HomeWorldFurnitureTypeExcelConfigData[]> {
    return await this.knex.select('*').from('HomeWorldFurnitureTypeExcelConfigData').then(this.commonLoad);
  }

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
    return await cached('FurnitureTypeMap_' + this.outputLangCode, async () => {
      const arr: HomeWorldFurnitureTypeExcelConfigData[] = await this.selectAllFurnitureType();
      const map: {[typeId: number]: HomeWorldFurnitureTypeExcelConfigData} = {};
      for (let item of arr) {
        map[item.TypeId] = item;
      }
      return map;
    });
  }

  async selectFurnitureMakeMap(): Promise<{[furnId: number]: FurnitureMakeExcelConfigData}> {
    return await cached('FurnitureMakeMap_' + this.outputLangCode, async () => {
      const makeArr: FurnitureMakeExcelConfigData[] = await this.readExcelDataFile('FurnitureMakeExcelConfigData.json', true);
      const makeMap: {[furnId: number]: FurnitureMakeExcelConfigData} = {};

      for (let make of makeArr) {
        makeMap[make.FurnitureItemId] = make;
        if (make.MaterialItems) {
          make.MaterialItems = await make.MaterialItems
            .filter(x => !!Object.keys(x).length)
            .asyncMap(async x => {
              x.Material = await this.selectMaterialExcelConfigData(x.Id);
              return x;
            });
        }
      }

      return makeMap;
    });
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
    furn.MappedFurnType = furn.FurnType.filter(typeId => !!typeId).map(typeId => typeMap[typeId]);
    furn.MakeData = makeMap[furn.Id];
    furn.RelatedMaterialId = await this.selectMaterialIdFromFurnitureId(furn.Id);
    if (furn.RelatedMaterialId) {
      furn.RelatedMaterial = await this.selectMaterialExcelConfigData(furn.RelatedMaterialId);
    }

    furn.IsInterior = furn.MappedFurnType.some(x => x.SceneType !== 'Exterior');
    furn.IsExterior = furn.MappedFurnType.some(x => x.SceneType === 'Exterior');

    if (furn.MappedFurnType[0]) {
      furn.CategoryId = furn.MappedFurnType[0].TypeCategoryId;
      furn.CategoryNameText = furn.MappedFurnType[0].TypeNameText;

      furn.TypeId = furn.MappedFurnType[0].TypeId;
      furn.TypeNameText = furn.MappedFurnType[0].TypeName2Text;
    }

    furn.FilterTokens = [];
    if (furn.IsInterior) furn.FilterTokens.push('Interior');
    if (furn.IsExterior) furn.FilterTokens.push('Exterior');
    for (let type of furn.MappedFurnType) {
      furn.FilterTokens.push('category-'+type.TypeCategoryId);
      furn.FilterTokens.push('subcategory-'+type.TypeId);
    }

    if (loadConf.LoadHomeWorldNPC && furn.SurfaceType === 'NPC') {
      furn.HomeWorldNPC = await this.selectHomeWorldNPC(furn.Id);
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
      Forge: [],
      FurnitureMake: []
    };

    const relationConf: [string, string, keyof ItemRelationMap, string, string[]][] = [
      ['CombineExcelConfigData',        'CombineId',  'Combine',        'ResultItemId',     ['MaterialItems']],
      ['CompoundExcelConfigData',       'Id',         'Compound',       null,               ['InputVec', 'OutputVec']],
      ['CookRecipeExcelConfigData',     'Id',         'CookRecipe',     null,               ['InputVec', 'QualityOutputVec']],
      ['ForgeExcelConfigData',          'Id',         'Forge',          'ResultItemId',     ['MaterialItems']],
      ['FurnitureMakeExcelConfigData',  'ConfigId',   'FurnitureMake',  'FurnitureItemId',  ['MaterialItems']],
    ];

    const pList: Promise<void>[] = [];

    for (let conf of relationConf) {
      let [table, idProp, outProp, singleResultProp, materialVecProps] = conf;

      pList.push((async () => {
        const relations: MaterialRelation[] = await this.knex.select('*').from(`Relation_${table}`)
          .where({RoleId: id}).then();

        if (relations.length) {
          const queryIds: number[] = relations.map(rel => rel.RelationId);
          let rows: any[] = await this.knex.select('*').from(table).whereIn(idProp, queryIds).then(this.commonLoad);

          for (let row of rows) {
            relations.find(rel => rel.RelationId === row[idProp]).RelationData = row;

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
          }
        }

        relationMap[outProp] = relations;
      })());
    }

    await Promise.all(pList);

    return relationMap;
  }

  private async postProcessMaterial(material: MaterialExcelConfigData, loadConf: MaterialLoadConf): Promise<MaterialExcelConfigData> {
    if (!material || !loadConf) {
      return material;
    }
    if (material.Icon) {
      if (material.FoodQuality) {
        material.IconUrl = '/serve-image/genshin?imageName=' + material.Icon + '&convert=' + material.FoodQuality;
      } else {
        material.IconUrl = '/images/genshin/' + material.Icon + '.png';
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

    const ids = [];

    if (isInt(searchText)) {
      ids.push(toInt(searchText));
    }

    await this.streamTextMapMatchesWithIndex(this.inputLangCode, searchText, 'Material', (id) => {
      ids.push(id);
    }, searchFlags);

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
      let localeCount = count.toLocaleString('en-US');

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
      weapon.Story = await this.selectReadableView(weapon.StoryId, true);
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

    const ids = [];

    if (isInt(searchText)) {
      ids.push(toInt(searchText));
    }

    await this.streamTextMapMatchesWithIndex(this.inputLangCode, searchText, 'Weapon', (id) => {
      ids.push(id);
    }, searchFlags);

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

  // region Books & Readables
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

  private async getDocumentIdsByTitleMatch(langCode: LangCode, searchText: string, flags?: string): Promise<number[]> {
    if (isStringBlank(searchText)) {
      return [];
    }
    let ids = [];
    await this.streamTextMapMatchesWithIndex(langCode, searchText, 'Readable', (id, _textMapHash) => {
      ids.push(id);
    }, flags);
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
    }, '-r ' + flags);

    return out;
  }

  async searchReadableView(searchText: string): Promise<ReadableSearchView> {
    const contentMatchFileNames = await this.getReadableFileNamesByContentMatch(this.inputLangCode, searchText, this.searchModeFlags);
    const titleMatchDocumentIds = await this.getDocumentIdsByTitleMatch(this.inputLangCode, searchText, this.searchModeFlags);
    const ret: ReadableSearchView = { ContentResults: [], TitleResults: [] }

    if (contentMatchFileNames.length) {
      const pathVar = LANG_CODE_TO_LOCALIZATION_PATH_PROP[this.inputLangCode];
      const pathVarSearch = contentMatchFileNames.map(f => 'ART/UI/Readable/' + this.inputLangCode + '/' + f.split('.txt')[0]);

      let localizations: LocalizationExcelConfigData[] = await this.knex.select('*')
        .from('LocalizationExcelConfigData')
        .whereIn(pathVar, pathVarSearch)
        .then(this.commonLoad);

      const normSearchText: string = this.normText(searchText, this.inputLangCode);

      ret.ContentResults = await localizations.asyncMap(async localization => {
        let view = await this.selectReadableViewByLocalizationId(localization.Id, true);
        if (!view) {
          return;
        }
        for (let item of view.Items) {
          item.Markers = {
            ReadableText: Marker.create(normSearchText, item.ReadableText),
            ReadableTextAsDialogue: Marker.create(normSearchText, item.ReadableTextAsDialogue),
            ReadableTextAsTemplate: Marker.create(normSearchText, item.ReadableTextAsTemplate),
          }
        }
        return view;
      });
    }

    if (titleMatchDocumentIds.length) {
      ret.TitleResults = await titleMatchDocumentIds.asyncMap(async id => await this.selectReadableView(id, false));
    }

    return ret;
  }

  private async selectDocumentIdByLocalizationId(localizationId: number): Promise<number> {
    return await this.knex.select('DocumentId').from('Relation_LocalizationIdToDocumentId')
      .where({LocalizationId: localizationId})
      .first()
      .then(res => res ? res.DocumentId : undefined);
  }

  private async loadLocalization(document: DocumentExcelConfigData, itemIndex: number, itemIsAlt: boolean, contentLocalizedId: number, triggerCond?: number): Promise<ReadableItem> {
    const localization: LocalizationExcelConfigData = await this.knex.select('*').from('LocalizationExcelConfigData')
      .where({Id: contentLocalizedId}).first().then(this.commonLoadFirst);

    const pathVar = LANG_CODE_TO_LOCALIZATION_PATH_PROP[this.outputLangCode];
    let ret: ReadableItem = {
      Index: itemIndex, IsAlternate: itemIsAlt, Localization: localization, LocalizationName: null,
      ReadableText: null, ReadableTextAsDialogue: null, ReadableTextAsTemplate: null, ReadableImages: []
    };

    if (localization && localization.AssetType === 'LOC_TEXT'
      && typeof localization[pathVar] === 'string' && localization[pathVar].includes('/Readable/')) {
      let fileName = path.basename(localization[pathVar].split('/Readable/')[1]);
      let filePath = './Readable/' + localization[pathVar].split('/Readable/')[1] + '.txt';
      try {
        let fileText = await fsp.readFile(this.getDataFilePath(filePath), { encoding: 'utf8' });
        let fileNormText = this.normText(fileText, this.outputLangCode)
          .replace(/<br \/>/g, '<br />\n')
          .replace(/^\n\n+/gm, fm => {
            return '<br />\n'.repeat(fm.length);
          });
        ret = {
          Index: itemIndex,
          IsAlternate: itemIsAlt,
          Localization: localization,
          LocalizationName: fileName,
          ReadableText: fileNormText,
          ReadableTextAsTemplate: `{{Readable|title=${document.TitleText || ''}\n|text=<!--\n-->`
            + fileNormText
              .replace(/\n\n+/g, '<br /><br />\n')
              .replace(/\n/g, '<!--\n-->') + '}}',
          ReadableTextAsDialogue: fileNormText.split(/\n/g).map(line => {
            if (line.endsWith('<br />')) {
              line = line.slice(0, -6);
            }
            if (!line) {
              return '::&nbsp;'
            }
            return '::' + line;
          }).join('\n'),
          ReadableImages: []
        };
        for (let match of fileNormText.matchAll(/<image\s*name=([^ \/]+)\s*\/>/g)) {
          ret.ReadableImages.push(match[1]);
        }
      } catch (ignore) {}
    }
    if (triggerCond) {
      let quest = await this.selectQuestExcelConfigData(triggerCond);
      if (quest) {
        ret.MainQuestTrigger = await this.selectMainQuestById(quest.MainId);
      }
    }
    return ret;
  }

  private async selectReadableByDocumentId(documentId: number, loadItems: boolean = true): Promise<Readable> {
    const Document: DocumentExcelConfigData = await this.knex.select('*').from('DocumentExcelConfigData')
      .where({Id: documentId}).first().then(this.commonLoadFirst);
    return !Document ? null : {
      Document,
      Items: loadItems ? [
        ... await Document.ContentLocalizedIds.asyncMap((id: number, idx: number) => this.loadLocalization(Document, idx, false, id)),
        ... await pairArrays(Document.AltContentLocalizedIds, Document.AltContentLocalizedQuestConds).asyncMap(
          async ([id, triggerCond], idx: number) => await this.loadLocalization(Document, idx, true, id, triggerCond)
        )
      ] : []
    };
  }

  async selectReadableViewByLocalizationId(localizationId: number, loadReadable: boolean = true): Promise<ReadableView> {
    return await this.selectDocumentIdByLocalizationId(localizationId)
      .then(docId => isset(docId) ? this.selectReadableView(docId, loadReadable) : null);
  }

  async selectReadableView(documentId: number, loadReadable: boolean|((readableView: ReadableView) => boolean) = true): Promise<ReadableView> {
    let view: ReadableView = {Id: documentId, Document: null, Items: []};
    view.BookCodex = await this.selectBookCodexByMaterialId(documentId);
    view.Material = await this.selectMaterialExcelConfigData(documentId);
    view.Artifact = await this.selectArtifactByStoryId(documentId);
    view.Weapon = await this.selectWeaponByStoryId(documentId);

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

    const shouldLoadItems = (typeof loadReadable === 'function' ? loadReadable(view) : loadReadable) === true;
    const readable = await this.selectReadableByDocumentId(documentId, shouldLoadItems);
    if (readable) {
      Object.assign(view, readable);
      return view;
    } else {
      return null;
    }
  }

  async selectBookCollection(suitId: number): Promise<BookSuitExcelConfigData> {
    let archive: ReadableArchiveView = await this.selectReadableArchiveView(readableView => readableView?.BookSuit?.Id === toInt(suitId));
    return archive.BookCollections[suitId];
  }

  async selectReadableArchiveView(loadReadables: boolean|((readableView: ReadableView) => boolean) = false): Promise<ReadableArchiveView> {
    const archive: ReadableArchiveView = {
      BookCollections: {},
      Materials: [],
      Artifacts: [],
      Weapons: [],
    };

    for (let document of await this.readDataFile<DocumentExcelConfigData[]>('./ExcelBinOutput/DocumentExcelConfigData.json')) {
      let view = await this.selectReadableView(document.Id, loadReadables);

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

  // region Achievements
  async selectAchievementGoals(): Promise<AchievementGoalExcelConfigData[]> {
    return await cached('AchievementGoals_' + this.outputLangCode, async () => {
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

    const ids = [];

    if (isInt(searchText)) {
      ids.push(toInt(searchText));
    }

    await this.streamTextMapMatchesWithIndex(this.inputLangCode, searchText, 'Achievement', (id) => {
      ids.push(id);
    }, searchFlags);

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