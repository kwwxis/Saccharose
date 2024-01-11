import './WikiRevisions.styles.scss';
import { pageMatch } from '../../../core/pageMatch.ts';
import { startGenericSearchPageListeners } from '../../genericSearchPage.ts';
import { genericEndpoints } from '../../../core/endpoints.ts';
import { SITE_MODE, SITE_MODE_WIKI_DOMAIN } from '../../../core/userPreferences/siteMode.ts';
import { constrainNumber, isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { ScriptJobPostResult, ScriptJobState } from '../../../../backend/util/scriptJobs.ts';
import { MwArticleInfo, MwRevision } from '../../../../shared/mediawiki/mwTypes.ts';
import { escapeHtml, toParam } from '../../../../shared/util/stringUtil.ts';
import { defaultMap, humanTiming, isEmpty, timeConvert } from '../../../../shared/util/genericUtil.ts';
import { createElement, getElementOffset } from '../../../util/domutil.ts';
import { listen } from '../../../util/eventListen.ts';
import { Marker } from '../../../../shared/util/highlightMarker.ts';
import { MwOwnSegment } from '../../../../backend/mediawiki/mwOwnSegmentHolder.ts';
import { IndexedRange, inRange, intersectRange, sort } from '../../../../shared/util/arrayUtil.ts';
import { MouseEvent } from 'react';
import { isNightmode } from '../../../core/userPreferences/siteTheme.ts';
import { highlightWikitext } from '../../../core/ace/aceHighlight.ts';

pageMatch('vue/WikiRevisionPage', async () => {
  const pageId: number = toInt(document.querySelector<HTMLMetaElement>('meta[name="x-pageid"]')?.content);
  const revid: number = toInt(document.querySelector<HTMLMetaElement>('meta[name="x-revid"]')?.content);

  if (!isInt(pageId)) {
    startGenericSearchPageListeners({
      endpoint: genericEndpoints.searchArticles,

      inputs: [
        {
          selector: '.search-input',
          apiParam: 'q',
          queryParam: 'q'
        }
      ],

      submitPendingTarget: '.search-submit-pending',
      submitButtonTarget: '.search-submit',
      resultTarget: '#search-result',

      beforeSendRequest(caller, apiPayload) {
        apiPayload.siteMode = SITE_MODE;
      }
    });
    return;
  }

  await init(pageId, revid);
});

function setInitError(message: string){
  const infoEl: HTMLElement = document.getElementById('tabpanel-revHome');
  infoEl.innerHTML = `<div class="content"><p class="warn-notice">${escapeHtml(message)}</p></div>`;
}

async function init(pageId: number, initialRevId?: number) {
  const infoEl: HTMLElement = document.getElementById('tabpanel-revHome');

  const page: MwArticleInfo = JSON.parse(document.querySelector<HTMLMetaElement>('meta[name="x-page"]')?.content);
  if (!page) {
    setInitError(`Article not found for page ID ${pageId}`);
    return;
  }

  let postResult: ScriptJobPostResult<'mwRevSave'>;
  try {
    postResult = await genericEndpoints.postJob.post({action: 'mwRevSave', pageid: pageId, siteMode: SITE_MODE});
    if (!postResult?.job?.job_id) {
      setInitError(`Script job post failure.`);
      return;
    }
  } catch (e) {
    setInitError(`Script job post failure.`);
    return;
  }

  console.log('Article Info', page);
  console.log('Script Job Posted:', postResult.job);

  if (postResult.posted === 'not_needed') {
    infoEl.innerHTML = `
      <h3 class="secondary-header">Script job run log</h3>
      <div class="content">
        <p>No need to run job: Saccharose is already at the latest revision for this article.</p>
      </div>
      <div id="rev-list"></div>
    `;
    await load(page, initialRevId);
  } else {
    infoEl.innerHTML = `
      <h3 class="secondary-header">Script job run log</h3>
      <div class="content">
        <p>Successfully posted script job: ${postResult.message}</p>
        <p>Job ID: <span class="code">${postResult.job.job_id}</span></p>
        <p>You can exit this page and come back if it's taking a while. The job will continue running in the background.</p>
        <div id="run-log" class="code" style="font-size: 12px; line-height: 1.8em; padding: 15px 1px 0"></div>
      </div>
      <div id="rev-list"></div>
    `;

    await (new PollContext(page, postResult.job.job_id, initialRevId)).poll();
  }
}

class PollContext {
  private runLogLastSize: number = 0;
  private runLogNumTimesSameSize: number = 0;

  constructor(readonly page: MwArticleInfo, readonly jobId: string, readonly initialRevId?: number) {}

  async poll() {
    const jobPoll: Pick<ScriptJobState<'mwRevSave'>, 'job_id' | 'run_complete' | 'run_log' | 'run_end' | 'result_error'>
      = await genericEndpoints.getJob.get({ jobId: this.jobId, fields: 'job_id,run_complete,run_log,run_end,result_error' });

    if (!jobPoll) {
      setTimeout(() => this.poll(), 500);
      return;
    }

    const runLogCurrSize: number = jobPoll.run_log.length;
    const runLogEl: HTMLElement = document.querySelector('#run-log');
    runLogEl.innerHTML = jobPoll.run_log.map(s => `<div>${escapeHtml(s)}</div>`).join('\n');

    if (jobPoll.result_error) {
      runLogEl.innerHTML += `<br /><br /><div>Fatal error:</div><div>${escapeHtml(jobPoll.result_error)}</div>`;
      return;
    }

    if (runLogCurrSize === this.runLogLastSize) {
      this.runLogNumTimesSameSize++;
    } else {
      this.runLogLastSize = runLogCurrSize;
      this.runLogNumTimesSameSize = 0;
    }

    const minTimeout: number = runLogEl.innerHTML.includes('Computing ownership segments') ? 1000 : 200;
    const timeout: number = minTimeout + constrainNumber(this.runLogNumTimesSameSize * 250, 0, 5000);

    if (jobPoll.run_complete && jobPoll.run_end) {
      console.log('Script Job Poll:', jobPoll, `Next Poll: n/a (complete)`);
      genericEndpoints.getJob.get({ jobId: this.jobId }).then(async job => {
        console.log('Script Job Complete:', job);
        await load(this.page, this.initialRevId);
      });
    } else {
      console.log('Script Job Poll:', jobPoll, `Next Poll: ${timeout} ms`);
      setTimeout(() => this.poll(), timeout);
    }
  }
}

async function load(page: MwArticleInfo, initialRevId?: number) {
  const infoEl: HTMLElement = document.getElementById('tabpanel-revHome');
  const chevronDownIconHtml: string = document.getElementById('template-chevron-down').innerHTML;
  const revListEl: HTMLElement = createElement('div', {
    id: 'rev-list',
    innerHTML: `
      <h3 class="secondary-header valign">
        <span>Revisions List</span>
        <span class="grow"></span>
        <div class="posRel fontWeight500">
          <button class="secondary no-active-style small" ui-action="dropdown: #rev-sort-dropdown">
            <span class="valign">Sort: <strong id="rev-sort-dropdown-current" class="spacer3-horiz">Newest to Oldest</strong> ${chevronDownIconHtml}</span>
          </button>
          <div id="rev-sort-dropdown" class="ui-dropdown">
            <div data-value="flexColumnReverse" class="option selected" ui-action="close-dropdown">Newest to Oldest</div>
            <div data-value="flexColumn" class="option" ui-action="close-dropdown">Oldest to Newest</div>
          </div>
        </div>
      </h3>
      <div class="content">
        <p class="info-notice">Select a revision below.</p>
      </div>
      <div id="rev-list-body" class="content dispFlex flexColumnReverse"></div>
    `
  });
  infoEl.append(revListEl);

  const revListBody: HTMLElement = document.querySelector('#rev-list-body');
  const revisions: MwRevision[] = await genericEndpoints.getRevisions.get({ siteMode: SITE_MODE, pageid: page.pageid });
  const extLinkIconHtml: string = document.getElementById('template-external-link-icon').innerHTML;

  listen([
    {
      selector: '#rev-sort-dropdown .option',
      event: 'click',
      multiple: true,
      handle(event, target) {
        document.querySelectorAll('#rev-sort-dropdown .option').forEach(el => el.classList.remove('selected'));
        target.classList.add('selected');
        document.querySelector<HTMLElement>('#rev-sort-dropdown-current').innerText = target.innerText;

        if (target.getAttribute('data-value') === 'flexColumn') {
          revListBody.classList.add('flexColumn');
          revListBody.classList.remove('flexColumnReverse');
        }

        if (target.getAttribute('data-value') === 'flexColumnReverse') {
          revListBody.classList.add('flexColumnReverse');
          revListBody.classList.remove('flexColumn');
        }
      }
    }
  ], revListEl);

  revListBody.innerHTML = revisions.map(rev => {
    return `
      <div class="mw-rev" data-revid="${rev.revid}" data-parentid="${rev.parentid}">
        <div class="mw-rev-title valign">
          <a class="mw-rev-open">${rev.revid}: by ${escapeHtml(rev.user)}${rev.minor ? ' (minor)' : ''}</a>
          <span class="grow"></span>
          <a class="mw-rev-openinwiki valign" href="https://${SITE_MODE_WIKI_DOMAIN}/${toParam(page.title)}?diff=prev&oldid=${rev.revid}" target="_blank">Open in wiki ${extLinkIconHtml}</a>
        </div>
        <div class="mw-rev-time">${timeConvert(new Date(rev.timestamp))}</div>
        <div class="mw-rev-comment">${escapeHtml(rev.comment)}</div>
      </div>
    `;
  }).join('\n');

  listen([
    {
      selector: '.mw-rev-open',
      event: 'click',
      multiple: true,
      handle(event, target) {
        event.preventDefault();
        event.stopPropagation();

        const mwRevEl: HTMLElement = target.closest('.mw-rev');
        const revId: number = toInt(mwRevEl.getAttribute('data-revid'));
        revSelect(page, revisions, revId);
      }
    }
  ]);

  document.body.append(segmentHoverLabel);

  if (initialRevId) {
    await revSelect(page, revisions, initialRevId);
  }
}

let segmentHoverListener: Function = null;
const segmentHoverLabel: HTMLElement = createElement('div', {
  class: 'segment-hover-label',
  style: 'opacity:0'
});

async function revSelect(page: MwArticleInfo, pageRevisions: MwRevision[], revId: number) {
  const parentId: number = pageRevisions.find(r => r.revid === revId).parentid;
  document.querySelectorAll<HTMLElement>('.curr-rev-id').forEach(el => el.innerText = String(revId));
  document.querySelectorAll<HTMLElement>('.prev-rev-id').forEach(el => el.innerText = String(parentId));

  const tabEl: HTMLButtonElement = document.querySelector('#tab-revSelect');
  tabEl.classList.remove('hide');
  tabEl.click();

  const rev: MwRevision = (await genericEndpoints.getRevisions.get({
    siteMode: SITE_MODE,
    revid: revId,
    loadMode: 'contentAndPrev'
  }))?.[0];

  console.log('Rev-Select:', rev);

  const revPropsEl: HTMLElement = document.querySelector('#rev-props');
  revPropsEl.innerHTML = `
  <div class="content">
    <dl>
      <dt>Revision Time</dt>
      <dd>${timeConvert(new Date(rev.timestamp))} (${humanTiming(new Date(rev.timestamp))})</dd>
      <dt>Revision Size</dt>
      <dd>${rev.size}</dd>
      <dt>Comment</dt>
      <dd>${escapeHtml(rev.comment)}</dd>
    </dl>
  </div>
  `;

  const revDiffEl: HTMLElement = document.querySelector('#rev-diff');
  const revContentEl: HTMLElement = document.querySelector('#rev-content');
  const revPrevContentEl: HTMLElement = document.querySelector('#rev-prev-content');
  const revContributorsEl: HTMLElement = document.querySelector('#rev-contributors');
  const revContributorsSortMenuEl: HTMLElement = document.querySelector('#rev-contributors-sort-menu');

  revDiffEl.innerHTML = '';
  revContentEl.innerHTML = '';
  revPrevContentEl.innerHTML = '';
  revContributorsEl.innerHTML = '';

  const segmentMarkers: Marker[] = revSegmentsToMarkers(rev.content, rev.segments);

  const ownerList: {[owner: string]: {owner: string, textSize: number}} = defaultMap((owner: string) => ({ owner, textSize: 0 }));
  for (let segment of rev.segments) {
    ownerList[segment.owner].textSize += segment.value.length;
  }
  function setOwnersListHtml(sortField: 'owner' | '-owner' | 'textSize' | '-textSize') {
    revContributorsEl.innerHTML =
      `<div class="valign meta-props">`
      + sort(Object.values(ownerList), sortField).map(item => {
        return `
          <div class="prop">
            <a class="prop-label">${escapeHtml(item.owner)}</a>
            <span class="prop-values">
              <span>${((item.textSize / rev.content.length) * 100.0).toFixed(2)}%</span>
            </span>
          </div>
        `;
      }).join('')
      + `</div>`;
  }

  const chevronDownIconHtml: string = document.getElementById('template-chevron-down').innerHTML;
  revContributorsSortMenuEl.innerHTML = `
    <button class="secondary no-active-style small" ui-action="dropdown: #rev-contributors-sort-dropdown">
      <span class="valign">Sort: <strong id="rev-contributors-sort-dropdown-current" class="spacer3-horiz">Percentage (desc.)</strong> ${chevronDownIconHtml}</span>
    </button>
    <div id="rev-contributors-sort-dropdown" class="ui-dropdown">
      <div data-value="-textSize" class="option selected" ui-action="close-dropdown">Percentage (desc.)</div>
      <div data-value="textSize" class="option" ui-action="close-dropdown">Percentage (asc.)</div>
      <div data-value="owner" class="option" ui-action="close-dropdown">Username (A to Z)</div>
      <div data-value="-owner" class="option" ui-action="close-dropdown">Username (Z to A)</div>
    </div>
  `;

  listen([
    {
      selector: '#rev-contributors-sort-dropdown .option',
      event: 'click',
      multiple: true,
      handle(_event, target) {
        document.querySelectorAll('#rev-contributors-sort-dropdown .option').forEach(el => el.classList.remove('selected'));
        document.getElementById('rev-contributors-sort-dropdown-current').innerText = target.innerText;
        target.classList.add('selected');
        setOwnersListHtml(target.getAttribute('data-value') as any);
      }
    }
  ], revContributorsSortMenuEl);

  setOwnersListHtml('-textSize');

  revContentEl.append(
    highlightWikitext({
      text: rev.content,
      gutters: true,
      markers: segmentMarkers
    })
  );

  revPrevContentEl.append(
    highlightWikitext({
      text: rev.prevContent,
      gutters: true
    })
  );

  if (segmentHoverListener != null) {
    document.removeEventListener('mousemove', segmentHoverListener as any);
  }

  let unhoverTimeout: any = null;
  let unhoverTimeout2: any = null;

  function segmentUnhover() {
    clearTimeout(unhoverTimeout);
    clearTimeout(unhoverTimeout2);

    unhoverTimeout = setTimeout(() => {
      setHighlightOwner(null);
    }, 70);

    unhoverTimeout2 = setTimeout(() => {
      segmentHoverLabel.style.setProperty('opacity', '0');
      segmentHoverLabel.classList.remove('active');
    }, 10);
  }

  function segmentHover(el: HTMLElement) {
    clearTimeout(unhoverTimeout);
    clearTimeout(unhoverTimeout2);

    const segmentIdx = toInt(el.getAttribute('data-segment-idx'));
    const segment = rev.segments[segmentIdx];
    if (!segment) {
      console.log('no segment', el);
    }

    setHighlightOwner(segment.owner);
    segmentHoverLabel.innerText = segment.owner;
    segmentHoverLabel.classList.add('active');
    segmentHoverLabel.style.setProperty('opacity', '1');
  }

  segmentHoverListener = (e: MouseEvent) => {
    // ClientX/ClientY -> coordinates relative to viewport
    // PageX/PageY -> coordinates relative to page (<html> element)

    segmentHoverLabel.style.setProperty('left', e.clientX+'px');
    segmentHoverLabel.style.setProperty('top', e.clientY+'px');

    // elementFromPoint takes in coordinates relative to viewport:
    const aceToken: HTMLElement = document.elementFromPoint(e.clientX, e.clientY)?.closest('.owner-segment') as HTMLElement;
    if (!aceToken) {
      segmentUnhover();
      return;
    } else {
      segmentHover(aceToken);
    }
  };

  document.addEventListener('mousemove', segmentHoverListener as any);
}

function setHighlightOwner(ownerName: string) {
  let style: HTMLStyleElement = document.getElementById('rev-highlight-style') as HTMLStyleElement;
  if (!ownerName) {
    if (style)
      style.remove();
    return;
  }
  if (!style) {
    style = document.createElement('style');
    style.id = 'rev-highlight-style';
    document.head.append(style);
  }
  if (isNightmode()) {
    style.textContent = `
    body.nightmode .owner-segment[data-owner="${CSS.escape(ownerName)}"] {
      background: hsl(41deg 78% 75% / 20%);
      transition: background 20ms linear;
    }
    `;
  } else {
    style.textContent = `
    .owner-segment[data-owner="${CSS.escape(ownerName)}"] {
      background: #fcfc64;
      transition: background 20ms linear;
    }
    `;
  }
}

/**
 * @example
 *
 * skipLinesKeepNL('lorem\nipsum\n\n\nfoobar')
 *
 * => [
 *   'lorem\n',
 *   'ipsum\n',
 *   '\n',
 *   '\n',
 *   'foobar'
 * ]
 */
function splitLinesKeepNL(content: string) {
  const contentSplit: string[] = content.split(/(\r?\n)/g);
  const out: string[] = [];
  for (let s of contentSplit) {
    if (/^[\r\n]+$/.test(s)) {
      if (out.length) {
        out[out.length - 1] += s;
      } else {
        out.push(s);
      }
    } else {
      out.push(s);
    }
  }
  return out.filter(s => !!s.length);
}

function revSegmentsToMarkers(content: string, segments: MwOwnSegment[]): Marker[] {
  const lines: string[] = splitLinesKeepNL(content);
  const markers: Marker[] = [];

  let idx: number = 0;
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line: string = lines[lineIdx];
    const lineLength: number = line.length;

    const lineRange: IndexedRange = {
      start: idx,
      end: idx + lineLength,
    };

    for (let i = 0; i < segments.length; i++) {
      const segment: MwOwnSegment = segments[i];

      const intersect: IndexedRange = intersectRange(segment, lineRange);
      if (intersect) {
        const relStart = intersect.start - lineRange.start;
        const relEnd = intersect.end - lineRange.start;
        const marker = new Marker('owner-segment', lineIdx + 1, relStart, relEnd, {
          'data-owner': segment.owner,
          'data-segment-idx': i
        });
        markers.push(marker);
        if (segment.owner === 'Funds' && segment.value.startsWith(' After the war')) {
          console.log('Funds', {segment, intersect, relStart, relEnd, line, marker});
        }
      }
    }

    idx += lineLength;
  }

  return markers;
}
