import { MetaProp, MetaPropAcceptValue } from './metaProp.ts';
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
  metadata: MetaProp[] = [];
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
  showGutter: boolean = false;
  showTextMapHash: boolean = false;
  similarityGroupId: number = null;
  copyAllSep: string = '\n';

  constructor(id: string, title: string, infoTooltip: string = null) {
    this.id = id;
    this.title = title;
    this.infoTooltip = infoTooltip;
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

  addEmptyMetaProp(label: string) {
    this.metadata.push(new MetaProp(label, null));
  }

  getMetaProp(label: string): MetaProp {
    return this.metadata.find(item => item.label === label);
  }

  getOrCreateMetaProp(label: string): MetaProp {
    let existingProp = this.metadata.find(item => item.label === label);
    if (existingProp) {
      return existingProp;
    } else {
      let newProp = new MetaProp(label);
      this.metadata.push(newProp);
      return newProp;
    }
  }

  addMetaProp(label: string, values: MetaPropAcceptValue, link?: string) {
    if (!values || (Array.isArray(values) && !values.length)) {
      return;
    }
    let newProp = new MetaProp(label, values, link);
    this.metadata.push(newProp);
    return newProp;
  }

  hasMetaProp(label: string) {
    return this.metadata.some(x => x.label === label);
  }
}
