import '../../loadenv';
import fs, { promises as fsp } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import commandLineArgs, { OptionDefinition as ArgsOptionDefinition } from 'command-line-args';
import commandLineUsage, { OptionDefinition as UsageOptionDefinition } from 'command-line-usage';
import chalk from 'chalk';
import { getGenshinDataFilePath, IMAGEDIR_GENSHIN } from '../../loadenv';
import { getGenshinControl } from '../../domain/genshin/genshinControl';
import { ReadableView } from '../../../shared/types/genshin/readable-types';
import { closeKnex } from '../../util/db';
import { __normGenshinText, loadGenshinTextSupportingData } from '../../domain/genshin/genshinText';
import { importNormalize, importPlainTextMap } from '../import_file_util';
import { GCGCharSkillDamage } from '../../../shared/types/genshin/gcg-types';
import { standardElementCode } from '../../../shared/types/genshin/manual-text-map';
import { VoiceItem, VoiceItemArrayMap } from '../../../shared/types/lang-types';
import { fetchCharacterFetters } from '../../domain/genshin/character/fetchCharacterFetters';
import { normalizeRawJson, SchemaTable } from '../import_db';
import { genshinSchema } from './genshin.schema';
import { translateSchema } from '../translate_schema';
import { sort } from '../../../shared/util/arrayUtil';

async function importGcgSkill() {
  const outDir = process.env.GENSHIN_DATA_ROOT;

  const skillExcelStr = fs.readFileSync(getGenshinDataFilePath('./ExcelBinOutput/GCGSkillExcelConfigData.json'), 'utf8');
  const skillExcelJson: any[] = JSON.parse(skillExcelStr);
  const skillInternalNames: Set<string> = new Set<string>();
  for (let skillExcel of skillExcelJson) {
    if (skillExcel['ODACBHLGCIN'] || skillExcel['CCKMLPCNHFL'] || skillExcel['HHHMJFBFAKD']) {
      skillInternalNames.add(skillExcel['ODACBHLGCIN'] || skillExcel['CCKMLPCNHFL'] || skillExcel['HHHMJFBFAKD']);
    }
  }

  const binOutputUnknownDir = getGenshinDataFilePath('./BinOutput/_unknown_dir');
  const unknownJsons = fs.readdirSync(binOutputUnknownDir).filter(file => path.extname(file) === '.json');

  const combined: {[name: string]: GCGCharSkillDamage} = {};

  for (let file of unknownJsons) {
    const fileData = fs.readFileSync(path.join(binOutputUnknownDir, file), 'utf8');
    const json: any = JSON.parse(fileData.toString());

    if (json['EONPAHCMPOI']) {
      json.name = json['EONPAHCMPOI'];
    }

    if (typeof json === 'object' && typeof json.name === 'string' && skillInternalNames.has(json.name)) {
      const name: string = json.name;
      const data: any = json['NGKMIMDBNPC'] || json['ACMGJEOBIEK'] || json['ANFAJNNDLFF'] || json['CLFPJIMIPNN'];
      if (!combined[name]) {
        combined[name] = {Name: name};
      }
      if (data) {
        combined[name].Damage = data["-2060930438"]?.value || data["-2060930438"]?.['DLLBGDKBMIL'];
        combined[name].IndirectDamage = data["-1921818039"]?.value || data["-1921818039"]?.['DLLBGDKBMIL'];
        combined[name].ElementTag = data["476224977"]?.ratio || data["476224977"]?.['HPDLNIPCGHB'];

        if (name.startsWith('Effect_Damage_')) {
          combined[name].Element = standardElementCode(name.split('_')[2].toLowerCase());
        } else {
          combined[name].Element = standardElementCode(combined[name].ElementTag);
        }

        if (combined[name].Element === null) {
          delete combined[name].Element;
        }

        switch (combined[name].Element) {
          case 'PYRO':
            combined[name].ElementKeywordId = 103;
            break;
          case 'HYDRO':
            combined[name].ElementKeywordId = 102;
            break;
          case 'DENDRO':
            combined[name].ElementKeywordId = 107;
            break;
          case 'ELECTRO':
            combined[name].ElementKeywordId = 104;
            break;
          case 'ANEMO':
            combined[name].ElementKeywordId = 105;
            break;
          case 'CRYO':
            combined[name].ElementKeywordId = 101;
            break;
          case 'GEO':
            combined[name].ElementKeywordId = 106;
            break;
          case 'PHYSICAL':
            combined[name].ElementKeywordId = 100;
            break;
        }
      }
    }
  }
  console.log(chalk.blue('Done. Output written to: ' + outDir + '/GCGCharSkillDamage.json'));
  fs.writeFileSync(outDir + '/GCGCharSkillDamage.json', JSON.stringify(combined, null, 2));
}

const VoiceSchema = <SchemaTable> {
  name: 'VoiceItems',
  columns: [],
  jsonFile: '',
  normalizeFixFields: {
    KMMBCJDNDNM: 'GameTrigger',
    JAOANONPLDI: 'GameTriggerArgs',
    IIFPKNOPNFI: 'PersonalConfig',
    EDNNCHGNMHO: 'SourceNames',
    EEFLLCGNDCG: 'SourceFileName',
    NJNEOOGNPKH: 'Gender',
  }
}

async function importVoice() {
  const outDir = process.env.GENSHIN_DATA_ROOT;
  const jsonDir = getGenshinDataFilePath('./BinOutput/Voice/Items');

  const combined: VoiceItemArrayMap = {};

  const jsonsInDir = fs.readdirSync(jsonDir).filter(file => path.extname(file) === '.json');
  const unknownTriggers: Set<string> = new Set();

  jsonsInDir.forEach(file => {
    const fileData = fs.readFileSync(path.join(jsonDir, file), 'utf8');
    const json: {[guid: string]: any} = JSON.parse(fileData.toString());

    for (let voiceItem of Object.values(json)) {
      voiceItem = normalizeRawJson(voiceItem, VoiceSchema);
      
      if (!voiceItem.GameTriggerArgs || !voiceItem.SourceNames) {
        continue;
      }

      let key: string;

      if (voiceItem.GameTrigger === 'Dialog') {
        key = 'Dialog_' + voiceItem.GameTriggerArgs;
      } else if (voiceItem.GameTrigger === 'DungeonReminder') {
        key = 'Reminder_' + voiceItem.GameTriggerArgs;
      } else if (voiceItem.GameTrigger === 'Fetter') {
        key = 'Fetter_' + voiceItem.GameTriggerArgs;
      } else if (voiceItem.GameTrigger === 'AnimatorEvent') {
        key = 'AnimatorEvent_' + voiceItem.GameTriggerArgs;
      } else if (voiceItem.GameTrigger === 'JoinTeam') {
        key = 'JoinTeam_' + voiceItem.GameTriggerArgs;
      } else if (voiceItem.GameTrigger === 'WeatherMonologue') {
        key = 'WeatherMonologue_' + voiceItem.GameTriggerArgs;
      } else if (voiceItem.GameTrigger === 'Card') {
        key = 'Card_' + voiceItem.GameTriggerArgs;
      } else {
        unknownTriggers.add(voiceItem.GameTrigger);
        continue;
      }

      combined[key] = [];

      for (let voiceSource of voiceItem.SourceNames) {
        let fileName: string = voiceSource.SourceFileName.split('\\').pop().toLowerCase().replace(/_/g, ' ').replace('.wem', '.ogg');
        let gender: number = voiceSource.Gender;
        let voiceSourceNorm: VoiceItem = {id: voiceItem.GameTriggerArgs, fileName};
        if (voiceItem.GameTrigger) {
          voiceSourceNorm.type = voiceItem.GameTrigger;
        }
        if (gender === 1) {
          voiceSourceNorm.gender = 'F';
          voiceSourceNorm.isGendered = true;
        } else  if (gender === 2) {
          voiceSourceNorm.gender = 'M';
          voiceSourceNorm.isGendered = true;
        }
        let alreadyExisting = combined[key].find(x => x.fileName === voiceSourceNorm.fileName);
        if (alreadyExisting) {
          // Sometimes miHoYo adds duplicates like:
          //   { sourceFileName: 'VO_AQ\VO_nahida\vo_XMAQ305_13_nahida_16.wem', rate: 1.0, avatarName: 'Switch_hero', emotion: '', gender: 2 }
          //   { sourceFileName: 'VO_AQ\VO_nahida\vo_XMAQ305_13_nahida_16.wem', rate: 1.0, avatarName: 'Switch_heroine', emotion: '', gender: 1 }
          // where the only difference is the "gender"/"avatarName" property, but they use the same file.
          // In which case we want to only have one of them and remove the gender.
          if (voiceSourceNorm.gender && alreadyExisting.gender) {
            delete alreadyExisting.gender;
            delete voiceSourceNorm.isGendered;
          }
          continue;
        }
        combined[key].push(voiceSourceNorm);
      }
    }
  });

  if (unknownTriggers.size) {
    console.log(chalk.red('Unknown game triggers:', unknownTriggers));
  }
  console.log(chalk.blue('Done. Output written to: ' + outDir + '/voiceItemsNormalized.json'));
  fs.writeFileSync(outDir + '/voiceItemsNormalized.json', JSON.stringify(combined, null, 2));
}

async function importFetters() {
  const outDir = process.env.GENSHIN_DATA_ROOT;

  const ctrl = getGenshinControl();
  const allFetters = await fetchCharacterFetters(ctrl, true);

  fs.writeFileSync(outDir + '/CharacterFettersCombined.json', JSON.stringify(allFetters, null, 2));
  console.log(chalk.blue('Done. Output written to: ' + outDir + '/CharacterFettersCombined.json'));
}

export async function importTranslateSchema() {
  function getExcelFilePair(filePath: string) {
    return {
      impExcelPath: path.resolve(process.env.IMPACTFUL_DATA_ROOT, filePath.replaceAll('\\', '/')),
      agdExcelPath: getGenshinDataFilePath(filePath),
    };
  }

  const excelDirPath = getGenshinDataFilePath('./ExcelBinOutput');

  const schemaResult = {};

  for (let schemaTable of Object.values(genshinSchema)) {
    if (!schemaTable.jsonFile.includes('ExcelBinOutput') || schemaTable.jsonFile.includes('DialogExcel')) {
      continue;
    }
    console.log('Processing schema table: ' + schemaTable.name + '...');
    let files = getExcelFilePair(schemaTable.jsonFile);
    schemaResult[schemaTable.name] = await translateSchema(files.impExcelPath, files.agdExcelPath);
  }

  const jsonsInDir = fs.readdirSync(excelDirPath).filter(file => path.extname(file) === '.json');
  for (let jsonFile of jsonsInDir) {
    const schemaName = path.basename(jsonFile).split('.')[0];
    if (genshinSchema[schemaName]) {
      continue;
    }
    console.log('Processing excel json: ' + schemaName + '...');
    try {
      let files = getExcelFilePair('./ExcelBinOutput/' + schemaName + '.json');
      schemaResult[schemaName] = await translateSchema(files.impExcelPath, files.agdExcelPath);
    } catch (e) {
      console.log('Skipping ' + schemaName + ' - no file');
      continue;
    }
  }

  console.log('Writing output...');
  const outDir = process.env.GENSHIN_DATA_ROOT;
  fs.writeFileSync(outDir + '/SchemaTranslation.json', JSON.stringify(schemaResult, null, 2));
  console.log(chalk.blue('Done. Output written to: ' + outDir + '/SchemaTranslation.json'));
}

async function translateExcel(outputDirectory: string) {
  const excelDirPath = getGenshinDataFilePath('./ExcelBinOutput');

  fs.mkdirSync(outputDirectory, { recursive: true });

  const schemaTranslationFilePath = getGenshinDataFilePath('./SchemaTranslation.json');
  const schemaTranslation: {[tableName: string]: {[key: string]: string}} =
    fs.existsSync(schemaTranslationFilePath)
      ? JSON.parse(fs.readFileSync(schemaTranslationFilePath, { encoding: 'utf8' }))
      : {};

  const jsonsInDir = fs.readdirSync(excelDirPath).filter(file => path.extname(file) === '.json');
  for (let jsonFile of jsonsInDir) {
    const schemaName = path.basename(jsonFile).split('.')[0];
    console.log('Processing ' + schemaName + ' has translation? ' + (schemaTranslation[schemaName] ? 'yes' : 'no'));

    const absJsonPath = getGenshinDataFilePath('./ExcelBinOutput/' + jsonFile);
    const json = await fsp.readFile(absJsonPath, {encoding: 'utf8'}).then(data => JSON.parse(data));

    const normJson = normalizeRawJson(json, genshinSchema[schemaName], schemaTranslation[schemaName]);
    fs.writeFileSync(path.resolve(outputDirectory, './' + schemaName + '.json'), JSON.stringify(normJson, null, 2));
  }

  console.log('Done');
}

function *walkSync(dir): Generator<string> {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name);
    }
  }
}

async function importMakeExcels() {
  const binOutputPath = getGenshinDataFilePath('./BinOutput');
  const excelDirPath = getGenshinDataFilePath('./ExcelBinOutput');

  const binOutputQuestPath = path.resolve(binOutputPath, './Quest');
  const binOutputTalkPath = path.resolve(binOutputPath, './Talk');

  const mainQuestExcelArray = [];
  const questExcelArray = [];
  const talkExcelArray = [];
  const dialogExcelArray = [];
  const dialogUnparentedExcelArray = [];

  const mainQuestById: {[id: string]: any} = {};
  const questExcelById: {[id: string]: any} = {};
  const talkExcelById: {[id: string]: any} = {};
  const dialogExcelById: {[id: string]: any} = {};

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
    let json = await fsp.readFile(fileName, {encoding: 'utf8'}).then(data => JSON.parse(data));
    processJsonObject(json);
    enqueueMainQuestExcel(json);
  }
  for (let fileName of walkSync(binOutputTalkPath)) {
    if (!fileName.endsWith('.json')) {
      continue;
    }
    let json = await fsp.readFile(fileName, {encoding: 'utf8'}).then(data => JSON.parse(data));
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

  let verifyMainQuestIds: number[] = await fsp.readFile(path.resolve(excelDirPath, './MainQuestExcelConfigData.json'), {encoding: 'utf8'})
    .then(data => JSON.parse(data)).then(arr => arr.map(x => x.id || x.Id));

  let verifyQuestIds: number[] = await fsp.readFile(path.resolve(excelDirPath, './QuestExcelConfigData.json'), {encoding: 'utf8'})
    .then(data => JSON.parse(data)).then(arr => arr.map(x => x.subId || x.SubId));

  let verifyTalkIds: number[] = await fsp.readFile(path.resolve(excelDirPath, './TalkExcelConfigData.json'), {encoding: 'utf8'})
    .then(data => JSON.parse(data)).then(arr => arr.map(x => x.id || x.Id));

  let verifyDialogIds: number[] = await fsp.readFile(path.resolve(excelDirPath, './DialogExcelConfigData.json'), {encoding: 'utf8'})
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

async function maximizeImages() {
  let dupeSet: string[] = [];
  let dupeKey: string = null;
  let affected: number = 0;

  async function processDupeSet() {
    let sizes: {[fileName: string]: number} = {};

    await Promise.all(dupeSet.map(f => {
      const absPath = path.join(IMAGEDIR_GENSHIN, f);
      return fsp.stat(absPath).then(stats => {
        sizes[absPath] = stats.size;
      });
    }));

    let largestFile: string = Object.keys(sizes).find(f => !f.includes('#')); // prefer non-hashtag file first
    let currLargestSize: number = 0;

    for (let [absPath, byteSize] of Object.entries(sizes)) {
      if (byteSize > currLargestSize) {
        largestFile = absPath;
        currLargestSize = byteSize;
      }
    }

    for (let absPath of Object.keys(sizes)) {
      if (absPath !== largestFile) {
        fs.unlinkSync(absPath);
      }
    }

    if (largestFile.includes('#')) {
      let actualFile = largestFile.replace(/#\d+\.png$/, '.png');
      fs.renameSync(largestFile, actualFile);
    }

    affected++;
  }

  for (let fileName of fs.readdirSync(IMAGEDIR_GENSHIN)) {

    let imageName: string;

    if (fileName.includes('#')) {
      imageName = fileName.split('#')[0];
    } else {
      imageName = fileName.split('.')[0];
    }

    if (dupeKey !== imageName) {
      dupeKey = imageName;
      if (dupeSet.length > 1) {
        await processDupeSet();
      }
      dupeSet = [];
    }

    dupeSet.push(fileName);
  }

  console.log('Done. Affected ' + affected + ' entries.');
}

async function importIndex() {
  if (!fs.existsSync(getGenshinDataFilePath('./TextMap/Index/'))) {
    fs.mkdirSync(getGenshinDataFilePath('./TextMap/Index/'));
  }

  const ctrl = getGenshinControl();

  const writeOutput = (file: string, data: any) => {
    fs.writeFileSync(getGenshinDataFilePath(`./TextMap/Index/TextIndex_${file}.json`), JSON.stringify(data, null, 2), 'utf8');
    console.log(chalk.blue(' (done)'));
  };

  {
    process.stdout.write(chalk.bold('Generating readable index...'));
    const archive = await ctrl.selectReadableArchiveView();
    const readableList: ReadableView[] = [
      ...archive.Artifacts,
      ...archive.Weapons,
      ...archive.Materials,
      ...Object.values(archive.BookCollections).flatMap(bookSuit => bookSuit.Books),
    ];
    const readableIndex: { [viewId: number]: number } = {};

    for (let view of readableList) {
      readableIndex[view.TitleTextMapHash] = view.Id;
    }
    writeOutput('Readable', readableIndex);
  }
  {
    process.stdout.write(chalk.bold('Generating material index...'));
    const materialList = await ctrl.selectAllMaterialExcelConfigData({ LoadRelations: false, LoadSourceData: false });
    const materialIndex: { [id: number]: number } = {};

    for (let material of materialList) {
      materialIndex[material.NameTextMapHash] = material.Id;
      materialIndex[material.DescTextMapHash] = material.Id;
    }
    writeOutput('Material', materialIndex);
  }
  {
    process.stdout.write(chalk.bold('Generating furniture index...'));
    const furnitureList = await ctrl.selectAllFurniture();
    const furnitureIndex: { [id: number]: number } = {};

    for (let furniture of furnitureList) {
      furnitureIndex[furniture.NameTextMapHash] = furniture.Id;
      furnitureIndex[furniture.DescTextMapHash] = furniture.Id;
    }
    writeOutput('Furniture', furnitureIndex);
  }
  {
    process.stdout.write(chalk.bold('Generating furniture index...'));
    const furnitureSuiteList = await ctrl.selectAllFurnitureSuite();
    const furnitureSuiteIndex: { [id: number]: number } = {};

    for (let furniture of furnitureSuiteList) {
      furnitureSuiteIndex[furniture.SuiteNameTextMapHash] = furniture.SuiteId;
      furnitureSuiteIndex[furniture.SuiteDescTextMapHash] = furniture.SuiteId;
    }
    writeOutput('FurnitureSuite', furnitureSuiteIndex);
  }
  {
    process.stdout.write(chalk.bold('Generating weapon index...'));
    const weaponList = await ctrl.selectAllWeapons();
    const weaponIndex: { [id: number]: number } = {};

    for (let weapon of weaponList) {
      weaponIndex[weapon.NameTextMapHash] = weapon.Id;
      weaponIndex[weapon.DescTextMapHash] = weapon.Id;
    }
    writeOutput('Weapon', weaponIndex);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const optionDefinitions: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
      {name: 'normalize', type: Boolean, description: 'Normalizes the JSON files.'},
      {name: 'plaintext', type: Boolean, description: 'Creates the PlainTextMap files.'},
      {name: 'index', type: Boolean, description: 'Creates the index files for PlainTextMap.'},
      {name: 'voice', type: Boolean, description: 'Creates the normalized voice items file.'},
      {name: 'gcg-skill', type: Boolean, description: 'Creates file for GCG skill data'},
      {name: 'fetters', type: Boolean, description: 'Creates file for character fetters data'},
      {name: 'make-excels', type: Boolean, description: 'Creates some of the excels that are no longer updated by the game client'},
      {name: 'translate-schema', type: Boolean, description: 'Creates the SchemaTranslation file.'},
      {name: 'translate-excel', type: String, description: 'Translate excel to output directory. Requires translate-schema to be completed first.'},
      {name: 'maximize-images', type: Boolean, description: 'Compares images with duplicate names to choose the image with the largest size.'},
      {name: 'help', type: Boolean, description: 'Display this usage guide.'},
    ];

    const options = commandLineArgs(optionDefinitions);

    if (!Object.keys(options).length) {
      console.warn(chalk.yellow('\nNot enough arguments.'));
      options.help = true;
    }

    if (Object.keys(options).length > 1) {
      console.warn(chalk.red('\nAll arguments are mutually exclusive.'));
      options.help = true;
    }

    if (options.help) {
      const usage = commandLineUsage([
        {
          header: 'Genshin Data Files Importer',
          content: 'Imports Genshin Data json into other supporting files.'
        },
        {
          header: 'Options',
          optionList: optionDefinitions
        }
      ])
      console.log(usage);
      return;
    }

    if (options.normalize) {
      await importNormalize(getGenshinDataFilePath('./ExcelBinOutput'), ['ProudSkillExcelConfigData.json']);
    }
    if (options.plaintext) {
      const ctrl = getGenshinControl();
      await importPlainTextMap(ctrl, getGenshinDataFilePath, loadGenshinTextSupportingData);
    }
    if (options.index) {
      await importIndex();
    }
    if (options.voice) {
      await importVoice();
    }
    if (options['gcg-skill']) {
      await importGcgSkill();
    }
    if (options.fetters) {
      await importFetters();
    }
    if (options['translate-schema']) {
      await importTranslateSchema();
    }
    if (options['translate-excel']) {
      await translateExcel(options['translate-excel']);
    }
    if (options['maximize-images']) {
      await maximizeImages();
    }
    if (options['make-excels']) {
      await importMakeExcels();
    }

    await closeKnex();
  })();
}