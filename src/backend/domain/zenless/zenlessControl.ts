// noinspection JSUnusedGlobalSymbols

import { AbstractControl } from '../abstract/abstractControl.ts';
import { getZenlessDataFilePath } from '../../loadenv.ts';
import { normalizeRawJson, SchemaTable } from '../../importer/import_db.ts';
import { LangCode, TextMapHash } from '../../../shared/types/lang-types.ts';
import { __normZenlessText, ZenlessNormTextOpts } from './zenlessText.ts';
import { genericNormSearchText, NormTextOptions } from '../abstract/genericNormalizers.ts';
import { zenless_i18n, ZENLESS_I18N_MAP } from '../abstract/i18n.ts';
import { AbstractControlState, ControlUserModeProvider } from '../abstract/abstractControlState.ts';
import { CurrentZenlessVersion, ZenlessVersions } from '../../../shared/types/game-versions.ts';
import { arrayFillRange, arrayIndexOf, arrayIntersect, arrayUnique } from '../../../shared/util/arrayUtil.ts';
import { custom } from '../../util/logger.ts';
import { CommonLineId, DialogWikitextResult } from '../../../shared/types/common-types.ts';
import { DialogueNode, DialogueNodeBranches } from '../../../shared/types/zenless/dialogue-types.ts';
import { Z3DialogBranchingCache, Z3DialogUtil } from './dialogue/z3_dialogue_util.ts';
import { Knex } from 'knex';

// region Control State
// --------------------------------------------------------------------------------------------------------------

/**
 * State/cache for only a single control
 */
export class ZenlessControlState extends AbstractControlState {
  // Caches:
  dialogueIdCache: Set<string> = new Set();

  // Autoload Preferences:
  AutoloadText: boolean = true;

  override copy(trx?: Knex.Transaction|boolean): ZenlessControlState {
    const state = new ZenlessControlState(this.controlUserMode);
    state.dialogueIdCache = new Set(this.dialogueIdCache);
    state.DbConnection = trx;
    return state;
  }
}

export function getZenlessControl(request?: ControlUserModeProvider) {
  return new ZenlessControl(request);
}

// region Control Object
// --------------------------------------------------------------------------------------------------------------
export class ZenlessControl extends AbstractControl<ZenlessControlState> {
  // region Constructor
  constructor(modeOrState?: ControlUserModeProvider|ZenlessControlState) {
    super({
      siteMode: 'zenless',
      dbName: 'zenless',
      cachePrefix: 'Zenless',
      stateConstructor: ZenlessControlState,
      modeOrState: modeOrState,
      excelPath: './FileCfg',
      disabledLangCodes: ['IT', 'TR'],
      currentGameVersion: CurrentZenlessVersion,
      gameVersions: ZenlessVersions,
      changelogConfig: {
        archivesDirectory: ENV.ZENLESS_ARCHIVES,
        textmapEnabled: true,
        excelEnabled: false,
      },
      excelUsagesFilesToSkip: []
    });
  }

  static noDbConnectInstance() {
    const state = new ZenlessControlState();
    state.DbConnection = false;
    return new ZenlessControl(state);
  }

  override getDataFilePath(file: string): string {
    return getZenlessDataFilePath(file);
  }

  override normText(text: string, langCode: LangCode, opts: NormTextOptions<ZenlessNormTextOpts> = {}): string {
    return __normZenlessText(text, langCode, opts);
  }

  override normSearchText(text: string, inputLangCode: LangCode): string {
    return genericNormSearchText(text, inputLangCode);
  }

  override copy(trx?: Knex.Transaction|boolean): ZenlessControl {
    return new ZenlessControl(this.state.copy(trx));
  }

  override i18n(key: keyof typeof ZENLESS_I18N_MAP, vars?: Record<string, string>): string {
    return zenless_i18n(key, this.outputLangCode, vars);
  }
  // endregion

  // region Post Process
  readonly maybeTextMapHash = (prop: string, x: any) => typeof x === 'string' && /^[a-zA-Z0-9_\-\/\\.]+$/.test(x)
    && !prop.endsWith('Id') && !prop.startsWith('ScriptConfig');

  override async postProcess<T>(targetObject: T, triggerNormalize?: SchemaTable | boolean, doNormText: boolean = false): Promise<T> {
    if (!targetObject)
      return targetObject;
    if (triggerNormalize) {
      targetObject = normalizeRawJson(targetObject, typeof triggerNormalize === 'boolean' ? null : triggerNormalize);
    }
    const stack: any[] = [targetObject];
    while (stack.length) {
      const object = stack.shift();

      if (Array.isArray(object)) {
        for (let element of object) {
          if (!!element && typeof element === 'object') {
            stack.push(element);
          }
        }
        continue;
      }

      const objAsAny = object as any;
      for (let prop in object) {
        if (this.state.AutoloadText && (
          this.maybeTextMapHash(prop, object[prop])
          || (Array.isArray(object[prop]) && (<any[]> object[prop]).every(x => this.maybeTextMapHash(prop, x)))
        )) {
          // Default text prop name for obfuscated props:
          let textProp: string = prop + 'Text';

          // For non-obfsucate ending in "Key"
          //   "DialogueKey" -> "DialogueText"
          //   "TextKey" -> "Text"
          if (prop.endsWith('Key')) {
            textProp = prop.slice(0, -3) + 'Text';
            if (textProp.endsWith('TextText')) {
              textProp = textProp.slice(0, -4);
            }
          } else if (prop.endsWith('Keys')) {
            textProp = prop.slice(0, -4) + 'Texts';
            if (textProp.endsWith('TextTexts')) {
              textProp = textProp.slice(0, -5) + 's';
            }
          }

          if (Array.isArray(object[prop])) {
            let newOriginalArray = [];
            object[textProp] = [];
            for (let id of <any[]>object[prop]) {
              let text = await this.getTextMapItem(this.outputLangCode, id);
              if (doNormText) {
                text = this.normText(text, this.outputLangCode);
              }
              if (text) {
                object[textProp].push(text);
                newOriginalArray.push(id);
              }
            }
            objAsAny[prop] = newOriginalArray;
          } else {
            let text = await this.getTextMapItem(this.outputLangCode, <TextMapHash> object[prop]);
            if (!!text && doNormText) {
              text = this.normText(text, this.outputLangCode);
            }
            if (!!text) {
              object[textProp] = text;
            }
          }
        }
        if (object[prop] === null || objAsAny[prop] === '') {
          delete object[prop];
        }
        if (!!object[prop] && typeof object[prop] === 'object') {
          stack.push(object[prop]);
        }
      }
    }
    return targetObject;
  }
  // endregion

  // region Dialog Template Select
  private async postProcessDialog(dialog: DialogueNode): Promise<DialogueNode> {
    if (!dialog) {
      return dialog;
    }
    return dialog;
  }

  async selectPreviousDialogs(nextNodeId: string, noAddCache: boolean = false): Promise<DialogueNode[]> {
    const ids: string[] = await this.knex.select('*')
      .from('Relation_DialogToNext')
      .where({NextNodeId: nextNodeId}).pluck('NodeId').then();
    return this.selectMultipleDialogueNodes(arrayUnique(ids), noAddCache);
  }

  async selectSingleDialogueNode(nodeId: string, noAddCache: boolean = false): Promise<DialogueNode> {
    let result: DialogueNode = await this.knex.select('*')
      .from('DialogueNodeTemplateTb')
      .where({NodeId: nodeId}).first().then(this.commonLoadFirst);
    if (!result) {
      return result;
    }
    result = await this.postProcessDialog(result);
    this.saveToDialogIdCache(result, noAddCache);
    return result;
  }

  async selectDialogsFromTextMapHash(textMapHash: TextMapHash|TextMapHash[],
                                     noAddCache: boolean = false,
                                     byAvatarNameHash: boolean = false): Promise<DialogueNode[]> {
    let builder = this.knex.select('*').from('DialogueNodeTemplateTb');

    const colName = byAvatarNameHash ? 'AvatarNameKey' : 'DialogueKey';

    if (Array.isArray(textMapHash)) {
      builder = builder.whereIn(colName, textMapHash);
    } else {
      builder = builder.where({[colName]: textMapHash});
    }

    const results = await builder.then(this.commonLoad);

    await results.asyncMap(async d => {
      await this.postProcessDialog(d);
      this.saveToDialogIdCache(d, noAddCache);
    });

    return results;
  }

  async selectMultipleDialogueNodes(nodeIds: string[], noAddCache: boolean = false): Promise<DialogueNode[]> {
    if (!nodeIds.length) {
      return [];
    }

    let results: DialogueNode[] = await this.knex.select('*')
      .from('DialogueNodeTemplateTb')
      .whereIn('NodeId', nodeIds)
      .then(this.commonLoad);

    await results.asyncMap(async d => {
      await this.postProcessDialog(d);
      this.saveToDialogIdCache(d, noAddCache);
    });

    return results;
  }
  // endregion

  // region Dialog Cache Ops
  saveToDialogIdCache(x: DialogueNode, noAddCache: boolean = false): void {
    if (!noAddCache) {
      this.state.dialogueIdCache.add(x.NodeId);
    }
  }
  isInDialogIdCache(x: string|DialogueNode): boolean {
    return this.state.dialogueIdCache.has(typeof x === 'string' ? x : x.NodeId);
  }
  copyDialogForRecurse(node: DialogueNode) {
    let copy: DialogueNode = JSON.parse(JSON.stringify(node));
    copy.Recurse = true;
    return copy;
  }
  // endregion

  // region Dialog Logic
  async selectDialogBranch(start: DialogueNode, cache?: Z3DialogBranchingCache, debugSource?: string|number): Promise<DialogueNode[]> {
    if (!start)
      return [];
    if (!debugSource)
      debugSource = 'any';
    if (!cache)
      cache = new Z3DialogBranchingCache(null, null);

    const debug: debug.Debugger = custom('dialog:' + debugSource+',dialog:' + start.NodeId);
    const detailedDebug: debug.Debugger = custom('dialog:' + debugSource+':detailed,dialog:' + start.NodeId+':detailed');

    const currBranch: DialogueNode[] = [];

    if (cache.dialogToBranch.hasOwnProperty(start.NodeId)) {
      debug('Selecting dialog branch for ' + start.NodeId + ' (already seen)', cache.dialogToBranch[start.NodeId]);
      return cache.dialogToBranch[start.NodeId];
    } else {
      debug('Selecting dialog branch for ' + start.NodeId);
      cache.dialogToBranch[start.NodeId] = currBranch;
    }

    let currNode: DialogueNode = start;

    // Loop over dialog nodes:
    while (currNode) {
      // Handle if seen already:
      if (cache.dialogSeenAlready.has(currNode.NodeId)) {
        currBranch.push(this.copyDialogForRecurse(currNode));
        break;
      } else {
        cache.dialogSeenAlready.add(currNode.NodeId);
      }

      // Handle self:
      currBranch.push(currNode);

      // Fetch next nodes:
      const nextNodes: DialogueNode[] = await this.selectMultipleDialogueNodes(
        Z3DialogUtil.getNextNodeIds(currNode)
      );

      detailedDebug('Curr Node:', currNode.NodeId, '/ Next Nodes:', nextNodes.map(x => x.NodeId).join());

      // Handle next nodes:
      if (nextNodes.length === 1) {
        // If only one next node -> same branch
        currNode = nextNodes[0];
      } else if (nextNodes.length > 1) {
        // If multiple next nodes -> branching

        const branches: DialogueNodeBranches = {};
        for (let nextNode of nextNodes) {
          branches[nextNode.NodeId] = await this.selectDialogBranch(nextNode, Z3DialogBranchingCache.from(cache), debugSource + ':' + start.NodeId);
        }

        const intersect: DialogueNode[] = arrayIntersect<DialogueNode>(Object.values(branches), this.NodeIdComparator)
          .filter(x => !Z3DialogUtil.isTransitionalDialog(x)); // don't rejoin on transitions

        if (!intersect.length) {
          // branches do not rejoin
          currNode.Branches = branches;
          currNode = null;
        } else {
          // branches rejoin
          let rejoinNode = intersect[0];
          for (let [k,v] of Object.entries(branches)) {
            branches[k] = v.slice(0, arrayIndexOf(v, rejoinNode, this.NodeIdComparator));
          }
          currNode.Branches = branches;
          currNode = rejoinNode;
        }
      } else {
        // If zero next nodes -> no more dialog
        currNode = null;
      }
    }
    return currBranch;
  }

  async generateDialogueWikitext(dialogLines: DialogueNode[], dialogDepth = 1,
                                 originatorDialog: DialogueNode = null, originatorIsFirstOfBranch: boolean = false,
                                 firstDialogOfBranchVisited: Set<string> = new Set()): Promise<DialogWikitextResult> {
    let out: string = '';
    let outIds: CommonLineId[] = [];
    let numSubsequentNonBranchPlayerDialogOption = 0;

    if (dialogLines.length) {
      firstDialogOfBranchVisited.add(dialogLines[0].NodeId);
    }

    for (let i = 0; i < dialogLines.length; i++) {
      let dialog: DialogueNode = dialogLines[i];
      let previousDialog: DialogueNode = dialogLines[i - 1];

      // DIcon Prefix
      // ~~~~~~~~~~~~
      let diconPrefix: string;

      if (Z3DialogUtil.isTransitionalDialog(dialog)) {
        if (originatorDialog && Z3DialogUtil.isTransitionalDialog(originatorDialog) && !originatorIsFirstOfBranch) {
          diconPrefix = ':'.repeat(dialogDepth);
        } else if (i === 0 || arrayFillRange(0, i - 1).every(j => Z3DialogUtil.isTransitionalDialog(dialogLines[j]))) {
          diconPrefix = ':'.repeat((dialogDepth - 1 ) || 1);
        } else {
          diconPrefix = ':'.repeat(dialogDepth);
        }
      } else {
        diconPrefix = ':'.repeat(dialogDepth);
      }

      let prefix: string = ':'.repeat(dialogDepth);
      let text: string = this.normText(Z3DialogUtil.getContentText(dialog), this.outputLangCode);
      let name: string = this.normText(Z3DialogUtil.getSpeakerText(dialog), this.outputLangCode);

      // Subsequent Non-Branch Dialogue Options
      // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

      const prevNextNodeIds: string[] = previousDialog ? Z3DialogUtil.getNextNodeIds(previousDialog) : [];

      // Check if this dialog is a subsequent non-branch player dialog option:
      if (previousDialog
        // Both the previous and current dialogs must be dialog options:
        && Z3DialogUtil.isTransitionalDialog(dialog) && Z3DialogUtil.isTransitionalDialog(previousDialog) &&
        (
          // The previous dialog must only have had 1 next dialog
          prevNextNodeIds.length === 1

          // Or the first dialog of every branch from the previous dialog must be a dialog option
          || (previousDialog.Branches && Object.values(previousDialog.Branches).map(b => b[0])
            .every(x => Z3DialogUtil.isTransitionalDialog(x)))
        )

        // The previous dialog's next dialogs must contain current dialog:
        && prevNextNodeIds.some(x => x === dialog.NodeId)) {
        numSubsequentNonBranchPlayerDialogOption++;
      } else {
        // If not, then reset the count to 0
        numSubsequentNonBranchPlayerDialogOption = 0;
      }

      // Voice-Overs
      // ~~~~~~~~~~~
      let voPrefix = ''; //this.voice.getVoPrefix('Dialog', dialog.NodeId, text, dialog.TalkRole.Type);

      // Next Branch Handlers
      // ~~~~~~~~~~~~~~~~~~~~

      const firstDialogOfBranchVisitedCopy = new Set<string>(firstDialogOfBranchVisited);
      if (dialog.Branches) {
        for (let dialogBranch of Object.values(dialog.Branches)) {
          if (!dialogBranch.length) {
            continue;
          }
          firstDialogOfBranchVisitedCopy.add(dialogBranch[0].NodeId);
        }
      }

      let branchExcludedCount = 0;
      let branchIncludedCount = 0;

      const handleBranch = async (transitionNodeId: string) => {
        if (!dialog.Branches) {
          return;
        }
        const dialogBranch = dialog.Branches[transitionNodeId]
        if (!dialogBranch || !dialogBranch.length) {
          return;
        }
        if (firstDialogOfBranchVisited.has(dialogBranch[0].NodeId)) {
          branchExcludedCount++;
          return;
        }
        branchIncludedCount++;
        const branchRet = await this.generateDialogueWikitext(dialogBranch, dialogDepth + 1, dialog, i === 0, firstDialogOfBranchVisitedCopy);
        out += '\n' + branchRet.wikitext;
        outIds.push(... branchRet.ids);
      }

      // Add Common IDs
      // ~~~~~~~~~~~~~~
      const appendOutIdForSelf = () => {
        outIds.push({commonId: dialog.NodeId, textMapHash: Z3DialogUtil.getContentTextKey(dialog)});
      };

      const appendOutIdForText = (textMapHash: TextMapHash) => {
        outIds.push({commonId: dialog.NodeId, textMapHash: textMapHash});
      };

      const appendEmptyOutId = () => {
        outIds.push(null);
      };

      const appendOutIdsForTextNewLines = () => {
        if (text && text.includes('\n')) {
          for (let _m of (text.match(/\n/g) || [])) {
            outIds.push(null);
          }
        }
      };

      // Output Append
      // ~~~~~~~~~~~~~
      if (dialog.Recurse) {
        if (Z3DialogUtil.isTransitionalDialog(dialog)) {
          out += `\n${diconPrefix};(${this.i18n('ReturnToDialogueOption')})`;
        } else {
          out += `\n${diconPrefix.slice(0,-1)};(${this.i18n('ReturnToDialogueOption')})`;
        }
        appendOutIdForSelf();
      } else if (Z3DialogUtil.isTransitionalDialog(dialog)) {
        if (dialog.NodeType === 1 || dialog.NodeType === 28) {
          for (let t of dialog.TransitionList) {
            let dicon: string = t.IconId === 0 ? `{{DIcon}}` : `{{DIcon|${t.IconId}}}`;
            out += `\n${diconPrefix}${':'.repeat(numSubsequentNonBranchPlayerDialogOption)}${dicon} ${t.Text}`;
            appendOutIdForText(t.TextKey);
            await handleBranch(t.NextNodeId);
          }
        } else if (dialog.NodeType === 20) {
          if (dialog.Success) {
            out += `\n${diconPrefix};(If success)`;
            appendEmptyOutId();
            await handleBranch(dialog.Success.NextNodeId);
          }
          if (dialog.Failure) {
            out += `\n${diconPrefix};(If failure)`;
            appendEmptyOutId();
            await handleBranch(dialog.Failure.NextNodeId);
          }
        } else if (dialog.NodeType === 27) {
          for (let next of dialog.NextList) {
            out += `\n${diconPrefix};(Random next)`;
            appendEmptyOutId();
            await handleBranch(next.NextNodeId);
          }
        } else if (dialog.NodeType === 30) {
          out += `\n${diconPrefix};(Confirm popup)`;
          appendEmptyOutId();

          out += `\n${diconPrefix};(Description: ${dialog.Description})`;
          appendOutIdForText(dialog.Description);

          out += `\n${diconPrefix};(Description detail: ${dialog.DescriptionDetail})`;
          appendOutIdForText(dialog.DescriptionDetailText);

          out += `\n${diconPrefix};(On confirm: ${dialog.ConfirmBtnDescText})`;
          appendOutIdForText(dialog.ConfirmBtnDesc);
          await handleBranch(dialog.OnConfirmNext.NextNodeId);

          out += `\n${diconPrefix};(On cancel: ${dialog.CancelBtnDescText})`;
          appendOutIdForText(dialog.CancelBtnDesc);
          await handleBranch(dialog.OnCancelNext.NextNodeId);
        } else if (dialog.NodeType === 31) {
          for (let t of dialog.TransitionList) {
            out += `\n${diconPrefix};(Transition for node type 31)`;
            appendEmptyOutId();
            await handleBranch(t.NextNodeId);
          }
        } else if (dialog.NodeType === 40) {
          for (let t of dialog.ConditionList) {
            out += `\n${diconPrefix};(If condition ${dialog.ConditionKey} equals ${t.Value})`;
            appendEmptyOutId();
            await handleBranch(t.NextNodeId);
          }
        }
      } else if (Z3DialogUtil.isBlackScreen(dialog)) {
        out += `\n${prefix}{{Black Screen|${voPrefix}${text}}}`;
        appendOutIdForSelf();
        appendOutIdsForTextNewLines();
      } else if (Z3DialogUtil.isContentful(dialog)) {
        if (name) {
          out += `\n${prefix}${voPrefix}'''${name}:''' ${text}`;
        } else {
          out += `\n${prefix}${voPrefix}${text}`;
        }
        appendOutIdForSelf();
        appendOutIdsForTextNewLines();
      }

      // Branch Post Handlers
      // ~~~~~~~~~~~~~~~~~~~~
      if (branchIncludedCount === 0 && branchExcludedCount > 0) {
        out += `\n${diconPrefix};(${this.i18n('ReturnToDialogueOption')})`;
        outIds.push(null);
      }
    }
    return {
      wikitext: out.trim(),
      ids: outIds,
    };
  }
  // endregion
}
// endregion
