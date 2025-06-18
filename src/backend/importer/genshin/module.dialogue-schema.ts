import path from 'path';
import { getGenshinDataFilePath } from '../../loadenv.ts';
import fs, { promises as fsp } from 'fs';
import { createPropertySchemaWithArray, PropertySchemaResult } from '../schema/translate_schema.ts';
import JSONBigImport, { JSONBigInt } from '../../util/json-bigint';
import { defaultMap } from '../../../shared/util/genericUtil.ts';
import { INTERACTION_KEEP_TYPES } from '../../../shared/types/genshin/interaction-types.ts';
import { sort } from '../../../shared/util/arrayUtil.ts';

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

type Combiner = (acc: any[], json: any, fileName?: string) => void;

async function walkSyncJsonCombine(dir: string, combiner: Combiner, maxCombines: number = 0, mustIncludeFiles: string[] = []): Promise<any[]> {
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
// endregion

function getSchemaFilePath(filePath: string): string {
  return path.resolve(process.env.GENSHIN_ARCHIVES, `./5.4/`, filePath);
}

export async function mapBinOutputQuest() {
  // await mapVoiceOvers();
  // await mapQuest();
  // await mapTalk();
  await mapInterAction();
}

async function mapVoiceOvers() {
  const voiceItemsCombiner: Combiner = (acc, json) => {
    acc.push(... Object.values(json));
  };

  const schemaVoiceItems: any[] = await walkSyncJsonCombine(getSchemaFilePath('./BinOutput/Voice/Items'),
    voiceItemsCombiner, 60, ['04443dd6.json']);
  const rawVoiceItems: any[] = await walkSyncJsonCombine(getGenshinDataFilePath('./BinOutput.Quest/Voice/Items'),
    voiceItemsCombiner, 60, ['04443dd6.json']);

  const propertySchema: PropertySchemaResult = await createPropertySchemaWithArray(
    null,
    null,
    schemaVoiceItems,
    rawVoiceItems
  );

  console.log(propertySchema);
}

async function mapQuest() {
  const questCombiner: Combiner = (acc, json) => {
    acc.push(json);
  };

  const schemaRows: any[] = await walkSyncJsonCombine(getSchemaFilePath('./BinOutput/Quest'),
    questCombiner, 100, []);
  const rawRows: any[] = await walkSyncJsonCombine(getGenshinDataFilePath('./BinOutput.Quest/Quest'),
    questCombiner, 100, []);

  const propertySchema: PropertySchemaResult = await createPropertySchemaWithArray(
    null,
    null,
    schemaRows,
    rawRows
  );

  console.log(propertySchema.map);
}

async function mapTalk() {
  const talkCombiner: Combiner = (acc, json, file) => {
    if (json.initDialog || Array.isArray(json) || json.talks) {
      return;
    }
    delete json.LOEAGAAPPKO;

    let rows: any[] = [];

    const theArrayKey: string = Object.entries(json).filter(([k, v]) => Array.isArray(v))?.[0]?.[0];

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

  const SUB_FOLDERS = ['Activity', 'Blossom', 'Coop', 'Cutscene', 'FreeGroup', 'Gadget', 'Npc', 'NpcOther', 'Quest'];
  for (let SUB_FOLDER of SUB_FOLDERS) {
    const schemaRows: any[] = await walkSyncJsonCombine(getSchemaFilePath('./BinOutput/Talk/' + SUB_FOLDER),
      talkCombiner, 60, []);
    const rawRows: any[] = await walkSyncJsonCombine(getGenshinDataFilePath('./BinOutput.Quest/Talk/' + SUB_FOLDER),
      talkCombiner, 60, []);

    const propertySchema: PropertySchemaResult = await createPropertySchemaWithArray(
      null,
      null,
      schemaRows,
      rawRows
    );

    console.log(SUB_FOLDER, propertySchema.map);
  }
}

async function mapInterAction() {
  const propMapping: Record<string, string> = {};

  const findInterAction = (debugLabel: string, groups: any[], expectedValues: any[]): { action: any, valuesFound: Record<string, string> } => {
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
    throw new Error('Not found! ' + debugLabel);
  };

  const findKeyWithValueMatching = (debugLabel: string, obj: any, matcher: (v: any) => boolean) => {
    for (let [key, value] of Object.entries(obj)) {
      if (matcher(value)) {
        return key;
      }
    }
    throw new Error('Not found! ' + debugLabel);
  };

  const aqSchema: any = await fsp.readFile(getSchemaFilePath('./BinOutput/InterAction/QuestDialogue/AQ/Fontaine_4019/Q401906.json'), { encoding: 'utf8' })
    .then(data => JSONbig.parse(data));
  const aqRaw: any = await fsp.readFile(getGenshinDataFilePath('./BinOutput.Quest/InterAction/QuestDialogue/AQ/Fontaine_4019/Q401906.json'), { encoding: 'utf8' })
    .then(data => JSONbig.parse(data));

  const lqSchema: any = await fsp.readFile(getSchemaFilePath('./BinOutput/InterAction/QuestDialogue/LQ/Emilie_14039/Q1403908.json'), { encoding: 'utf8' })
    .then(data => JSONbig.parse(data));
  const lqRaw: any = await fsp.readFile(getGenshinDataFilePath('./BinOutput.Quest/InterAction/QuestDialogue/LQ/Emilie_14039/Q1403908.json'), { encoding: 'utf8' })
    .then(data => JSONbig.parse(data));

  const groupIdKey = findKeyWithValueMatching('Find groupId', aqRaw,
      v => Array.isArray(v) && bigStringify(v).includes('grpId') && bigStringify(v).includes('index') && bigStringify(v).includes('nextGrpId'));

  const groupKey = findKeyWithValueMatching('Find group', aqRaw,
    v => Array.isArray(v) && bigStringify(v).includes(`"DIALOG"`) && bigStringify(v).includes(`"DIALOG_SELECT"`));

  const aqGroups: any[] = aqRaw[groupKey];

  const dialogAction = findInterAction('Find DIALOG', aqGroups, ['DIALOG', 40190601]);
  const dialogSelectAction = findInterAction('Find DIALOG', aqGroups, [
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

  console.log({
    groupIdKey,
    groupKey,
    dialogAction,
    dialogSelectAction
  });
}

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
