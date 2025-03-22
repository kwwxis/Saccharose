// region Class: DialogBranchingCache
// --------------------------------------------------------------------------------------------------------------
import { DialogueNode } from '../../../../shared/types/zenless/dialogue-types.ts';

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
// endregion
