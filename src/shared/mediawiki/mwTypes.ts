
// MwNode
//  ├─ MwTextNode
//  │   ├─ MwBehaviorSwitch
//  │   ├─ MwGlyphSpace
//  │   └─ MwWhiteSpace
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

import { isInt } from '../util/numberUtil';
import { mwParse, mwSimpleTextParse } from './mwParse';

export abstract class MwNode {
  abstract toString(): string;
}

/**
 * An MwNode that can contain children.
 */
export class MwParentNode extends MwNode {
  parts: MwNode[] = [];
  toString(): string {
    return this.parts.map(p => p.toString()).join('');
  }
  addNode(node: MwNode) {
    this.parts.push(node);
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
        if (child instanceof MwTemplateNode) {
          stack.push(child);
        }
      }
    }
    return ret;
  }
}

// ------------------------------------------------------------------------------------------
export abstract class MwTextNode extends MwNode {
  content: string;
  protected constructor(content: string) {
    super();
    this.content = content;
  }
  toString(): string {
    return this.content;
  }
}

export class MwWhiteSpace extends MwTextNode {
  constructor(content: string) {
    super(content);
  }
}
export class MwGlyphSpace extends MwTextNode {
  constructor(content: string) {
    super(content);
  }
}
export class MwBehaviorSwitch extends MwTextNode {
  constructor(content: string) {
    super(content);
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

  toString(): string {
    return this.tagStart + super.toString() + this.tagEnd;
  }
}
export class MwComment extends MwElement {
  content: string;
  constructor(tagStart: string, tagContent: string, tagEnd: string) {
    super('comment', tagStart, tagEnd);
    this.content = tagContent;
  }
  toString(): string {
    return this.tagStart + this.content + this.tagEnd;
  }
}
export class MwNowiki extends MwElement {
  content: string;
  constructor(tagStart: string, tagContent: string, tagEnd: string) {
    super('nowiki', tagStart, tagEnd);
    this.content = tagContent;
  }
  toString(): string {
    return this.tagStart + this.content + this.tagEnd;
  }
}
export class MwHeading extends MwElement {
  constructor(tagName: string, tagStart: string, tagEnd: string) {
    super(tagName, tagStart, tagEnd);
  }
}

export class MwSection extends MwParentNode {
  getHeading(): MwHeading {
    if (!(this.parts[0] instanceof MwHeading)) {
      throw 'Implementation error: first item of parts should be an MwHeading.';
    }
    return this.parts[0];
  }
}

export class MwLinkNode extends MwParentNode {
  private _link: string = '';
  linkParts: MwTextNode[] = [];
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

  toString(): string {
    if (this.type === 'InternalLink' || this.type === 'File') {
      return '[[' + this.linkParts.map(p => p.toString()).join('') + super.toString() + ']]';
    } else if (this.type === 'ExternalLink') {
      return '[' + this.linkParts.map(p => p.toString()).join('') + super.toString() + ']';
    }
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

  beforeValueWhitespace: MwWhiteSpace = new MwWhiteSpace('');

  /**
   * Key parts. Only present for numbered/named parameters.
   */
  keyParts: MwTextNode[] = [];

  constructor(prefix: MwParamNodePrefixType, key: string|number, simpleTextValue?: string) {
    super();
    this.prefix = prefix;
    this.key = key;
    if (!!simpleTextValue) {
      this.parts = mwSimpleTextParse(simpleTextValue);
    }
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

  set key(newKey: number|string) {
    if (typeof newKey === 'string') {
      this.keyParts = mwSimpleTextParse(newKey);
      this._key = newKey.trim();
    } else {
      this._key = newKey;
    }
  }

  toString() {
    if (this.isAnonymous) {
      return this.prefix + this.beforeValueWhitespace.toString() + this.value;
    } else {
      return this.prefix + this.keyParts.map(x => x.toString()).join('') + '=' + this.beforeValueWhitespace.toString() + this.value;
    }
  }
}

export type MwTemplateType = 'Template' | 'Variable' | 'ParserFunction' | 'TemplateParam';
export type MwLinkType = 'InternalLink' | 'ExternalLink' | 'File';
export type MwParamParentType = MwTemplateType | MwLinkType;

export class MwTemplateNode extends MwParentNode {
  templateName: string;
  parts: MwNode[] = [];
  type: MwTemplateType = 'Template';

  constructor(templateName: string) {
    super();
    this.templateName = templateName;
  }

  toString(): string {
    if (this.type === 'TemplateParam') {
      return '{{{' + super.toString() + '}}}';
    } else {
      return '{{' + super.toString() + '}}';
    }
  }

  get params(): MwParamNode[] {
    return this.parts.filter(part => part instanceof MwParamNode && part.key !== 0) as MwParamNode[];
  }

  getParam(key: string | number): MwParamNode{
    return this.params.find(param => param.key == key);
  }
}