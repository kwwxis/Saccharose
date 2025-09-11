import '../../../loadenv.ts';
import { escapeRegExp } from '../../../../shared/util/stringUtil.ts';
import { pathToFileURL } from 'url';
import { Marker } from '../../../../shared/util/highlightMarker.ts';
import { custom } from '../../../util/logger.ts';
import { CommonLineId, DialogWikitextResult } from '../../../../shared/types/common-types.ts';
import { DialogueSectionResult } from '../../../util/dialogueSectionResult.ts';
import { ZenlessControl } from '../zenlessControl.ts';
import { DialogueNode } from '../../../../shared/types/zenless/dialogue-types.ts';
import { z3_dialogTraceBack, Z3DialogUtil } from './z3_dialogue_util.ts';

// region Branch Dialogue: Options & State
// --------------------------------------------------------------------------------------------------------------
export const DIALOGUE_GENERATE_MAX = 100;

export type DialogueGenerateOpts = {
  query: string,
}

class DialogueGenerateState {
  readonly result: DialogueSectionResult[] = [];
  readonly query: string;
  readonly seenFirstDialogNodeIds: Set<string> = new Set();

  constructor(readonly ctrl: ZenlessControl, opts: DialogueGenerateOpts) {
    this.query = opts.query;
  }
}
// endregion

// region Branch Dialogue: Logic
// --------------------------------------------------------------------------------------------------------------

/**
 * Add highlight markers to search result dialogue section.
 * @param ctrl The control instance.
 * @param query The original query.
 * @param dialogue The DialogExcel of the match.
 * @param sect The section to highlight.
 */
async function addHighlightMarkers(ctrl: ZenlessControl,
                                   query: number|number[]|string,
                                   dialogue: DialogueNode,
                                   sect: DialogueSectionResult) {
  let re: RegExp;
  if (typeof query === 'string' && ctrl.inputLangCode === ctrl.outputLangCode) {
    re = new RegExp(ctrl.searchModeIsRegex ? `(?<=(:'''|{{DIcon[^}]*}}) .*)` + query
      : escapeRegExp(ctrl.normText(query, ctrl.outputLangCode)), ctrl.searchModeReFlags);
  } else {
    re = new RegExp(escapeRegExp(ctrl.normText(Z3DialogUtil.getContentText(dialogue), ctrl.outputLangCode)), ctrl.searchModeReFlags);
  }

  const lineIds: CommonLineId[] = sect.wikitextLineIds;

  for (let marker of await Marker.createAsync(re, sect.wikitext)) {
    sect.wikitextMarkers.push(marker);
  }

  if (sect.children && sect.children.length) {
    for (let child of sect.children) {
      await addHighlightMarkers(ctrl, query, dialogue, child);
    }
  }
}

async function handle(state: DialogueGenerateState, id: string|DialogueNode): Promise<boolean> {
  if (!id) {
    const debug = custom('branch-dialogue');
    debug('Early exit: no ID');
    return false;
  }

  const {
    result,
    ctrl,
    seenFirstDialogNodeIds,
    query,
  } = state;

  // Find Dialog Excel
  // --------------------------------------------------------------------------------------------------------------

  // Look for dialog node:
  const dialog: DialogueNode = typeof id === 'string' ? await ctrl.selectSingleDialogueNode(id, true) : id;

  // If no dialog, then there's nothing we can do:
  if (!dialog) {
    const debug = custom('branch-dialogue:' + id);
    debug('No Talk or Dialogue found');
    throw 'No Talk or Dialogue found for ID: ' + id;
  }

  // Filters
  // --------------------------------------------------------------------------------------------------------------
  const firstDialogs = await z3_dialogTraceBack(ctrl, dialog);

  let foundDialogs: boolean = false;
  for (let firstDialog of firstDialogs) {
    if (seenFirstDialogNodeIds.has(firstDialog.NodeId)) {
      continue;
    } else {
      seenFirstDialogNodeIds.add(firstDialog.NodeId);
    }

    const dialogueBranch = await ctrl.selectDialogBranch(firstDialog);

    const sect = new DialogueSectionResult('Dialogue_'+firstDialog.NodeId, 'Dialogue');
    const dialogWikitextRet: DialogWikitextResult = await ctrl.generateDialogueWikitext(dialogueBranch);
    sect.setWikitext(dialogWikitextRet);

    await addHighlightMarkers(ctrl, query, dialog, sect);
    result.push(sect);
  }
  return foundDialogs;
}

export async function dialogueGenerate(ctrl: ZenlessControl, opts: DialogueGenerateOpts): Promise<DialogueSectionResult[]> {
  const state: DialogueGenerateState = new DialogueGenerateState(ctrl, opts);

  const debug = custom('branch-dialogue');
  debug('Generating branch dialogue for opts:', opts, '/ query:', state.query);

  let acceptedCount = 0;
  for await (let textMapHash of ctrl.generateTextMapMatches({
    searchText: state.query.trim(),
    inputLangCode: ctrl.inputLangCode,
    outputLangCode: ctrl.outputLangCode,
    flags: ctrl.searchModeFlags,
  })) {
    const dialogues: DialogueNode[] = await ctrl.selectDialogsFromTextMapHash(textMapHash, true);
    const didAccept: boolean = (await dialogues.asyncMap(d => handle(state, d))).some(b => !!b);
    if (didAccept) {
      acceptedCount++;
    }
    if (acceptedCount > DIALOGUE_GENERATE_MAX) {
      break;
    }
  }

  return state.result;
}
// endregion

// region CLI Testing
// --------------------------------------------------------------------------------------------------------------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    //console.log(await dialogueGenerate(`Uh, why are you two fighting?`));
    //console.log(await talkConfigGenerate(6906901));
    // let res = await dialogueGenerateByNpc(getGenshinControl(), 'Arapratap');
    // console.log(util.inspect(res, false, null, true));
    // await closeKnex();
  })();
}
// endregion
