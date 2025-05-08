// region Walk Sync
// --------------------------------------------------------------------------------------------------------------
import fs, { promises as fsp } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { normalizeRawJson, renameFields } from '../import_db.ts';
import { DialogueNode, DialogueNode40Condition } from '../../../shared/types/zenless/dialogue-types.ts';
import { removeSuffix } from '../../../shared/util/stringUtil.ts';
import { sort } from '../../../shared/util/arrayUtil.ts';
import { isset } from '../../../shared/util/genericUtil.ts';

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
type StorySections = DialogueNode[][];

function processDialogueNode(scriptName: string,
                             node: DialogueNode,
                             sectionIndex: number,
                             numSections: number,
                             nodeIndex: number,
                             numNodes: number): DialogueNode {
  node = renameFields(node, {
    AvatarName: 'AvatarNameKey',
    BindSubSectionIndex: 'BindNodeIndex',
  });

  const isOfLastSection = sectionIndex === numSections - 1;
  const isLastNodeInSection = nodeIndex === numNodes - 1;

  node.NodeId = `${scriptName}_${sectionIndex}_${nodeIndex}`;
  node.ScriptConfigName = scriptName;
  node.ScriptConfigSectionIndex = sectionIndex;
  node.ScriptConfigNodeIndex = nodeIndex;

  const handleTransition = (t: any) => {
    if (t && isset(t.BindSectionIndex) && isset(t.BindNodeIndex)) {
      t.NextNodeId = `${scriptName}_${t.BindSectionIndex}_${t.BindNodeIndex}`;
    }
  };

  const nodeAsAny = node as any;

  if (Array.isArray(nodeAsAny.TransitionList)) {
    nodeAsAny.TransitionList.forEach(handleTransition);
  } else if (Array.isArray(nodeAsAny.NextList)) {
    nodeAsAny.NextList.forEach(handleTransition);
  } else if (Array.isArray(nodeAsAny.ConditionList)) {
    nodeAsAny.ConditionList.forEach(handleTransition);
  } else if (Array.isArray(nodeAsAny.QuestList)) {
    nodeAsAny.QuestList.forEach(handleTransition);
  } else if (nodeAsAny.Failure || nodeAsAny.Success || nodeAsAny.OnConfirmNext || nodeAsAny.OnCancelNext) {
    handleTransition(nodeAsAny.Failure);
    handleTransition(nodeAsAny.Success);
    handleTransition(nodeAsAny.OnConfirmNext);
    handleTransition(nodeAsAny.OnCancelNext);
  } else {
    if (isOfLastSection && isLastNodeInSection) {
      // Last node in last section - nothing
    } else if (isOfLastSection) {
      // Middle node in last section
      node.NextNodeId = `${scriptName}_${sectionIndex}_${nodeIndex + 1}`;
    } else if (isLastNodeInSection) {
      // Last node in middle section
      node.NextNodeId = `${scriptName}_${sectionIndex + 1}_0`;
    } else {
      // Middle node in middle section
      node.NextNodeId = `${scriptName}_${sectionIndex}_${nodeIndex + 1}`;
    }
  }

  return node;
}

export async function generateDialogueNodes(repoRoot: string) {
  const fileCfgPath: string = path.resolve(repoRoot, './FileCfg');
  const scriptConfigPath: string = path.resolve(repoRoot, './Data/ScriptConfig');
  if (!fs.existsSync(fileCfgPath)) throw new Error('FileCfg path does not exist!');
  if (!fs.existsSync(scriptConfigPath)) throw new Error('ScriptConfig path does not exist!');

  const dialogueNodeArray: DialogueNode[] = [];

  console.log('Processing ScriptConfigs');
  for (let fileName of walkSync(scriptConfigPath)) {
    if (!fileName.endsWith('.json')) {
      continue;
    }

    const scriptName = removeSuffix(path.basename(fileName), '.json');
    const json = normalizeRawJson(await fsp.readFile(fileName, { encoding: 'utf8' }).then(data => JSON.parse(data)));
    if (!json || !json.StorySections || !Array.isArray(json.StorySections)) {
      continue;
    }

    const storySections: StorySections = json.StorySections;

    for (let sectionIndex = 0; sectionIndex < storySections.length; sectionIndex++) {
      const subSection = storySections[sectionIndex];

      for (let nodeIndex = 0; nodeIndex < subSection.length; nodeIndex++) {
        const node = subSection[nodeIndex];
        const retNode = processDialogueNode(scriptName, node, sectionIndex, storySections.length, nodeIndex, subSection.length);
        if (retNode) {
          dialogueNodeArray.push(retNode);
        }
      }
    }
  }

  console.log('Processed ' + dialogueNodeArray.length + ' dialogue nodes');

  console.log('Sorting dialogue nodes');
  sort(dialogueNodeArray, 'Id');

  console.log('Writing to DialogueNodeTemplateTb');
  fs.writeFileSync(path.resolve(fileCfgPath, './DialogueNodeTemplateTb.json'), JSON.stringify(dialogueNodeArray, null, 2));
}
// endregion

// region CLI
// --------------------------------------------------------------------------------------------------------------
async function runFromCli() {
  if (process.argv.length <= 2) {
    console.error('Not enough parameters! First parameter must be path to zenless data repository directory.');
    process.exit(1);
  }

  const repoDir: string = process.argv[2];
  if (!fs.existsSync(repoDir)) {
    console.error('Repository directory does not exist! -- ' + repoDir);
    process.exit(1);
  }

  await generateDialogueNodes(repoDir);
  process.exit(0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runFromCli();
}
// endregion
