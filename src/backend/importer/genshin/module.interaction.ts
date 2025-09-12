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
import { isInt } from '../../../shared/util/numberUtil.ts';
import { fsWalkSync } from '../../util/fsutil.ts';

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

  const filePaths: string[] = [];
  for (let filePath of fsWalkSync(binOutputIAQD)) {
    filePaths.push(filePath);
  }

  console.log('Starting');
  console.log('  0%');

  let lastLogTimeMs: number = Date.now();
  let numComplete = 0;
  for (let filePath of filePaths) {
    if (!filePath.endsWith('.json')) {
      continue;
    }
    try {
      const relName = path.relative(binOutputIAQD, filePath).replace(/\\/g, '/').replace(/\//g, ';');
      const outFile = path.resolve(outDir, relName);

      const json = await fsp.readFile(filePath, { encoding: 'utf8' }).then(data => JSON.parse(data));
      const groups = gatherGroups(relName, json);
      if (!groups) {
        continue;
      }

      fs.writeFileSync(outFile, JSON.stringify(groups, null, 2));
    } catch (e) {
      console.error('Error processing ' + filePath);
      throw e;
    } finally {
      numComplete++;

      let currTimeMs: number = Date.now();
      if ((currTimeMs - lastLogTimeMs) >= 2000) {
        lastLogTimeMs = currTimeMs;
        console.log(`  ${(numComplete / filePaths.length) * 100 | 0}%`);
      }
    }
  }
  console.log('  100%');

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
    if (isInt(action.DialogId)) {
      d2f[action.DialogId].push([fileName, groupId, groupIndex]);
    } else {
      return null;
    }
  } else if (action.Type === 'UI_TRIGGER') {
    uiTriggerContextNames.add(action.ContextName);
  }
  return action;
}

let nextFakeGroupId = 9000000000;

function gatherGroups(fileName: string, json: any): InterActionGroup[] {
  if (!json || !Array.isArray(json.group) || !Array.isArray(json.groupId)) {
    return;
  }

  if (json.group.length > json.groupId.length) {
    if (json.group.length === 1) {
      let grpId = nextFakeGroupId++;
      let nextGrpId = nextFakeGroupId++;
      json.groupId = [
        {
          GrpId: grpId,
          Index: 0,
          NextGrpId: nextGrpId,
          NextGrpIdList: [],
          NoCircleNextGrpId: nextGrpId,
        }
      ];
    } else {
      console.warn('Cannot process ' + fileName + '. Group lengths issue. Group: '
        + json.group.length + ', GroupId: ' + json.groupId.length);
      return;
    }
  }

  let groups: InterActionGroup[] = [];
  let groupMap: {[groupId: number]: InterActionGroup} = {};
  let groupIdToPreviousId: {[groupId: number]: Set<number>} = defaultMap('Set');

  for (let i = 0; i < json.group.length; i++) {
    const groupId: {GrpId: number, Index: number, NextGrpId?: number, NextGrpIdList?: number[], NoCircleNextGrpId?: number} = normalizeRawJson(json.groupId[i]);

    const normalActions: InterAction[] = [];
    const selectActions: InterAction[] = [];

    for (let _action of json.group[i]) {
      let action = processInterAction(fileName, groupId.GrpId, groupId.Index || 0, _action);
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
          action.GrpIdList = Array(action.DialogIdList.length).fill(groupId.NextGrpId);
        }
        for (let GrpId of action.GrpIdList) {
          groupIdToPreviousId[GrpId].add(groupId.GrpId);
        }
        selectActions.push(action);
      } else if (action.Type === 'DIALOG') {
        const actionsOfSameType = selectActions.filter(a => a.Type === action.Type);
        if (actionsOfSameType.some(a => isEquiv(a.DialogId, action.DialogId))) {
          continue; // duplicate, disregard
        }
        if (!isInt(action.DialogId)) {
          console.error('Found DIALOG without DialogId:', action, ' in ' + fileName);
        }
        normalActions.push(action);
      } else {
        normalActions.push(action);
      }
    }

    let group: InterActionGroup = {
      Index: groupId.Index || 0,
      GroupId: groupId.GrpId,
      NextGroupId: groupId.NextGrpId,
      NextGroupIdList: groupId.NextGrpIdList,
      NoCircleNextGroupId: groupId.NoCircleNextGrpId,
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
