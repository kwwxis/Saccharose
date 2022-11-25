import { MwParseContext } from '../mwParse';
import { MwComment, MwNowiki } from '../mwTypes';
import { MwParseModule } from '../mwParseModule';

export class MwParseHtmlModule extends MwParseModule {
  offer(ch: string): boolean {
    const ctx = this.ctx;
    if (ch === '<') {
      if (ctx.iter.peek(4) === '<!--') {
        let commentStr: string = /^<!--.*?-->/si.exec(ctx.iter.peek())?.[0];
        if (commentStr) {
          ctx.addNode(new MwComment(commentStr));
          ctx.iter.skip(commentStr.length);
          return true;
        }
      }
      if (ctx.iter.peek(8) === '<nowiki>') {
        let nowiki = /^(<nowiki>)(.*?)(<\/nowiki>)/si.exec(ctx.iter.peek());
        if (nowiki) {
          ctx.addNode(new MwNowiki(nowiki[1], nowiki[2], nowiki[3]));
          ctx.iter.skip(nowiki[0].length);
          return true;
        }
      }
    }
    return false;
  }
}