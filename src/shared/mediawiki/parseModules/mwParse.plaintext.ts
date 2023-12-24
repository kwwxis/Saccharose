import { MwTextNode, MwEOL } from '../mwTypes.ts';
import { MwParseModule } from '../mwParseModule.ts';
/**
 * The plaintext module is always last within the parse context, and it *always* accepts the offer.
 * This means that if none of the other modules accepted the offer, then the offered character will be assumed to
 * be plaintext.
 */
export class MwParsePlaintextModule extends MwParseModule {
  buffer: string = '';

  isEol(ch: string): boolean {
    return /\n/.test(ch);
  }

  sb_push(): void {
    if (!this.buffer) {
      return;
    }
    let eolMode = this.isEol(this.buffer.charAt(0));
    if (eolMode) {
      this.ctx.addNode(new MwEOL(this.buffer), false);
    } else {
      this.ctx.addNode(new MwTextNode(this.buffer), false);
    }
    this.buffer = '';
  };

  sb_append(ch: string): void {
    if (!this.buffer) {
      this.buffer = ch;
      return;
    }
    let eolMode = this.isEol(this.buffer.charAt(0));
    if (this.isEol(ch)) {
      if (eolMode) {
        this.buffer += ch;
      } else {
        this.ctx.addNode(new MwTextNode(this.buffer), false);
        this.buffer = ch;
      }
    } else {
      if (eolMode) {
        this.ctx.addNode(new MwEOL(this.buffer), false);
        this.buffer = ch;
      } else {
        this.buffer += ch;
      }
    }
  }

  offer(ch: string): boolean {
    this.sb_append(ch);
    return true;
  }

  override afterParse() {
    this.sb_push();
  }

}