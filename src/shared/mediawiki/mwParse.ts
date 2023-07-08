import { MwComment, MwGlyphSpace, MwNode, MwParamNode, MwParentNode, MwTextNode, MwWhiteSpace } from './mwTypes';
import { MwParseHtmlModule } from './parseModules/mwParse.html';
import { MwParseTemplateModule } from './parseModules/mwParse.template';
import { MwParsePlaintextModule } from './parseModules/mwParse.plaintext';
import { MwParseModule } from './mwParseModule';
import { MwParseLinkModule } from './parseModules/mwParse.link';
import { isStringBlank } from '../util/stringUtil';
import { MwParseParamModule } from './parseModules/mwParse.param';
import { MwParseSpecialTextModule } from './parseModules/mwParse.specialText';

class MwParseIterator {
  i: number = 0;
  ch: string = null;
  private stack: MwParseContext[] = [];

  constructor(private str) {}

  skip(amount: number|string): void {
    if (typeof amount === 'string') {
      amount = amount.length;
    }
    if (amount <= 1) {
      return;
    }
    this.i += amount - 1;
  }

  rollback(amount: number|string): void {
    if (typeof amount === 'string') {
      amount = amount.length;
    }
    if (amount <= 0) {
      return;
    }
    this.i -= amount;
  }

  peek(limit: number = 0): string {
    return limit <= 0 ? this.str.slice(this.i) : this.str.slice(this.i, this.i + limit);
  }

  charAt(pos: number): string {
    return this.str.charAt(pos);
  }

  slice(startIndex?: number, endIndex?: number): string {
    return this.str.slice(startIndex, endIndex);
  }

  pushContext(node: MwParentNode, controlModule: MwParseModule): MwParseContext {
    let ctx = new MwParseContext(node, controlModule, this);
    this.stack.push(ctx);
    return ctx;
  }

  get currentContext(): MwParseContext {
    return this.stack[this.stack.length - 1];
  }

  popContext(): MwParseContext {
    return this.stack.pop();
  }
}

export class MwParseContext {
  readonly node: MwParentNode;
  readonly iter: MwParseIterator
  readonly modules: MwParseModule[] = [];
  private controlModule: MwParseModule;
  private plaintextModule: MwParsePlaintextModule;

  constructor(node: MwParentNode, controlModule: MwParseModule, iter: MwParseIterator) {
    this.node = node;
    this.iter = iter;

    if (controlModule) {
      this.controlModule = controlModule;
      this.controlModule.controlContext = this;
      this.modules.push(this.controlModule);
    }

    if (controlModule instanceof MwParseTemplateModule) {
      this.modules.push(new MwParseParamModule(this, controlModule.templateNode.type));
    } else if (controlModule instanceof MwParseLinkModule) {
      this.modules.push(new MwParseParamModule(this, controlModule.linkNode.type));
    }

    this.modules.push(new MwParseTemplateModule(this));
    this.modules.push(new MwParseLinkModule(this));


    // if (!controlModule || controlModule instanceof MwParseSectionModule) {
    //   // Do not activate section module unless at top-level or directly under another section.
    //   // In other words, don't try to parse for section headings while inside a template/link/param/etc.
    //   this.modules.push(new MwParseSectionModule(this));
    // }

    this.modules.push(new MwParseSpecialTextModule(this));
    this.modules.push(new MwParseHtmlModule(this));
    this.modules.push(this.plaintextModule = new MwParsePlaintextModule(this));
  }

  get i() {
    return this.iter.i;
  }

  get ch() {
    return this.iter.ch;
  }

  mostRecentNode(): MwNode {
    return this.node.parts.length ? this.node.parts[this.node.parts.length - 1] : null;
  }

  addNode(node: MwNode, pushPlainText: boolean = true) {
    if (pushPlainText) {
      this.plaintextModule.sb_push();
    }
    this.node.addNode(node);
  }

  sb_append(ch: string): void {
    this.plaintextModule.sb_append(ch);
  }

  enter(node: MwParentNode, controlModule: MwParseModule) {
    this.addNode(node);
    this.iter.pushContext(node, controlModule);
  }

  exit() {
    if (this.iter.currentContext === this) {
      this.iter.popContext();
    } else {
      return;
    }
    for (let module of this.modules) {
      module.afterParse();
    }
    if (this.controlModule) {
      this.controlModule.controlContext = null;
    }
  }
}

export function mwSimpleTextParse(str: string): MwTextNode[] {
  let parts: MwTextNode[] = [];
  let strParts = str.split(/(\s+)/g).filter(x => !!x);
  for (let strPart of strParts) {
    if (/\s/.test(strPart[0])) {
      parts.push(new MwWhiteSpace(strPart));
    } else {
      parts.push(new MwGlyphSpace(strPart));
    }
  }
  return parts;
}

// TODO:
//  - template params
//  - italic/bold
//  - section headings
//  - horizontal rule
//  - bulleted/numbered lists
//  - definition lists
//  - html tags (including self-closing, e.g. ref, references)
//  - <pre> blocks (space-prefixed too)
//  - html entities
//  - tables
//  - magic links
//  - interwiki links
//
// https://www.mediawiki.org/wiki/Help:Formatting
// https://www.mediawiki.org/wiki/Help:Links
// https://www.mediawiki.org/wiki/Help:Templates
// https://www.mediawiki.org/wiki/Help:Magic_words
// https://www.mediawiki.org/wiki/Help:Extension:ParserFunctions

export function mwParse(str: string): MwParentNode {
  if (!str) {
    return new MwParentNode();
  }
  if (isStringBlank(str)) {
    let node = new MwParentNode();
    node.addNode(new MwWhiteSpace(str));
    return node;
  }

  str = str.replace(/\r/g, '');

  let iter: MwParseIterator = new MwParseIterator(str);
  let rootContext = iter.pushContext(new MwParentNode(), null);

  for (iter.i = 0; iter.i < str.length; iter.i++) {
    let ctx = iter.currentContext;

    iter.ch = str.charAt(iter.i);

    for (let module of ctx.modules) {
      if (module.offer(iter.ch)) {
        break;
      }
    }
  }

  rootContext.exit();
  return rootContext.node;
}


export function extractTrailingEmptySpaceToParentParts(parent: MwParentNode) {
  let newParts: MwNode[] = [];
  for (let part of parent.parts) {
    if (part instanceof MwParentNode) {
      let inEmptySpace = true;
      let nonEmptySpace = [];
      let trailingEmptySpace = [];
      for (let i = part.parts.length - 1; i >= 0; i--) {
        let paramPart = part.parts[i];
        if (!(paramPart instanceof MwWhiteSpace || paramPart instanceof MwComment)) {
          inEmptySpace = false;
        }
        if (inEmptySpace) {
          trailingEmptySpace.push(paramPart)
        } else {
          nonEmptySpace.push(paramPart);
        }
      }
      part.parts = nonEmptySpace.reverse();
      newParts.push(part);
      newParts.push(... trailingEmptySpace.reverse());
    } else {
      newParts.push(part);
    }
  }
  parent.parts = newParts;
}

(<any> window).mwParse = mwParse;