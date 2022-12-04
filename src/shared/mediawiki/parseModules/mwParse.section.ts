import { MwParseModule } from '../mwParseModule';
import { MwBehaviorSwitch, MwHeading, MwRedirect, MwSection } from '../mwTypes';
import { mwParse, mwSimpleTextParse } from '../mwParse';

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
 *  - Section title syntax cannot be multi-line but can render as multi-line using `<br />`.
 *      - For example, this is invalid:
 *        ```
 *        ===My Invalid
 *        Section Title===
 *        ```
 *      - But this is valid `===My Valid<br /> Section Title===`
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
  private sectionHeadingRegex: RegExp = /^((={1,6}).*?(={1,6}))(\n|\r\n|$)/;

  // TODO: not functional yet (WIP)
  offer(ch: string): boolean {
    const ctx = this.ctx;

    if (this.lineStartMatch(this.sectionHeadingRegex)) {
      const match = this.sectionHeadingRegex.exec(ctx.iter.peek());
      const headingLevel = Math.min(match[2].length, match[3].length);
      const headingInner = match[1].slice(headingLevel, -headingLevel);

      const section = new MwSection();

      const heading = new MwHeading('H'+headingLevel, '='.repeat(headingLevel), '='.repeat(headingLevel));
      heading.parts = mwParse(headingInner).parts;

      section.parts.push(heading);

      return true;
    }

    return false;
  }


}