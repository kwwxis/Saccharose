import { MwParseContext } from './mwParse.ts';

export abstract class MwParseModule {
  /**
   * The parent context of this parse module.
   */
  readonly ctx: MwParseContext;

  /**
   * If this module is serving as the control module for a parse context, then this will be set to that context.
   */
  controlContext: MwParseContext;

  constructor(context: MwParseContext) {
    this.ctx = context;
  }

  /**
   * As the parse iterator advances through each index in the input string, it'll iterate through every module
   * in the current parse context and call this `offer` method with the character at the current parse index.
   *
   * @param ch The current character. Can also be accessed through `this.ctx.i` or `this.ctx.iter.i`
   * @returns The parse module will return `true` if it accepted the offer, meaning it will not call the `offer` method
   * on any of the remaining modules for the current parse index. If the parse module returns `false`, then it did not
   * accept the offer and the parser will continue to offer the character to the remaining modules until it finds one
   * that accepts the offer. Note that the plaintext module (which is always last), always accepts the offer.
   */
  abstract offer(ch: string): boolean;

  /**
   * After parse hook when this module's parent context exits.
   */
  afterParse(): void {}

  /**
   * If this module is controlling a context, then calling this method will exit out of that context.
   *
   * If this module is not controlling a context, then this method will error.
   */
  exit() {
    this.controlContext.exit();
  }

  /**
   * Returns true if the parse iterator is currently at the start of a line and that the supplied regex matches against
   * a string that includes everything after the start of the new line (including all lines after it)
   */
  lineStartMatch(regex: RegExp): boolean {
    const ctx = this.ctx;
    const prevCh = ctx.i > 0 ? ctx.iter.charAt(ctx.i - 1) : null;

    if (prevCh && regex.test(ctx.iter.peek())) {
      return true;
    }
    // noinspection RedundantIfStatementJS
    if (ctx.i === 0 && regex.test(ctx.iter.slice(ctx.i))) {
      return true;
    }
    return false;
  }
}
