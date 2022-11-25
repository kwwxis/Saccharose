import { escapeRegExp } from '../../../../shared/util/stringUtil';
import { mwParse, mwSimpleTextParse } from '../mwParse';
import { MwParseModule } from '../mwParseModule';
import { MwLinkNode, MwLinkType } from '../mwTypes';

export const MW_URL_SCHEMES = [
  'bitcoin:', 'ftp://', 'ftps://', 'geo:', 'git://', 'mvn:', 'gopher://', 'http://',
  'https://', 'irc://', 'ircs://', 'irc6://', 'magnet:', 'mailto:', 'mms://', 'news:', 'itms:', 'market:', 'spotify:', 'steam:',
  'nntp://', 'redis://', 'sftp://', 'sip:', 'sips:', 'sms:', 'ssh://', 'fax:', 'fm:', 'hcp://', 'im:', 'imap://', 'teamspeak://',
  'svn://', 'tel:', 'callto:', 'skype:', 'zoommtg://', 'zoomus://', 'telnet://', 'urn:', 'worldwind://', 'xmpp:','slack://', '//',
];

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
        ctx.addNode(linkNode);
        ctx.iter.skip(fullMatch.length);
        console.log('Template entered and exited:', fullMatch);
      } else {
        this.linkNode = linkNode;
        this.linkNode.hasParams = true;
        ctx.enter(this.linkNode, this);
        ctx.iter.skip(fullMatch.length - linkTextEnd.length);
        console.log('Template entered:', fullMatch);
      }
      return true;
    }

    if (this.linkNode && ch === ']') {
      if (ctx.iter.peek(2) === ']]' && (this.linkNode.isInternal || this.linkNode.isFile)) {
        console.log('Link exited:', this.linkNode.link);
        this.exit();
        ctx.iter.skip(']]');
        this.linkNode = null;
        return true;
      }

      if (this.linkNode.isExternal) {
        console.log('Link exited:', this.linkNode.link);
        this.exit();
        ctx.iter.skip(']');
        this.linkNode = null;
        return true;
      }
    }

    return false;
  }
}