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
}