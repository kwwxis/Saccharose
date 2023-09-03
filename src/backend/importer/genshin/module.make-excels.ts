import fs, { promises as fsp } from 'fs';
import path from 'path';
import { getGenshinDataFilePath } from '../../loadenv';
import { sort } from '../../../shared/util/arrayUtil';

function* walkSync(dir): Generator<string> {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name);
    }
  }
}

export async function importMakeExcels() {
  const binOutputPath = getGenshinDataFilePath('./BinOutput');
  const excelDirPath = getGenshinDataFilePath('./ExcelBinOutput');

  const binOutputQuestPath = path.resolve(binOutputPath, './Quest');
  const binOutputTalkPath = path.resolve(binOutputPath, './Talk');

  const mainQuestExcelArray = [];
  const questExcelArray = [];
  const talkExcelArray = [];
  const dialogExcelArray = [];
  const dialogUnparentedExcelArray = [];

  const mainQuestById: { [id: string]: any } = {};
  const questExcelById: { [id: string]: any } = {};
  const talkExcelById: { [id: string]: any } = {};
  const dialogExcelById: { [id: string]: any } = {};

  // ----------------------------------------------------------------------
  // Enqueue Functions

  function enqueueMainQuestExcel(obj: any) {
    if (!obj) {
      return;
    }
    if (mainQuestById[obj.id]) {
      console.log('Got duplicate of main quest ' + obj.id);
      Object.assign(mainQuestById[obj.id], obj);
      return;
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

  function enqueueQuestExcel(obj: any) {
    if (!obj) {
      return;
    }
    if (questExcelById[obj.subId]) {
      console.log('Got duplicate of quest ' + obj.subId);
      Object.assign(questExcelById[obj.subId], obj);
      return;
    }
    questExcelArray.push(obj);
    questExcelById[obj.subId] = obj;
  }

  function enqueueTalkExcel(obj: any) {
    if (!obj) {
      return;
    }
    if (talkExcelById[obj.id]) {
      console.log('Got duplicate of talk ' + obj.id);
      Object.assign(talkExcelById[obj.id], obj);
      return;
    }

    if (!obj.nextTalks) {
      obj.nextTalks = [];
    }
    if (!obj.npcId) {
      obj.npcId = [];
    }

    talkExcelArray.push(obj);
    talkExcelById[obj.id] = obj;
  }

  function enqueueDialogExcel(obj: any, extraProps: any = {}) {
    if (!obj) {
      return;
    }
    if (dialogExcelById[obj.id]) {
      console.log('Got duplicate of dialog ' + obj.id);
      Object.assign(dialogExcelById[obj.id], obj);
      return;
    }

    if (!obj.nextDialogs) {
      obj.nextDialogs = [];
    }
    if (!obj.talkRole) {
      obj.talkRole = {};
    }

    dialogExcelArray.push(Object.assign(obj, extraProps));
    dialogExcelById[obj.id] = obj;
  }

  // ----------------------------------------------------------------------
  // Process Functions

  function processJsonObject(json: any) {
    if (!json) {
      return;
    }
    if (json.initDialog) {
      enqueueTalkExcel(json);
    }
    if (json.talkRole) {
      enqueueDialogExcel(json);
    }
    if (Array.isArray(json.dialogList)) {
      let extraProps: any = {};
      if (json.talkId) {
        extraProps.talkId = json.talkId;
      }
      if (json.type) {
        extraProps.talkType = json.type;
      }
      json.dialogList.forEach(obj => enqueueDialogExcel(obj, extraProps));
    }
    if (Array.isArray(json.talks)) {
      json.talks.forEach(obj => enqueueTalkExcel(obj));
    }
    if (Array.isArray(json.subQuests)) {
      json.subQuests.forEach(obj => enqueueQuestExcel(obj));
    }
  }

  // ----------------------------------------------------------------------
  // Process Loop Stage

  for (let fileName of walkSync(binOutputQuestPath)) {
    if (!fileName.endsWith('.json')) {
      continue;
    }
    let json = await fsp.readFile(fileName, { encoding: 'utf8' }).then(data => JSON.parse(data));
    processJsonObject(json);
    enqueueMainQuestExcel(json);
  }
  for (let fileName of walkSync(binOutputTalkPath)) {
    if (!fileName.endsWith('.json')) {
      continue;
    }
    let json = await fsp.readFile(fileName, { encoding: 'utf8' }).then(data => JSON.parse(data));
    processJsonObject(json);
    if (json.id && json.type && json.subQuests) {
      enqueueMainQuestExcel(json);
    }
  }

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
  // Verify Stage

  const generatedMainQuestIds: Set<number> = new Set(mainQuestExcelArray.map(x => x.id));
  const generatedQuestIds: Set<number> = new Set(questExcelArray.map(x => x.subId));
  const generatedTalkIds: Set<number> = new Set(talkExcelArray.map(x => x.id));
  const generatedDialogIds: Set<number> = new Set(dialogExcelArray.map(x => x.id));

  let verifyMainQuestIds: number[] = await fsp.readFile(path.resolve(excelDirPath, './MainQuestExcelConfigData.json'), { encoding: 'utf8' })
    .then(data => JSON.parse(data)).then(arr => arr.map(x => x.id || x.Id));

  let verifyQuestIds: number[] = await fsp.readFile(path.resolve(excelDirPath, './QuestExcelConfigData.json'), { encoding: 'utf8' })
    .then(data => JSON.parse(data)).then(arr => arr.map(x => x.subId || x.SubId));

  let verifyTalkIds: number[] = await fsp.readFile(path.resolve(excelDirPath, './TalkExcelConfigData.json'), { encoding: 'utf8' })
    .then(data => JSON.parse(data)).then(arr => arr.map(x => x.id || x.Id));

  let verifyDialogIds: number[] = await fsp.readFile(path.resolve(excelDirPath, './DialogExcelConfigData.json'), { encoding: 'utf8' })
    .then(data => JSON.parse(data)).then(arr => arr.map(x => x.id || x.Id || x['GFLDJMJKIKE']));

  verifyMainQuestIds = verifyMainQuestIds.filter(id => !generatedMainQuestIds.has(id));
  verifyQuestIds = verifyQuestIds.filter(id => !generatedQuestIds.has(id));
  verifyTalkIds = verifyTalkIds.filter(id => !generatedTalkIds.has(id));
  verifyDialogIds = verifyDialogIds.filter(id => !generatedDialogIds.has(id));

  console.log('Missing Main Quest IDs:', verifyMainQuestIds);
  console.log('Missing Quest IDs:', verifyQuestIds);
  console.log('Missing Talk IDs:', verifyTalkIds);
  console.log('Missing Dialog IDs:', verifyDialogIds);

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

  // ----------------------------------------------------------------------

  console.log('Done');
}