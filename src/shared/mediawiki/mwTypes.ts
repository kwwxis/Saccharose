
// MwNode
//  ├─ MwCharSequence
//  │   ├─ MwBehaviorSwitch
//  │   ├─ MwTextNode
//  │   └─ MwEOL
//  ├─ MwParent
//      ├─ MwTemplateParam
//      ├─ MwTemplateCall
//      ├─ MwElement
//      │   ├─ MwComment
//      │   ├─ MwItalic
//      │   ├─ MwBold
//      │   ├─ MwLink
//      │   ├─ MwHR
//      │   ├─ MwPre
//      │   └─ MwNowiki

import { isInt } from '../util/numberUtil.ts';
import { mwParse, mwSimpleTextParse } from './mwParse.ts';
export abstract class MwNode {
  abstract toString(): string;
  abstract copy(): MwNode;
}

/**
 * An MwNode that can contain children.
 */
export abstract class MwParentNode extends MwNode {
  parts: MwNode[] = [];

  public copyPartsFrom(other: MwParentNode): this {
    this.parts = other.parts.map(part => part.copy());
    return this;
  }

  override toString(): string {
    return this.parts.map(p => p.toString()).join('');
  }

  addNode(node: MwNode) {
    this.parts.push(node);
  }

  indexOf(node: number|MwNode): number {
    let index;
    if (node instanceof MwNode) {
      index = this.parts.indexOf(node);
    } else {
      index = node;
    }
    if (index > this.parts.length - 1) {
      return -1;
    }
    return index;
  }

  insertNodes(index: number, newItems: MwNode[]) {
    this.parts.splice(index, 0, ... newItems);
  }

  removeNodes(nodes: (number|MwNode)[]): boolean {
    return nodes.map(node => this.removeNode(node)).some(res => !!res);
  }

  removeNode(node: number|MwNode): boolean {
    let index = this.indexOf(node);
    if (index > -1) {
      this.parts.splice(index, 1);
      return true;
    }
    return false;
  }

  replaceNode(node: number|MwNode, newNode: MwNode): boolean {
    let index = this.indexOf(node);
    if (index > -1) {
      this.parts[index] = newNode;
      return true;
    }
    return false;
  }

  findTemplateNodes(): MwTemplateNode[] {
    let ret: MwTemplateNode[] = [];
    let stack: MwParentNode[] = [this];
    while (stack.length) {
      let node = stack.pop();
      if (node instanceof MwTemplateNode) {
        ret.push(node);
      }
      for (let child of node.parts) {
        if (child instanceof MwParentNode) {
          stack.push(child);
        }
      }
    }
    return ret;
  }
}

export class MwContainer extends MwParentNode {
  override copy(): MwContainer {
    return new MwContainer().copyPartsFrom(this);
  }
}

// ------------------------------------------------------------------------------------------
export abstract class MwCharSequence extends MwNode {
  content: string;
  protected constructor(content: string) {
    super();
    this.content = content;
  }
  override toString(): string {
    return this.content;
  }
}

export class MwEOL extends MwCharSequence {
  constructor(content: string) {
    super(content);
  }
  override copy(): MwEOL {
    return new MwEOL(this.content);
  }
}
export class MwTextNode extends MwCharSequence {
  constructor(content: string) {
    super(content);
  }
  override copy(): MwTextNode {
    return new MwTextNode(this.content);
  }
}
export class MwBehaviorSwitch extends MwCharSequence {
  constructor(content: string) {
    super(content);
  }
  override copy(): MwBehaviorSwitch {
    return new MwBehaviorSwitch(this.content);
  }
}
// ------------------------------------------------------------------------------------------
export class MwElement extends MwParentNode {
  tagName: string;
  tagStart: string;
  tagEnd: string;

  constructor(tagName: string, tagStart: string, tagEnd: string) {
    super();
    this.tagName = tagName;
    this.tagStart = tagStart;
    this.tagEnd = tagEnd;
  }

  override toString(): string {
    return this.tagStart + super.toString() + this.tagEnd;
  }

  override copy(): MwElement {
    return new MwElement(this.tagName, this.tagStart, this.tagEnd).copyPartsFrom(this);
  }
}
export class MwComment extends MwElement {
  content: string;
  constructor(tagStart: string, tagContent: string, tagEnd: string) {
    super('comment', tagStart, tagEnd);
    this.content = tagContent;
  }
  override toString(): string {
    return this.tagStart + this.content + this.tagEnd;
  }
  override copy(): MwComment {
    return new MwComment(this.tagStart, this.content, this.tagEnd).copyPartsFrom(this);
  }
}
export class MwNowiki extends MwElement {
  content: string;
  constructor(tagStart: string, tagContent: string, tagEnd: string) {
    super('nowiki', tagStart, tagEnd);
    this.content = tagContent;
  }
  override toString(): string {
    return this.tagStart + this.content + this.tagEnd;
  }
  override copy(): MwNowiki {
    return new MwNowiki(this.tagStart, this.content, this.tagEnd).copyPartsFrom(this);
  }
}
export class MwHeading extends MwElement {
  constructor(tagName: string, tagStart: string, tagEnd: string) {
    super(tagName, tagStart, tagEnd);
  }
  getLevel(): number {
    // tagName is always H1, H2, H3, H4, H5, or H6
    return parseInt(this.tagName.slice(1));
  }
  get innerText(): string {
    return this.parts.map(p => p.toString()).join('');
  }
  set innerText(wikitext: string) {
    this.parts = mwParse(wikitext).parts;
  }
  override copy(): MwHeading {
    return new MwHeading(this.tagName, this.tagStart, this.tagEnd).copyPartsFrom(this);
  }
}

export class MwSection extends MwParentNode {
  constructor(readonly level, readonly heading: MwHeading) {
    super();
  }
  override toString(): string {
    return this.heading.toString() + super.toString();
  }
  override copy(): MwSection {
    return new MwSection(this.level, this.heading).copyPartsFrom(this);
  }
}

export class MwLinkNode extends MwParentNode {
  private _link: string = '';
  linkParts: MwCharSequence[] = [];
  hasParams: boolean = false;
  type: MwLinkType;

  constructor(type: MwLinkType, link: string) {
    super();
    this.type = type;
    this.link = link;
  }

  get link() {
    return this._link;
  }

  set link(newLink: string) {
    this._link = newLink.trim();
    this.linkParts = mwSimpleTextParse(newLink);
  }

  get isInternal(): boolean {
    return this.type === 'InternalLink';
  }

  get isExternal(): boolean {
    return this.type === 'ExternalLink';
  }

  get isFile(): boolean {
    return this.type === 'File';
  }

  override toString(): string {
    if (this.type === 'InternalLink' || this.type === 'File') {
      return '[[' + this.linkParts.map(p => p.toString()).join('') + super.toString() + ']]';
    } else if (this.type === 'ExternalLink') {
      return '[' + this.linkParts.map(p => p.toString()).join('') + super.toString() + ']';
    }
  }

  override copy(): MwLinkNode {
    return new MwLinkNode(this.type, this.link).copyPartsFrom(this);
  }
}

export class MwRedirect extends MwParentNode {
  constructor(parts: MwNode[]) {
    super();
    this.parts = parts;
  }
  getLinkNode(): MwLinkNode {
    return this.parts.find(part => part instanceof MwLinkNode) as MwLinkNode;
  }
  override copy(): MwRedirect {
    return new MwRedirect([]).copyPartsFrom(this);
  }
}

export type MwParamNodePrefixType = '|' | ':' | ' ' | '';

export class MwParamNode extends MwParentNode {

  /**
   * The key of the parameter.
   * Always a number for anonymous parameters
   * Always a string for numbered and named parameters.
   */
  private _key: number|string;

  prefix: MwParamNodePrefixType = '';

  beforeValueWhitespace: MwTextNode = new MwTextNode('');
  afterValueWhitespace: MwTextNode = new MwTextNode('');

  /**
   * Key parts. Only present for numbered/named parameters.
   */
  keyParts: MwCharSequence[] = [];

  constructor(prefix: MwParamNodePrefixType, key: string|number, simpleTextValue?: string, beforeValueWhitespace?: string, afterValueWhitespace?: string) {
    super();
    this.prefix = prefix;
    this.key = key;
    if (!!simpleTextValue) {
      this.parts = mwSimpleTextParse(simpleTextValue);
    }
    if (beforeValueWhitespace) {
      this.beforeValueWhitespace.content = beforeValueWhitespace;
    }
    if (afterValueWhitespace) {
      this.afterValueWhitespace.content = afterValueWhitespace;
    }
  }

  override copy(): MwParamNode {
    return new MwParamNode(this.prefix, this.rawKey, null, this.beforeValueWhitespace?.content, this.afterValueWhitespace?.content).copyPartsFrom(this);
  }

  get trimmedValue() {
    return this.value.trim();
  }

  get isAnonymous() {
    return typeof this.key === 'number';
  }

  get isNumbered() {
    return !this.isAnonymous && isInt(this.key);
  }

  get isNamed() {
    return !this.isAnonymous && !isInt(this.key);
  }

  get value() {
    return super.toString();
  }

  set value(wikitext: string) {
    this.parts = mwParse(wikitext).parts;
  }

  get key() {
    return this._key;
  }

  get rawKey(): string {
    return this.keyParts.map(x => x.toString()).join('');
  }

  set key(newKey: number|string) {
    if (typeof newKey === 'string') {
      this.keyParts = mwSimpleTextParse(newKey);
      this._key = newKey.trim();
    } else {
      this._key = newKey;
    }
  }

  override toString() {
    if (this.isAnonymous) {
      return this.prefix + this.beforeValueWhitespace.toString() + this.value + this.afterValueWhitespace.toString();
    } else {
      return this.prefix + this.keyParts.map(x => x.toString()).join('') + '=' + this.beforeValueWhitespace.toString() + this.value + this.afterValueWhitespace.toString();
    }
  }

  _evaluateAfterValueWhitespace(): this {
    const parts: MwNode[] = this.parts;
    const afterValueWhitespace: MwTextNode = new MwTextNode('');

    while (true) {
      if (!parts.length) {
        break;
      }
      const lastPart = parts[parts.length - 1];
      if (lastPart instanceof MwEOL) {
        afterValueWhitespace.content = lastPart.content + afterValueWhitespace.content;
        parts.pop();
        continue;
      }

      if (!(lastPart instanceof MwTextNode)) {
        break;
      }

      if (!/\s*$/.test(lastPart.content)) {
        break;
      }

      if (/^\s*$/.test(lastPart.content)) {
        afterValueWhitespace.content = lastPart.content + afterValueWhitespace.content;
        parts.pop();
        continue;
      }

      const match = /^(.*?)(\s*)$/.exec(lastPart.content);
      afterValueWhitespace.content = match[2] + afterValueWhitespace.content;
      lastPart.content = match[1];
      break;
    }

    this.afterValueWhitespace = afterValueWhitespace;
    return this;
  }
}

export type MwTemplateType = 'Template' | 'Variable' | 'ParserFunction' | 'TemplateParam';
export type MwLinkType = 'InternalLink' | 'ExternalLink' | 'File';
export type MwParamParentType = MwTemplateType | MwLinkType;

export class MwTemplateNode extends MwParentNode {
  templateName: string;
  override parts: MwNode[] = [];
  type: MwTemplateType = 'Template';
  private originalTemplateName: string;

  constructor(templateName: string) {
    super();
    this.originalTemplateName = templateName;
    this.templateName = templateName.trim().replace(/ /g, '_');
    this.addNode(new MwParamNode('', 0, templateName)._evaluateAfterValueWhitespace());
  }

  override toString(): string {
    if (this.type === 'TemplateParam') {
      return '{{{' + super.toString() + '}}}';
    } else {
      return '{{' + super.toString() + '}}';
    }
  }

  override copy(): MwTemplateNode {
    return new MwTemplateNode(this.originalTemplateName).copyPartsFrom(this);
  }

  addParam(param: MwParamNode) {
    this.addNode(param);
  }

  addParamBefore(param: MwParamNode, ref: string | number): boolean {
    const refParam = this.getParam(ref);
    if (refParam) {
      const refIndex = this.indexOf(refParam);
      this.insertNodes(refIndex, [param]);
      return true;
    }
    return false;
  }

  addParamAfter(param: MwParamNode, ref: string | number): boolean {
    const refParam = this.getParam(ref);
    if (refParam) {
      const refIndex = this.indexOf(refParam);
      this.insertNodes(refIndex + 1, [param]);
      return true;
    }
    return false;
  }

  getTemplateNameNode(): MwParamNode {
    return <MwParamNode> this.parts.filter(part => part instanceof MwParamNode && part.key === 0)[0];
  }

  get params(): MwParamNode[] {
    return this.parts.filter(part => part instanceof MwParamNode && part.key !== 0) as MwParamNode[];
  }

  getParam(key: string | number): MwParamNode {
    return key === 0 ? this.getTemplateNameNode() : this.params.find(param => param.key == key);
  }

  getLongestParamKeyLen(ignoring: string[] = []) {
    return Math.max(... this.params
      .filter(p => typeof p.key === 'string' && !ignoring.includes(p.key))
      .map(p => String(p.key).length)
    );
  }

  readjustPropPad(ignoring: string[] = []) {
    const propPad = this.getLongestParamKeyLen(ignoring) + 2;

    for (let param of this.params.filter(p => typeof p.key === 'string')) {
      param.key = String(param.key).padEnd(propPad, ' ');
    }
  }

  removeParam(key: string | number | MwParamNode): MwParamNode {
    let param: MwParamNode = typeof key === 'string' || typeof key === 'number' ? this.getParam(key) : key;
    if (param) {
      this.removeNode(param);
    }
    return param;
  }

  removeParams(keys: (string|number)[]|RegExp) {
    if (keys instanceof RegExp) {
      const regexp: RegExp = keys;
      keys = this.params.filter(p => regexp.test(String(p.key))).map(p => p.key);
    }

    for (let key of keys) {
      this.removeParam(key);
    }
  }
}