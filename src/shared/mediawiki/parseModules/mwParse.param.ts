import { MwParseModule } from '../mwParseModule';
import { MwParamNode, MwParamNodePrefixType, MwParamParentType, MwWhiteSpace } from '../mwTypes';
import { MwParseContext } from '../mwParse';

/**
 * This parser module handles parameters for a few different types of nodes:
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
 */
export class MwParseParamModule extends MwParseModule {
  paramNode: MwParamNode = null;
  paramCounter: number = 1;
  anonymousKeyCounter: number = 1;
  parentType: MwParamParentType;
  completed: boolean = false;
  openBraces: number = 0;

  constructor(context: MwParseContext, parentType: MwParamParentType) {
    super(context);
    this.parentType = parentType;
  }

  /**
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

  getEndRegex() {
    if (this.parentType === 'File' || this.parentType === 'InternalLink') {
      return /^]]/;
    } else if (this.parentType === 'ExternalLink') {
      return /^]/;
    } else if (this.parentType === 'TemplateParam') {
      return /^}}}/;
    } else {
      return /^}}/;
    }
  }

  offer(ch: string): boolean {
    if (this.completed) {
      return false;
    }

    const ctx = this.ctx;
    const peek = ctx.iter.peek();

    if (this.paramCounter > 1 && this.getEndRegex().test(peek)) {
      if (this.parentType === 'Template' && this.openBraces > 0 && /^}}}/.test(peek)) {
        // do nothing
      } else if (this.parentType === 'TemplateParam' && this.openBraces > 0 && /^}}}}/.test(peek)) {
        // do nothing
      } else {
        this.completed = true;
        this.exit();
        this.ctx.iter.rollback(1);
        return true;
      }
    }

    if (this.getStartRegex().test(peek)) {
      if (this.paramCounter > 1) {
        this.exit();
      }

      const regexRes = this.getStartRegex().exec(ctx.iter.peek());
      const fullMatch = regexRes[0];
      const isAnonymous = regexRes[3] !== '=' || !/^[a-zA-Z0-9\-_.\s]+$/.test(regexRes[2]);
      const paramKey = isAnonymous ? this.anonymousKeyCounter++ : regexRes[2];

      this.paramNode = new MwParamNode(ch as MwParamNodePrefixType, paramKey);
      this.paramCounter++;

      ctx.enter(this.paramNode, this);

      if (isAnonymous) {
        // If anonymous, only skip past the start character "|" or ":"
        // (In other words, no skip needed since skip(1) has no effect)
        ctx.iter.skip(1);
      } else {
        // If numbered/named, then skip past key and "="
        ctx.iter.skip(fullMatch.length);
      }

      if (/^(\s+)(\S)/.test(this.ctx.iter.peek().slice(1))) {
        const whitespaceRegexRes = /^(\s+)(\S)/.exec(this.ctx.iter.peek().slice(1));
        let whitespace = whitespaceRegexRes[1];

        if (/[|}\]]/.test(whitespaceRegexRes[2])) {
          // Param has no value
          if (whitespace.endsWith('\r\n')) {
            whitespace = whitespace.slice(0, -2);
          } else if (whitespace.endsWith('\n')) {
            whitespace = whitespace.slice(0, -1);
          } else {
            whitespace = null;
          }
        }

        if (whitespace) {
          this.paramNode.beforeValueWhitespace = new MwWhiteSpace(whitespace);
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