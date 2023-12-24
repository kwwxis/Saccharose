import { escapeRegExp } from '../../util/stringUtil.ts';
import { MwParseModule } from '../mwParseModule.ts';
import { MwLinkNode, MwLinkType, MwRedirect } from '../mwTypes.ts';
import { MW_URL_SCHEMES } from '../mwContants.ts';

export function MW_URL_SCHEME_REGEX(prepend: string = '', append: string =''): string {
  return MW_URL_SCHEMES.map(scheme => prepend + escapeRegExp(scheme) + append).join('|');
}

/**
 * Returns a regex to check for the start of a link and determine if it's internal or external.
 */
export function MW_LINK_START_REGEX(): RegExp {
  let schemeRegexInternal = MW_URL_SCHEME_REGEX('(\\s*)');
  let schemeRegexExternal = MW_URL_SCHEME_REGEX();

  // use negative lookahead to not match any URL starting with one of the MW_URL_SCHEMES as an internal URL
  let internalLinkPattern = `^(\\[\\[)((?!${schemeRegexInternal}).+?)(\\||\\]\\])`;

  // only match URLs starting with one of the MW_URL_SCHEMES as an external URL
  let externalLinkPattern = `^(\\[)((?:${schemeRegexExternal}).*?)( |\\])`;

  return new RegExp(`${internalLinkPattern}|${externalLinkPattern}`)
}

/**
 * Parser module that handles:
 *   - Internal links e.g. `[[Pagename]]` or `[[Pagename|Go to Pagename]]`
 *   - External links e.g. `[https://www.google.com]` or `[https://www.google.com Go to google]`
 *   - Files e.g. `[[File:MyFile.png]]` or `[[File:MyFile.png|options|caption]]`
 *
 * TODO:
 *   word ending links (link trail rules)
 *   pipe trick (internal links only, doesn't work with anchor links
 *   subpage links? [[/example]] [[../example]]
 *   visible category link [[:Category:Help]] [[:File:Example.jpg]]
 *   bare links
 *   templates in links
 *   interlanguage links [[en:link]] or [[:en:link]]
 *   magic links
 *
 * Caveats:
 *   Templates are assumed to be part of links when unclear.
 *
 */
export class MwParseLinkModule extends MwParseModule {
  linkNode: MwLinkNode = null;

  offer(ch: string): boolean {
    const ctx = this.ctx;

    if (!this.linkNode && ch === '[') {
      let regexResult: string[] = MW_LINK_START_REGEX().exec(ctx.iter.peek())?.filter(x => !!x);
      if (!regexResult) {
        return false;
      }

      const fullMatch = regexResult[0];
      const linkOpen = regexResult[1]; // either "[" or "[["
      const linkText = regexResult[2];
      const linkTextEnd = regexResult[3]; // either "|" or "]]" for internal; and either " " (space) or "]" for external
      let linkType: MwLinkType = linkOpen.length === 1 ? 'ExternalLink' : 'InternalLink';
      if (linkType === 'InternalLink' && linkText.trim().startsWith('File:')) {
        linkType = 'File';
      }

      const linkNode = new MwLinkNode(linkType, linkText);

      if (linkTextEnd.includes(']')) {
        const mostRecentNode = ctx.mostRecentNode();
        if (mostRecentNode instanceof MwRedirect) {
          mostRecentNode.addNode(linkNode);
        } else {
          ctx.addNode(linkNode);
        }
        ctx.iter.skip(fullMatch.length);
      } else {
        this.linkNode = linkNode;
        this.linkNode.hasParams = true;
        ctx.enter(this.linkNode, this);
        ctx.iter.skip(fullMatch.length - linkTextEnd.length);
      }
      return true;
    }

    if (this.linkNode && ch === ']') {
      if (ctx.iter.peek(2) === ']]' && (this.linkNode.isInternal || this.linkNode.isFile)) {
        this.exit();
        ctx.iter.skip(']]');
        this.linkNode = null;
        return true;
      }

      if (this.linkNode.isExternal) {
        this.exit();
        ctx.iter.skip(']');
        this.linkNode = null;
        return true;
      }
    }

    return false;
  }
}
