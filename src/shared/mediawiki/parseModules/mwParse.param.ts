import { MwParseModule } from '../mwParseModule';
import {
  MwCharSequence,
  MwEOL,
  MwNode,
  MwParamNode,
  MwParamNodePrefixType,
  MwParamParentType,
  MwTextNode,
} from '../mwTypes';
import { MwParseContext } from '../mwParse';

/**
 * This parser module handles parameters for a few different types of parent nodes:
 *   - Templates, e.g. `{{MyTemplate|myParam=myValue}}`
 *   - Variables, e.g. `{{DISPLAYTITLE:foobar}}`
 *   - Parser functions, e.g. `{{#if:x|then Y|else Z}}`
 *   - Template params, e.g. `{{{myParam|default value if no value}}}`
 *   - Links, e.g. `[[My Page|Link text]]` or `[https://www.google.com Go to google]`
 *   - Files, e.g. `[[File:MyImage.png|alt=my alt text]]`
 *
 * There are three types of parameters:
 *  - Anonymous, e.g. `{{MyTemplate|anonymous param value}}`
 *  - Numbered, e.g. `{{MyTemplate|1=my numbered param value}}`
 *  - Named, e.g. `{{MyTemplate|myNamedParam=some value}}`
 *
 * The same MwParseParamModule instance is used across all parameters within the parent node.
 */
export class MwParseParamModule extends MwParseModule {
  /**
   * The current parameter node.
   */
  paramNode: MwParamNode = null;

  /**
   * Counts the number of parameters encountered so far within the parent node.
   */
  paramCounter: number = 1;

  /**
   * The counter the keep track of anonymous keys.
   */
  anonymousKeyCounter: number = 1;

  /**
   * The type of the parent node.
   */
  parentType: MwParamParentType;

  /**
   * Will be set to true if there are no more parameters left to parse within the parent node.
   */
  completed: boolean = false;

  /**
   * The number of open braces.
   */
  openBraces: number = 0;

  constructor(context: MwParseContext, parentType: MwParamParentType) {
    super(context);
    this.parentType = parentType;
  }

  override afterParse() {
    this.finishParam();
  }

  finishParam() {
    if (!this.paramNode) {
      return;
    }
    this.paramNode._evaluateAfterValueWhitespace();
  }

  /**
   * Returns a regex that tests for the start of a new parameter.
   *
   *  - First group: prefix (only allow ":" on first param) - should be identical to "ch"
   *  - Second group: param key or value
   *  - Third group: end character
   */
  getStartRegex() {
    if (this.parentType === 'ExternalLink' && this.paramCounter === 1) {
      // space starts first parameter for external link
      return /^( )(.*?)([|=\]])/s;
    } else if (this.parentType === 'File' || this.parentType === 'InternalLink' || this.parentType === 'ExternalLink') {
      // File/InternalLink parameters and ExternalLink parameters after first param start with "|"
      return /^(\|)(.*?)([|=\]])/s;
    } else if ((this.parentType === 'ParserFunction' || this.parentType === 'Variable') && this.paramCounter === 1) {
      // Only allow ":" prefix for first parameter of parser function or variable
      return /^([|:])(.*?)([|=}])/s;
    } else {
      // Param starts with "|"
      return /^(\|)(.*?)([|=}])/s;
    }
  }

  /**
   * Returns a regex to test the end of the parent node depending on the parent node type.
   */
  getParentEndRegex() {
    if (this.parentType === 'File' || this.parentType === 'InternalLink') {
      return /^]]/; // Files and internal links end with ']]'
    } else if (this.parentType === 'ExternalLink') {
      return /^]/; // External links end with ']'
    } else if (this.parentType === 'TemplateParam') {
      return /^}}}/; // Template params end with '}}}'
    } else {
      return /^}}/; // All else ends with '}}'
    }
  }

  offer(ch: string): boolean {
    if (this.completed) {
      // If we know there are no more parameters left to parse, then always reject the offer
      return false;
    }

    const ctx = this.ctx;
    const peek = ctx.iter.peek();

    // Check if the parent needs to exit:
    if (this.paramCounter > 1 && this.getParentEndRegex().test(peek)) {
      if (this.parentType === 'Template' && this.openBraces > 0 && /^}}}/.test(peek)) {
        // do nothing
      } else if (this.parentType === 'TemplateParam' && this.openBraces > 0 && /^}}}}/.test(peek)) {
        // do nothing
      } else {
        this.completed = true;

        // exit out and return to the context of the parent node
        this.exit();

        // Must roll back 1 character so that the context of the parent node receives the character that is at the
        // start of the end regex, otherwise the parent node's context won't recognize it needs to exit as well.
        this.ctx.iter.rollback(1);
        return true;
      }
    }

    // Check for the start of a new parameter
    if (this.getStartRegex().test(peek)) {
      // The paramCounter initially starts off at 1, so we don't want to call exit() if it's at 1, because that means
      // we haven't added any parameters yet, meaning we're not in a parameter context
      if (this.paramCounter > 1) {
        // If the paramCounter is greater than 1, that means we have already added a parameter node.
        // So we will call exit() to exit out of the context for the most recently added parameter.
        this.exit();
      }

      const regexRes = this.getStartRegex().exec(ctx.iter.peek());
      const fullMatch = regexRes[0];

      // check if this is an anonymous parameter:
      const isAnonymous = regexRes[3] !== '=' || !/^[a-zA-Z0-9\-_.\s]+$/.test(regexRes[2]);

      // Get the parameter key, either a number of anonymous or a string if numbered/named
      const paramKey = isAnonymous ? this.anonymousKeyCounter++ : regexRes[2];

      // Create new parameter node and increment counter
      this.finishParam();
      this.paramNode = new MwParamNode(ch as MwParamNodePrefixType, paramKey);
      this.paramCounter++;

      // Create and enter a new context for the parameter node
      ctx.enter(this.paramNode, this);

      if (isAnonymous) {
        // If anonymous, only skip past the start character "|" or ":"
        // (In other words, no skip needed since skip(1) has no effect)
        ctx.iter.skip(1);
      } else {
        // If numbered/named, then skip past key and "="
        ctx.iter.skip(fullMatch.length);
      }

      // Evaluate the "beforeValueWhitespace"
      // For example, for a template parameter:
      //   - If a parameter is numbered/named, the "beforeValueWhitespace" will be the whitespace between
      //     the "=" and the start of the value
      //   - If a parameter is anonymous, the "beforeValueWhitespace" will be the whitespace between
      //     the "|" and the start of the value
      if (/^(\s+)(\S)/.test(this.ctx.iter.peek().slice(1))) {
        const whitespaceRegexRes = /^(\s+)(\S)/.exec(this.ctx.iter.peek().slice(1));
        let whitespace = whitespaceRegexRes[1];

        if (/[|}\]]/.test(whitespaceRegexRes[2])) {
          // Param has no value
          if (whitespace.endsWith('\n')) {
            whitespace = whitespace.slice(0, -1);
          } else {
            whitespace = null;
          }
        }

        if (whitespace) {
          this.paramNode.beforeValueWhitespace = new MwTextNode(whitespace);
          ctx.iter.skip(whitespace.length + 1);
        }
      }

      return true;
    } else {
      if (ch === '{') {
        this.openBraces++;
      }
      if (ch === '}') {
        this.openBraces--;
      }
    }

    return false;
  }

}