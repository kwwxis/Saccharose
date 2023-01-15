import { DialogExcelConfigData, TalkExcelConfigData } from '../../../shared/types/dialogue-types';
import { ConfigCondition } from '../../../shared/types/general-types';
import { Control } from '../script_util';
import { QuestGenerateResult } from './quest_generator';
import { MetaProp, MetaPropValue } from '../../util/metaProp';
import { toBoolean } from '../../../shared/util/genericUtil';
import { dialogueToQuestId } from './reverse_quest';
import { Marker } from '../../../shared/util/highlightMarker';

export class DialogueSectionResult {
  id: string = null;
  title: string = '';
  metadata: MetaProp[] = [];
  helptext: string = '';
  wikitext: string = '';
  wikitextMarkers: Marker[] = [];
  wikitextArray: { title?: string, wikitext: string, markers?: Marker[] }[] = [];
  children: DialogueSectionResult[] = [];
  htmlMessage: string = null;
  originalData: { talkConfig?: TalkExcelConfigData, dialogBranch?: DialogExcelConfigData[] } = {};
  showGutter: boolean = false;

  constructor(id: string, title: string, helptext: string = null) {
    this.id = id;
    this.title = title;
    this.helptext = helptext;
  }

  afterConstruct(fn: (sect: this) => void): this {
    fn(this);
    return this;
  }

  addEmptyMetaProp(label: string) {
    this.metadata.push(new MetaProp(label, null));
  }

  addMetaProp(label: string, values: string | number | string[] | (string|number)[] | number[] | MetaPropValue[], link?: string) {
    if (!values || (Array.isArray(values) && !values.length)) {
      return;
    }
    this.metadata.push(new MetaProp(label, values, link));
  }

  addCondMetaProp(fieldName: string, condComb: string, condList: ConfigCondition[]) {
    let label = fieldName + (condComb ? '[Comb=' + condComb + ']' : '');
    let values = [];
    if (condList && condList.length) {
      for (let cond of condList) {
        let str = '(' + 'Type=' + cond.Type + (cond.Param ? ' Param=' + JSON.stringify(cond.Param) : '')
          + (cond.ParamStr ? ' ParamStr=' + cond.ParamStr : '')
          + (cond.Count ? ' Count=' + cond.Count : '') + ')';
        values.push(str);
      }
    }
    this.addMetaProp(label, values);
  }
}

export class SbOut {
  private out = '';

  toString() {
    return this.out;
  }

  get() {
    return this.out;
  }

  append(str: string) {
    this.out += str;
  }

  line(text?: string) {
    this.out += '\n' + (text || '');
  }

  clearOut() {
    this.out = '';
  }
}

export class TalkConfigAccumulator {
  readonly fetchedTalkConfigIds: number[] = [];
  readonly fetchedTopLevelTalkConfigs: TalkExcelConfigData[] = [];

  constructor(private ctrl: Control) {
  }

  async handleTalkConfig(talkConfig: TalkExcelConfigData, isTopLevel: boolean = true): Promise<TalkExcelConfigData> {
    if (!talkConfig || this.fetchedTalkConfigIds.includes(talkConfig.Id)) {
      return null; // skip if not found or if already found
    }
    this.fetchedTalkConfigIds.push(talkConfig.Id);
    if (!!talkConfig.InitDialog) {
      talkConfig.Dialog = await this.ctrl.selectDialogBranch(await this.ctrl.selectSingleDialogExcelConfigData(talkConfig.InitDialog));
    } else {
      talkConfig.Dialog = [];
    }
    if (isTopLevel) {
      this.fetchedTopLevelTalkConfigs.push(talkConfig);
    }
    if (talkConfig.NextTalks) {
      if (!talkConfig.NextTalksDataList) {
        talkConfig.NextTalksDataList = [];
      }
      let finalNextTalks: number[] = [];
      for (let nextTalkId of talkConfig.NextTalks) {
        let nextTalkConfig = await this.handleTalkConfig(await this.ctrl.selectTalkExcelConfigDataByQuestSubId(nextTalkId), false);
        if (nextTalkConfig) {
          let prevTalkConfig: TalkExcelConfigData = null;
          if (talkConfig.NextTalksDataList.length) {
            prevTalkConfig = talkConfig.NextTalksDataList[talkConfig.NextTalksDataList.length - 1];
          }
          if (prevTalkConfig && prevTalkConfig.InitDialog === nextTalkConfig.InitDialog) {
            continue;
          }
          talkConfig.NextTalksDataList.push(nextTalkConfig);
        }
        finalNextTalks.push(nextTalkId);
      }
      talkConfig.NextTalks = finalNextTalks;
    }
    return talkConfig;
  }
}

export async function talkConfigToDialogueSectionResult(ctrl: Control, parentSect: DialogueSectionResult | QuestGenerateResult,
                                                        sectName: string, sectHelptext: string, talkConfig: TalkExcelConfigData, dialogueDepth: number = 1): Promise<DialogueSectionResult> {
  let mysect = new DialogueSectionResult('Talk_' + talkConfig.Id, sectName, sectHelptext);
  mysect.originalData.talkConfig = talkConfig;

  mysect.addMetaProp('Talk ID', talkConfig.Id, '/branch-dialogue?q={}');
  if (talkConfig.QuestId) {
    mysect.addMetaProp('Quest ID', talkConfig.QuestId, '/quests/{}');
  } else {
    let questIds = await dialogueToQuestId(ctrl, talkConfig);
    if (questIds.length) {
      mysect.addMetaProp('Quest ID', questIds, '/quests/{}');
    }
  }
  mysect.addMetaProp('Quest Idle Talk', talkConfig.QuestIdleTalk ? 'yes' : null);
  mysect.addMetaProp('NPC ID', talkConfig.NpcId, '/npc-dialogue?q={}');
  mysect.addMetaProp('Next Talk IDs', talkConfig.NextTalks, '/branch-dialogue?q={}');

  for (let beginCond of (talkConfig.BeginCond || [])) {
    switch (beginCond.Type) {
      case 'QUEST_COND_AVATAR_FETTER_GT':
        mysect.addMetaProp('Friendship', ['greater than', beginCond.Param[1]]);
        break;
      case 'QUEST_COND_AVATAR_FETTER_LT':
        mysect.addMetaProp('Friendship', ['less than', beginCond.Param[1]]);
        break;
      case 'QUEST_COND_AVATAR_FETTER_EQ':
        mysect.addMetaProp('Friendship', ['equals', beginCond.Param[1]]);
        break;
      case 'QUEST_COND_IS_DAYTIME':
        if (toBoolean(beginCond.Param[0])) {
          mysect.addEmptyMetaProp('Daytime Only');
        } else {
          mysect.addEmptyMetaProp('Nighttime Only');
        }
        break;
    }
  }

  if (talkConfig.Dialog.length && ctrl.isPlayerDialogueOption(talkConfig.Dialog[0])) {
    dialogueDepth += 1;
  }

  let out = new SbOut();
  out.append(await ctrl.generateDialogueWikiText(talkConfig.Dialog, dialogueDepth));
  mysect.wikitext = out.toString();

  if (talkConfig.NextTalksDataList) {
    for (let nextTalkConfig of talkConfig.NextTalksDataList) {
      await talkConfigToDialogueSectionResult(ctrl, mysect, 'Next Talk', 'An immediate (but possibly conditional) continuation from the parent talk.<br>' +
        'This can happen for conditional dialogues and branching.<br><br>' +
        'Example 1: multiple talks leading to the same next talk.<br>' +
        'Example 2: a branch that might lead to one of the next talks depending on some condition.', nextTalkConfig, dialogueDepth);
    }
  }

  if (talkConfig.NextTalks) {
    // Get a list of next talk ids that are *not* in NextTalksDataList
    let skippedNextTalkIds = talkConfig.NextTalks.filter(myId => !talkConfig.NextTalksDataList.find(x => x.Id === myId));
    for (let nextTalkId of skippedNextTalkIds) {
      let placeholderSect = new DialogueSectionResult(null, 'Next Talk');
      placeholderSect.metadata.push(new MetaProp('Talk ID', nextTalkId, `/branch-dialogue?q=${nextTalkId}`));
      placeholderSect.htmlMessage = `<p>This section contains dialogue but wasn't shown because the section is already present on the page.
      This can happen when multiple talks lead to the same next talk.</p>
      <p><a href="#Talk_${nextTalkId}">Jump to Talk ${nextTalkId}</a></p>`;
      mysect.children.push(placeholderSect);
    }
  }

  if (parentSect) {
    if (parentSect instanceof QuestGenerateResult) {
      parentSect.dialogue.push(mysect);
    } else {
      parentSect.children.push(mysect);
    }
  }
  return mysect;
}

/**
 * Trace a dialog back to the first dialog of its section.
 *
 * There can be multiple results if there are multiple first dialogs that lead to the same dialog.
 */
export async function traceBack(ctrl: Control, dialog: DialogExcelConfigData): Promise<DialogExcelConfigData[]> {
  if (!dialog) {
    return undefined;
  }
  let stack: DialogExcelConfigData[] = [dialog];
  let ret: DialogExcelConfigData[] = [];
  while (true) {
    let nextStack = [];
    for (let d of stack) {
      let prevs = await ctrl.selectPreviousDialogs(d.Id);
      if (!prevs.length) {
        if (!ret.some(r => r.Id === d.Id)) {
          ret.push(d);
        }
      } else {
        nextStack.push(... prevs);
      }
    }
    if (nextStack.length) {
      stack = nextStack;
    } else {
      break;
    }
  }
  return ret;
}