import { MetaProp, MetaPropAcceptValue, MetaPropsHelper } from './metaProp.ts';
import { CommonLineId, DialogWikitextResult } from '../../shared/types/common-types.ts';
import { Marker } from '../../shared/util/highlightMarker.ts';
import {
  DialogExcelConfigData,
  TalkExcelConfigData,
} from '../../shared/types/genshin/dialogue-types.ts';

export class DialogueSectionResult {
  id: string = null;
  title: string = '';
  isHtmlTitle: boolean = false;

  headerProps: MetaProp[] = [];
  beginCondProps: MetaProp[] = [];
  finishCondProps: MetaProp[] = [];
  finishExecProps: MetaProp[] = [];
  failCondProps: MetaProp[] = [];
  failExecProps: MetaProp[] = [];

  infoTooltip: string = '';
  htmlMessage: string = null;

  private _wikitext: string = '';
  private _wikitextLineIds: CommonLineId[] = [];
  wikitextMarkers: Marker[] = [];
  wikitextArray: { title?: string, wikitext: string, markers?: Marker[] }[] = [];

  children: DialogueSectionResult[] = [];
  originalData: {
    talkConfig?: TalkExcelConfigData,
    dialogBranch?: DialogExcelConfigData[],
    questId?: number,
    questName?: string
  } = {};
  extraData?: Record<string, any> = {};
  showGutter: boolean = false;
  showTextMapHash: boolean = false;
  similarityGroupId: number = null;
  copyAllSep: string = '\n';

  constructor(id: string, title: string, infoTooltip: string = null) {
    this.id = id;
    this.title = title;
    this.infoTooltip = infoTooltip;
  }

  toJSON(): any {
    return {
      id: this.id,
      title: this.title,
      isHtmlTitle: this.isHtmlTitle,
      headerProps: this.headerProps,
      beginCondProps: this.beginCondProps,
      finishExecProps: this.finishExecProps,
      infoTooltip: this.infoTooltip,
      htmlMessage: this.htmlMessage,
      wikitext: this.wikitext,
      wikitextLineIds: this.wikitextLineIds,
      wikitextMarkers: this.wikitextMarkers,
      wikitextArray: this.wikitextArray,
      originalData: this.originalData,
      showGutter: this.showGutter,
      showTextMapHash: this.showTextMapHash,
      similarityGroupId: this.similarityGroupId,
      copyAllSep: this.copyAllSep,
    };
  }

  get wikitext(): string {
    return this._wikitext;
  }

  get wikitextLineIds(): CommonLineId[] {
    return this._wikitextLineIds;
  }

  clearWikitext() {
    this._wikitext = '';
    this._wikitextLineIds = [];
  }

  setWikitext(result: DialogWikitextResult) {
    this._wikitext = result.wikitext;
    this._wikitextLineIds = result.ids;
  }

  appendEmptyLine() {
    this._wikitext += '\n';
    this._wikitextLineIds.push(null);
  }

  append(item: DialogWikitextResult) {
    if (!this._wikitext.length) {
      this._wikitext += item.wikitext;
    } else {
      this._wikitext += '\n' + item.wikitext;
    }
    this._wikitextLineIds.push(...item.ids);
  }

  prepend(item: DialogWikitextResult) {
    if (!this._wikitext.length) {
      this._wikitext = item.wikitext;
    } else {
      this._wikitext = item.wikitext + '\n' + this._wikitext;
    }
    this._wikitextLineIds.unshift(...item.ids);
  }

  prependFreeForm(text: string) {
    this._wikitext = text + this._wikitext;
    if (text && text.includes('\n')) {
      for (let _m of (text.match(/\n/g) || [])) {
        this._wikitextLineIds.unshift(null);
      }
    }
  }

  appendFreeForm(text: string) {
    this._wikitext += text;
    if (text && text.includes('\n')) {
      for (let _m of (text.match(/\n/g) || [])) {
        this._wikitextLineIds.push(null);
      }
    }
  }

  toString(includeDTemplate: boolean = false): string {
    const sep = this.copyAllSep.replace(/\\n/g, '\n');
    let str = '';

    if (this._wikitext) {
      str += this._wikitext;
    }
    if (this.wikitextArray && this.wikitextArray.length) {
      for (let wikitextArrayElement of this.wikitextArray) {
        str += sep + wikitextArrayElement.wikitext;
      }
    }

    if (this.children && this.children.length) {
      for (let child of this.children) {
        str += sep + child.toString();
      }
    }

    if (includeDTemplate) {
      str = '{{Dialogue Start}}\n' + str.trim() + '\n{{Dialogue End}}';
    }

    return str.trim();
  }

  afterConstruct(fn: (sect: this) => void): this {
    fn(this);
    return this;
  }

  // METADATA
  // --------------------------------------------------------------------------------------------------------------

  addEmptyHeaderProp(label: string) {
    return MetaPropsHelper.of(this.headerProps).addEmptyProp(label);
  }

  getHeaderProp(label: string): MetaProp {
    return MetaPropsHelper.of(this.headerProps).getProp(label);
  }

  getOrCreateHeaderProp(label: string): MetaProp {
    return MetaPropsHelper.of(this.headerProps).getOrCreateProp(label);
  }

  addHeaderProp(label: string, values: MetaPropAcceptValue, link?: string) {
    return MetaPropsHelper.of(this.headerProps).addProp(label, values, link);
  }

  hasHeaderProp(label: string) {
    return MetaPropsHelper.of(this.headerProps).hasProp(label);
  }

  // BEGIN COND PROPS
  // --------------------------------------------------------------------------------------------------------------

  addEmptyBeginCondProp(label: string) {
    return MetaPropsHelper.of(this.beginCondProps).addEmptyProp(label);
  }

  getBeginCondProp(label: string): MetaProp {
    return MetaPropsHelper.of(this.beginCondProps).getProp(label);
  }

  getOrCreateBeginCondProp(label: string): MetaProp {
    return MetaPropsHelper.of(this.beginCondProps).getOrCreateProp(label);
  }

  addBeginCondProp(label: string, values: MetaPropAcceptValue, link?: string) {
    return MetaPropsHelper.of(this.beginCondProps).addProp(label, values, link);
  }

  hasBeginCondProp(label: string) {
    return MetaPropsHelper.of(this.beginCondProps).hasProp(label);
  }

  // FINISH EXEC PROPS
  // --------------------------------------------------------------------------------------------------------------

  addEmptyFinishCondProp(label: string) {
    return MetaPropsHelper.of(this.finishCondProps).addEmptyProp(label);
  }

  getFinishCondProp(label: string): MetaProp {
    return MetaPropsHelper.of(this.finishCondProps).getProp(label);
  }

  getOrCreateFinishCondProp(label: string): MetaProp {
    return MetaPropsHelper.of(this.finishCondProps).getOrCreateProp(label);
  }

  addFinishCondProp(label: string, values: MetaPropAcceptValue, link?: string) {
    return MetaPropsHelper.of(this.finishCondProps).addProp(label, values, link);
  }

  hasFinishCondProp(label: string) {
    return MetaPropsHelper.of(this.finishCondProps).hasProp(label);
  }

  // FINISH EXEC PROPS
  // --------------------------------------------------------------------------------------------------------------

  addEmptyFinishExecProp(label: string) {
    return MetaPropsHelper.of(this.finishExecProps).addEmptyProp(label);
  }

  getFinishExecProp(label: string): MetaProp {
    return MetaPropsHelper.of(this.finishExecProps).getProp(label);
  }

  getOrCreateFinishExecProp(label: string): MetaProp {
    return MetaPropsHelper.of(this.finishExecProps).getOrCreateProp(label);
  }

  addFinishExecProp(label: string, values: MetaPropAcceptValue, link?: string) {
    return MetaPropsHelper.of(this.finishExecProps).addProp(label, values, link);
  }

  hasFinishExecProp(label: string) {
    return MetaPropsHelper.of(this.finishExecProps).hasProp(label);
  }

  // FAIL EXEC PROPS
  // --------------------------------------------------------------------------------------------------------------

  addEmptyFailCondProp(label: string) {
    return MetaPropsHelper.of(this.failCondProps).addEmptyProp(label);
  }

  getFailCondProp(label: string): MetaProp {
    return MetaPropsHelper.of(this.failCondProps).getProp(label);
  }

  getOrCreateFailCondProp(label: string): MetaProp {
    return MetaPropsHelper.of(this.failCondProps).getOrCreateProp(label);
  }

  addFailCondProp(label: string, values: MetaPropAcceptValue, link?: string) {
    return MetaPropsHelper.of(this.failCondProps).addProp(label, values, link);
  }

  hasFailCondProp(label: string) {
    return MetaPropsHelper.of(this.failCondProps).hasProp(label);
  }

  // FAIL EXEC PROPS
  // --------------------------------------------------------------------------------------------------------------

  addEmptyFailExecProp(label: string) {
    return MetaPropsHelper.of(this.failExecProps).addEmptyProp(label);
  }

  getFailExecProp(label: string): MetaProp {
    return MetaPropsHelper.of(this.failExecProps).getProp(label);
  }

  getOrCreateFailExecProp(label: string): MetaProp {
    return MetaPropsHelper.of(this.failExecProps).getOrCreateProp(label);
  }

  addFailExecProp(label: string, values: MetaPropAcceptValue, link?: string) {
    return MetaPropsHelper.of(this.failExecProps).addProp(label, values, link);
  }

  hasFailExecProp(label: string) {
    return MetaPropsHelper.of(this.failExecProps).hasProp(label);
  }
}
