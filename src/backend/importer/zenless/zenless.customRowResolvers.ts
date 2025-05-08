
// This file is for customRowResolvers that need to use ZenlessControl.
// We cannot import ZenlessControl inside zenless.schema.ts which is why we have this file.
// This file should be used by zenless.schema.ts through dynamic import ONLY.

import { ZenlessControl } from '../../domain/zenless/zenlessControl.ts';
import { DialogueNode } from '../../../shared/types/zenless/dialogue-types.ts';
import { Z3DialogUtil } from '../../domain/zenless/dialogue/z3_dialogue_util.ts';

export async function relation_DialogToNext_resolver(row: DialogueNode, _allRows, acc: Record<string, any>) {
  if (!acc.ctrl) {
    acc.ctrl = ZenlessControl.noDbConnectInstance();
  }

  const ctrl: ZenlessControl = acc.ctrl;

  const nextDialogs = Z3DialogUtil.getNextNodeIds(row);

  if (nextDialogs && nextDialogs.length) {
    return nextDialogs.map(nextDialogId => ({
      NodeId: row.NodeId,
      NextNodeId: nextDialogId,
    }));
  } else {
    return [];
  }
}
