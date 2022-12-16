import { MwParseModule } from '../mwParseModule';
import { MwParamNode, MwParamParentType, MwWhiteSpace } from '../mwTypes';
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
      this.completed = true;
      this.exit();
      this.ctx.iter.rollback(1);
      return true;
    }

    if (this.getStartRegex().test(peek)) {
      if (this.paramCounter > 1) {
        this.exit();
      }

      const regexRes = this.getStartRegex().exec(ctx.iter.peek());
      const fullMatch = regexRes[0];
      const isAnonymous = regexRes[3] !== '=';
      const paramKey = isAnonymous ? this.anonymousKeyCounter++ : regexRes[2];

      this.paramNode = new MwParamNode(ch, paramKey);
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

      if (/^\s+/.test(this.ctx.iter.peek().slice(1))) {
        const whitespaceRegexRes = /^\s+/.exec(this.ctx.iter.peek().slice(1));
        this.paramNode.beforeValueWhitespace = new MwWhiteSpace(whitespaceRegexRes[0]);
        ctx.iter.skip(whitespaceRegexRes[0].length + 1);
      }

      return true;
    }

    return false;
  }

}