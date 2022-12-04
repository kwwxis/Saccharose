import { MwParseModule } from '../mwParseModule';
import { MwBehaviorSwitch, MwRedirect } from '../mwTypes';
import { escapeRegExp } from '../../util/stringUtil';
import { mwSimpleTextParse } from '../mwParse';
import { MW_BEHAVIOR_SWITCHES } from '../mwContants';

export function MW_BEHAVIOR_SWITCHES_REGEX(prepend: string = '', append: string = ''): string {
  return MW_BEHAVIOR_SWITCHES.map(scheme => prepend + escapeRegExp(scheme) + append).join('|');
}

export class MwParseSpecialTextModule extends MwParseModule {
  private behaviorSwitchRegex: RegExp = new RegExp(`^(${MW_BEHAVIOR_SWITCHES_REGEX()})`);
  private redirectRegex: RegExp = /^(#REDIRECT\s+)\[\[.*?]]/si;

  offer(ch: string): boolean {
    const ctx = this.ctx;

    if (ch === '_' && this.behaviorSwitchRegex.test(ctx.iter.peek())) {
      // No word boundary for behavior switches, e.g. "foo__TOC__bar" is a valid match
      const match = this.behaviorSwitchRegex.exec(ctx.iter.peek());
      ctx.addNode(new MwBehaviorSwitch(match[0]));
      ctx.iter.skip(match[0].length);
      return true;
    }

    if (this.lineStartMatch(this.redirectRegex)) {
      const match = this.redirectRegex.exec(ctx.iter.peek());
      ctx.addNode(new MwRedirect(mwSimpleTextParse(match[1])));
      ctx.iter.skip(match[1].length);
      return true;
    }

    return false;
  }
}