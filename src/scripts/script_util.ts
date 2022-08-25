import config from '@/config';
import util from 'util';
import {exec} from 'child_process';
const execPromise = util.promisify(exec);
import { Knex } from 'knex';
import { openKnex } from '@db';
import {
  TextMapItem, NpcExcelConfigData, ManualTextMapConfigData, ConfigCondition,
  MainQuestExcelConfigData, QuestExcelConfigData,
  DialogExcelConfigData, TalkExcelConfigData, TalkRole, LangCode
} from '@types';
import { getTextMapItem } from './textmap';
import { Request } from '@router';

// character name in the dialogue text -> character name in the vo file
export const normNameMap = {
  azhdaha: 'dahaka',
  kaedeharakazuha: 'kazuha',
  kamisatoayaka: 'ayaka',
  kamisatoayato: 'ayato',
  rounin: 'ronin',
  sanden: 'santa',
  sangonomiyakokomi: 'kokomi',
  ei: 'raidenei',
  raidenshogun: 'raidenshogun',
  smileyyanxiao: 'yanxiao',
  guoba: 'gooba',
  amber: 'ambor',
  aratakiitto: 'itto',
  grannyoni: 'onibaaya',
  jean: 'qin',
  kayabukiikkei: 'kayabukikazukei',
  kidkujirai: 'kurajikun',
  kukishinobu: 'shinobu',
  ushi: 'ushio',
  souta: 'sota',
  shimurakanbei: 'shimurakanbee',
  shikanoinheizou: 'heizou',
  amenomatougo: 'amenomatoogo',
  ryuuji: 'ryuji',
};

export function normalizeName(name: string) {
  if (name.trim().startsWith('???')) {
    return '???';
  }
  if (name.includes('|')) {
    name = name.split('|')[1];
  }
  return name.replace(/\s+/g, '').replace(/[\._\-\?,:\[\]\(\)'"]/g, '').trim().toLowerCase();
}

// Same as normalizeName but uses normNameMap too
export function normalizeCharName(name: string) {
  let normName = normalizeName(name);
  if (normNameMap[normName]) {
    normName = normNameMap[normName];
  }
  return normName;
}

export async function grep(searchText: string, file: string, extraFlags?: string): Promise<string[]> {
  try {
    searchText = searchText.replace(/'/g, `\\'`); // escape single quote
    if (file.endsWith('.json')) {
      searchText = searchText.replace(/"/g, `\\\\"`); // double quotes since it's JSON
    }

    // Must use single quotes for searchText - double quotes has different behavior in bash, is insecure for arbitrary string...
    const cmd = `grep -i ${extraFlags || ''} '${searchText}' ${config.database.getGenshinDataFilePath(file)}`;
    const { stdout, stderr } = await execPromise(cmd, {
      env: { PATH: process.env.SHELL_PATH },
      shell: process.env.SHELL_EXEC
    });
    let lines = stdout.split(/\n/).map(s => s.trim()).filter(x => !!x);
    return lines;
  } catch (err) {
    return [];
  }
};

export async function grepIdStartsWith(idProp: string, idPrefix: number|string, file: string): Promise<(number|string)[]> {
  let isInt = typeof idPrefix === 'number';
  let lines = await grep(`"${idProp}": ${isInt ? idPrefix : '"' + idPrefix}`, file);
  let out = [];
  for (let line of lines) {
    let parts = /":\s+"?([^",$]+)/.exec(line);
    out.push(isInt ? parseInt(parts[1]) : parts[1]);
  }
  return out;
}

function toNumber(x: string|number) {
  if (typeof x === 'number') {
    return x;
  } else if (x.includes('.')) {
    return parseFloat(x);
  } else {
    return parseInt(x);
  }
}

export const convertRubi = (text: string) => {
  let ruby = [];

  let i = 0;
  text = text.replace(/{RUBY#\[S\]([^}]+)}/g, (match, p1) => {
    ruby.push(p1);
    return '{RUBY'+(i++)+'}';
  });

  let parts = text.split(/(\s+)/); // keep whitespace parts

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].includes('{RUBY')) {
      parts[i] = parts[i].replace(/^(.*){RUBY(\d+)}(.*)/, (match, p1, p2, p3) => `{{Rubi|${p1}${p3}|${ruby[parseInt(p2)]}}}`);
    }
  }
  return parts.join('');
}

export const travelerPlaceholder = (langCode: string = 'EN') => {
  switch (langCode) {
    case 'CHS': return '玩家';
    case 'CHT': return '玩家';
    case 'DE': return 'Reisender'; // #(Reisende/Reisender)
    case 'EN': return 'Traveler';
    case 'ES': return 'Viajero'; // #Viajer(a/o)
    case 'FR': return 'Voyageur'; // #{M#Voyageur}{F#Voyageuse}
    case 'ID': return 'Pengembara';
    case 'JP': return 'プレイヤー';
    case 'KR': return '플레이어';
    case 'PT': return 'Jogador';
    case 'RU': return 'Игрок';
    case 'TH': return 'ผู้เล่น';
    case 'VI': return 'Người Chơi';
  }
  return 'Traveler;'
}

export const normText = (text: string, langCode: string = 'EN') => {
  if (!text) {
    return text;
  }
  text = text.replace(/—/g, '&mdash;').trim();
  text = text.replace(/{NICKNAME}/g, '('+travelerPlaceholder(langCode)+')');
  text = text.replace(/{NON_BREAK_SPACE}/g, '&nbsp;');
  text = text.replace(/{F#([^}]+)}{M#([^}]+)}/g, '($2/$1)');
  text = text.replace(/{M#([^}]+)}{F#([^}]+)}/g, '($1/$2)');
  text = text.replace(/\<color=#00E1FFFF\>([^<]+)\<\/color\>/g, '{{color|buzzword|$1}}');
  text = text.replace(/\\n/g, '<br />');

  if (text.includes('RUBY#[S]')) {
    text = convertRubi(text);
  }

  if (text.startsWith('#')) {
    text = text.slice(1);
  }
  return text;
}


export function arrayUnique(a) {
  var prims = {"boolean":{}, "number":{}, "string":{}}, objs = [];

  return a.filter(function(item) {
      var type = typeof item;
      if(type in prims)
          return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
      else
          return objs.indexOf(item) >= 0 ? false : objs.push(item);
  });
}

export type ArrayComparator<T> = (a: T, b: T) => (boolean|number);

export function arrayEmpty(array: any[]) {
  return !array || array.length === 0;
}

export function arrayIndexOf<T>(array: T[], obj: T, comparator: ArrayComparator<T>): number {
  if (!comparator)
    return array.indexOf(obj);
  for (let i = 0; i < array.length; i++) {
    let item = array[i];
    if (item === obj || comparator(item, obj))
      return i;
  }
  return -1;
}

export function arrayContains<T>(array: T[], obj: T, comparator: ArrayComparator<T>): boolean {
  return arrayIndexOf(array, obj, comparator) >= 0;
}

export function arrayIntersect<T>(args: T[][], comparator?: ArrayComparator<T>): T[] {
	let result = [];
  let lists: T[][] = args;

  for (let i = 0; i < lists.length; i++) {
  	let currentList = lists[i];
  	for (let y = 0; y < currentList.length; y++) {
    	let currentValue = currentList[y];
      if (!arrayContains(result, currentValue, comparator)) {
        if (lists.filter(list => !arrayContains(list, currentValue, comparator)).length == 0) {
          result.push(currentValue);
        }
      }
    }
  }
  return result;
}


export function arraySort<T>(args: T[], comparator?: ArrayComparator<T>): T[] {
  return args.sort(comparator as ((a: T, b: T) => number));
}

export const stringify = (obj: any) => {
  if (typeof obj === 'string') {
    return obj;
  }
  return JSON.stringify(obj, null, 2);
};

export class ControlPrefs {
  KnexInstance: Knex = null;
  Request: Request = null;
  TalkConfigDataBeginCond: {[talkConfigId: number]: ConfigCondition} = {};

  ExcludeCondProperties = true;
  ExcludeExecProperties = true;
  ExcludeGuideProperties = true;
  ExcludeNpcListProperties = false;
  ExcludeNpcDataListProperties = true;
  ExcludeOrphanedDialogue = false;

  dialogCache: {[Id: number]: DialogExcelConfigData} = {};
  npcCache: {[Id: number]: NpcExcelConfigData} = {};

  static beforeQuestSub(questSubId: number): ConfigCondition {
    return {Type: 'QUEST_COND_STATE_EQUAL', Param: [questSubId, 2]};
  }
  static afterQuestSub(questSubId: number): ConfigCondition {
    return {Type: 'QUEST_COND_STATE_EQUAL', Param: [questSubId, 3]};
  }

  get inputLangCode(): LangCode {
    return this.Request ? this.Request.cookies['inputLangCode'] || 'EN' : 'EN';
  }

  get outputLangCode(): LangCode {
    return this.Request ? this.Request.cookies['outputLangCode'] || 'EN' : 'EN';
  }
}

export function getControl(controlContext?: Request|ControlPrefs) {
  return new Control(controlContext);
}

export class Control {
  private prefs: ControlPrefs;
  private knex: Knex;

  private IdComparator = (a: any, b: any) => a.Id === b.Id;
  private sortByOrder = (a: any, b: any) => {
    return a.Order - b.Order || a.Order - b.Order;
  };

  constructor(controlContext: Request|ControlPrefs) {
    if (!!controlContext && controlContext.hasOwnProperty('url')) {
      this.prefs = new ControlPrefs();
      this.prefs.Request = controlContext as Request;
    } else if (!!controlContext) {
      this.prefs = controlContext as ControlPrefs;
    } else {
      this.prefs = new ControlPrefs();
    }

    this.knex = this.prefs.KnexInstance || openKnex();
  }

  postProcessCondProp(obj: any, prop: string) {
    let condArray = obj[prop] as ConfigCondition[];
    let newCondArray = [];
    for (let cond of condArray) {
      if (cond.Param) {
        cond.Param = cond.Param.filter(x => !!x);
      }
      if (cond.Param && cond.Param.length) {
        newCondArray.push(cond);
      }
    }
    if (newCondArray.length) {
      obj[prop] = newCondArray;
    } else {
      delete obj[prop];
    }
  }

  async postProcess<T>(object: T): Promise<T> {
    const objAsAny = object as any;
    for (let prop in object) {
      if (prop.endsWith('MapHash')) {
        let textProp = prop.slice(0, -7);
        //let text = await knex.select('Text').from('TextMap').where({Id: object[prop]}).first().then(x => x && x.Text);
        let text = getTextMapItem(this.outputLangCode, object[prop]);
        if (!!text)
          object[textProp] = text;
        else
          delete object[prop];
      }
      if (prop === 'TitleTextMapHash') {
        object['TitleTextEN'] = getTextMapItem('EN', object['TitleTextMapHash']);
      }
      if (prop.endsWith('Cond')) {
        if (this.prefs.ExcludeCondProperties && !prop.startsWith('Begin') && !prop.startsWith('Accept') && !prop.startsWith('Finish') && !prop.startsWith('Fail')) {
          delete object[prop];
        } else if (objAsAny[prop]) {
          this.postProcessCondProp(objAsAny, prop);
        }
      }
      if (prop.endsWith('Exec')) {
        if (this.prefs.ExcludeExecProperties) {
          delete object[prop];
        } else {
          this.postProcessCondProp(objAsAny, prop);
        }
      }
      if (prop.endsWith('NpcList') || prop.endsWith('NpcId')) {
        let slicedProp = prop.endsWith('NpcList') ? prop.slice(0, -4) : prop.slice(0, -2);
        if (this.prefs.ExcludeNpcListProperties) {
          delete object[prop];
        } else {
          let dataList = await this.getNpcList(object[prop] as any);
          dataList = dataList.filter(x => !!x);
          if (!this.prefs.ExcludeNpcDataListProperties)
            object[slicedProp+'DataList'] = dataList;
          object[slicedProp+'NameList'] = dataList.map(x => x.NameText);
        }
      }
      if (this.prefs.ExcludeGuideProperties && prop.endsWith('Guide')) {
        delete object[prop];
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
      if (object[prop] === null || objAsAny[prop] === '') {
        delete object[prop];
      }
    }
    if (!objAsAny.TalkRoleNameText && !!objAsAny.TalkRole) {
      objAsAny.TalkRoleNameText = objAsAny.TalkRole.NameText;
    }
    return object;
  }

  private commonLoad = async (result: any[]) => await Promise.all(result.map(record => !record ? record : this.postProcess(JSON.parse(record.json_data))));
  private commonLoadFirst = async (record: any) => !record ? record : await this.postProcess(JSON.parse(record.json_data));

  async getNpc(npcId: number): Promise<NpcExcelConfigData> {
    if (!npcId) return null;
    return await this.getNpcList([ npcId ]).then(x => x && x.length ? x[0] : null);
  }

  async getNpcList(npcIds: number[]): Promise<NpcExcelConfigData[]> {
    if (!npcIds || !npcIds.length) return [];
    let notCachedIds = npcIds.filter(id => !this.prefs.npcCache[id]);
    let cachedList = npcIds.map(id => this.prefs.npcCache[id]).filter(x => !!x);
    let uncachedList: NpcExcelConfigData[] = await this.knex.select('*').from('NpcExcelConfigData').whereIn('Id', notCachedIds).then(this.commonLoad);
    uncachedList.forEach(npc => this.prefs.npcCache[npc.Id] = npc);
    return cachedList.concat(uncachedList);
  }

  async selectMainQuestsByNameOrId(name: string|number, limit: number = 25): Promise<MainQuestExcelConfigData[]> {
    if (typeof name === 'string') {
      let matches = await this.getTextMapMatches(name);
      let textMapIds = Object.keys(matches).map(i => parseInt(i));

      return await this.knex.select('*').from('MainQuestExcelConfigData').whereIn('TitleTextMapHash', textMapIds)
        .limit(limit).then(this.commonLoad);
    } else {
      return [await this.selectMainQuestById(name)];
    }
  }

  async selectMainQuestById(id: number): Promise<MainQuestExcelConfigData> {
    return await this.knex.select('*').from('MainQuestExcelConfigData').where({Id: id}).first().then(this.commonLoadFirst);
  }

  async selectQuestByMainQuestId(id: number): Promise<QuestExcelConfigData[]> {
    return await this.knex.select('*').from('QuestExcelConfigData').where({MainId: id}).then(this.commonLoad)
      .then(quests => quests.sort(this.sortByOrder));
  }

  async selectManualTextMapConfigDataById(id: string): Promise<ManualTextMapConfigData> {
    return await this.knex.select('*').from('ManualTextMapConfigData').where({TextMapId: id}).first().then(this.commonLoadFirst);
  }

  async selectTalkExcelConfigDataById(id: number): Promise<TalkExcelConfigData> {
    return await this.knex.select('*').from('TalkExcelConfigData').where({Id: id}).orWhere({QuestCondStateEqualFirst: id}).first().then(this.commonLoadFirst);
  }

  async selectTalkExcelConfigDataByQuestSubId(id: number): Promise<TalkExcelConfigData> {
    return await this.knex.select('*').from('TalkExcelConfigData').where({Id: id}).orWhere({QuestCondStateEqualFirst: id}).first().then(this.commonLoadFirst);
  }

  async selectTalkExcelConfigDataIdsByPrefix(idPrefix: number|string): Promise<number[]> {
    let allTalkExcelTalkConfigIds = this.prefs.ExcludeOrphanedDialogue ? [] : await grepIdStartsWith('_id', idPrefix, './ExcelBinOutput/TalkExcelConfigData.json');
    return allTalkExcelTalkConfigIds.map(i => toNumber(i));
  }

  async addOrphanedDialogueAndQuestMessages(mainQuest: MainQuestExcelConfigData) {
    let allDialogueIds = this.prefs.ExcludeOrphanedDialogue ? [] : await grepIdStartsWith('Id', mainQuest.Id, './ExcelBinOutput/DialogExcelConfigData.json');
    let allQuestMessageIds = await grepIdStartsWith('TextMapId', 'QUEST_Message_Q' + mainQuest.Id, './ExcelBinOutput/ManualTextMapConfigData.json');
    let consumedQuestMessageIds = [];

    const handleOrphanedDialog = async (quest: MainQuestExcelConfigData|QuestExcelConfigData, id: number) => {
      if (this.prefs.dialogCache[id])
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

  async selectTalkExcelConfigDataByQuestId(questId: number): Promise<TalkExcelConfigData[]> {
    return await this.knex.select('*').from('TalkExcelConfigData').where({QuestId: questId}).orWhere({QuestCondStateEqualFirst: questId}).then(this.commonLoad)
      .then(quests => quests.sort(this.sortByOrder));
  }

  async selectTalkExcelConfigDataByNpcId(npcId: number): Promise<TalkExcelConfigData[]> {
    return await this.knex.select('*').from('TalkExcelConfigData').where({NpcId: npcId}).then(this.commonLoad)
      .then(quests => quests.sort(this.sortByOrder));
  }

  async selectDialogExcelConfigDataByTalkRoleId(talkRoleId: number): Promise<DialogExcelConfigData[]> {
    return await this.knex.select('*').from('DialogExcelConfigData').where({TalkRoleId: talkRoleId}).then(this.commonLoad)
      .then(quests => quests.sort(this.sortByOrder));
  }

  async selectSingleDialogExcelConfigData(id: number): Promise<DialogExcelConfigData> {
    if (this.prefs.dialogCache[id])
      return this.prefs.dialogCache[id];
    let result: DialogExcelConfigData = await this.knex.select('*').from('DialogExcelConfigData').where({Id: id}).first().then(this.commonLoadFirst);
    this.prefs.dialogCache[id] = result;
    return result && result.TalkContentText ? result : null;
  }

  async selectMultipleDialogExcelConfigData(ids: number[]): Promise<DialogExcelConfigData[]> {
    return await Promise.all(ids.map(id => this.selectSingleDialogExcelConfigData(id))).then(arr => arr.filter(x => !!x && !!x.TalkContentText));
  }

  copyDialogForRecurse(node: DialogExcelConfigData) {
    let copy: DialogExcelConfigData = JSON.parse(JSON.stringify(node));
    copy.recurse = true;
    return copy;
  }

  async getDialogFromTextContentId(textMapId: number): Promise<DialogExcelConfigData> {
    let result: DialogExcelConfigData = await this.knex.select('*').from('DialogExcelConfigData').where({TalkContentTextMapHash: textMapId})
      .first().then(this.commonLoadFirst);
    this.prefs.dialogCache[result.Id] = result;
    return result;
  }

  isPlayerDialogueOption(dialog: DialogExcelConfigData): boolean {
    return dialog.TalkRole.Type === 'TALK_ROLE_PLAYER' && dialog.TalkShowType && dialog.TalkShowType === 'TALK_SHOW_FORCE_SELECT';
  }

  async selectDialogBranch(start: DialogExcelConfigData, dialogSeenAlready: number[] = []): Promise<DialogExcelConfigData[]> {
    if (!start)
      return [];
    let currBranch: DialogExcelConfigData[] = [];
    let currNode = start;
    while (currNode) {
      if (dialogSeenAlready.includes(currNode.Id)) {
        currBranch.push(this.copyDialogForRecurse(currNode));
        break;
      } else {
        dialogSeenAlready.push(currNode.Id);
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
        const branches: DialogExcelConfigData[][] = await Promise.all(nextNodes.map(node => this.selectDialogBranch(node, dialogSeenAlready.slice())));
        //console.log('Branches:', branches.map(b => b[0]));
        const intersect = arrayIntersect<DialogExcelConfigData>(branches, this.IdComparator).filter(x => x.TalkRole.Type !== 'TALK_ROLE_PLAYER'); // do not rejoin on a player talk
        //console.log('Intersect:', intersect.length ? intersect[0] : null);
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
      let matchId = await this.findTextMapIdByExactName(nameOrTextMapId);
      nameOrTextMapId = [ matchId ];
    }
    if (typeof nameOrTextMapId === 'number') {
      nameOrTextMapId = [ nameOrTextMapId ];
    }
    console.log('NPC Name TextMapId:', nameOrTextMapId);
    let npcList = await this.knex.select('*').from('NpcExcelConfigData').whereIn('NameTextMapHash', <number[]> nameOrTextMapId).then(this.commonLoad);
    console.log('NPC List', npcList);
    return npcList;
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
      let dialog = dialogLines[i];
      let diconPrefix;

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

      let prefix = ':'.repeat(dialogDepth);
      let text = normText(dialog.TalkContentText, this.outputLangCode);

      if (text.includes('SEXPRO')) {
        let matches = /\{PLAYERAVATAR#SEXPRO\[(.*)\|(.*)\]\}/.exec(text);
        if (matches.length >= 3) {
          let g1 = matches[1];
          let g2 = matches[2];
          let g1e = await this.selectManualTextMapConfigDataById(g1);
          let g2e = await this.selectManualTextMapConfigDataById(g2);
          text = `(${g1e.TextMapContentText}/${g2e.TextMapContentText})`;
        }
      }

      if (previousDialog && this.isPlayerDialogueOption(dialog) && this.isPlayerDialogueOption(previousDialog) &&
          previousDialog.NextDialogs.length === 1 && previousDialog.NextDialogs[0] === dialog.Id) {
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

      if (dialog.TalkRole.Type === 'TALK_ROLE_BLACK_SCREEN') {
        out += '\n';
        out += `\n${prefix}'''${text}'''`;
        out += '\n';
      } else if (dialog.TalkRole.Type === 'TALK_ROLE_PLAYER') {
        if (dialog.TalkRoleNameText) {
          // I don't remember under what circumstances a TALK_ROLE_PLAYER has a TalkRoleNameText
          out += `\n${diconPrefix}'''${dialog.TalkRoleNameText}:''' ${text}`;
        } else if (dialog.TalkShowType && dialog.TalkShowType === 'TALK_SHOW_FORCE_SELECT') {
          out += `\n${diconPrefix}${':'.repeat(numSubsequentNonBranchPlayerDialogOption)}{{DIcon}} ${text}`;
        } else {
          //out += `\n${diconPrefix}'''(Traveler):''' ${text}`;
          out += `\n${diconPrefix}${':'.repeat(numSubsequentNonBranchPlayerDialogOption)}{{DIcon}} ${text}`;
        }
      } else if (dialog.TalkRole.Type === 'TALK_ROLE_NPC' || dialog.TalkRole.Type === 'TALK_ROLE_GADGET') {
        out += `\n${prefix}'''${dialog.TalkRoleNameText}:''' ${text}`;
      } else if (dialog.TalkRole.Type === 'TALK_ROLE_MATE_AVATAR') {
        out += `\n${prefix}'''(Traveler's Sibling):''' ${text}`;
      } else {
        if (text) {
          out += `\n${prefix}:'''Cutscene_Character_Replace_me''' ${text}`;
        } else {
          console.warn('Dialog with unknown TalkRole.Type "' + dialog.TalkRole.Type + '" and without text:', dialog);
        }
      }

      if (dialog.recurse) {
        if (dialog.TalkRole.Type === 'TALK_ROLE_PLAYER') {
          out += `\n${diconPrefix};(Return to option selection)`;
        } else {
          out += `\n${diconPrefix.slice(0,-1)};(Return to option selection)`;
        }
      }

      if (dialog.Branches && dialog.Branches.length) {
        let temp = new Set<number>(firstDialogOfBranchVisited);
        for (let dialogBranch of dialog.Branches) {
          temp.add(dialogBranch[0].Id);
        }

        let excludedCount = 0;
        let includedCount = 0;
        for (let dialogBranch of dialog.Branches) {
          if (firstDialogOfBranchVisited.has(dialogBranch[0].Id)) {
            excludedCount++;
            continue;
          }
          includedCount++;
          out += await this.generateDialogueWikiText(dialogBranch, dialogDepth + 1, dialog, i === 0, temp);
        }
        if (includedCount === 0 && excludedCount > 0) {
          out += `\n${diconPrefix};(Return to option selection)`;
        }
      }

      previousDialog = dialog;
    }
    return out;
  }

  getPrefs(): ControlPrefs {
    return this.prefs;
  }

  get inputLangCode() {
    return this.prefs.inputLangCode;
  }

  get outputLangCode() {
    return this.prefs.outputLangCode;
  }

  readonly FLAG_EXACT_WORD = '-w';
  readonly FLAG_REGEX = '-E';

  async getTextMapMatches(searchText: string, flags?: string): Promise<{[id: number]: string}> {
    let lines = await grep(searchText, config.database.getTextMapFile(this.inputLangCode), flags);
    let out = {};
    for (let line of lines) {
      let parts = /^"(\d+)":\s+"(.*)",?$/.exec(line);
      out[parts[1]] = parts[2].replaceAll('\\', '');
    }
    return out;
  }

  async getTextMapIdStartsWith(idPrefix: string): Promise<{[id: number]: string}> {
    let lines = await grep(`^\\s*"${idPrefix}\\d+": "`,config.database.getTextMapFile(this.inputLangCode), '-E');
    console.log(lines);
    let out = {};
    for (let line of lines) {
      let parts = /^"(\d+)":\s+"(.*)",?$/.exec(line);
      out[parts[1]] = parts[2].replaceAll('\\', '');
    }
    return out;
  }

  async findTextMapIdByExactName(name: string): Promise<number> {
    let matches = await this.getTextMapMatches(name, this.FLAG_EXACT_WORD);
    for (let [id,value] of Object.entries(matches)) {
      if (value.toLowerCase() === name.toLowerCase()) {
        return parseInt(id);
      }
    }
    return 0;
  }
}