// noinspection JSUnusedGlobalSymbols

import {
  CityConfigData,
  ConfigCondition,
  NpcExcelConfigData,
  WorldAreaConfigData,
  WorldAreaType,
} from '../../../shared/types/genshin/general-types';
import { getVoPrefix } from './genshinVoiceItems';
import { Request } from '../../util/router';
import SrtParser, { SrtLine } from '../../util/srtParser';
import { promises as fs } from 'fs';
import {
  arrayIndexOf,
  arrayIntersect,
  arrayUnique,
  cleanEmpty,
  pairArrays,
  sort,
} from '../../../shared/util/arrayUtil';
import { isInt, toInt, toNumber } from '../../../shared/util/numberUtil';
import { normalizeRawJson, normalizeRawJsonKey, schema, SchemaTable } from '../../importer/import_db';
import {
  escapeRegExp,
  extractRomanNumeral,
  isStringBlank,
  replaceAsync,
  romanToInt,
} from '../../../shared/util/stringUtil';
import {
  DialogExcelConfigData,
  ManualTextMapConfigData,
  QuestSummarizationTextExcelConfigData,
  ReminderExcelConfigData,
  TalkExcelConfigData,
  TalkLoadType,
  TalkRole,
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
  FurnitureSuiteExcelConfigData,
  HomeWorldEventExcelConfigData,
  HomeWorldFurnitureExcelConfigData,
  HomeWorldFurnitureTypeExcelConfigData,
  HomeWorldNPCExcelConfigData,
} from '../../../shared/types/genshin/homeworld-types';
import { getLineNumberForLineText, grep, grepIdStartsWith, grepStream } from '../../util/shellutil';
import {
  getGenshinDataFilePath,
  getPlainTextMapRelPath,
  getReadableRelPath,
  getTextIndexRelPath,
  getTextMapRelPath,
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
import { WeaponExcelConfigData, WeaponLoadConf } from '../../../shared/types/genshin/weapon-types';
import { AvatarExcelConfigData } from '../../../shared/types/genshin/avatar-types';
import { basename } from 'path';
import { MonsterExcelConfigData } from '../../../shared/types/genshin/monster-types';
import { isEmpty, isset } from '../../../shared/util/genericUtil';
import { NewActivityExcelConfigData } from '../../../shared/types/genshin/activity-types';
import { Marker } from '../../../shared/util/highlightMarker';
import { ElementType, ManualTextMapHashes } from '../../../shared/types/genshin/manual-text-map';
import { custom } from '../../util/logger';
import { DialogBranchingCache } from './dialogue/dialogue_util';
import { normText } from './genshinNormalizers';
import { IdUsages, SearchMode } from '../../util/searchUtil';
import { AbstractControl, AbstractControlState } from '../abstractControl';
import debug from 'debug';
import { LANG_CODES, LangCode, LangCodeMap } from '../../../shared/types/lang-types';

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
  questSummaryCache: QuestSummarizationTextExcelConfigData[] = null;

  // Preferences:
  DisableNpcCache: boolean = false;
  DisableAvatarCache: boolean = false;
  ExcludeOrphanedDialogue: boolean = false;
}

export function getGenshinControl(controlState?: Request|GenshinControlState) {
  return new GenshinControl(controlState);
}

// TODO: Make this not a god object
export class GenshinControl extends AbstractControl<GenshinControlState> {
  constructor(controlState: Request|GenshinControlState) {
    super(controlState, GenshinControlState);
  }

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

  async postProcess<T>(object: T, triggerNormalize?: SchemaTable): Promise<T> {
    if (!object)
      return object;
    if (triggerNormalize) {
      object = normalizeRawJson(object, triggerNormalize);
    }
    const objAsAny = object as any;
    for (let prop in object) {
      if (prop.endsWith('MapHash') || prop.endsWith('MapHashList')) {
        let textProp = prop.endsWith('List') ? prop.slice(0, -11) + 'List' : prop.slice(0, -7);
        if (Array.isArray(object[prop])) {
          let newOriginalArray = [];
          object[textProp] = [];
          for (let id of <any[]> object[prop]) {
            let text = await this.getTextMapItem(this.outputLangCode, id);
            if (text) {
              object[textProp].push(text);
              newOriginalArray.push(id);
            }
          }
          objAsAny[prop] = newOriginalArray;
        } else {
          let text = await this.getTextMapItem(this.outputLangCode, object[prop]);
          if (!!text) {
            object[textProp] = text;
          }
        }
      }
      if (prop.endsWith('Tips') && Array.isArray(object[prop])) {
        let textProp = 'Mapped' + prop;
        let newOriginalArray = [];
        object[textProp] = [];
        for (let id of <any[]> object[prop]) {
          let text = await this.getTextMapItem(this.outputLangCode, id);
          if (text) {
            object[textProp].push(text);
            newOriginalArray.push(id);
          }
        }
        objAsAny[prop] = newOriginalArray;
      }
      if (prop.endsWith('ElementType') || prop.endsWith('ElementTypes')) {
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
      if ((prop.endsWith('NpcList') || prop.endsWith('NpcId')) && Array.isArray(objAsAny[prop])) {
        let slicedProp = prop.endsWith('NpcList') ? prop.slice(0, -4) : prop.slice(0, -2);
        let dataList: NpcExcelConfigData[] = (await this.getNpcList(object[prop] as any, false));
        object[slicedProp+'DataList'] = dataList;
        object[slicedProp+'NameList'] = dataList.map(x => x.NameText);
      }
      if (prop.endsWith('NpcId') && !Array.isArray(objAsAny[prop])) {
        let slicedProp = prop.slice(0, -2);
        object[slicedProp] = await this.getNpc(objAsAny[prop]);
      }
      if (prop == 'TalkRole') {
        let TalkRole = (<any> object[prop]) as TalkRole;
        let TalkRoleId: number = null;

        if (typeof TalkRole.Id === 'string') {
          TalkRoleId = parseInt(TalkRole.Id);
          if (isNaN(TalkRoleId)) {
            TalkRole.NameText = TalkRole.Id as string;
          }
        } else {
          TalkRoleId = TalkRole.Id;
        }

        if (TalkRole.Type === 'TALK_ROLE_PLAYER') {
          delete TalkRole.Id;
          continue;
        }

        let npc = await this.getNpc(TalkRoleId);
        if (npc) {
          TalkRole.NameTextMapHash = npc.NameTextMapHash;
          TalkRole.NameText = npc.NameText;
        }
      }
      if (prop === 'AvatarId' && typeof objAsAny[prop] === 'number') {
        objAsAny.Avatar = await this.selectAvatarById(objAsAny[prop]);
      }
      if (prop === 'MonsterId' && typeof objAsAny[prop] === 'number') {
        objAsAny.Monster = await this.selectMonsterById(objAsAny[prop]);
      }
      if (object[prop] === null || objAsAny[prop] === '') {
        delete object[prop];
      }
    }
    if (!objAsAny.TalkRoleNameText && !!objAsAny.TalkRole) {
      objAsAny.TalkRoleNameText = objAsAny.TalkRole.NameText;
      objAsAny.TalkRoleNameTextMapHash = objAsAny.TalkRole.NameTextMapHash;
    }
    return object;
  }

  readonly commonLoad = async (result: any[], triggerNormalize?: SchemaTable) => await Promise.all(
    result.map(record => {
      return !record || !record.json_data
        ? this.postProcess(record, triggerNormalize)
        : this.postProcess(JSON.parse(record.json_data), triggerNormalize);
    })
  );

  readonly commonLoadFirst = async (record: any, triggerNormalize?: SchemaTable) => {
    return !record || !record.json_data
      ? this.postProcess(record, triggerNormalize)
      : await this.postProcess(JSON.parse(record.json_data), triggerNormalize);
  };

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
      let textMapIds: number[] = (await this.getTextMapMatches(this.inputLangCode, name, '-i')).map(x => x.hash);
      return await this.knex.select('*').from('MainQuestExcelConfigData')
        .whereIn('TitleTextMapHash', textMapIds)
        .limit(limit).then(this.commonLoad).then(x => this.postProcessMainQuests(x));
    } else {
      return [await this.selectMainQuestById(name)];
    }
  }

  async getTextMapItem(langCode: LangCode, hash: any): Promise<string> {
    // if (typeof hash === 'number') {
    //   hash = String(hash);
    // }
    // if (typeof hash !== 'string') {
    //   return undefined;
    // }
    // if (langCode === 'CH') {
    //   langCode = 'CHS';
    // }
    // return TextMap[langCode][hash];
    return await this.knex.select('Text').from('TextMap'+langCode)
      .where({Hash: hash}).first().then(x => x.Text);
  }
  
  async createLangCodeMap(hash: any, doNormText: boolean = true): Promise<LangCodeMap> {
    let map = {};
    for (let langCode of LANG_CODES) {
      map[langCode] = await this.getTextMapItem(langCode, hash);
      if (doNormText) {
        map[langCode] = normText(map[langCode], langCode);
      }
    }
    return map as LangCodeMap;
  }

  async getTextMapHashFromPlainLineMap(langCode: LangCode, lineNum: number): Promise<number> {
    // return PlainLineMap[langCode][lineNum] || undefined;
    return await this.knex.select('Hash').from('PlainLineMap'+langCode)
      .where({Line: lineNum}).first().then(x => x.Hash);
  }

  async getElementName(elementType: ElementType, langCode: LangCode = 'EN'): Promise<string> {
    let hash = ManualTextMapHashes[elementType];
    if (!hash) {
      hash = ManualTextMapHashes['None'];
    }
    return await this.getTextMapItem(langCode, hash);
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

  async selectManualTextMapConfigDataById(id: string): Promise<ManualTextMapConfigData> {
    return await this.knex.select('*').from('ManualTextMapConfigData')
      .where({TextMapId: id}).first().then(this.commonLoadFirst);
  }

  async selectTalkExcelConfigDataById(id: number, loadType: TalkLoadType = null): Promise<TalkExcelConfigData> {
    return await this.knex.select('*').from('TalkExcelConfigData')
      .where(cleanEmpty({Id: id, LoadType: loadType}))
      .orWhere(cleanEmpty({QuestCondStateEqualFirst: id, LoadType: loadType})).first().then(this.commonLoadFirst);
  }

  async selectTalkExcelConfigDataByQuestSubId(id: number, loadType: TalkLoadType = null): Promise<TalkExcelConfigData> {
    return await this.knex.select('*').from('TalkExcelConfigData')
      .where(cleanEmpty({Id: id, LoadType: loadType}))
      .orWhere(cleanEmpty({QuestCondStateEqualFirst: id, LoadType: loadType})).first().then(this.commonLoadFirst);
  }

  async selectTalkExcelConfigDataIdsByPrefix(idPrefix: number|string): Promise<number[]> {
    let allTalkExcelTalkConfigIds = this.state.ExcludeOrphanedDialogue ? []
      : await grepIdStartsWith('Id', idPrefix, './ExcelBinOutput/TalkExcelConfigData.json');
    return allTalkExcelTalkConfigIds.map(i => toNumber(i));
  }

  async selectTalkExcelConfigDataByFirstDialogueId(firstDialogueId: number, loadType: TalkLoadType = null): Promise<TalkExcelConfigData> {
    return await this.knex.select('*').from('TalkExcelConfigData')
      .where(cleanEmpty({InitDialog: firstDialogueId, LoadType: loadType})).first().then(this.commonLoadFirst);
  }

  async selectTalkExcelConfigDataListByFirstDialogueId(firstDialogueId: number, loadType: TalkLoadType = null): Promise<TalkExcelConfigData[]> {
    return await this.knex.select('*').from('TalkExcelConfigData')
      .where(cleanEmpty({InitDialog: firstDialogueId, LoadType: loadType})).then(this.commonLoad);
  }

  async addOrphanedDialogueAndQuestMessages(mainQuest: MainQuestExcelConfigData) {
    let allDialogueIds = this.state.ExcludeOrphanedDialogue ? [] : await grepIdStartsWith('id', mainQuest.Id, './ExcelBinOutput/DialogExcelConfigData.json');
    let allQuestMessageIds = await grepIdStartsWith('TextMapId', 'QUEST_Message_Q' + mainQuest.Id, './ExcelBinOutput/ManualTextMapConfigData.json');
    let consumedQuestMessageIds = [];

    const handleOrphanedDialog = async (quest: MainQuestExcelConfigData|QuestExcelConfigData, id: number) => {
      if (this.state.dialogueIdCache.has(id))
        return;
      let dialog = await this.selectSingleDialogExcelConfigData(id as number);
      if (dialog) {
        if (!quest.OrphanedDialog)
          quest.OrphanedDialog = [];
        let dialogs = await this.selectDialogBranch(dialog);
        quest.OrphanedDialog.push(dialogs);
      }
    }

    for (let quest of mainQuest.QuestExcelConfigDataList) {
      for (let id of allDialogueIds) {
        if (!id.toString().startsWith(quest.SubId.toString()))
          continue;
        await handleOrphanedDialog(quest, id as number);
      }
      if (allQuestMessageIds && allQuestMessageIds.length) {
        quest.QuestMessages = [];
        for (let id of allQuestMessageIds) {
          if (!id.toString().startsWith('QUEST_Message_Q' + quest.SubId.toString()))
            continue;
          quest.QuestMessages.push(await this.selectManualTextMapConfigDataById(id as string));
          consumedQuestMessageIds.push(id);
        }
      }
    }
    for (let id of allDialogueIds) {
      await handleOrphanedDialog(mainQuest, id as number);
    }
    if (allQuestMessageIds && allQuestMessageIds.length) {
      mainQuest.QuestMessages = [];
      for (let id of allQuestMessageIds) {
        if (consumedQuestMessageIds.includes(id))
          continue;
        mainQuest.QuestMessages.push(await this.selectManualTextMapConfigDataById(id as string));
      }
    }
  }

  async selectTalkExcelConfigDataByQuestId(questId: number, loadType: TalkLoadType = null): Promise<TalkExcelConfigData[]> {
    return await this.knex.select('*').from('TalkExcelConfigData')
      .where(cleanEmpty({QuestId: questId, LoadType: loadType}))
      .orWhere(cleanEmpty({QuestCondStateEqualFirst: questId, LoadType: loadType})).then(this.commonLoad);
  }

  async selectTalkExcelConfigDataByNpcId(npcId: number): Promise<TalkExcelConfigData[]> {
    let talkIds: number[] = await this.knex.select('TalkId').from('Relation_NpcToTalk')
      .where({NpcId: npcId}).pluck('TalkId').then();
    return Promise.all(talkIds.map(talkId => this.selectTalkExcelConfigDataById(talkId)));
  }

  private postProcessDialog(dialog: DialogExcelConfigData): DialogExcelConfigData {
    if (dialog.TalkRole.Type !== 'TALK_ROLE_PLAYER' && !this.isBlackScreenDialog(dialog) && !dialog.TalkRole.Id) {
      dialog.TalkRole.Type = 'TALK_ROLE_PLAYER';
    }
    return dialog;
  }

  async selectDialogExcelConfigDataByTalkRoleId(talkRoleId: number): Promise<DialogExcelConfigData[]> {
    let dialogs: DialogExcelConfigData[] = await this.knex.select('*').from('DialogExcelConfigData')
      .where({TalkRoleId: talkRoleId}).then(this.commonLoad);
    return dialogs.map(d => this.postProcessDialog(d));
  }

  async selectPreviousDialogs(nextId: number): Promise<DialogExcelConfigData[]> {
    let ids: number[] = await this.knex.select('*').from('Relation_DialogToNext')
      .where({NextId: nextId}).pluck('DialogId').then();
    return this.selectMultipleDialogExcelConfigData(arrayUnique(ids));
  }

  async selectSingleDialogExcelConfigData(id: number): Promise<DialogExcelConfigData> {
    let result: DialogExcelConfigData = await this.knex.select('*').from('DialogExcelConfigData')
      .where({Id: id}).first().then(this.commonLoadFirst);
    if (!result) {
      return result;
    }
    result = this.postProcessDialog(result);
    this.saveToDialogIdCache(result);
    return result && result.TalkContentText ? result : null;
  }

  saveToDialogIdCache(x: DialogExcelConfigData): void {
    this.state.dialogueIdCache.add(x.Id);
  }
  isInDialogIdCache(x: number|DialogExcelConfigData): boolean {
    return this.state.dialogueIdCache.has(typeof x === 'number' ? x : x.Id);
  }

  async selectMultipleDialogExcelConfigData(ids: number[]): Promise<DialogExcelConfigData[]> {
    if (!ids.length) {
      return [];
    }
    return await Promise.all(ids.map(id => this.selectSingleDialogExcelConfigData(id)))
      .then(arr => arr.filter(x => !!x && !!x.TalkContentText));
  }

  copyDialogForRecurse(node: DialogExcelConfigData) {
    let copy: DialogExcelConfigData = JSON.parse(JSON.stringify(node));
    copy.Recurse = true;
    return copy;
  }

  async selectDialogsFromTextContentId(textMapId: number): Promise<DialogExcelConfigData[]> {
    let results: DialogExcelConfigData[] = await this.knex.select('*').from('DialogExcelConfigData')
      .where({TalkContentTextMapHash: textMapId})
      .then(this.commonLoad);
    for (let result of results) {
      result = this.postProcessDialog(result);
      this.saveToDialogIdCache(result);
    }
    return results;
  }

  isPlayerDialogueOption(dialog: DialogExcelConfigData): boolean {
    return dialog.TalkRole.Type === 'TALK_ROLE_PLAYER'; // && dialog.TalkShowType && dialog.TalkShowType === 'TALK_SHOW_FORCE_SELECT';
  }

  async selectDialogBranch(start: DialogExcelConfigData, cache?: DialogBranchingCache, debugSource?: string|number): Promise<DialogExcelConfigData[]> {
    if (!start)
      return [];
    if (!debugSource)
      debugSource = 'any';
    if (!cache)
      cache = new DialogBranchingCache(null, null);

    const debug: debug.Debugger = custom('dialog:' + debugSource);

    const currBranch: DialogExcelConfigData[] = [];

    if (cache.dialogToBranch.hasOwnProperty(start.Id)) {
      debug('Selecting dialog branch for ' + start.Id + ' (already seen)');
      //currBranch.push(this.copyDialogForRecurse(start));
      return cache.dialogToBranch[start.Id];
    } else {
      debug('Selecting dialog branch for ' + start.Id);
      cache.dialogToBranch[start.Id] = currBranch;
    }

    let currNode = start;

    while (currNode) {
      if (cache.dialogSeenAlready.has(currNode.Id)) {
        currBranch.push(this.copyDialogForRecurse(currNode));
        break;
      } else {
        cache.dialogSeenAlready.add(currNode.Id);
      }

      if (currNode.TalkContentText) {
        currBranch.push(currNode);
      }

      const nextNodes: DialogExcelConfigData[] = await this.selectMultipleDialogExcelConfigData(currNode.NextDialogs);

      if (nextNodes.length === 1) {
        // If only one next node -> same branch
        currNode = nextNodes[0];
      } else if (nextNodes.length > 1) {
        // If multiple next nodes -> branching

        const branches: DialogExcelConfigData[][] = await Promise.all(
          nextNodes.map((node: DialogExcelConfigData) => {
            return this.selectDialogBranch(node, DialogBranchingCache.from(cache), debugSource + ':' + start.Id);
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
        // No more dialog
        currNode = null;
      }
    }
    return currBranch;
  }

  async selectNpcListByName(nameOrTextMapId: number|string|number[]): Promise<NpcExcelConfigData[]> {
    if (typeof nameOrTextMapId === 'string') {
      nameOrTextMapId = await this.findTextMapIdsByExactName(nameOrTextMapId);
    }
    if (typeof nameOrTextMapId === 'number') {
      nameOrTextMapId = [ nameOrTextMapId ];
    }
    return await this.knex.select('*').from('NpcExcelConfigData')
      .whereIn('NameTextMapHash', <number[]>nameOrTextMapId).then(this.commonLoad);
  }

  doesDialogHaveNpc(dialog: DialogExcelConfigData, npcNames: string[]) {
    if (npcNames.includes(dialog.TalkRole.NameText)) {
      return true;
    }
    if (dialog.Branches) {
      for (let branch of dialog.Branches) {
        for (let branchDialog of branch) {
          if (this.doesDialogHaveNpc(branchDialog, npcNames)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  doesQuestSubHaveNpc(questSub: QuestExcelConfigData, npcNames: string[]) {
    if (questSub.TalkExcelConfigDataList) {
      for (let talkConfig of questSub.TalkExcelConfigDataList) {
        for (let dialog of talkConfig.Dialog) {
          if (this.doesDialogHaveNpc(dialog, npcNames)) {
            return true;
          }
        }
      }
    }
    if (questSub.OrphanedDialog) {
      for (let dialogs of questSub.OrphanedDialog) {
        for (let dialog of dialogs) {
          if (this.doesDialogHaveNpc(dialog, npcNames)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  isBlackScreenDialog(dialog: DialogExcelConfigData): boolean {
    return dialog.TalkRole.Type === 'TALK_ROLE_BLACK_SCREEN' || dialog.TalkRole.Type === 'TALK_ROLE_CONSEQUENT_BLACK_SCREEN'
      || dialog.TalkRole.Type === 'TALK_ROLE_NEED_CLICK_BLACK_SCREEN' || dialog.TalkRole.Type === 'TALK_ROLE_CONSEQUENT_NEED_CLICK_BLACK_SCREEN';
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
      let text: string = normText(dialog.TalkContentText, this.outputLangCode);

      // Traveler SEXPRO
      // ~~~~~~~~~~~~~~~

      if (text.includes('SEXPRO')) {
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

      if (previousDialog && this.isPlayerDialogueOption(dialog) && this.isPlayerDialogueOption(previousDialog) &&
        (previousDialog.NextDialogs.length === 1 || previousDialog.Branches.map(b => b[0]).every(x => this.isPlayerDialogueOption(x))) &&
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
      let voPrefix = getVoPrefix('Dialog', dialog.Id, text, dialog.TalkRole.Type);

      // Output Append
      // ~~~~~~~~~~~~~

      if (dialog.Recurse) {
        if (dialog.TalkRole.Type === 'TALK_ROLE_PLAYER') {
          out += `\n${diconPrefix};(Return to option selection)`;
        } else {
          out += `\n${diconPrefix.slice(0,-1)};(Return to option selection)`;
        }
      } else {
        if (this.isBlackScreenDialog(dialog)) {
          // if (!previousDialog || !this.isBlackScreenDialog(previousDialog)) {
          //   out += '\n';
          // }
          out += `\n${prefix}{{Black Screen|${text}}}`;
          // out += '\n';
        } else if (dialog.TalkRole.Type === 'TALK_ROLE_PLAYER') {
          if (voPrefix) {
            out += `\n${diconPrefix}${voPrefix}'''(Traveler):''' ${text}`;
          } else {
            if (dialog.TalkRoleNameText) {
              let name = normText(dialog.TalkRoleNameText, this.outputLangCode);
              out += `\n${prefix}'''${name}:''' ${text}`;
            } else {
              out += `\n${diconPrefix}${':'.repeat(numSubsequentNonBranchPlayerDialogOption)}{{DIcon}} ${text}`;
            }
          }
        } else if (dialog.TalkRole.Type === 'TALK_ROLE_NPC' || dialog.TalkRole.Type === 'TALK_ROLE_GADGET') {
          let name = normText(dialog.TalkRoleNameText, this.outputLangCode);
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

  getPrefs(): GenshinControlState {
    return this.state;
  }

  get inputLangCode(): LangCode {
    return this.state.inputLangCode;
  }

  get outputLangCode(): LangCode {
    return this.state.outputLangCode;
  }

  get searchMode(): SearchMode {
    return this.state.searchMode;
  }

  get searchModeFlags(): string {
    switch (this.searchMode) {
      case 'W':
        return '-w';
      case 'WI':
        return '-wi';
      case 'C':
        return '';
      case 'CI':
        return '-i';
      case 'R':
        return '-P';
      case 'RI':
        return '-Pi';
      default:
        return '-wi';
    }
  }

  async getIdUsages(id: number): Promise<IdUsages> {
    let out: IdUsages = {};

    let decimalRegex = new RegExp(`(\\.${id}|${id}\\.)`)
    let fieldRegex = new RegExp(`"([^"]+)":\\s*["\\[]?`);

    let results = await grep(String(id), './ExcelBinOutput', '-wrn');
    for (let result of results) {
      if (decimalRegex.test(result)) {
        continue;
      }

      let exec = /\/([^\/]+).json:(\d+)/.exec(result);
      if (exec && exec.length >= 3) {
        let fileName = exec[1];
        let lineNum = parseInt(exec[2]);
        if (!out[fileName]) {
          out[fileName] = [];
        }

        let fieldExec = fieldRegex.exec(result);
        let fieldName = fieldExec && fieldExec.length >= 2 && fieldExec[1];
        let refObject: any = undefined;

        if (fieldName && schema[fileName]) {
          let table: SchemaTable = schema[fileName];
          fieldName = normalizeRawJsonKey(fieldName, table);
          for (let column of table.columns) {
            if (column.name === fieldName && (column.isPrimary || column.isIndex)) {

              refObject = await this.knex.select('*').from(table.name)
                .where({[column.name]: id}).first().then(this.commonLoadFirst);
            }
          }
        }

        out[fileName].push({
          lineNumber: lineNum,
          field: fieldName,
          refObject: refObject,
        });
      }
    }

    return out;
  }

  async getTextMapMatches(langCode: LangCode, searchText: string, flags?: string, startFromLine?: number): Promise<{hash: number, text: string, line: number}[]> {
    if (isStringBlank(searchText)) {
      return [];
    }

    const out: {hash: number, text: string, line: number}[] = [];

    if (isInt(searchText.trim())) {
      const hash = toInt(searchText.trim());
      const text = await this.getTextMapItem(langCode, searchText);
      if (text) {
        out.push({ hash, text, line: await getLineNumberForLineText(String(hash), getPlainTextMapRelPath(langCode, 'Hash')) });
      }
    }

    const textFile = getPlainTextMapRelPath(langCode, 'Text');
    const matches = await grep(searchText, textFile, flags + ' -n', true, startFromLine);

    for (let match of matches) {
      if (!match)
        continue;

      let lineNum = toInt(match.split(':', 2)[0]);
      if (isNaN(lineNum))
        continue;

      const textMapId: number = await this.getTextMapHashFromPlainLineMap(langCode, lineNum);
      out.push({ hash: textMapId, text: await this.getTextMapItem(langCode, textMapId), line: lineNum });
    }
    return out;
  }

  async getReadableMatches(langCode: LangCode, searchText: string, flags?: string): Promise<string[]> {
    if (isStringBlank(searchText)) {
      return [];
    }

    let out: string[] = [];

    await grepStream(searchText, getReadableRelPath(langCode), line => {
      let exec = /\/([^\/]+)\.txt/.exec(line);
      if (exec) {
        out.push(exec[1]);
      }
    }, '-r ' + flags);

    return out;
  }

  async streamTextMapMatchesWithIndex(langCode: LangCode,
                                      searchText: string,
                                      textIndexName: string,
                                      stream: (id: number, textMapHash: number) => void,
                                      flags?: string): Promise<number|Error> {
    const textIndexFile = getTextIndexRelPath(textIndexName);
    const promises: Promise<void>[] = [];
    const batchMax = 100;

    let batch = [];

    const processBatch = () => {
      if (!batch.length) {
        return;
      }
      const regex = `"(` + batch.join('|') + `)":`;
      batch = [];
      promises.push((async () => {
        const matches = await grep(regex, textIndexFile, '-E', false);
        for (let match of matches) {
          let parts = /"(\d+)":\s+(\d+),?$/.exec(match);
          let textMapId = toInt(parts[1]);
          let id = toInt(parts[2]);
          stream(id, textMapId);
        }
      })());
    };

    const ret = await this.streamTextMapMatches(langCode, searchText, (textMapHash: number, _text: string) => {
      batch.push(textMapHash);
      if (batch.length >= batchMax) {
        processBatch();
      }
    }, flags);

    processBatch();

    await Promise.all(promises);

    return ret;
  }

  async streamTextMapMatches(langCode: LangCode,
                             searchText: string,
                             stream: (textMapHash: number, text?: string, kill?: () => void) => void,
                             flags?: string): Promise<number|Error> {
    if (isStringBlank(searchText)) {
      return 0;
    }

    if (isInt(searchText.trim())) {
      let didKill = false;
      const hash = toInt(searchText.trim());
      const text = await this.getTextMapItem(langCode, searchText);
      if (text) {
        stream(hash, text, () => didKill = true);
      }
      if (didKill) {
        return 0;
      }
    }

    const textFile = getPlainTextMapRelPath(langCode, 'Text');

    return await grepStream(searchText, textFile, async (match: string, kill: () => void) => {
      if (!match)
        return;

      const lineNum = toInt(match.split(':', 2)[0]);
      if (isNaN(lineNum))
        return;

      const textMapId: number = await this.getTextMapHashFromPlainLineMap(langCode, lineNum);
      const text: string = await this.getTextMapItem(langCode, textMapId);
      stream(textMapId, text, kill);
    }, flags + ' -n');
  }

  async findTextMapIdsByExactName(name: string): Promise<number[]> {
    let results = [];

    const cmp = (a: string, b: string) => {
      return normText(a, this.inputLangCode, true, true)?.toLowerCase() ===
        normText(b, this.inputLangCode, true, true)?.toLowerCase();
    }

    await this.streamTextMapMatches(this.inputLangCode, name, (id: number, value: string) => {
      if (cmp(value, name)) {
        results.push(id);
      }
    }, '-wi');

    if (!results.length) {
      let searchRegex = escapeRegExp(name).split(/\s+/g).join('.*?').split(/(')/g).join('.*?');

      await this.streamTextMapMatches(this.inputLangCode, searchRegex, (id: number, value: string) => {
        if (cmp(value, name)) {
          results.push(id);
        }
      }, '-Pi');
    }

    return results;
  }

  equivDialog(d1: DialogExcelConfigData, d2: DialogExcelConfigData): boolean {
    if (!d1 || !d2) return false;

    return d1.TalkContentText === d2.TalkContentText && d1.TalkRoleNameText === d2.TalkRoleNameText && d1.TalkRole.Type === d2.TalkRole.Type;
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

  async selectMonsterById(id: number): Promise<MonsterExcelConfigData> {
    let monster: MonsterExcelConfigData = await this.knex.select('*').from('MonsterExcelConfigData')
      .where({Id: id}).first().then(this.commonLoadFirst);

    if (monster.DescribeId) {
      monster.Describe = await this.knex.select('*').from('MonsterDescribeExcelConfigData')
        .where({Id: monster.DescribeId}).first().then(this.commonLoadFirst);

      if (monster.Describe && monster.Describe.TitleId) {
        monster.Describe.Title = await this.knex.select('*').from('MonsterTitleExcelConfigData')
          .where({TitleId: monster.Describe.TitleId}).first().then(this.commonLoadFirst);
      }

      if (monster.Describe && monster.Describe.SpecialNameLabId) {
        monster.Describe.SpecialName = await this.knex.select('*').from('MonsterSpecialNameExcelConfigData')
          .where({SpecialNameLabId: monster.Describe.SpecialNameLabId}).first().then(this.commonLoadFirst);
      }
    }

    return monster;
  }

  async selectAllQuestSummary(): Promise<QuestSummarizationTextExcelConfigData[]> {
    if (this.state.questSummaryCache) {
      return this.state.questSummaryCache;
    }
    let items = await this.knex.select('*').from('QuestSummarizationTextExcelConfigData').then(this.commonLoad);
    this.state.questSummaryCache = items;
    return items;
  }

  async selectAllAvatars(): Promise<AvatarExcelConfigData[]> {
    return await this.knex.select('*').from('AvatarExcelConfigData').then(this.commonLoad);
  }

  async selectAllReminders(): Promise<ReminderExcelConfigData[]> {
    return await this.knex.select('*').from('ReminderExcelConfigData').then(this.commonLoad);
  }

  async selectReminderById(id: number): Promise<ReminderExcelConfigData> {
    return await this.knex.select('*').from('ReminderExcelConfigData')
      .where({Id: id}).first().then(this.commonLoadFirst);
  }

  async selectReminderByContentTextMapId(id: number): Promise<ReminderExcelConfigData> {
    return await this.knex.select('*').from('ReminderExcelConfigData')
      .where({ContentTextMapHash: id}).first().then(this.commonLoadFirst);
  }

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

  async readGenshinDataFile<T>(filePath: string): Promise<T> {
    let fileContents: string = await fs.readFile(getGenshinDataFilePath(filePath), {encoding: 'utf8'});
    let json = JSON.parse(fileContents);
    let fileBaseName = '/' + basename(filePath);
    let schemaTable = Object.values(schema).find(s => s.jsonFile.endsWith(fileBaseName));
    json = normalizeRawJson(json, schemaTable);
    if (Array.isArray(json)) {
      json = await this.commonLoad(json);
    } else {
      json = await this.commonLoadFirst(json);
    }
    return json;
  }

  async loadCutsceneSubtitlesByQuestId(questId: number): Promise<{[fileName: string]: string}> {
    let fileNames: string[] = await fs.readdir(getGenshinDataFilePath('./Subtitle/'+this.outputLangCode));

    let targetFileNames: string[] = [];
    for (let fileName of fileNames) {
      if (fileName.includes(`Q${questId}`) || fileName.includes(`Q_${questId}`)) {
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
      let filePath1: string = getGenshinDataFilePath('./Subtitle/'+this.outputLangCode+'/'+input[0]);
      let fileData1: string = await fs.readFile(filePath1, {encoding: 'utf8'});

      let srt1: SrtLine[] = parser.fromSrt(fileData1);
      let srt2: SrtLine[] = [];

      if (input.length > 1) {
        let filePath2: string = getGenshinDataFilePath('./Subtitle/'+this.outputLangCode+'/'+input[1]);
        let fileData2: string = await fs.readFile(filePath2, {encoding: 'utf8'});
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
        out.push(`::'''CS_CHAR:''' ` + normText(srtLine.text, this.outputLangCode));
      }
      out.push(':;(Cinematic ends)');
      formattedResults[srtFile] = out.join('\n');
    }

    return formattedResults;
  }

  async selectAllHomeWorldEvents(): Promise<HomeWorldEventExcelConfigData[]> {
    return await this.knex.select('*').from('HomeWorldEventExcelConfigData').then(this.commonLoad);
  }

  async selectAllHomeWorldNPCs(): Promise<HomeWorldNPCExcelConfigData[]> {
    return await this.knex.select('*').from('HomeWorldNPCExcelConfigData').then(this.commonLoad)
      .then((rows: HomeWorldNPCExcelConfigData[]) => {
        for (let npc of rows) {
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
        }
        return rows;
      });
  }

  async selectFurniture(id: number): Promise<HomeWorldFurnitureExcelConfigData> {
    return await this.knex.select('*').from('HomeWorldFurnitureExcelConfigData')
      .where({Id: id}).first().then(this.commonLoadFirst);
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
    return await this.knex.select('*').from('HomeWorldFurnitureExcelConfigData').then(this.commonLoad);
  }
  async selectAllFurnitureType(): Promise<HomeWorldFurnitureTypeExcelConfigData[]> {
    return await this.knex.select('*').from('HomeWorldFurnitureTypeExcelConfigData').then(this.commonLoad);
  }
  async selectAllFurnitureSuite(): Promise<FurnitureSuiteExcelConfigData[]> {
    return await this.knex.select('*').from('FurnitureSuiteExcelConfigData').then(this.commonLoad);
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
    if (loadConf.LoadSourceData) {
      material.SourceData = await this.selectMaterialSourceDataExcelConfigData(material.Id);
    }
    if (loadConf.LoadRelations) {
      material.Relations = await this.selectItemRelations(material.Id);
    }
    return material;
  }

  async selectMaterialExcelConfigData(id: number, loadConf: MaterialLoadConf = {}): Promise<MaterialExcelConfigData> {
    return await this.knex.select('*').from('MaterialExcelConfigData')
      .where({ Id: id }).first().then(this.commonLoadFirst).then(material => this.postProcessMaterial(material, loadConf));
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
    if (Object.values(loadConf).some(bool => !!bool)) {
      for (let material of materials) {
        await this.postProcessMaterial(material, loadConf);
      }
    }
    return materials;
  }

  async selectAllMaterialExcelConfigData(loadConf: MaterialLoadConf = {}): Promise<MaterialExcelConfigData[]> {
    const materials: MaterialExcelConfigData[] = await this.knex.select('*').from('MaterialExcelConfigData')
      .then(this.commonLoad);
    if (Object.values(loadConf).some(bool => !!bool)) {
      for (let material of materials) {
        await this.postProcessMaterial(material, loadConf);
      }
    }
    return materials;
  }

  async selectRewardExcelConfigData(rewardId: number): Promise<RewardExcelConfigData> {
    let reward: RewardExcelConfigData = await this.knex.select('*').from('RewardExcelConfigData')
      .where({RewardId: rewardId}).first().then(this.commonLoadFirst);

    if (!reward) {
      return reward;
    }

    await Promise.all(reward.RewardItemList.map(rewardItem => {
      if (!rewardItem.ItemId) {
        return Promise.resolve();
      }
      return this.selectMaterialExcelConfigData(rewardItem.ItemId).then(material => rewardItem.Material = material);
    }));

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
      // Split:
      ExpCount: '',
      MoraCount: '',
      PrimogemCount: '',
      OtherCards: '',

      // All:
      CombinedStrings: '',
      CombinedCards: '',
      QuestForm: '',
    };

    for (let item of reward.RewardItemList) {
      if (!item.Material) {
        continue;
      }

      let countForm = (item.ItemCount || 1).toLocaleString('en-US');
      let cardForm = `{{Card|${item.Material.NameText}|${countForm}}}`;
      let stringForm = `${item.Material.NameText}*${countForm}`;

      if (item.ItemId === ADVENTURE_EXP_ID) {
        reward.RewardSummary.ExpCount = countForm;
      } else if (item.ItemId === MORA_ID) {
        reward.RewardSummary.MoraCount = countForm;
      } else if (item.ItemId === PRIMOGEM_ID) {
        reward.RewardSummary.PrimogemCount = countForm;
      } else {
        reward.RewardSummary.OtherCards += cardForm;
      }

      reward.RewardSummary.CombinedCards += cardForm;
      reward.RewardSummary.CombinedStrings += (reward.RewardSummary.CombinedStrings.length ? ';' : '') + stringForm;
    }

    reward.RewardSummary.QuestForm =
      `|exp           = ${reward.RewardSummary.ExpCount}\n` +
      `|mora          = ${reward.RewardSummary.MoraCount}\n` +
      `|primogems     = ${reward.RewardSummary.PrimogemCount}\n` +
      `|other         = ${reward.RewardSummary.OtherCards}`;

    return reward;
  }

  async selectCityNameById(cityId: number, forceLangCode?: LangCode): Promise<string> {
    let textMapHash: number = await this.knex.select('CityNameTextMapHash')
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

  async selectReputationQuestExcelConfigData(parentQuestId: number): Promise<ReputationQuestExcelConfigData> {
    let rep: ReputationQuestExcelConfigData = await this.knex.select('*')
      .from('ReputationQuestExcelConfigData')
      .where({ParentQuestId: parentQuestId})
      .first().then(this.commonLoadFirst);

    if (!rep) {
      return null;
    }

    let cityName = await this.selectCityNameById(rep.CityId);
    let reward = await this.selectRewardExcelConfigData(rep.RewardId);

    rep.QuestForm =
      `|rep           = ${cityName}\n` +
      `|repAmt        = ${reward.RewardItemList[0].ItemCount}\n` +
      `|repOrder      = ${rep.Order}`;
    rep.QuestFormWithTitle = rep.QuestForm + `\n` +
      `|repTitle      = ${rep.TitleText}`;

    return rep;
  }

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
    return weapon;
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

  async selectArtifactCodexById(id: number): Promise<ReliquaryCodexExcelConfigData> {
    return await this.knex.select('*').from('ReliquaryCodexExcelConfigData')
      .where({Id: id}).first().then(this.commonLoadFirst);
  }

  async selectArtifactSetById(id: number): Promise<ReliquarySetExcelConfigData> {
    return await this.knex.select('*').from('ReliquarySetExcelConfigData')
      .where({SetId: id}).first().then(this.commonLoadFirst);
  }

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

  async selectReadableViewsByTitle(langCode: LangCode, searchText: string, flags?: string): Promise<number[]> {
    if (isStringBlank(searchText)) {
      return [];
    }
    let ids = [];
    await this.streamTextMapMatchesWithIndex(langCode, searchText, 'Readable', (id, _textMapHash) => {
      ids.push(id);
    }, flags);
    return ids;
  }

  async searchReadableView(searchText: string): Promise<ReadableSearchView> {
    const files = await this.getReadableMatches(this.inputLangCode, searchText, this.searchModeFlags);
    const titleMatchViewIds = await this.selectReadableViewsByTitle(this.inputLangCode, searchText, this.searchModeFlags);
    const ret: ReadableSearchView = { ContentResults: [], TitleResults: [] }

    if (files.length) {
      const pathVar = LANG_CODE_TO_LOCALIZATION_PATH_PROP[this.inputLangCode];
      const pathVarSearch = files.map(f => 'ART/UI/Readable/' + this.inputLangCode + '/' + f.split('.txt')[0]);

      let localizations: LocalizationExcelConfigData[] = await this.knex.select('*')
        .from('LocalizationExcelConfigData')
        .whereIn(pathVar, pathVarSearch)
        .then(this.commonLoad);

      ret.ContentResults = await localizations.asyncMap(async localization => {
        let view = await this.selectReadableViewByLocalizationId(localization.Id, true);
        if (!view) {
          return;
        }
        for (let item of view.Items) {
          item.Markers = Marker.create(normText(searchText, this.inputLangCode), item.ReadableText);
        }
        return view;
      });
    }

    if (titleMatchViewIds.length) {
      ret.TitleResults = await titleMatchViewIds.asyncMap(async id => await this.selectReadableView(id, false));
    }

    return ret;
  }

  async selectDocumentIdByLocalizationId(localizationId: number) {
    return await this.knex.select('Id').from('DocumentExcelConfigData')
      .where({ContentLocalizedId: localizationId})
      .or.where({AltContentLocalizationId_0: localizationId})
      .first()
      .then(res => res ? res.Id : undefined);
  }

  async loadLocalization(contentLocalizedId: number, triggerCond?: number): Promise<ReadableItem> {
    const localization: LocalizationExcelConfigData = await this.knex.select('*').from('LocalizationExcelConfigData')
      .where({Id: contentLocalizedId}).first().then(this.commonLoadFirst);

    const pathVar = LANG_CODE_TO_LOCALIZATION_PATH_PROP[this.outputLangCode];
    let ret: ReadableItem = {Localization: localization, ReadableText: null};

    if (localization && localization.AssetType === 'LOC_TEXT'
      && typeof localization[pathVar] === 'string' && localization[pathVar].includes('/Readable/')) {
      let filePath = './Readable/' + localization[pathVar].split('/Readable/')[1] + '.txt';
      try {
        let fileText = await fs.readFile(getGenshinDataFilePath(filePath), { encoding: 'utf8' });
        let fileNormText = normText(fileText, this.outputLangCode).replace(/<br \/>/g, '<br />\n');
        ret = {Localization: localization, ReadableText: fileNormText};
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

  async selectReadableByDocumentId(documentId: number): Promise<Readable> {
    const Document: DocumentExcelConfigData = await this.knex.select('*').from('DocumentExcelConfigData')
      .where({Id: documentId}).first().then(this.commonLoadFirst);
    return !Document ? null : {
      Document,
      Items: [
        await this.loadLocalization(Document.ContentLocalizedId),
        ... await pairArrays(Document.AltContentLocalizedIds, Document.AltContentLocalizedQuestConds).asyncMap(
          async ([id, triggerCond]) => await this.loadLocalization(id, triggerCond)
        )
      ]
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
    } else if (view.Artifact) {
      view.TitleText = view.Artifact.NameText;
      view.TitleTextMapHash = view.Artifact.NameTextMapHash;
      view.Icon = view.Artifact.Icon;
    } else if (view.Weapon) {
      view.TitleText = view.Weapon.NameText;
      view.TitleTextMapHash = view.Weapon.NameTextMapHash;
      view.Icon = view.Weapon.Icon;
    } else {
      view.TitleText = '(Unnamed readable)';
    }

    if ((typeof loadReadable === 'function' ? loadReadable(view) : loadReadable) === true) {
      let readable = await this.selectReadableByDocumentId(documentId);
      if (readable) {
        Object.assign(view, readable);
      }
    }

    return view;
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

    for (let document of await this.readGenshinDataFile<DocumentExcelConfigData[]>('./ExcelBinOutput/DocumentExcelConfigData.json')) {
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
}