// region Class: DialogBranchingCache
// --------------------------------------------------------------------------------------------------------------
import {
  DialogueNode,
  DialogueNodeGenericTransition,
  NodeTypeIdToName,
} from '../../../../shared/types/zenless/dialogue-types.ts';
import { ZenlessControl } from '../zenlessControl.ts';
import { sort } from '../../../../shared/util/arrayUtil.ts';

export class Z3DialogBranchingCache {
  dialogToBranch: {[nodeId: string]: DialogueNode[]} = {};
  dialogSeenAlready: Set<string>;

  constructor(dialogToBranch: {[nodeId: string]: DialogueNode[]}, dialogueSeenAlready: Set<string>) {
    this.dialogToBranch = dialogToBranch || {};
    this.dialogSeenAlready = !dialogueSeenAlready ? new Set<string>() : new Set<string>(dialogueSeenAlready);
  }

  static from(self: Z3DialogBranchingCache) {
    return new Z3DialogBranchingCache(self.dialogToBranch, self.dialogSeenAlready);
  }
}

class Z3DialogUtilInstance {
  getNodeType(d: DialogueNode): number {
    return d.NodeType;
  }

  getNodeTypeName(d: DialogueNode): string {
    return NodeTypeIdToName[d.NodeType];
  }

  isContentful(d: DialogueNode): boolean {
    return [0, 1, 15, 20, 23, 27, 28, 29, 30, 31, 37, 40].includes(d.NodeType);
  }

  getSpeakerText(d: DialogueNode): string {
    if (d.NodeType === 0) {
      return d.AvatarNameText;
    }
    return null;
  }

  getContentText(d: DialogueNode): string {
    if (d.NodeType === 0) {
      return d.DialogueText;
    } else if (d.NodeType === 15) {
      return d.DialogueTexts.join('\n');
    } else {
      return null;
    }
  }

  getContentTextKey(d: DialogueNode): string {
    if (d.NodeType === 0) {
      return d.DialogueKey;
    } else if (d.NodeType === 15) {
      return d.DialogueKeys[0];
    } else {
      return null;
    }
  }

  getNextNodeIds(d: DialogueNode): string[] {
    const transitions = this.getTransitions(d);
    if (transitions.length) {
      return transitions.map(t => t.NextNodeId).filter(x => !!x);
    } else if (d.NextNodeId) {
      return [d.NextNodeId];
    } else {
      return [];
    }
  }

  getTransitions(d: DialogueNode): DialogueNodeGenericTransition[] {
    if (d.NodeType === 1) {
      return d.TransitionList;
    } else if (d.NodeType === 20) {
      return [d.Success, d.Failure].filter(x => !!x);
    } else if (d.NodeType === 27) {
      return d.NextList;
    } else if (d.NodeType === 28) {
      return d.TransitionList;
    } else if (d.NodeType === 30) {
      return [d.OnCancelNext, d.OnConfirmNext].filter(x => !!x);
    } else if (d.NodeType === 31) {
      return d.TransitionList;
    } else if (d.NodeType === 40) {
      return d.ConditionList;
    }
    return [];
  }
}

export const Z3DialogUtil = new Z3DialogUtilInstance();
// endregion

/**
 * Trace a dialog back to the first dialog of its section.
 *
 * There can be multiple results if there are multiple first dialogs that lead to the same dialog.
 */
export async function z3_dialogTraceBack(ctrl: ZenlessControl, dialog: DialogueNode): Promise<DialogueNode[]> {
  if (!dialog) {
    return undefined;
  }
  let stack: DialogueNode[] = [dialog];
  let ret: DialogueNode[] = [];
  let seenIds: Set<string> = new Set();

  //console.log(`START: ${dialog.Id}: ${dialog.TalkRoleNameText}: ${dialog.TalkContentText}`)

  while (true) {
    let nextStack = [];
    for (let d of stack) {
      let prevs: DialogueNode[] = await ctrl.selectPreviousDialogs(d.NodeId, true);
      // if (!prevs.length) {
      //   console.log('PREVS: none');
      // } else {
      //   console.log('PREVS:\n' + prevs.map(p => `  ${p.Id}: ${p.TalkRoleNameText}: ${p.TalkContentText}`).join(`\n`));
      // }
      if (!prevs.length) {
        if (!ret.some(r => r.NodeId === d.NodeId)) {
          ret.push(d);
        }
      } else {
        for (let prev of prevs) {
          if (!seenIds.has(prev.NodeId)) {
            nextStack.push(prev);
            seenIds.add(prev.NodeId);
          }
        }
      }
    }
    if (nextStack.length) {
      stack = nextStack;
    } else {
      break;
    }
  }
  if (!ret.length && seenIds.size) {
    const seenIdsArr = Array.from(seenIds);

    const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
    seenIdsArr.sort((a,b) => {
      return collator.compare(a, b);
    });

    return [await ctrl.selectSingleDialogueNode(seenIdsArr[0], true)];
  }
  return ret;
}
