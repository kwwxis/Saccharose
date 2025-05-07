// region Class: DialogBranchingCache
// --------------------------------------------------------------------------------------------------------------
import {
  DialogueNode,
  DialogueNodeGenericTransition,
  NodeTypeIdToName,
} from '../../../../shared/types/zenless/dialogue-types.ts';

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
  }

  getContentText(d: DialogueNode): string {
    return null;
  }

  getNextNodeIds(d: DialogueNode): string[] {
    return [];
  }

  getTransitions(d: DialogueNode): DialogueNodeGenericTransition[] {
    return [];
  }
}

export const Z3DialogUtil = new Z3DialogUtilInstance();
// endregion
