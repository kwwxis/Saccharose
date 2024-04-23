/**
 * Generate Quest & Dialog Excels
 *
 * Specifically these:
 *  - MainQuestExcelConfigData
 *  - QuestExcelConfigData
 *  - TalkExcelConfigData
 *  - DialogExcelConfigData
 *
 * It also generates some custom files:
 *   - DialogUnparentedExcelConfigData: associates dialogs to a main quest for dialogs that aren't part of a talk.
 *   - CodexQuestExcelConfigData: info from BinOutput/CodexQuest (quest log in the in-game archive)
 */

import fs, { promises as fsp } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import * as process from 'process';
import { sort, walkObject } from '../../../shared/util/arrayUtil.ts';
import { renameFields } from '../import_db.ts';
import { defaultMap } from '../../../shared/util/genericUtil.ts';
import { isInt, toInt } from '../../../shared/util/numberUtil.ts';

// region Walk Sync
// --------------------------------------------------------------------------------------------------------------
function* walkSync(dir: string): Generator<string> {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name);
    }
  }
}
// endregion

export async function generateAvatarAnimInteractionGoodBad(repoRoot: string) {
  const binOutputPath: string = path.resolve(repoRoot, './BinOutput');
  const binOutputQuestPath: string = path.resolve(binOutputPath, './Avatar');

  for (let fileName of walkSync(binOutputQuestPath)) {
    if (!fileName.endsWith('.json')) {
      continue;
    }
    let json = await fsp.readFile(fileName, { encoding: 'utf8' }).then(data => JSON.parse(data));
    let animStates = json?.stateLayers?.defaultLayer?.stateIDs;
    let hasAnyOutput: boolean = false;

    if (!!animStates) {
      for (let [stateName, stateProps] of Object.entries(animStates)) {
        let hasInteractionGood: boolean = false;
        walkObject(stateProps, proc => {
          if (proc.value === 'Interaction_Bad') {
            hasInteractionGood = true;
            return 'QUIT';
          }
        });
        if (hasInteractionGood) {
          if (!hasAnyOutput) {
            console.log(path.basename(fileName) + ':');
            hasAnyOutput = true;
          }
          console.log('  ' + stateName);
        }
      }
    }
  }
}

// region Main Function
// --------------------------------------------------------------------------------------------------------------
export async function generateQuestDialogExcels(repoRoot: string) {
  const binOutputPath: string = path.resolve(repoRoot, './BinOutput');
  const excelDirPath: string = path.resolve(repoRoot, './ExcelBinOutput');

  if (!fs.existsSync(binOutputPath)) throw new Error('BinOutput path does not exist!');
  if (!fs.existsSync(excelDirPath)) throw new Error('ExcelBinOutput path does not exist!');

  const binOutputQuestPath: string = path.resolve(binOutputPath, './Quest');
  const binOutputTalkPath: string = path.resolve(binOutputPath, './Talk');
  const binOutputCodexQuestPath: string = path.resolve(binOutputPath, './CodexQuest');

  if (!fs.existsSync(binOutputQuestPath)) throw new Error('BinOutput/Quest path does not exist!');
  if (!fs.existsSync(binOutputTalkPath)) throw new Error('BinOutput/Talk path does not exist!');
  if (!fs.existsSync(binOutputCodexQuestPath)) throw new Error('BinOutput/CodexQuest path does not exist!');

  const mainQuestExcelArray: any[] = [];
  const questExcelArray: any[] = [];
  const talkExcelArray: any[] = [];
  const dialogExcelArray: any[] = [];
  const dialogUnparentedExcelArray: any[] = [];
  const codexQuestArray: any[] = [];

  const mainQuestById: { [id: string]: any } = {};
  const questExcelById: { [id: string]: any } = {};
  const questExcelToMqId: { [id: string]: number } = {};
  const talkExcelById: { [id: string]: any } = {};
  const dialogExcelById: { [id: string]: any } = {};
  const scannedTalkIds: { [id: string]: {[fileName: string]: any} } = defaultMap('Object');

  // ----------------------------------------------------------------------
  // Enqueue Functions

  function deobf(obj: any): any {
    // TODO: This needs to be updated with each new Genshin version! (maybe)
    obj = renameFields(obj, {
      CCFPGAKINNB: 'id',
      FKFBNNHJPDP: 'series',
      JNMCHAGDLOL: 'type',
      KBPAAIICBFE: 'luaPath',
      FLCLAPBOOHF: 'chapterId',
      GEMDBAMINAF: 'suggestTrackMainQuestList',
      MHOOJOMLDDB: 'rewardIdList',
      HLAINHJACPJ: 'titleTextMapHash',
      CJBHOPEAEPN: 'descTextMapHash',
      CNJBGFDOLLA: 'showType',

      // QuestExcel props:
      POJOCEPJPAL: 'subQuests',
      OHGOECEBPJM: 'subId',
      DNINOJJPDDG: 'mainId',
      NKCPJODPKPO: 'order',
      AODHOADLAJC: 'finishCond',
      OBKNOBNIEGC: 'param',
      OALKBEIOAOH: 'guide',
      KGFIGPLOOGN: 'guideScene',
      IGOKLNLLAJL: 'guideStyle',
      CDDKJNJPILI: 'guideHint',
      DBJJALMJAGP: 'finishParent',
      IBKCENKCMEM: 'isRewind',
      JLPDHGIFKMC: 'versionBegin',
      NADDGOKKJAO: 'versionEnd',

      // Talk props:
      FEOACBMDCKJ: 'talkId',
      PCNNNPLAEAI: 'talks',
      CLHPPLIFPFJ: 'beginWay',
      AFNAENENCBB: 'beginCond',
      KPMDGJNJNJC: 'priority',
      FMFFELFBBJN: 'initDialog',
      JDOFKFPHIDC: 'npcId',
      GHHGNCCJOEJ: 'performCfg',
      GKACCNJHFHH: 'heroTalk',
      OLLANCCFJKD: 'questId',
      NKIDPMJGEKA: 'assertIndex',
      BBMLHKKNIOJ: 'prePerformCfg',
      EECDLICEMBF: 'nextTalks',
      NFLHDPLENGC: 'activeMode',

      // Dialog props:
      AAOAAFLLOJI: 'dialogList',
      FNNPCGIAELE: 'nextDialogs',
      HJLEMJIGNFE: 'talkRole',
      BDOKCLNNDGN: 'talkContentTextMapHash',
      LBIALGEBDEF: 'talkAssetPath',
      OHKKBEPEBKH: 'talkAssetPathAlter',
      AMNGMAPONHL: 'talkAudioName',
      IANGBGFBILD: 'actionBefore',
      ADGDAEPIILL: 'actionWhile',
      DGJCJLLDMON: 'actionAfter',
      DOCDFJJIDNG: 'optionIcon'
    });
    return obj;
  }

  function enqueueMainQuestExcel(obj: any, fileName: string) {
    if (!obj) {
      return;
    }
    if (obj && !obj.id) {
      obj = deobf(obj);
      if (obj && !obj.id) {
        console.warn('Encountered obfuscated MQ:', fileName);
        return;
      }
    }
    if (mainQuestById[obj.id]) {
      console.log('Got duplicate of main quest ' + obj.id);
      Object.assign(mainQuestById[obj.id], obj);
      return;
    }

    if (Array.isArray(obj.subQuests)) {
      obj.subQuests.forEach((questExcel: any) => enqueueQuestExcel(questExcel, obj.id));
    }

    if (Array.isArray(obj.dialogList)) {
      for (let dialog of obj.dialogList) {
        dialogUnparentedExcelArray.push({ MainQuestId: obj.id, DialogId: dialog.id });
      }
    }

    obj = Object.assign({}, obj);
    delete obj['talks'];
    delete obj['dialogList'];
    delete obj['subQuests'];

    if (!obj.rewardIdList) {
      obj.rewardIdList = [];
    }
    if (!obj.suggestTrackMainQuestList) {
      obj.suggestTrackMainQuestList = [];
    }
    if (!obj.specialShowRewardId) {
      obj.specialShowRewardId = [];
    }
    if (!obj.specialShowCondIdList) {
      obj.specialShowCondIdList = [];
    }

    mainQuestExcelArray.push(obj);
    mainQuestById[obj.id] = obj;
  }

  function enqueueQuestExcel(obj: any, mainQuestId: number) {
    if (!obj) {
      return;
    }
    if (obj && !obj.subId) {
      console.warn('Encountered obfuscated QuestExcel under MQ ID ', mainQuestId);
      return;
    }
    if (questExcelById[obj.subId]) {
      console.log('Got duplicate of quest ' + obj.subId);
      Object.assign(questExcelById[obj.subId], obj);
      return;
    }
    questExcelArray.push(obj);
    questExcelById[obj.subId] = obj;
    questExcelToMqId[obj.subId] = mainQuestId;
  }

  function createAndEnqueueTalkExcel(talkId: string|number, obj: any) {
    if (typeof talkId === 'string') {
      talkId = parseInt(talkId);
    }

    const firstDialogId = Array.isArray(obj.dialogList) ? obj.dialogList?.[0]?.id : undefined;
    const npcIds: number[] = [];

    if (Array.isArray(obj.dialogList)) {
      for (let dialog of obj.dialogList) {
        if (dialog.talkRole && isInt(dialog.talkRole.id) && dialog.talkRole.type === 'TALK_ROLE_NPC') {
          const talkRoleId = toInt(dialog.talkRole.id);
          if (!npcIds.includes(talkRoleId)) {
            npcIds.push(toInt(dialog.talkRole.id));
          }
        }
      }
    }

    enqueueTalkExcel({
      id: talkId,
      npcId: npcIds,
      questId: questExcelToMqId[talkId],
      initDialog: firstDialogId,
      saccharoseSyntheticTalk: true,
    });
  }

  function enqueueTalkExcel(obj: any) {
    if (!obj) {
      return;
    }
    if (obj && !obj.id) {
      console.warn('Encountered obfuscated TalkExcel');
      return;
    }
    if (talkExcelById[obj.id]) {
      //console.log('Got duplicate of talk ' + obj.id);
      Object.assign(talkExcelById[obj.id], obj);
      return;
    }

    if (!obj.nextTalks) {
      obj.nextTalks = [];
    }
    if (!obj.npcId) {
      obj.npcId = [];
    }
    if (!obj.questId && questExcelToMqId[obj.id]) {
      obj.questId = questExcelToMqId[obj.id];
    }

    talkExcelArray.push(obj);
    talkExcelById[obj.id] = obj;
  }

  function enqueueDialogExcel(obj: any, fileName: string, extraProps: any = {}) {
    if (!obj) {
      return;
    }
    if (obj && !obj.id) {
      console.warn('Encountered obfuscated DialogExcel');
      return;
    }
    if (dialogExcelById[obj.id]) {
      //console.log('Got duplicate of dialog ' + obj.id);
      Object.assign(dialogExcelById[obj.id], obj);
      return;
    }

    if (!obj.nextDialogs) {
      obj.nextDialogs = [];
    }
    if (!obj.talkRole) {
      obj.talkRole = {};
    }
    if (!obj.talkSubDirectory) {
      obj.talkBinType = fileName.match(/Talk[\/\\]([^\/\\]+)[\/\\]/)?.[1];
    }

    dialogExcelArray.push(Object.assign(obj, extraProps));
    dialogExcelById[obj.id] = obj;
  }

  // ----------------------------------------------------------------------
  // Process Functions

  function processJsonObject(json: any, fileName: string) {
    if (!json) {
      return;
    }
    if (json.initDialog) {
      enqueueTalkExcel(json);
    }
    if (json.talkRole) {
      enqueueDialogExcel(json, fileName);
    }
    if (Array.isArray(json.dialogList)) {
      let extraProps: any = {};
      if (json.talkId) {
        extraProps.talkId = json.talkId;
        scannedTalkIds[json.talkId][fileName] = json;
      }
      if (json.type) {
        extraProps.talkType = json.type;
      }
      json.dialogList.forEach((obj: any) => enqueueDialogExcel(obj, fileName, extraProps));
    }
    if (Array.isArray(json.talks)) {
      json.talks.forEach((obj: any) => enqueueTalkExcel(obj));
    }
  }

  function processCodexQuestObject(json: any) {
    if (!json.mainQuestId || !Array.isArray(json.subQuests)) {
      return;
    }
    const mqId = json.mainQuestId;
    for (let subQuest of json.subQuests) {
      if (!subQuest.items) {
        continue;
      }
      for (let item of subQuest.items) {
        if (!item) {
          continue;
        }

        if (!item.itemId) {
          console.log(item);
          throw 'Error getting CodexQuest item ID!';
        }

        const defaultNextItemId: number = Object.values(item).find(x => Array.isArray(x) && typeof x[0] === 'number')?.[0];

        const initialObj: any = {
          mainQuestId: mqId,
          itemId: item.itemId,
          speakerTextMapHash: item.speakerText?.textId,
          speakerTextType: item.speakerText?.textType,
          nextItemId: defaultNextItemId,
        };

        if (item.dialogs) {
          let i = 0;
          for (let dialog of item.dialogs) {
            codexQuestArray.push(Object.assign({}, initialObj, {
              id: (mqId + "-" + item.itemId + "-" + i),
              contentTextMapHash: dialog.text?.textId,
              contentTextType: dialog.text?.textType,

              soundId: dialog.soundId,
              nextItemId: dialog.nextItemId,
            }));
            i++;
          }
        }
        if (item.texts) {
          let i = 0;
          for (let text of item.texts) {
            codexQuestArray.push(Object.assign({}, initialObj, {
              id: (mqId + "-" + item.itemId + "-" + i),
              contentTextMapHash: text.textId,
              contentTextType: text.textType,
            }));
            i++;
          }
        }
      }
    }
  }

  // ----------------------------------------------------------------------
  // Process Loop Stage

  console.log('Processing BinOutput/Quest');
  for (let fileName of walkSync(binOutputQuestPath)) {
    if (!fileName.endsWith('.json')) {
      continue;
    }
    let json = await fsp.readFile(fileName, { encoding: 'utf8' }).then(data => JSON.parse(data));
    json = deobf(json);
    enqueueMainQuestExcel(json, fileName);
    processJsonObject(json, fileName);
  }

  console.log('Processing BinOutput/Talk');
  for (let fileName of walkSync(binOutputTalkPath)) {
    if (!fileName.endsWith('.json')) {
      continue;
    }
    if (fileName.includes('Talk/Coop') || fileName.includes('Talk\\Coop')) {
      continue; // Ignoring hangout talks for now -- not implemented
    }
    let json = await fsp.readFile(fileName, { encoding: 'utf8' }).then(data => JSON.parse(data));
    json = deobf(json);
    if (json.id && json.type && json.subQuests) {
      enqueueMainQuestExcel(json, fileName);
    }
    processJsonObject(json, fileName);
  }

  for (let talkId of Object.keys(scannedTalkIds)) {
    if (!talkExcelById[talkId]) {
      const fileNameToObject = scannedTalkIds[talkId];

      if (Object.keys(fileNameToObject).length === 1) {
        createAndEnqueueTalkExcel(talkId, Object.values(fileNameToObject)[0]);
      } else {
        const bestKey = Object.keys(fileNameToObject).find(k => /[\/\\]\d+\.json/.test(k)) || Object.keys(fileNameToObject)[0];
        createAndEnqueueTalkExcel(talkId, fileNameToObject[bestKey]);
      }
    }
  }

  console.log('Processing BinOutput/CodexQuest');
  for (let fileName of walkSync(binOutputCodexQuestPath)) {
    if (!fileName.endsWith('.json')) {
      continue;
    }
    let json = await fsp.readFile(fileName, { encoding: 'utf8' }).then(data => JSON.parse(data));
    json = deobf(json);
    processCodexQuestObject(json);
  }

  console.log('Processed ' + mainQuestExcelArray.length + ' main quests');
  console.log('Processed ' + questExcelArray.length + ' quests');
  console.log('Processed ' + talkExcelArray.length + ' talks');
  console.log('Processed ' + dialogExcelArray.length + ' dialogs');
  console.log('Processed ' + codexQuestArray.length + ' codex quests');

  // ----------------------------------------------------------------------
  // Sort Stage

  console.log('Sorting MainQuestExcelConfigData');
  sort(mainQuestExcelArray, 'id');

  console.log('Sorting QuestExcelConfigData');
  sort(questExcelArray, 'id');

  console.log('Sorting TalkExcelConfigData');
  sort(talkExcelArray, 'id');

  console.log('Sorting DialogExcelConfigData');
  sort(dialogExcelArray, 'id');

  console.log('Sorting DialogUnparentedExcelConfigData');
  sort(dialogUnparentedExcelArray, 'MainQuestId', 'DialogId');

  // ----------------------------------------------------------------------
  // Write Stage

  console.log('Writing to MainQuestExcelConfigData');
  fs.writeFileSync(path.resolve(excelDirPath, './MainQuestExcelConfigData.json'), JSON.stringify(mainQuestExcelArray, null, 2));

  console.log('Writing to QuestExcelConfigData');
  fs.writeFileSync(path.resolve(excelDirPath, './QuestExcelConfigData.json'), JSON.stringify(questExcelArray, null, 2));

  console.log('Writing to TalkExcelConfigData');
  fs.writeFileSync(path.resolve(excelDirPath, './TalkExcelConfigData.json'), JSON.stringify(talkExcelArray, null, 2));

  console.log('Writing to DialogExcelConfigData');
  fs.writeFileSync(path.resolve(excelDirPath, './DialogExcelConfigData.json'), JSON.stringify(dialogExcelArray, null, 2));

  console.log('Writing to DialogUnparentedExcelConfigData');
  fs.writeFileSync(path.resolve(excelDirPath, './DialogUnparentedExcelConfigData.json'), JSON.stringify(dialogUnparentedExcelArray, null, 2));

  console.log('Writing to CodexQuestExcelConfigData');
  fs.writeFileSync(path.resolve(excelDirPath, './CodexQuestExcelConfigData.json'), JSON.stringify(codexQuestArray, null, 2));

  // ----------------------------------------------------------------------

  console.log('Done');
}
// endregion

// region CLI
// --------------------------------------------------------------------------------------------------------------
async function runFromCli() {
  if (process.argv.length <= 2) {
    console.error('Not enough parameters! First parameter must be path to genshin data repository directory.');
    process.exit(1);
  }

  const repoDir: string = process.argv[2];
  if (!fs.existsSync(repoDir)) {
    console.error('Repository directory does not exist! -- ' + repoDir);
    process.exit(1);
  }

  await generateQuestDialogExcels(repoDir);
  process.exit(0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runFromCli();
}
// endregion
