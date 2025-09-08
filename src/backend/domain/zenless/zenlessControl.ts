// noinspection JSUnusedGlobalSymbols

import { AbstractControl } from '../abstract/abstractControl.ts';
import { getZenlessDataFilePath } from '../../loadenv.ts';
import { normalizeRawJson, SchemaTable } from '../../importer/import_db.ts';
import { LangCode, TextMapHash } from '../../../shared/types/lang-types.ts';
import { __normZenlessText, ZenlessNormTextOpts } from './zenlessText.ts';
import { NormTextOptions } from '../abstract/genericNormalizers.ts';
import { zenless_i18n, ZENLESS_I18N_MAP } from '../abstract/i18n.ts';
import { AbstractControlState, ControlUserModeProvider } from '../abstract/abstractControlState.ts';
import { CurrentZenlessVersion, ZenlessVersions } from '../../../shared/types/game-versions.ts';
import { arrayFillRange, arrayIndexOf, arrayIntersect, arrayUnique } from '../../../shared/util/arrayUtil.ts';
import { custom } from '../../util/logger.ts';
import { CommonLineId, DialogWikitextResult } from '../../../shared/types/common-types.ts';
import { DialogueNode } from '../../../shared/types/zenless/dialogue-types.ts';
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
        directory: ENV.ZENLESS_CHANGELOGS,
        textmapEnabled: true,
        excelEnabled: false,
      },
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

  // region Dialog Checks
  isPlayerDialogOption(node: DialogueNode): boolean {
    return [1, 20, 27, 28, 30, 31].includes(node.NodeType);
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
      if (Z3DialogUtil.isContentful(currNode)) {
        currBranch.push(currNode);
      }

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

        const branches: DialogueNode[][] = [];
        for (let nextNode of nextNodes) {
          branches.push(await this.selectDialogBranch(nextNode, Z3DialogBranchingCache.from(cache), debugSource + ':' + start.NodeId));
        }

        const intersect: DialogueNode[] = arrayIntersect<DialogueNode>(branches, this.NodeIdComparator)
          .filter(x => !this.isPlayerDialogOption(x)); // don't rejoin on player dialogue options

        if (!intersect.length) {
          // branches do not rejoin
          currNode.Branches = branches;
          currNode = null;
        } else {
          // branches rejoin
          let rejoinNode = intersect[0];
          for (let i = 0; i < branches.length; i++) {
            let branch = branches[i];
            branches[i] = branch.slice(0, arrayIndexOf(branch, rejoinNode, this.NodeIdComparator));
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
    let out = '';
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

      if (this.isPlayerDialogOption(dialog)) {
        if (originatorDialog && this.isPlayerDialogOption(originatorDialog) && !originatorIsFirstOfBranch) {
          diconPrefix = ':'.repeat(dialogDepth);
        } else if (i === 0 || arrayFillRange(0, i - 1).every(j => this.isPlayerDialogOption(dialogLines[j]))) {
          diconPrefix = ':'.repeat((dialogDepth - 1 ) || 1);
        } else {
          diconPrefix = ':'.repeat(dialogDepth);
        }
      } else {
        diconPrefix = ':'.repeat(dialogDepth);
      }

      let prefix: string = ':'.repeat(dialogDepth);
      let text: string = this.normText(Z3DialogUtil.getContentText(dialog), this.outputLangCode);
      let name = this.normText(Z3DialogUtil.getSpeakerText(dialog), this.outputLangCode);

      // Subsequent Non-Branch Dialogue Options
      // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

      const prevNextNodeIds = previousDialog ? Z3DialogUtil.getNextNodeIds(previousDialog) : [];

      // This is for if you have non-branch subsequent player dialogue options for the purpose of generating an output like:
      // :'''Paimon:''' Blah blah blah
      // :{{DIcon}} Paimon, you're sussy baka
      // ::{{DIcon}} And you're emergency food too
      // :'''Paimon:''' Nani!?!?
      // The second dialogue option is indented to show it is an option that follows the previous option rather than
      // the player being presented with two dialogue options at the same time.
      if (previousDialog

        // Both the previous and current dialogs must be dialog options:
        && this.isPlayerDialogOption(dialog)
        && this.isPlayerDialogOption(previousDialog) &&

        (
          // The previous dialog must only have had 1 next dialog
          prevNextNodeIds.length === 1

          // Or the first dialog of every branch from the previous dialog must be a dialog option
          || previousDialog.Branches?.map(b => b[0]).every(x => this.isPlayerDialogOption(x))
        )

        // The previous dialog's next dialogs must contain current dialog:
        && prevNextNodeIds.some(x => x === dialog.NodeId)) {
        numSubsequentNonBranchPlayerDialogOption++;
      } else {
        numSubsequentNonBranchPlayerDialogOption = 0;
      }

      // Voice-Overs
      // ~~~~~~~~~~~
      let voPrefix = ''; //this.voice.getVoPrefix('Dialog', dialog.NodeId, text, dialog.TalkRole.Type);

      // Output Append
      // ~~~~~~~~~~~~~

      outIds.push({commonId: dialog.NodeId, textMapHash: Z3DialogUtil.getContentTextKey(dialog)});

      if (text && text.includes('\n')) {
        for (let _m of (text.match(/\n/g) || [])) {
          outIds.push(null);
        }
      }

      // if (this.isBlackScreenDialog(dialog)) {
      //   out += `\n${prefix}{{Black Screen|${voPrefix}${text}}}`;
      // }
      out += `\n${prefix}${voPrefix}'''${name}:''' ${text}`;

      // Next Branches
      // ~~~~~~~~~~~~~

      if (dialog.Branches && dialog.Branches.length) {
        let temp = new Set<string>(firstDialogOfBranchVisited);
        for (let dialogBranch of dialog.Branches) {
          if (!dialogBranch.length) {
            continue;
          }
          temp.add(dialogBranch[0].NodeId);
        }

        let excludedCount = 0;
        let includedCount = 0;
        for (let dialogBranch of dialog.Branches) {
          if (!dialogBranch.length) {
            continue;
          }
          if (firstDialogOfBranchVisited.has(dialogBranch[0].NodeId)) {
            excludedCount++;
            continue;
          }
          includedCount++;
          const branchRet = await this.generateDialogueWikitext(dialogBranch, dialogDepth + 1, dialog, i === 0, temp);
          out += '\n' + branchRet.wikitext;
          outIds.push(... branchRet.ids);
        }
        if (includedCount === 0 && excludedCount > 0) {
          out += `\n${diconPrefix};(${this.i18n('ReturnToDialogueOption')})`;
          outIds.push(null);
        }
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
