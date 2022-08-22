import config from '@/config';
import path from 'path';
import util from 'util';
import {exec} from 'child_process';
const execPromise = util.promisify(exec);
import { Knex } from 'knex';
import { openKnex } from '@db';
import {
  TextMapItem, NpcExcelConfigData, ManualTextMapConfigData, ConfigCondition,
  MainQuestExcelConfigData, QuestExcelConfigData,
  DialogExcelConfigData, TalkExcelConfigData, TalkRole
} from '@types';

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

export function getGenshinDataFilePath(file: string) {
  return path.resolve(process.env.DATA_ROOT, config.database.genshin_data, file).replaceAll('\\', '/');
}

export async function grep(searchText: string, file: string, extraFlags?: string): Promise<string[]> {
  try {
    searchText = searchText.replace(/"/g, '\\"'); // escape double quote
    const cmd = `grep -i ${extraFlags || ''} "${searchText}" ${getGenshinDataFilePath(file)}`;
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

export const normText = (text: string) => {
  if (!text) {
    return text;
  }
  text = text.replace(/—/g, '&mdash;').trim();
  text = text.replace('{NICKNAME}', '(Traveler)');
  text = text.replace('{NON_BREAK_SPACE}', '&nbsp;');
  text = text.replace(/{F#([^}]+)}{M#([^}]+)}/g, '($2/$1)');
  text = text.replace(/{M#([^}]+)}{F#([^}]+)}/g, '($1/$2)');
  text = text.replace(/\<color=#00E1FFFF\>([^<]+)\<\/color\>/g, '{{color|buzzword|$1}}');

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

export class OverridePrefs {
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
}

export function getControl(knex?: Knex, pref?: OverridePrefs) {
  if (!knex) {
    knex = openKnex();
  }
  if (!pref) {
    pref = new OverridePrefs();
  }

  const IdComparator = (a: any, b: any) => a.Id === b.Id;
  const sortByOrder = (a: any, b: any) => {
    return a.Order - b.Order || a.Order - b.Order;
  };

  function postProcessCondProp(obj: any, prop: string) {
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

  async function postProcess<T>(object: T): Promise<T> {
    const objAsAny = object as any;
    for (let prop in object) {
      if (prop.endsWith('MapHash')) {
        let textProp = prop.slice(0, -7);
        let text = await knex.select('Text').from('TextMap').where({Id: object[prop]}).first().then(x => x && x.Text);
        if (!!text)
          object[textProp] = text;
        else
          delete object[prop];
      }
      if (prop.endsWith('Cond')) {
        if (pref.ExcludeCondProperties && !prop.startsWith('Begin') && !prop.startsWith('Accept') && !prop.startsWith('Finish') && !prop.startsWith('Fail')) {
          delete object[prop];
        } else if (objAsAny[prop]) {
          postProcessCondProp(objAsAny, prop);
        }
      }
      if (prop.endsWith('Exec')) {
        if (pref.ExcludeExecProperties) {
          delete object[prop];
        } else {
          postProcessCondProp(objAsAny, prop);
        }
      }
      if (prop.endsWith('NpcList') || prop.endsWith('NpcId')) {
        let slicedProp = prop.endsWith('NpcList') ? prop.slice(0, -4) : prop.slice(0, -2);
        if (pref.ExcludeNpcListProperties) {
          delete object[prop];
        } else {
          let dataList = await getNpcList(object[prop] as any);
          dataList = dataList.filter(x => !!x);
          if (!pref.ExcludeNpcDataListProperties)
            object[slicedProp+'DataList'] = dataList;
          object[slicedProp+'NameList'] = dataList.map(x => x.NameText);
        }
      }
      if (pref.ExcludeGuideProperties && prop.endsWith('Guide')) {
        delete object[prop];
      }
      if (prop == 'TalkRole') {
        let TalkRole = (<any> object[prop]) as TalkRole;
        let TalkRoleId = TalkRole.Id;
        if (typeof TalkRoleId === 'string')
          TalkRole.Id = parseInt(TalkRoleId);
        if (TalkRole.Type === 'TALK_ROLE_PLAYER') {
          delete TalkRole.Id;
          continue;
        }
        let npc = await getNpc(TalkRoleId);
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

  const commonLoad = async (result: any[]) => await Promise.all(result.map(record => !record ? record : postProcess(JSON.parse(record.json_data))));
  const commonLoadFirst = async (record: any) => !record ? record : await postProcess(JSON.parse(record.json_data));

  async function getNpc(npcId: number): Promise<NpcExcelConfigData> {
    return await getNpcList([ npcId ]).then(x => x && x.length ? x[0] : null);
  }

  async function getNpcList(npcIds: number[]): Promise<NpcExcelConfigData[]> {
    if (!npcIds || !npcIds.length) return [];
    let notCachedIds = npcIds.filter(id => !pref.npcCache[id]);
    let cachedList = npcIds.map(id => pref.npcCache[id]).filter(x => !!x);
    let uncachedList: NpcExcelConfigData[] = await knex.select('*').from('NpcExcelConfigData').whereIn('Id', notCachedIds).then(commonLoad);
    uncachedList.forEach(npc => pref.npcCache[npc.Id] = npc);
    return cachedList.concat(uncachedList);
  }

  async function selectMainQuestByName(name: string|number[]): Promise<MainQuestExcelConfigData> {
    let textMapIds = [];
    if (typeof name === 'string') {
      const textMapItems: TextMapItem[] = await knex.select('*').from('TextMap').where({Text: name}).limit(25).then();
      textMapIds = textMapItems.map(x => x.Id);
    } else {
      textMapIds = name;
    }

    return await knex.select('*').from('MainQuestExcelConfigData').whereIn('TitleTextMapHash', textMapIds)
      .first().then(commonLoadFirst);
  }

  async function selectMainQuestsByName(name: string|number[], limit: number = 25): Promise<MainQuestExcelConfigData[]> {
    let textMapIds = [];
    if (typeof name === 'string') {
      const textMapItems: TextMapItem[] = await knex.select('*').from('TextMap').where({Text: name}).limit(limit).then();
      textMapIds = textMapItems.map(x => x.Id);
    } else {
      textMapIds = name;
    }

    return await knex.select('*').from('MainQuestExcelConfigData').whereIn('TitleTextMapHash', textMapIds)
      .limit(limit).then(commonLoad);
  }

  async function selectMainQuestById(id: number): Promise<MainQuestExcelConfigData> {
    return await knex.select('*').from('MainQuestExcelConfigData').where({Id: id}).first().then(commonLoadFirst);
  }

  async function selectQuestByMainQuestId(id: number): Promise<QuestExcelConfigData[]> {
    return await knex.select('*').from('QuestExcelConfigData').where({MainId: id}).then(commonLoad)
      .then(quests => quests.sort(sortByOrder));
  }

  async function selectManualTextMapConfigDataById(id: string): Promise<ManualTextMapConfigData> {
    return await knex.select('*').from('ManualTextMapConfigData').where({TextMapId: id}).first().then(commonLoadFirst);
  }

  async function selectTalkExcelConfigDataById(id: number): Promise<TalkExcelConfigData> {
    return await knex.select('*').from('TalkExcelConfigData').where({Id: id}).orWhere({QuestCondStateEqualFirst: id}).first().then(commonLoadFirst);
  }

  async function selectTalkExcelConfigDataByQuestSubId(id: number): Promise<TalkExcelConfigData> {
    return await knex.select('*').from('TalkExcelConfigData').where({Id: id}).orWhere({QuestCondStateEqualFirst: id}).first().then(commonLoadFirst);
  }

  async function selectTalkExcelConfigDataIdsByPrefix(idPrefix: number|string): Promise<number[]> {
    let allTalkExcelTalkConfigIds = pref.ExcludeOrphanedDialogue ? [] : await grepIdStartsWith('_id', idPrefix, './ExcelBinOutput/TalkExcelConfigData.json');
    return allTalkExcelTalkConfigIds.map(i => toNumber(i));
  }

  async function addOrphanedDialogueAndQuestMessages(mainQuest: MainQuestExcelConfigData) {
    let allDialogueIds = pref.ExcludeOrphanedDialogue ? [] : await grepIdStartsWith('Id', mainQuest.Id, './ExcelBinOutput/DialogExcelConfigData.json');
    let allQuestMessageIds = await grepIdStartsWith('TextMapId', 'QUEST_Message_Q' + mainQuest.Id, './ExcelBinOutput/ManualTextMapConfigData.json');
    let consumedQuestMessageIds = [];

    const handleOrphanedDialog = async (quest: MainQuestExcelConfigData|QuestExcelConfigData, id: number) => {
      if (pref.dialogCache[id])
        return;
      let dialog = await selectSingleDialogExcelConfigData(id as number);
      if (dialog) {
        if (!quest.OrphanedDialog)
          quest.OrphanedDialog = [];
        let dialogs = await selectDialogBranch(dialog);
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
          quest.QuestMessages.push(await selectManualTextMapConfigDataById(id as string));
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
        mainQuest.QuestMessages.push(await selectManualTextMapConfigDataById(id as string));
      }
    }
  }

  async function selectTalkExcelConfigDataByQuestId(questId: number): Promise<TalkExcelConfigData[]> {
    return await knex.select('*').from('TalkExcelConfigData').where({QuestId: questId}).orWhere({QuestCondStateEqualFirst: questId}).then(commonLoad)
      .then(quests => quests.sort(sortByOrder));
  }

  async function selectTalkExcelConfigDataByNpcId(npcId: number): Promise<TalkExcelConfigData[]> {
    return await knex.select('*').from('TalkExcelConfigData').where({NpcId: npcId}).then(commonLoad)
      .then(quests => quests.sort(sortByOrder));
  }

  async function selectDialogExcelConfigDataByTalkRoleId(talkRoleId: number): Promise<DialogExcelConfigData[]> {
    return await knex.select('*').from('DialogExcelConfigData').where({TalkRoleId: talkRoleId}).then(commonLoad)
      .then(quests => quests.sort(sortByOrder));
  }

  async function selectSingleDialogExcelConfigData(id: number): Promise<DialogExcelConfigData> {
    if (pref.dialogCache[id])
      return pref.dialogCache[id];
    let result: DialogExcelConfigData = await knex.select('*').from('DialogExcelConfigData').where({Id: id}).first().then(commonLoadFirst);
    pref.dialogCache[id] = result;
    return result && result.TalkContentText ? result : null;
  }

  async function selectMultipleDialogExcelConfigData(ids: number[]): Promise<DialogExcelConfigData[]> {
    return await Promise.all(ids.map(id => selectSingleDialogExcelConfigData(id))).then(arr => arr.filter(x => !!x && !!x.TalkContentText));
  }

  function copyDialogForRecurse(node: DialogExcelConfigData) {
    let copy: DialogExcelConfigData = JSON.parse(JSON.stringify(node));
    copy.recurse = true;
    return copy;
  }

  async function getDialogFromTextContentId(textMapId: number): Promise<DialogExcelConfigData> {
    let result: DialogExcelConfigData = await knex.select('*').from('DialogExcelConfigData').where({TalkContentTextMapHash: textMapId}).first().then(commonLoadFirst);
    pref.dialogCache [result.Id] = result;
    return result;
  }

  function isPlayerDialogueOption(dialog: DialogExcelConfigData): boolean {
    return dialog.TalkRole.Type === 'TALK_ROLE_PLAYER' && dialog.TalkShowType && dialog.TalkShowType === 'TALK_SHOW_FORCE_SELECT';
  }

  async function selectDialogBranch(start: DialogExcelConfigData, dialogSeenAlready: number[] = []): Promise<DialogExcelConfigData[]> {
    if (!start)
      return [];
    let currBranch: DialogExcelConfigData[] = [];
    let currNode = start;
    while (currNode) {
      if (dialogSeenAlready.includes(currNode.Id)) {
        currBranch.push(copyDialogForRecurse(currNode));
        break;
      } else {
        dialogSeenAlready.push(currNode.Id);
      }

      if (currNode.TalkContentText) {
        currBranch.push(currNode);
      }

      const nextNodes: DialogExcelConfigData[] = await selectMultipleDialogExcelConfigData(currNode.NextDialogs);
      if (nextNodes.length === 1) {
        // If only one next node -> same branch
        currNode = nextNodes[0];
      } else if (nextNodes.length > 1) {
        // If multiple next nodes -> branching
        const branches: DialogExcelConfigData[][] = await Promise.all(nextNodes.map(node => selectDialogBranch(node, dialogSeenAlready.slice())));
        //console.log('Branches:', branches.map(b => b[0]));
        const intersect = arrayIntersect<DialogExcelConfigData>(branches, IdComparator).filter(x => x.TalkRole.Type !== 'TALK_ROLE_PLAYER'); // do not rejoin on a player talk
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
            branches[i] = branch.slice(0, arrayIndexOf(branch, rejoinNode, IdComparator));
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

  async function selectNpcListByName(nameOrTextMapId: number|string|number[]): Promise<NpcExcelConfigData[]> {
    if (typeof nameOrTextMapId === 'string') {
      nameOrTextMapId = await knex.select('Id').from('TextMap').where({Text: nameOrTextMapId}).then(a => a.map(x => <number> x.Id));
    }
    if (typeof nameOrTextMapId === 'number') {
      nameOrTextMapId = [ nameOrTextMapId ];
    }
    console.log('NPC Name TextMapId:', nameOrTextMapId);
    let npcList = await knex.select('*').from('NpcExcelConfigData').whereIn('NameTextMapHash', <number[]> nameOrTextMapId).then(commonLoad);
    console.log('NPC List', npcList);
    return npcList;
  }

  function doesDialogHaveNpc(dialog: DialogExcelConfigData, npcNames: string[]) {
    if (npcNames.includes(dialog.TalkRole.NameText)) {
      return true;
    }
    if (dialog.Branches) {
      for (let branch of dialog.Branches) {
        for (let branchDialog of branch) {
          if (doesDialogHaveNpc(branchDialog, npcNames)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function doesQuestSubHaveNpc(questSub: QuestExcelConfigData, npcNames: string[]) {
    if (questSub.TalkExcelConfigDataList) {
      for (let talkConfig of questSub.TalkExcelConfigDataList) {
        for (let dialog of talkConfig.Dialog) {
          if (doesDialogHaveNpc(dialog, npcNames)) {
            return true;
          }
        }
      }
    }
    if (questSub.OrphanedDialog) {
      for (let dialogs of questSub.OrphanedDialog) {
        for (let dialog of dialogs) {
          if (doesDialogHaveNpc(dialog, npcNames)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  async function generateDialogueWikiText(dialogLines: DialogExcelConfigData[], dialogDepth = 1, originatorDialog: DialogExcelConfigData = null, originatorIsFirstOfBranch: boolean = false): Promise<string> {
    let out = '';
    let numSubsequentNonBranchPlayerDialogOption = 0;
    let previousDialog: DialogExcelConfigData = null;

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
      let text = normText(dialog.TalkContentText);

      if (text.includes('SEXPRO')) {
        let matches = /\{PLAYERAVATAR#SEXPRO\[(.*)\|(.*)\]\}/.exec(text);
        if (matches.length >= 3) {
          let g1 = matches[1];
          let g2 = matches[2];
          let g1e = await selectManualTextMapConfigDataById(g1);
          let g2e = await selectManualTextMapConfigDataById(g2);
          text = `(${g1e.TextMapContentText}/${g2e.TextMapContentText})`;
        }
      }

      if (previousDialog && isPlayerDialogueOption(dialog) && isPlayerDialogueOption(previousDialog) &&
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
        out += '\n(recursive)';
      }

      if (dialog.Branches && dialog.Branches.length) {
        for (let dialogBranch of dialog.Branches) {
          out += await generateDialogueWikiText(dialogBranch, dialogDepth + 1, dialog, i === 0);
        }
      }

      previousDialog = dialog;
    }
    return out;
  };

  return {
    getPref() {
      return pref;
    },
    postProcess,
    commonLoad,
    commonLoadFirst,
    getNpc,
    getNpcList,
    selectMainQuestByName,
    selectMainQuestsByName,
    selectMainQuestById,
    selectQuestByMainQuestId,
    selectManualTextMapConfigDataById,
    selectTalkExcelConfigDataById,
    selectTalkExcelConfigDataByQuestSubId,
    selectTalkExcelConfigDataIdsByPrefix,
    selectTalkExcelConfigDataByQuestId,
    selectTalkExcelConfigDataByNpcId,
    selectNpcListByName,
    selectDialogExcelConfigDataByTalkRoleId,
    addOrphanedDialogueAndQuestMessages,
    getDialogFromTextContentId,
    selectSingleDialogExcelConfigData,
    selectMultipleDialogExcelConfigData,
    selectDialogBranch,
    doesQuestSubHaveNpc,
    generateDialogueWikiText,
    isPlayerDialogueOption,
  }
}