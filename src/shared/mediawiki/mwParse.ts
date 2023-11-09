import {
  MwComment,
  MwEOL,
  MwNode,
  MwParentNode,
  MwSection,
  MwCharSequence,
  MwTextNode, MwContainer,
} from './mwTypes';
import { MwParseHtmlModule } from './parseModules/mwParse.html';
import { MwParseTemplateModule } from './parseModules/mwParse.template';
import { MwParsePlaintextModule } from './parseModules/mwParse.plaintext';
import { MwParseModule } from './mwParseModule';
import { MwParseLinkModule } from './parseModules/mwParse.link';
import { isStringBlank } from '../util/stringUtil';
import { MwParseParamModule } from './parseModules/mwParse.param';
import { MwParseSpecialTextModule } from './parseModules/mwParse.specialText';
import { MwParseSectionModule } from './parseModules/mwParse.section';

// Helpful Documentation:
// https://www.mediawiki.org/wiki/Help:Formatting
// https://www.mediawiki.org/wiki/Help:Links
// https://www.mediawiki.org/wiki/Help:Templates
// https://www.mediawiki.org/wiki/Help:Magic_words
// https://www.mediawiki.org/wiki/Help:Extension:ParserFunctions

/**
 * The iterator on the input string to `mwParse`. There is only one instance of the iterator for a call to `mwParse`.
 * This iterator is shared across all modules and all parse contexts.
 */
export class MwParseIterator {
  /**
   * The parser goes through the input string character-by-character. This `i` variable represents the current index
   * within the input string.
   */
  i: number = 0;

  /**
   * The character at the current index.
   */
  ch: string = null;

  /**
   * The parse context stack. The first element in the stack is always the root context.
   *
   * This stack represents "depth" is added to and removed from as the parser goes through input string.
   *
   * The last element in the stack is the current context.
   *
   * See the documentation on {@link MwParseContext} for more info.
   */
  readonly stack: MwParseContext[] = [];

  constructor(private str) {}

  /**
   * Skip past a certain number of characters in the iterator.
   *
   * This counts the current character as part of the characters that can be skipped. So `skip(1)` will have no effect
   * since the current character will already be skipped at the next parse loop.
   *
   * @param amount The number of characters to skip. Can also supply a string, and it'll skip past the length of that string.
   */
  skip(amount: number|string): void {
    if (typeof amount === 'string') {
      amount = amount.length;
    }
    if (amount <= 1) {
      return;
    }
    this.i += amount - 1;
  }

  /**
   * Roll the iterator back a certain amount of characters.
   * @param amount The number of characters to roll back. Can also supply a string, and it'll roll back the length of that string.
   */
  rollback(amount: number|string): void {
    if (typeof amount === 'string') {
      amount = amount.length;
    }
    if (amount <= 0) {
      return;
    }
    this.i -= amount;
    if (this.i < 0) {
      this.i = 0;
    }
  }

  /**
   * Get a substring of the input string that starts at the current parse index.
   * @param limit Optional limit to the substring. If not supplied, then the substring will end at the end of the input string.
   */
  peek(limit: number = 0): string {
    return limit <= 0 ? this.str.slice(this.i) : this.str.slice(this.i, this.i + limit);
  }

  /**
   * Get a specific character at the supplied index within the input string.
   */
  charAt(pos: number): string {
    return this.str.charAt(pos);
  }

  /**
   * Get a slice of the input string.
   */
  slice(startIndex?: number, endIndex?: number): string {
    return this.str.slice(startIndex, endIndex);
  }

  /**
   * Create and push a new parse context onto the context stack.
   * @param node The node for the new context.
   * @param controlModule The control module for the new context.
   */
  pushContext(node: MwParentNode, controlModule: MwParseModule): MwParseContext {
    let ctx = new MwParseContext(node, controlModule, this);
    this.stack.push(ctx);
    return ctx;
  }

  /**
   * Get the current context (i.e. the last context in the stack).
   */
  get currentContext(): MwParseContext {
    return this.stack[this.stack.length - 1];
  }

  /**
   * Remove and return the last context in the stack. The new last context will become the new current context.
   */
  popContext(): MwParseContext {
    return this.stack.pop();
  }
}

/**
 * Each parse context has a specific node and a specific "control module". The control module is the module that
 * controls this context, meaning it has the highest priority. The control module is generally the module on the parent
 * context that encountered the node for this context. Note that the control module belongs to the parent context,
 * not this context.
 *
 * When the parser encounters a node that needs a parse context, that context is created and added to the stack.
 *
 * When the parser is done parsing that node and all nodes within it, the context is removed from the stack.
 *
 * A node that needs a parse context is a node that can contain other nodes, meaning that the parser should run on
 * the content of that node. For example, template nodes, param nodes, sections, etc.
 *
 * A node that does **not** need a parse context is a node that only has plaintext content.
 *
 * Each parse context has its own modules, and modules are not shared apart from control modules.
 */
export class MwParseContext {
  /**
   * The node for this parse context.
   */
  readonly node: MwParentNode;

  /**
   * The iterator instance.
   */
  readonly iter: MwParseIterator

  /**
   * Modules are invoked by the parser in the order that they are in this array.
   * This means the first module in this array has the highest priority and the last module has the lowest priority.
   */
  readonly modules: MwParseModule[] = [];

  /**
   * The module that is currently controlling this context. Note that this is optional because the root context does
   * not have a control module.
   *
   * If the control module is provided, then it'll also be the first item in the `modules` array because it must have
   * the highest priority.
   *
   * The control module is generally the module on the parent context that encountered the node for this context.
   * Note that the control module belongs to the parent context, not this context.
   *
   * For example, let's say the parse is currently in a template node, then it encounters a parameter node. This means
   * that the current context is controlled by MwParseTemplateModule and the module that encountered the parameter node
   * is the current context's MwParseParamModule. A new context will be created with the newly created parameter node
   * and with the MwParseParamModule serving as the control module of the new context.
   *
   * The new context will become the current context, and the previous current context will be considered the parent
   * context. The "MwParseParamModule" is the control module, but it belongs to the parent context.
   */
  readonly controlModule: MwParseModule;

  /**
   * Instance of the plaintext module for this context.
   */
  readonly plaintextModule: MwParsePlaintextModule;

  /**
   * Construct a new parse context.
   * @param node The node for this parse context.
   * @param controlModule The module that will control this context (optional, can be null/undefined).
   * @param iter The iterator instance.
   */
  constructor(node: MwParentNode, controlModule: MwParseModule, iter: MwParseIterator) {
    this.node = node;
    this.iter = iter;

    // The control module must be added first since it must have the highest priority.
    if (controlModule) {
      this.controlModule = controlModule;
      this.controlModule.controlContext = this;
      this.modules.push(this.controlModule);
    }

    // Only activate param module when the context is controlled by template/link modules
    if (controlModule instanceof MwParseTemplateModule) {
      this.modules.push(new MwParseParamModule(this, controlModule.templateNode.type));
    } else if (controlModule instanceof MwParseLinkModule) {
      this.modules.push(new MwParseParamModule(this, controlModule.linkNode.type));
    }

    // Template/Link modules must come after param module (if param module is active)
    this.modules.push(new MwParseTemplateModule(this));
    this.modules.push(new MwParseLinkModule(this));

    // Do not activate section module unless at top-level (root context) or directly under another section.
    // In other words, don't try to parse for section headings while inside a template/link/param/etc.
    if (!controlModule || controlModule instanceof MwParseSectionModule) {
      this.modules.push(new MwParseSectionModule(this));
    }

    this.modules.push(new MwParseSpecialTextModule(this));
    this.modules.push(new MwParseHtmlModule(this));

    // Plaintext module must always be last
    this.modules.push(this.plaintextModule = new MwParsePlaintextModule(this));
  }

  /**
   * Get the current parse index.
   */
  get i() {
    return this.iter.i;
  }

  /**
   * Get the current parse character.
   */
  get ch() {
    return this.iter.ch;
  }

  /**
   * Get the most node that was mostly recently added to this context. May be null if no nodes have been added yet.
   */
  mostRecentNode(): MwNode {
    return this.node.parts.length ? this.node.parts[this.node.parts.length - 1] : null;
  }

  /**
   * Add a node to this context.
   * @param node The node to add.
   * @param pushPlainText Whether to push the plaintext module's buffer (default: true)
   */
  addNode(node: MwNode, pushPlainText: boolean = true) {
    if (pushPlainText) {
      this.plaintextModule.sb_push();
    }
    this.node.addNode(node);
  }

  /**
   * Append character to the plaintext module's buffer.
   * @param ch Character to append.
   */
  sb_append(ch: string): void {
    this.plaintextModule.sb_append(ch);
  }

  /**
   * Create and add a new context into the parse context stack. This will also call `addNode` with the node supplied,
   * so you shouldn't call `addNode` yourself before calling `enter`.
   *
   * The newly created context will be the last item in the stack, so it'll become the current context.
   *
   * @param node The node to append to this context and to serve as the node for the new context.
   * @param controlModule The module that will control the new context.
   */
  enter(node: MwParentNode, controlModule: MwParseModule) {
    if (this.iter.currentContext !== this) {
      throw 'Internal error: invalid enter() invocation on an MwParseContext that is not the current context. This is a bug in mwParse and is not your fault.';
    }
    this.addNode(node);
    this.iter.pushContext(node, controlModule);
  }

  /**
   * Exit this context if it's the current context (the last context in the stack)
   *
   * If this context is not the current context, then this method will do nothing.
   *
   * Exiting this context will remove it from the stack, and whichever context becomes the new last context in the stack
   * will be the new current context.
   */
  exit() {
    if (this.iter.currentContext === this) {
      // If the current context is this context then remove it from the stack
      this.iter.popContext();
    } else {
      console.trace();
      // Otherwise throw an exception
      throw 'Internal error: invalid exit() invocation on an MwParseContext that is not the current context. This is a bug in mwParse and is not your fault.';
    }
    // This context has finished, so invoke the afterParse hook on every module
    for (let module of this.modules) {
      if (module === this.controlModule) {
        continue; // don't call afterParse on the control module since the control module belongs to the parent context
      }
      module.afterParse();
    }

    if (this.controlModule) {
      // Remove the controlContext reference on the control module.
      // Not really necessary, but may help with garbage collection since this parse context is no longer needed but
      // the control module will still be used by the parent context.
      this.controlModule.controlContext = null;
    }
  }
}

/**
 * Parse a string that is assumed to only contain plaintext.
 * @param str The input string for the parser.
 * @returns MwCharSequence array
 */
export function mwSimpleTextParse(str: string): MwCharSequence[] {
  str = str.replace(/\r/g, '');
  let parts: MwCharSequence[] = [];
  let strParts = str.split(/(\n+)/g).filter(x => !!x);
  for (let strPart of strParts) {
    if (/\n/.test(strPart[0])) {
      parts.push(new MwEOL(strPart));
    } else {
      parts.push(new MwTextNode(strPart));
    }
  }
  return parts;
}

// TODO:
//  - italic/bold
//  - section headings
//  - horizontal rule
//  - bulleted/numbered lists
//  - definition lists
//  - html tags (including self-closing, e.g. ref, references)
//  - <pre> blocks (space-prefixed too)
//  - html entities
//  - tables


/**
 * Parse wikitext.
 * @param str The input string for the parser.
 */
export function mwParse(str: string): MwParentNode {
  if (!str) {
    // If the input string is null/undefined/empty, then return an empty MwParentNode
    return new MwContainer();
  }

  // Remove any '\r' so there's only '\n'
  str = str.replace(/\r/g, '');

  // Create parse iterator
  let iter: MwParseIterator = new MwParseIterator(str);

  // Create root context and add it to the iterator's parse context stack
  // The root context will be always be the first context in the stack and will start off as the only context in the
  // stack, thereby making it the last and current context until more contexts are pushed onto the stack.
  let rootContext = iter.pushContext(new MwContainer(), null);

  // Main parse loop:
  for (iter.i = 0; iter.i < str.length; iter.i++) {
    // Get the current context (the last context in the stack)
    let ctx = iter.currentContext;

    // Get the current character and update `iter.ch`
    iter.ch = str.charAt(iter.i);

    // Loop through each module in the current context and offer the current parse index/character to each module
    // Once a module has "accepted" (returned true) the offer, it'll stop processing the remaining modules and
    // move on to the next index. Note that the plaintext module is always the last module and also will always accept
    // the offer if the plaintext module is reached.
    for (let module of ctx.modules) {
      if (module.offer(iter.ch)) {
        break;
      }
    }
  }

  while (iter.stack.length > 1) {
    const currentCtx = iter.currentContext;
    if (currentCtx.node instanceof MwSection) {
      currentCtx.exit();
    } else {
      throw `Internal error: encountered parse context that did not exit at stack depth ${iter.stack.length + 1}`;
    }
  }

  // Once the loop is finished, exit out of the root context and return the root node (MwParentNode)
  rootContext.exit();
  return rootContext.node;
}