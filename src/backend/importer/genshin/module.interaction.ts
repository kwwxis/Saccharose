import '../../loadenv';
import path from 'path';
import fs, { promises as fsp } from 'fs';
import { pathToFileURL } from 'url';
import { getGenshinDataFilePath } from '../../loadenv';
import { normalizeRawJson, SchemaTable } from '../import_db';
import {
  InterAction,
  INTERACTION_KEEP_TYPES,
  InterActionGroup,
  InterActionSchema,
} from '../../../shared/types/genshin/interaction-types';

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

// region Types
// --------------------------------------------------------------------------------------------------------------

// endregion

// region Main Function
// --------------------------------------------------------------------------------------------------------------
const allTypes: Set<string> = new Set();
const d2f: {[id: number]: string} = {};

export async function loadInterActionQD(repoRoot: string) {
  const binOutputPath: string = path.resolve(repoRoot, './BinOutput');
  const excelDirPath: string = path.resolve(repoRoot, './ExcelBinOutput');

  if (!fs.existsSync(binOutputPath)) throw new Error('BinOutput path does not exist!');
  if (!fs.existsSync(excelDirPath)) throw new Error('ExcelBinOutput path does not exist!');

  const binOutputIAQD: string = path.resolve(binOutputPath, './InterAction/QuestDialogue');

  if (!fs.existsSync(binOutputIAQD)) throw new Error('BinOutput/InterAction/QuestDialogue path does not exist!');

  const outDir = path.resolve(repoRoot, './InterAction');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir);

  for (let fileName of walkSync(binOutputIAQD)) {
    if (!fileName.endsWith('.json')) {
      continue;
    }

    const json = await fsp.readFile(fileName, { encoding: 'utf8' }).then(data => JSON.parse(data));

    let basename = path.basename(fileName);
    let outFile = path.resolve(outDir, basename);
    let dupe = 2;
    while (fs.existsSync(outFile)) {
      basename = basename.replace('.json', `_${dupe++}.json`);
      outFile = path.resolve(outDir, basename);
    }

    const groups = processJsonObject(basename, json);
    if (!groups) {
      continue;
    }

    fs.writeFileSync(outFile, JSON.stringify(groups, null, 2));
  }

  fs.writeFileSync(path.resolve(repoRoot, './InterActionD2F.json'), JSON.stringify(d2f, null, 2));
  console.log('Done');
}


function processInterAction(fileName: string, a: any): InterAction {
  let action: InterAction = normalizeRawJson(a, InterActionSchema);
  allTypes.add(action.Type);
  if (action.Type === 'DIALOG') {
    if (typeof action.DialogId === 'number') {
      d2f[action.DialogId] = fileName;
    } else {
      return null;
    }
  } else if (action.Type === 'DIALOG_SELECT') {
    if (Array.isArray(action.DialogOptions)) {
      for (let dialogOption of action.DialogOptions) {
        d2f[dialogOption] = fileName;
      }
    } else {
      return null;
    }
  }
  return action;
}

function processJsonObject(fileName: string, json: any): InterActionGroup[] {
  if (!json || !Array.isArray(json.group) || !Array.isArray(json.groupId)) {
    return;
  }

  let groups: InterActionGroup[] = [];

  for (let i = 0; i < json.group.length; i++) {
    let _actions: any[] = json.group[i];
    let actions: InterAction[] = [];
    for (let _action of _actions) {
      let action = processInterAction(fileName, _action);
      if (!action) {
        continue;
      }
      if (!INTERACTION_KEEP_TYPES.has(action.Type)) {
        continue;
      }
      actions.push(action);
    }

    let groupId: any = json.groupId[i];
    let group: InterActionGroup = {
      Index: groupId.index || 0,
      GroupId: groupId.grpId,
      NextGroupId: groupId.nextGrpId,
      Actions: actions,
    }
    groups.push(group);
  }

  return groups;
}

// region CLI
// --------------------------------------------------------------------------------------------------------------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadInterActionQD(getGenshinDataFilePath());
}