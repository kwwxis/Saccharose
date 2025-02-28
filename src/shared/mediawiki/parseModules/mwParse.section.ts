import { MwParseModule } from '../mwParseModule.ts';
import { MwHeading, MwSection } from '../mwParseTypes.ts';
import { mwParse } from '../mwParse.ts';
import { toInt } from '../../util/numberUtil.ts';

/**
 * Parse module for sections.
 *
 * Rules:
 *  - Must be at start of line, e.g. `===MySection===`, not `  ==My Section==`
 *  - Extraneous characters after the last `=` renders it invalid and to be interpreted as plaintext, e.g. "===MySection=== asdf"
 *  - Extraneous equals signs will be rendered as plaintext at the innermost
 *     - e.g. `====My Section===` would render the section title as `=My Section`
 *     - e.g. `===My Section====` would render the section title as `My Section=`
 *     - e.g  `=======My Section=======` would render the section title as "=My Section="
 *  - Section titles can contain complex nodes such as links, styling (italics, bold), templates, images, etc.
 *  - Section title syntax cannot be multi-line but can render as multi-line using `<br>`.
 *      - For example, this is invalid:
 *        ```
 *        ===My Invalid
 *        Section Title===
 *        ```
 *      - But this is valid `===My Valid<br> Section Title===`
 *  - For the purpose of the Table-of-Contents, nodes that do not have text (e.g. images, BR elements) are ignored.
 *  - Any complex nodes whose syntax is multi-line (e.g. mediawiki syntax for lists and tables) cannot go in a section header.
 *      - But anything you can put in a single line works. For example a list can work via HTML:
 *        `===My Section 2 <ul><li>foo</li><li>bar</li></ul>===`
 *      - Another example:
 *        `===My Section 2 <table class="article-table"><tr><td>Table</td></tr></table>===`
 *
 * Caveats:
 *   - Does not parse section headings in templates. For example, this wiki-text renders three section headings.
 *     The "Sub-Heading 2" is, in-fact, interpreted as a section heading. However, this parser does not evaluate
 *     templates and would not interpret "Sub-Heading 2" as a heading but instead as plaintext.
 *      ```
 *      ==Heading==
 *      {{#if:1|
 *      ==Sub-Heading 2==
 *      |}}
 *      ===Sub-Heading 3===
 *      ```
 */
export class MwParseSectionModule extends MwParseModule {
  private equalsHeadingRegex: RegExp = /^(={1,6})(.*?)(\1)(?=\n|$)/;

  // noinspection RegExpSuspiciousBackref (backref warning not an issue)
  private htmlHeadingRegex: RegExp = /^(<h([1-6])(?:>|\s.*?>))(.*?)(<\/h\2(?:>|\s.*?>))/i;

  offer(ch: string): boolean {
    const ctx = this.ctx;

    if (ctx !== this.ctx.iter.currentContext) {
      return false;
    }

    if (this.lineStartMatch(this.equalsHeadingRegex)) {
      const match = this.equalsHeadingRegex.exec(ctx.iter.peek());
      const fullMatch = match[0];
      const tagStart = match[1];
      const headingLevel = tagStart.length;
      const headingInner = match[2];
      const tagEnd = match[3];
      return this.processMatch(headingLevel, fullMatch, tagStart, headingInner, tagEnd);
    }

    if (this.lineStartMatch(this.htmlHeadingRegex)) {
      const match = this.htmlHeadingRegex.exec(ctx.iter.peek());
      const fullMatch = match[0];
      const tagStart = match[1];
      const headingLevel = toInt(match[2]);
      const headingInner = match[3];
      const tagEnd = match[4];
      return this.processMatch(headingLevel, fullMatch, tagStart, headingInner, tagEnd);
    }

    return false;
  }

  processMatch(headingLevel: number, fullMatch: string, tagStart: string, headingInner: string, tagEnd: string) {
    const ctx = this.ctx;
    const ctxLevel = ctx.node instanceof MwSection ? ctx.node.level : 0;

    if (ctxLevel === headingLevel) {
      ctx.exit();
      ctx.iter.rollback(1);
      return true;
    } else if (ctxLevel) {
      if (headingLevel > ctxLevel) {
      } else {
        ctx.exit();
        ctx.iter.rollback(1);
        return true;
      }
    }

    const heading = new MwHeading('H'+headingLevel, tagStart, tagEnd);
    heading.parts = mwParse(headingInner).parts;

    const section = new MwSection(headingLevel, heading);
    this.ctx.enter(section, null);
    this.ctx.iter.skip(fullMatch);

    return true;
  }


}
