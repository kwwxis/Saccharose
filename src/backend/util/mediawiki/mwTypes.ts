
// MwNode
//  ├─ MwTextNode
//  │   ├─ MwBlankSpace
//  │   │   ├─ MwComment
//  │   │   └─ MwWhiteSpace
//  │   └─ MwGlyphSpace
//  ├─ MwParent
//      ├─ MwTemplateParam
//      ├─ MwTemplateCall
//      ├─ MwElement
//      │   ├─ MwItalic
//      │   ├─ MwBold
//      │   ├─ MwLink
//      │   ├─ MwHR
//      │   ├─ MwPre
//      │   └─ MwNowiki

import { isInt } from '../../../shared/util/numberUtil';
import { mwSimpleTextParse } from './mwParse';

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
}

// ------------------------------------------------------------------------------------------
export abstract class MwTextNode extends MwNode {
  readonly content;
  protected constructor(content: string) {
    super();
    this.content = content;
  }
  toString(): string {
    return this.content;
  }
}

export abstract class MwBlankSpace extends MwTextNode {
  protected constructor(readonly content: string) {
    super(content);
  }
}
export class MwComment extends MwBlankSpace {
  constructor(content: string) {
    super(content);
  }
}
export class MwWhiteSpace extends MwBlankSpace {
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

  constructor(tagStart: string, tagEnd: string) {
    super();
    this.tagStart = tagStart;
    this.tagEnd = tagEnd;
  }

  toString(): string {
    return this.tagStart + super.toString() + this.tagEnd;
  }
}
export class MwNowiki extends MwElement {
  content: string;
  constructor(tagStart: string, tagContent, tagEnd: string) {
    super(tagStart, tagEnd);
    this.tagName = 'nowiki';
    this.content = tagContent;
  }
  toString(): string {
    return this.tagStart + this.content + this.tagEnd;
  }
}
export class MwLinkNode extends MwParentNode {
  readonly link: string = '';
  linkParts: MwTextNode[] = [];
  hasParams: boolean = false;
  readonly type: MwLinkType;

  constructor(type: MwLinkType, link: string) {
    super();
    this.type = type;
    this.link = link.trim();
    this.linkParts = mwSimpleTextParse(link);
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

// ------------------------------------------------------------------------------------------
export const MW_BEHAVIOR_SWITCHES: string[] = [
  '__NOTOC__', '__FORCETOC__', '__TOC__', '__NOEDITSECTION__', '__NEWSECTIONLINK__', '__NONEWSECTIONLINK__',
  '__NOGALLERY__', '__HIDDENCAT__', '__EXPECTUNUSEDCATEGORY__', '__NOCONTENTCONVERT__', '__NOCC__', '__NOTITLECONVERT__', '__NOTC__',
  '__START__', '__END__', '__INDEX__', '__NOINDEX__', '__STATICREDIRECT__', '__NOGLOBAL__', '__DISAMBIG__',
  '__EXPECTED_UNCONNECTED_PAGE__',
];
export const MW_VARIABLES: Set<string> = new Set<string>([
  'CURRENTYEAR', 'CURRENTMONTH', 'CURRENTMONTH1', 'CURRENTMONTHNAME', 'CURRENTMONTHNAMEGEN', 'CURRENTMONTHABBREV',
  'CURRENTDAY', 'CURRENTDAY2', 'CURRENTDOW', 'CURRENTDAYNAME', 'CURRENTTIME', 'CURRENTHOUR', 'CURRENTWEEK', 'CURRENTTIMESTAMP',

  'LOCALYEAR', 'LOCALMONTH', 'LOCALMONTH1', 'LOCALMONTHNAME', 'LOCALMONTHNAMEGEN', 'LOCALMONTHABBREV',
  'LOCALDAY', 'LOCALDAY2', 'LOCALDOW', 'LOCALDAYNAME', 'LOCALTIME', 'LOCALHOUR', 'LOCALWEEK', 'LOCALTIMESTAMP',

  'SITENAME', 'SERVER', 'SERVERNAME', 'DIRMARK', 'DIRECTIONMARK', 'SCRIPTPATH', 'STYLEPATH', 'CURRENTVERSION',
  'CONTENTLANGUAGE', 'CONTENTLANG', 'PAGEID', 'PAGELANGUAGE', 'PROTECTIONLEVEL', 'PROTECTIONEXPIRY', 'CASCADINGSOURCES',
  'REVISIONID', 'REVISIONDAY', 'REVISIONDAY2', 'REVISIONMONTH', 'REVISIONMONTH1', 'REVISIONYEAR', 'REVISIONTIMESTAMP',
  'REVISIONUSER', 'REVISIONSIZE',
  'DISPLAYTITLE', 'DEFAULTSORT', 'DEFAULTSORTKEY', 'DEFAULTCATEGORYSORT',
  'PAGESINCATEGORY', 'PAGESINCAT', 'NUMBERINGROUP', 'NUMINGROUP', 'PAGESINNS', 'PAGESINNAMESPACE',
  'NUMBEROFPAGES', 'NUMBEROFARTICLES', 'NUMBEROFFILES', 'NUMBEROFEDITS', 'NUMBEROFVIEWS', 'NUMBEROFUSERS', 'NUMBEROFADMINS',
  'NUMBEROFACTIVEUSERS',
  'FULLPAGENAME', 'PAGENAME', 'BASEPAGENAME', 'ROOTPAGENAME', 'SUBPAGENAME', 'SUBJECTPAGENAME', 'ARTICLEPAGENAME',
  'TALKPAGENAME',
  'FULLPAGENAMEE', 'PAGENAMEE', 'BASEPAGENAMEE', 'ROOTPAGENAMEE', 'SUBPAGENAMEE', 'SUBJECTPAGENAMEE', 'ARTICLEPAGENAMEE',
  'TALKPAGENAMEE',
  'NAMESPACE', 'NAMESPACENUMBER', 'SUBJECTSPACE', 'ARTICLESPACE', 'TALKSPACE',
  'NAMESPACEE', 'SUBJECTSPACEE', 'ARTICLESPACEE', 'TALKSPACEE',
  '!', '=',
]);
export class MwParamNode extends MwParentNode {

  /**
   * The key of the parameter.
   * Always a number for anonymous parameters
   * Always a string for numbered and named parameters.
   */
  readonly key: number|string;

  readonly prefix: string = '';

  /**
   * Key parts. Only present for numbered/named parameters.
   */
  keyParts: MwTextNode[] = [];

  constructor(prefix: string, key: string|number, simpleTextValue?: string) {
    super();
    this.prefix = prefix;
    this.key = key;

    if (typeof key === 'string') {
      this.keyParts = mwSimpleTextParse(key);
      this.key = key.trim();
    }
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

  toString() {
    if (this.isAnonymous) {
      return this.prefix + this.value;
    } else {
      return this.prefix + this.keyParts.map(x => x.toString()).join('') + '=' + this.value;
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
}