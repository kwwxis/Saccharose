import { MwParseContext } from './mwParse';

export abstract class MwParseModule {
  readonly ctx: MwParseContext;
  controlContext: MwParseContext;

  constructor(context: MwParseContext) {
    this.ctx = context;
  }

  abstract offer(ch: string): boolean;

  afterParse(): void {}

  exit() {
    this.controlContext.exit();
  }

  lineStartMatch(regex: RegExp) {
    const ctx = this.ctx;
    if (ctx.ch === '\n' && regex.test(ctx.iter.slice(1))) {
      ctx.sb_append('\n');
      ctx.iter.i++;
      return true;
    }
    return false;
  }
}