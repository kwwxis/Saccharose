import path from 'path';
import { getGenshinDataFilePath } from '../../loadenv.ts';
import fs, { promises as fsp } from 'fs';
import { createPropertySchemaWithArray, PropertySchemaResult, shouldIgnoreConfig } from '../schema/translate_schema.ts';
import JSONBigImport, { JSONBigInt } from '../../util/json-bigint';
import { defaultMap } from '../../../shared/util/genericUtil.ts';
import { INTERACTION_KEEP_TYPES } from '../../../shared/types/genshin/interaction-types.ts';
import { sort } from '../../../shared/util/arrayUtil.ts';
import { fsRead, fsReadJson, fsWrite } from '../../util/fsutil.ts';
import { renameFields } from '../import_db.ts';
import { isInt } from '../../../shared/util/numberUtil.ts';

const JSONbig: JSONBigInt = JSONBigImport({ useNativeBigInt: true, objectProto: true });

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

async function walkSyncWrite(inDir: string, outDir: string, mapping: Record<string, string>) {
  console.log('Writing to ' + outDir);

  inDir = getGenshinDataFilePath(inDir);
  outDir = getGenshinDataFilePath(outDir);

  await fsp.rm(outDir, { recursive: true, force: true });

  const inPaths: string[] = [];
  for (let inPath of walkSync(inDir)) {
    inPaths.push(inPath);
  }

  let lastLogTimeMs: number = Date.now();
  console.log('  0%');

  let numComplete = 0;
  for (let inPath of inPaths) {
    let relPath = path.relative(inDir, inPath);
    let outPath = path.resolve(outDir, relPath);

    let jsonAsString: string = await fsRead(inPath);

    let json: any;
    try {
      json = JSON.parse(jsonAsString);
    } catch (e) {
      console.error('Error parsing JSON for ' + inPath);
      throw e;
    }
    json = renameFields(json, mapping);

    await fsp.mkdir(path.dirname(outPath), { recursive: true });
    await fsWrite(outPath, JSON.stringify(json, null, 2));
    numComplete++;

    let currTimeMs: number = Date.now();
    if ((currTimeMs - lastLogTimeMs) >= 2000) {
      lastLogTimeMs = currTimeMs;
      console.log(`  ${(numComplete / inPaths.length) * 100 | 0}%`);
    }
  }

  console.log('  100%');
}

type Combiner = (acc: any[], json: any, fileName?: string) => void;

async function walkSyncJsonCombine(dir: string, combiner: Combiner, maxCombines: number = 0, mustIncludeFiles: string[] = [], onlyIntFiles: boolean = false): Promise<any[]> {
  let acc: any[] = [];
  let combines: number = 0;

  let mustIncludesFound: Set<string> = new Set();

  for (let file of walkSync(dir)) {
    if (file.includes('BlossomGroup')) {
      continue;
    }
    if (!file.endsWith('.json')) {
      continue;
    }
    const baseName = path.basename(file);
    const baseNameNoExt = baseName.slice(0, -5);
    if (onlyIntFiles && !isInt(baseNameNoExt)) {
      continue;
    }

    if (maxCombines && maxCombines > 0 && combines > maxCombines && mustIncludesFound.size === mustIncludeFiles.length) {
      break;
    }

    if (!maxCombines || maxCombines <= 0 || combines <= maxCombines) {
      let json = await fsp.readFile(file, { encoding: 'utf8' }).then(data => JSONbig.parse(data));
      combiner(acc, json, file);
      combines++;
    }

    if (mustIncludesFound.size !== mustIncludeFiles.length && mustIncludeFiles.includes(baseName) && !mustIncludesFound.has(baseName)) {
      mustIncludesFound.add(baseName);

      let json = await fsp.readFile(file, { encoding: 'utf8' }).then(data => JSONbig.parse(data));
      combiner(acc, json, file);
      combines++;
    }
  }

  if (mustIncludesFound.size !== mustIncludeFiles.length) {
    throw new Error('Failed to find one or more must include files');
  }

  return acc;
}

const findKeyWithValue = (o: any, searchV: any, searchDepth: number, currentDepth: number = 0, isRoot: boolean = true): string => {
  if (Array.isArray(o)) {
    for (let oe of o) {
      const ret = findKeyWithValue(oe, searchV, searchDepth, currentDepth, false);
      if (ret) {
        return ret;
      }
    }
  } else if (!!o && typeof o === 'object') {
    for (let [k, v] of Object.entries(o)) {
      if (searchDepth === currentDepth) {
        if (typeof searchV === 'function') {
          if (searchV(v, k)) {
            return k;
          }
        } else if (String(v) === String(searchV)) {
          return k;
        }
      }
      if (!!v && (typeof v === 'object' || Array.isArray(v))) {
        const ret = findKeyWithValue(v, searchV, searchDepth, currentDepth+1, false);
        if (ret) {
          return ret;
        }
      }
    }
  }
  if (isRoot) {
    throw new Error('Not found! Searching for value ' + searchV);
  } else {
    return null;
  }
}
// endregion

function getSchemaFilePath(filePath: string): string {
  return path.resolve(ENV.GENSHIN_ARCHIVES, `./5.4/`, filePath);
}

export async function writeDeobfBin() {
  shouldIgnoreConfig.shouldIgnoreEmptyString = true;

  let anyInvalidJson = false;
  for (let file of walkSync(getGenshinDataFilePath('./BinOutput.Obf/InterAction/QuestDialogue'))) {
    try {
      JSON.parse(await fsRead(file));
    } catch (err) {
      console.log('Invalid JSON:', file, err);
      anyInvalidJson = true;
    }
  }
  if (anyInvalidJson) {
    return;
  }

  console.log('----- CodexQuest Mapping -----');
  const cqMapping = await mapCodexQuest();

  console.log('----- GCG Mapping -----');
  const gcgDvsMapping = await mapGcgDeclaredValueSet();

  console.log('----- HomeworldFurnitureSuit Mapping -----');
  const furnSuitMapping = await mapFurnSuit();

  console.log('----- InterAction Mapping -----');
  const iaMapping = await mapInterAction();

  console.log('----- Quest Mapping -----');
  const questMapping = await mapQuest();

  console.log('----- Talk Mapping -----');
  const talkMapping = await mapTalk();

  console.log('----- Voice Mapping -----');
  const voiceMapping = await mapVoiceOvers();

  console.log();
  console.log();

  console.log('----- Writing Outputs -----');
  await walkSyncWrite('./BinOutput.Obf/CodexQuest', './BinOutput/CodexQuest', cqMapping);
  await walkSyncWrite('./BinOutput.Obf/GCG/Gcg_DeclaredValueSet', './BinOutput/GCG/Gcg_DeclaredValueSet', gcgDvsMapping);
  await walkSyncWrite('./BinOutput.Obf/HomeworldFurnitureSuit', './BinOutput/HomeworldFurnitureSuit', furnSuitMapping);
  await walkSyncWrite('./BinOutput.Obf/InterAction/QuestDialogue', './BinOutput/InterAction/QuestDialogue', iaMapping);
  await walkSyncWrite('./BinOutput.Obf/Quest', './BinOutput/Quest', questMapping);
  await walkSyncWrite('./BinOutput.Obf/Talk', './BinOutput/Talk', talkMapping);
  await walkSyncWrite('./BinOutput.Obf/Voice', './BinOutput/Voice', voiceMapping);
}

// region Mappers
// --------------------------------------------------------------------------------------------------------------
async function mapCodexQuest(): Promise<Record<string, string>> {
  let rawRecord: any = await fsReadJson(getGenshinDataFilePath('./BinOutput.Obf/CodexQuest/10122.json'));
  const propertySchema: Record<string, string> = {};

  propertySchema[findKeyWithValue(rawRecord, 10122, 0)] = 'mainQuestId';
  propertySchema[findKeyWithValue(rawRecord, 'LQ', 0)] = 'questType';
  propertySchema[findKeyWithValue(rawRecord, v => JSON.stringify(v).includes(`"MainQuestTitle"`), 0)] = 'mainQuestTitle';
  propertySchema[findKeyWithValue(rawRecord, v => JSON.stringify(v).includes(`"MainQuestDesp"`), 0)] = 'mainQuestDesp';
  propertySchema[findKeyWithValue(rawRecord, v => JSON.stringify(v).includes(`"ChapterTitle"`), 0)] = 'chapterTitle';
  propertySchema[findKeyWithValue(rawRecord, v => JSON.stringify(v).includes(`"ChapterNum"`), 0)] = 'chapterNum';

  propertySchema[findKeyWithValue(rawRecord, 'MainQuestDesp', 1)] = 'textType';
  propertySchema[findKeyWithValue(rawRecord, 382984446, 1)] = 'textId';
  propertySchema[findKeyWithValue(rawRecord, v => Array.isArray(v), 0)] = 'subQuests';

  rawRecord = renameFields(rawRecord, propertySchema);

  let rawSubquests = rawRecord.subQuests;
  let rawSubquest0 = rawSubquests[0];

  propertySchema[findKeyWithValue(rawSubquest0, v => JSON.stringify(v).includes(`"SubQuestTitle"`), 0)] = 'subQuestTitle';
  propertySchema[findKeyWithValue(rawSubquest0, v => Array.isArray(v), 0)] = 'items';

  rawSubquest0 = renameFields(rawSubquest0, propertySchema);

  let rawItem0 = rawSubquest0.items[0];

  propertySchema[findKeyWithValue(rawItem0, 2, 0)] = 'itemId';
  propertySchema[findKeyWithValue(rawItem0, 3, 0)] = 'nextItemId';
  propertySchema[findKeyWithValue(rawItem0, 'SingleDialog', 0)] = 'itemType';
  propertySchema[findKeyWithValue(rawItem0, v => JSON.stringify(v).includes(`"SpeakerKnown"`), 0)] = 'speakerText'
  propertySchema[findKeyWithValue(rawItem0, v => Array.isArray(v) && JSON.stringify(v).includes(`"Dialog"`), 0)] = 'dialogs';

  rawItem0 = renameFields(rawItem0, propertySchema);

  let rawDialog0 = rawItem0.dialogs[0];

  propertySchema[findKeyWithValue(rawDialog0, v => JSON.stringify(v).includes(`"DialogNormal"`), 0)] = 'text';
  propertySchema[findKeyWithValue(rawDialog0, 101220101, 0)] = 'soundId';
  propertySchema[findKeyWithValue(rawDialog0, 'Dialog', 0)] = 'dialogType';

  rawRecord = await fsReadJson(getGenshinDataFilePath('./BinOutput.Obf/CodexQuest/11027.json'));
  rawRecord = renameFields(rawRecord, propertySchema);

  rawItem0 = rawRecord.subQuests.find(f => JSON.stringify(f).includes(`itemId":222`)).items.find(i => i.itemId === 222);

  propertySchema[findKeyWithValue(rawItem0, v => Array.isArray(v) && v.length === 1 && v[0] === 223, 0)] = 'nextItemIdList';
  propertySchema[findKeyWithValue(rawItem0, v => JSON.stringify(v).includes(`"TalkFinished"`), 0)] = 'showCondition';
  propertySchema[findKeyWithValue(rawItem0, 'TalkFinished', 1)] = 'type';
  propertySchema[findKeyWithValue(rawItem0, 1102716, 1)] = 'param1';

  rawRecord = await fsReadJson(getGenshinDataFilePath('./BinOutput.Obf/CodexQuest/8021.json'));
  rawRecord = renameFields(rawRecord, propertySchema);

  rawItem0 = rawRecord.subQuests.find(f => JSON.stringify(f).includes(`itemId":232`)).items.find(i => i.itemId === 232);

  propertySchema[findKeyWithValue(rawItem0, (v,k) => JSON.stringify(v).includes(`SpeakerKnown`) && k !== 'speakerText', 0)] = 'speakerText2'
  propertySchema[findKeyWithValue(rawItem0, (v,k) => Array.isArray(v) && JSON.stringify(v).includes(`"Dialog"`) && k !== 'dialogs', 0)] = 'dialogs2';

  rawItem0 = rawRecord.subQuests.find(f => JSON.stringify(f).includes(`itemId":274`)).items.find(i => i.itemId === 274);

  propertySchema[findKeyWithValue(rawItem0, (v) => Array.isArray(v) && JSON.stringify(v).includes('Narratage'), 0)] = 'texts'

  console.log(propertySchema);
  return propertySchema;
}

async function mapGcgDeclaredValueSet(): Promise<Record<string, string>> {
  const rawRecord = await fsReadJson(getGenshinDataFilePath('./BinOutput.Obf/GCG/Gcg_DeclaredValueSet/Char_Skill_11061.json'));
  const propertySchema: Record<string, string> = {};

  propertySchema[findKeyWithValue(rawRecord, 'Char_Skill_11061', 0)] = 'name';
  propertySchema[findKeyWithValue(rawRecord, 'EffectNum', 2)] = 'type';
  propertySchema[findKeyWithValue(rawRecord, 2, 2)] = 'value';
  propertySchema[findKeyWithValue(rawRecord, 'GCG_ELEMENT_PHYSIC', 2)] = 'element';
  propertySchema[findKeyWithValue(rawRecord, v => typeof v === 'object', 0)] = 'declaredValueMap';

  console.log(propertySchema);
  return propertySchema;
}

async function mapFurnSuit(): Promise<Record<string, string>> {
  const rawRecord = await fsReadJson(getGenshinDataFilePath('./BinOutput.Obf/HomeworldFurnitureSuit/Home_Suite_Exterior_Xm_Street_Fish.json'));
  const propertySchema: Record<string, string> = {};

  propertySchema[findKeyWithValue(rawRecord, 24, 0)] = 'radius';
  propertySchema[findKeyWithValue(rawRecord, 14, 0)] = 'height';
  propertySchema[findKeyWithValue(rawRecord, v => Array.isArray(v) && JSON.stringify(v).includes('370317'), 0)] = 'furnitureUnits';
  propertySchema[findKeyWithValue(rawRecord, v => Array.isArray(v) && !JSON.stringify(v).includes('370317'), 0)] = 'npcSpawnPoints';

  propertySchema[findKeyWithValue(rawRecord, 370317, 1)] = 'furnitureID';

  propertySchema[findKeyWithValue(rawRecord, v =>
    String(v['_x']).includes('12.51') && String(v['_y']).includes('0.01') && String(v['_z']).includes('-12.96'), 1)] = 'eulerAngles';

  propertySchema[findKeyWithValue(rawRecord, v =>
    String(v['_x']).includes('0') && String(v['_y']).includes('54.31') && String(v['_z']).includes('0'), 1)] = 'rotation';

  console.log(propertySchema);

  return propertySchema;
}

async function mapInterAction(): Promise<Record<string, string>> {
  const propertySchema: Record<string, string> = {};

  const findInterAction = (groups: any[], expectedValues: any[]): { action: any, valuesFound: Record<string, string> } => {
    for (let group of groups) {
      for (let action of group) {
        let valuesFound: Record<string, string> = {};
        for (let [key, value] of Object.entries(action)) {
          if (expectedValues.some(ev => String(ev) === String(value))) {
            valuesFound[String(value)] = key;
          }
        }
        if (Object.keys(valuesFound).length === expectedValues.length) {
          return { action, valuesFound };
        }
      }
    }
    throw new Error('Not found! Looking for inter action expecting values: ' + expectedValues);
  };

  const aqSchema: any = await fsp.readFile(getSchemaFilePath('./BinOutput/InterAction/QuestDialogue/AQ/Fontaine_4019/Q401906.json'), { encoding: 'utf8' })
    .then(data => JSONbig.parse(data));
  const aqRaw: any = await fsp.readFile(getGenshinDataFilePath('./BinOutput.Obf/InterAction/QuestDialogue/AQ/Fontaine_4019/Q401906.json'), { encoding: 'utf8' })
    .then(data => JSONbig.parse(data));

  const lqSchema: any = await fsp.readFile(getSchemaFilePath('./BinOutput/InterAction/QuestDialogue/LQ/Emilie_14039/Q1403908.json'), { encoding: 'utf8' })
    .then(data => JSONbig.parse(data));
  const lqRaw: any = await fsp.readFile(getGenshinDataFilePath('./BinOutput.Obf/InterAction/QuestDialogue/LQ/Emilie_14039/Q1403908.json'), { encoding: 'utf8' })
    .then(data => JSONbig.parse(data));

  const groupIdKey = findKeyWithValue(aqRaw,
      v => Array.isArray(v) && bigStringify(v).includes('grpId') && bigStringify(v).includes('index') && bigStringify(v).includes('nextGrpId'), 0);

  const groupKey = findKeyWithValue(aqRaw,
    v => Array.isArray(v) && bigStringify(v).includes(`"DIALOG"`) && bigStringify(v).includes(`"DIALOG_SELECT"`), 0);

  propertySchema[groupIdKey] = 'groupId';
  propertySchema[groupKey] = 'group';

  const aqGroups: any[] = aqRaw[groupKey];

  // DIALOG
  const dAction = findInterAction(aqGroups, ['DIALOG', 40190601]);
  propertySchema[dAction.valuesFound['40190601']] = 'dialogID';


  // DIALOG_SELECT
  const dsAction = findInterAction(aqGroups, [
    'DIALOG_SELECT',
    [ // dialogIDList
      40190602,
      40190604
    ],
    [ // grpIDList
      1813244414,
      1813244415
    ]
  ]);
  propertySchema[dsAction.valuesFound['40190602,40190604']] = 'dialogIDList';
  propertySchema[dsAction.valuesFound['1813244414,1813244415']] = 'grpIDList';

  // DIALOG_CLEAR
  // const dcAction = findInterAction(aqGroups, ['DIALOG_CLEAR', 40190601]);

  // SIMPLE_BLACK_SCREEN
  // const sbsAction = findInterAction(aqGroups, ['SIMPLE_BLACK_SCREEN', 40190601]);

  // BLACK_SCREEN
  // const bsAction = findInterAction(aqGroups, ['BLACK_SCREEN', 40190601]);

  // CHANGE_TIME
  // const ctAction = findInterAction(aqGroups, ['CHANGE_TIME', 40190601]);

  // CUTSCENE (in AQ)
  const csAction = findInterAction(aqGroups, ['CUTSCENE']);
  propertySchema[findKeyWithValue(csAction.action, 40190601, 0)] = 'cutsceneIndex';
  propertySchema[findKeyWithValue(csAction.action, v => !!v && typeof v === 'object' && !Array.isArray(v), 0)] = 'cutsceneCfg';

  // SHOW_BG_PIC (in LQ)
  // const bgPicAction = findInterAction(lqGroups, ['SHOW_BG_PIC']);

  // UI_TRIGGER
  // const uiAction = findInterAction(aqGroups, ['UI_TRIGGER', 40190601]);

  console.log(propertySchema);

  return propertySchema;
}

async function mapQuest(): Promise<Record<string, string>> {
  const questCombiner: Combiner = (acc, json) => {
    acc.push(json);
  };

  const schemaRows: any[] = await walkSyncJsonCombine(getSchemaFilePath('./BinOutput/Quest'),
    questCombiner, 120, []);
  const rawRows: any[] = await walkSyncJsonCombine(getGenshinDataFilePath('./BinOutput.Obf/Quest'),
    questCombiner, 120, []);

  const propertySchema: PropertySchemaResult = await createPropertySchemaWithArray(
    null,
    null,
    schemaRows,
    rawRows
  );

  console.log(propertySchema.map);

  return propertySchema.map;
}

async function mapTalk(): Promise<Record<string, string>> {
  const talkCombiner: Combiner = (acc, json, _file) => {
    delete json.LOEAGAAPPKO; // from schema

    let rows: any[] = [];

    const theArrayKey: string = Object.entries(json).filter(([_k, v]) => Array.isArray(v))?.[0]?.[0];

    if (!theArrayKey) {
      rows.push(json);
    } else {
      const nonArrayEntries: any = {};
      for (let [key, value] of Object.entries(json)) {
        if (key !== theArrayKey) {
          nonArrayEntries[key] = value;
        }
      }

      for (let item of json[theArrayKey]) {
        const row = {
          ... nonArrayEntries,
          [theArrayKey]: 'THE_ARRAY_KEY',
          ... item
        };
        rows.push(row);
      }
    }

    acc.push(... rows);
  };

  const combinedSchema: Record<string, string> = {};

  const SUB_FOLDERS = [
    'Activity', 'ActivityGroup',
    'Blossom', 'Coop', 'Cutscene', 'FreeGroup',
    'Gadget', 'GadgetGroup',
    'Npc', 'NpcGroup', 'NpcOther',
    'Quest'
  ];

  for (let SUB_FOLDER of SUB_FOLDERS) {
    console.log('Processing Talk/' + SUB_FOLDER);
    const schemaRows: any[] = await walkSyncJsonCombine(getSchemaFilePath('./BinOutput/Talk/' + SUB_FOLDER),
      talkCombiner, 60, [], true);
    const rawRows: any[] = await walkSyncJsonCombine(getGenshinDataFilePath('./BinOutput.Obf/Talk/' + SUB_FOLDER),
      talkCombiner, 60, [], true);

    const propertySchema: PropertySchemaResult = await createPropertySchemaWithArray(
      null,
      null,
      schemaRows,
      rawRows
    );

    for (let [obfKey, realKey] of Object.entries(propertySchema.map)) {
      if (!combinedSchema[obfKey]) {
        combinedSchema[obfKey] = realKey;
      } else {
        const existingRealKey = combinedSchema[obfKey];
        if (existingRealKey !== realKey) {
          console.error('Conflict! ' + obfKey + ' -- ' + existingRealKey + ' vs ' + realKey);
        }
      }
    }
  }

  console.log(combinedSchema);

  return combinedSchema;
}

async function mapVoiceOvers(): Promise<Record<string, string>> {
  const voiceItemsCombiner: Combiner = (acc, json) => {
    acc.push(... Object.values(json));
  };

  const schemaVoiceItems: any[] = await walkSyncJsonCombine(getSchemaFilePath('./BinOutput/Voice/Items'),
    voiceItemsCombiner, 60, ['04443dd6.json']);
  const rawVoiceItems: any[] = await walkSyncJsonCombine(getGenshinDataFilePath('./BinOutput.Obf/Voice/Items'),
    voiceItemsCombiner, 60, ['1231137260.json']);

  const propertySchema: PropertySchemaResult = await createPropertySchemaWithArray(
    null,
    null,
    schemaVoiceItems,
    rawVoiceItems
  );

  console.log(propertySchema.map);

  return propertySchema.map;
}
// endregion

// region Other Utils
// --------------------------------------------------------------------------------------------------------------
function bigStringify(json: any) {
  return JSON.stringify(
    json,
    (_, v) => typeof v === 'bigint' ? v.toString() : v
  );
}

async function __utilFindInterActionsWithMostTypes() {
  const counts: Record<string, Set<string>> = defaultMap('Set');

  for (let file of walkSync(getSchemaFilePath('./BinOutput/InterAction/QuestDialogue'))) {
    if (!file.endsWith('.json')) {
      continue;
    }
    let json = await fsp.readFile(file, { encoding: 'utf8' }).then(data => JSONbig.parse(data));
    let jsonStr = bigStringify(json);

    for (let type of INTERACTION_KEEP_TYPES) {
      if (jsonStr.includes(`"${type}"`)) {
        counts[file].add(type);
      }
    }
  }

  const countPairs = Object.entries(counts)
    .map(([k, v]) => ({fileName: k, types: v, typeCount: v.size}));
  sort(countPairs, '-typeCount');
  console.log(countPairs.slice(0, 20))
}
// endregion
