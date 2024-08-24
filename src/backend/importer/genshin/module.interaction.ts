import '../../loadenv.ts';
import path from 'path';
import fs, { promises as fsp } from 'fs';
import { pathToFileURL } from 'url';
import { getGenshinDataFilePath } from '../../loadenv.ts';
import { normalizeRawJson } from '../import_db.ts';
import {
  InterAction,
  INTERACTION_KEEP_TYPES,
  InterActionD2F,
  InterActionGroup,
  InterActionSchema,
} from '../../../shared/types/genshin/interaction-types.ts';
import { reformatPrimitiveArrays } from '../util/import_file_util.ts';
import { isEquiv } from '../../../shared/util/arrayUtil.ts';
import { defaultMap } from '../../../shared/util/genericUtil.ts';

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

// region Main Function
// --------------------------------------------------------------------------------------------------------------
const allTypes: Set<string> = new Set();
const uiTriggerContextNames: Set<string> = new Set();
const d2f: InterActionD2F = defaultMap('Array');

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

  for (let filePath of walkSync(binOutputIAQD)) {
    if (!filePath.endsWith('.json')) {
      continue;
    }

    const json = await fsp.readFile(filePath, { encoding: 'utf8' }).then(data => JSON.parse(data));

    const relName = path.relative(binOutputIAQD, filePath).replace(/\\/g, '/').replace(/\//g, ';');
    let outFile = path.resolve(outDir, relName);

    const groups = gatherGroups(relName, json);
    if (!groups) {
      continue;
    }

    fs.writeFileSync(outFile, JSON.stringify(groups, null, 2));
  }

  fs.writeFileSync(path.resolve(repoRoot, './InterActionD2F.json'), reformatPrimitiveArrays(JSON.stringify(d2f, null, 2)));
  console.log('Done');
}


function processInterAction(fileName: string, groupId: number, groupIndex: number, _action: any): InterAction {
  let action: InterAction = normalizeRawJson(_action, InterActionSchema);
  allTypes.add(action.Type);
  if (action.Type === 'DIALOG_SELECT') {
    if (Array.isArray(action.DialogIdList)) {
      for (let dialogOption of action.DialogIdList) {
        d2f[dialogOption].push([fileName, groupId, groupIndex]);
      }
    } else {
      return null;
    }
  } else if (action.Type === 'DIALOG' || !!action.DialogId) {
    if (typeof action.DialogId === 'number') {
      d2f[action.DialogId].push([fileName, groupId, groupIndex]);
    } else {
      return null;
    }
  } else if (action.Type === 'UI_TRIGGER') {
    uiTriggerContextNames.add(action.ContextName);
  }
  return action;
}

function gatherGroups(fileName: string, json: any): InterActionGroup[] {
  if (!json || !Array.isArray(json.group) || !Array.isArray(json.groupId)) {
    return;
  }

  let groups: InterActionGroup[] = [];
  let groupMap: {[groupId: number]: InterActionGroup} = {};
  let groupIdToPreviousId: {[groupId: number]: Set<number>} = defaultMap('Set');

  for (let i = 0; i < json.group.length; i++) {
    const groupId: {grpId: number, index: number, nextGrpId: number} = json.groupId[i];
    const normalActions: InterAction[] = [];
    const selectActions: InterAction[] = [];

    for (let _action of json.group[i]) {
      let action = processInterAction(fileName, groupId.grpId, groupId.index || 0, _action);
      if (!action) {
        continue;
      }
      if (!INTERACTION_KEEP_TYPES.has(action.Type)) {
        continue;
      }
      if (action.Type === 'DIALOG_SELECT') {
        const actionOfSameType = selectActions.find(a => a.Type === action.Type);
        if (actionOfSameType && isEquiv(actionOfSameType.DialogIdList, action.DialogIdList) && isEquiv(actionOfSameType.GrpIdList, action.GrpIdList)) {
          continue; // duplicate, disregard
        }
        if (actionOfSameType) {
          console.error('Found action of same type DIALOG_SELECT:', action);
        }
        if (!Array.isArray(action.DialogIdList)) {
          console.error('Found DIALOG_SELECT without DialogIdList:', action, ' in ' + fileName);
        }
        if (!Array.isArray(action.GrpIdList)) {
          action.GrpIdList = Array(action.DialogIdList.length).fill(groupId.nextGrpId);
        }
        for (let grpId of action.GrpIdList) {
          groupIdToPreviousId[grpId].add(groupId.grpId);
        }
        selectActions.push(action);
      } else if (action.Type === 'DIALOG') {
        const actionsOfSameType = selectActions.filter(a => a.Type === action.Type);
        if (actionsOfSameType.some(a => isEquiv(a.DialogId, action.DialogId))) {
          continue; // duplicate, disregard
        }
        if (typeof action.DialogId !== 'number') {
          console.error('Found DIALOG without DialogId:', action, ' in ' + fileName);
        }
        normalActions.push(action);
      } else {
        normalActions.push(action);
      }
    }

    let group: InterActionGroup = {
      Index: groupId.index || 0,
      GroupId: groupId.grpId,
      NextGroupId: groupId.nextGrpId,
      Actions: [
        ... normalActions,
        ... selectActions, // bring down DIALOG_SELECT action to always be last
      ],
    };
    groupIdToPreviousId[group.NextGroupId].add(group.GroupId);
    groupMap[group.GroupId] = group;
    groups.push(group);
  }

  for (let [groupId, prevGroupIds] of Object.entries(groupIdToPreviousId)) {
    if (groupMap[groupId]) {
      groupMap[groupId].PrevGroupIds = Array.from(prevGroupIds);
    }
  }

  return groups;
}

// region CLI
// --------------------------------------------------------------------------------------------------------------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadInterActionQD(getGenshinDataFilePath());
}
