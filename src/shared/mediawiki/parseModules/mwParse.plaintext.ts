import { MwGlyphSpace, MwWhiteSpace } from '../mwTypes';
import { MwParseModule } from '../mwParseModule';

export class MwParsePlaintextModule extends MwParseModule {
  sb_text: string = '';

  isWhitespace(ch: string): boolean {
    return /\s/.test(ch);
  }

  sb_push(): void {
    if (!this.sb_text) {
      return;
    }
    let sbWsMode = this.isWhitespace(this.sb_text.charAt(0));
    if (sbWsMode) {
      this.ctx.addNode(new MwWhiteSpace(this.sb_text), false);
    } else {
      this.ctx.addNode(new MwGlyphSpace(this.sb_text), false);
    }
    this.sb_text = '';
  };

  sb_append(ch: string): void {
    if (!this.sb_text) {
      this.sb_text = ch;
      return;
    }
    let sbWsMode = this.isWhitespace(this.sb_text.charAt(0));
    if (this.isWhitespace(ch)) {
      if (sbWsMode) {
        this.sb_text += ch;
      } else {
        this.ctx.addNode(new MwGlyphSpace(this.sb_text), false);
        this.sb_text = ch;
      }
    } else {
      if (sbWsMode) {
        this.ctx.addNode(new MwWhiteSpace(this.sb_text), false);
        this.sb_text = ch;
      } else {
        this.sb_text += ch;
      }
    }
  }

  offer(ch: string): boolean {
    this.sb_append(ch);
    return true;
  }

  afterParse() {
    this.sb_push();
  }

}