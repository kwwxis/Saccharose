import { MwRevision, MwTagMap } from '../../../../../shared/mediawiki/mwTypes.ts';
import { escapeHtml, toParam } from '../../../../../shared/util/stringUtil.ts';
import { SITE_MODE_WIKI_DOMAIN } from '../../../../core/userPreferences/siteModeInfo.ts';
import { templateIcon } from '../../../../util/templateIcons.ts';
import { isEmpty, timeConvert } from '../../../../../shared/util/genericUtil.ts';
import { WikiRevAppState } from '../rev-app-main.ts';

export function createRevListHtml(state: WikiRevAppState, revisions: MwRevision[], reverse: boolean = false) {
  return (reverse ? revisions.slice().reverse() : revisions).map(rev => {
    const prev: MwRevision = revisions.find(r => r.revid === rev.parentid);
    const prevSize: number = prev ? prev.size : 0;
    const deltaSize: string = (rev.size - prevSize) >= 0 ? `+${rev.size - prevSize}` : String(rev.size - prevSize);

    return `
      <div class="mw-rev" data-revid="${rev.revid}" data-parentid="${rev.parentid}">
        <div class="mw-rev-title valign">
          <div class="mw-rev-titleRow1 valign">
            <a class="mw-rev-open">${rev.revid}: by ${escapeHtml(rev.user)}</a>
            ${rev.minor ? '&nbsp;<span class="fontWeight700" title="Minor change" style="opacity:0.8;font-size:0.95em">(m)</span>' : ''}
          </div>
          <div class="mw-rev-titleRow2 valign grow">
            <span style="opacity:0.75">&nbsp;(${rev.size} bytes)</span>
            <span class="${deltaSize.startsWith('+') ? 'mw-rev-green' : 'mw-rev-red'}">&nbsp;(${deltaSize})</span>
            <span class="grow"></span>
            <a class="mw-rev-openinwiki valign" href="https://${SITE_MODE_WIKI_DOMAIN}/${toParam(state.page.title)}?diff=prev&oldid=${rev.revid}"
              target="_blank">Open in wiki ${templateIcon('external-link')}</a>
          </div>
        </div>
        <div class="mw-rev-subtitle valign">
          <div class="mw-rev-time spacer5-right">${timeConvert(new Date(rev.timestamp))}</div>
          <div class="mw-rev-tags">${isEmpty(rev.tags) ? '(No tags)' : rev.tags.map(tag => MwTagMap[tag] || tag).join(', ')}</div>
        </div>
        <div class="mw-rev-comment">${escapeHtml(rev.comment)}</div>
      </div>
    `;
  }).join('\n');
}
