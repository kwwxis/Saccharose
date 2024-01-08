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
import { highlightWikitext } from '../../../core/ace/wikitextEditor.ts';
import { Marker } from '../../../../shared/util/highlightMarker.ts';
import { MwOwnSegment } from '../../../../backend/mediawiki/mwOwnSegmentHolder.ts';
import { IndexedRange, inRange, intersectRange, sort } from '../../../../shared/util/arrayUtil.ts';
import { MouseEvent } from 'react';

pageMatch('vue/WikiRevisionPage', async () => {
  const pageId: number = toInt(document.querySelector<HTMLMetaElement>('meta[name="x-pageid"]')?.content);

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

  await init(pageId);
});

function setInitError(message: string){
  const infoEl: HTMLElement = document.getElementById('tabpanel-revHome');
  infoEl.innerHTML = `<div class="content"><p class="warn-notice">${escapeHtml(message)}</p></div>`;
}

async function init(pageId: number) {
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

  console.log('Script Job Posted:', postResult.job);
  await (new PollContext(page, postResult.job.job_id)).poll();
}

class PollContext {
  private runLogLastSize: number = 0;
  private runLogNumTimesSameSize: number = 0;

  constructor(readonly page: MwArticleInfo, readonly jobId: string) {}

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
      genericEndpoints.getJob.get({ jobId: this.jobId }).then(job => load(this.page, job));
    } else {
      console.log('Script Job Poll:', jobPoll, `Next Poll: ${timeout} ms`);
      setTimeout(() => this.poll(), timeout);
    }
  }
}


async function load(page: MwArticleInfo, job: ScriptJobState<'mwRevSave'>) {
  console.log('Script Job Complete:', job);

  const infoEl: HTMLElement = document.getElementById('tabpanel-revHome');
  const revListEl: HTMLElement = createElement('div', {
    id: 'rev-list',
    innerHTML: `
      <h3 class="secondary-header valign">
        <span>Revisions List</span>
        <span class="grow"></span>
        <div class="posRel fontWeight500">
          <button class="secondary no-active-style small" ui-action="dropdown: #rev-sort-dropdown">
            <span>Sort: <strong id="rev-sort-dropdown-current">Newest to Oldest</strong></span>
          </button>
          <div id="rev-sort-dropdown" class="ui-dropdown">
            <div data-value="flexColumn" class="option" ui-action="close-dropdown">Oldest to Newest</div>
            <div data-value="flexColumnReverse" class="option selected" ui-action="close-dropdown">Newest to Oldest</div>
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
        const parentId: number = toInt(mwRevEl.getAttribute('data-parentid'));
        revSelect(page, revId, parentId);
      }
    }
  ]);

  document.body.append(segmentHoverLabel);
}

let segmentHoverListener: Function = null;
const segmentHoverLabel: HTMLElement = createElement('div', {
  class: 'segment-hover-label hide'
});

async function revSelect(page: MwArticleInfo, revId: number, parentId: number) {
  document.querySelectorAll<HTMLElement>('.curr-rev-id').forEach(el => el.innerText = String(revId));
  document.querySelectorAll<HTMLElement>('.prev-rev-id').forEach(el => el.innerText = String(parentId));

  const tabEl: HTMLButtonElement = document.querySelector('#tab-revSelect');
  tabEl.classList.remove('hide');
  tabEl.click();

  const hasParent: boolean = !isEmpty(parentId) && parentId !== 0;

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

  revDiffEl.innerHTML = '';
  revContentEl.innerHTML = '';
  revPrevContentEl.innerHTML = '';
  revContributorsEl.innerHTML = '';

  const segmentMarkers: Marker[] = revSegmentsToMarkers(rev.content, rev.segments);
  console.log('Segment markers:', segmentMarkers);

  const ownerList: {[owner: string]: number} = defaultMap('Zero');
  for (let segment of rev.segments) {
    ownerList[segment.owner] += segment.value.length;
  }
  revContributorsEl.innerHTML = `
    <div class="valign meta-props">
      <div class="prop">
        <span class="prop-label">Friendship Lv.</span>
        <span class="prop-values">
          <span class="prop-value"><%= fetter.OpenCondsSummary.Friendship %></span>
        </span>
      </div>
    </div>
  `;
  revContributorsEl.innerHTML =
    `<div class="valign meta-props">`
      + sort(Object.entries(ownerList), '0').map(([owner, textSize]) => {
        return `
          <div class="prop">
            <a class="prop-label">${escapeHtml(owner)}</a>
            <span class="prop-values">
              <span>${((textSize / rev.content.length) * 100.0).toFixed(2)}%</span>
            </span>
          </div>
        `;
      }).join('')
    + `</div>`;

  revContentEl.append(
    highlightWikitext(rev.content, true, segmentMarkers)
  );

  revPrevContentEl.append(
    highlightWikitext(rev.prevContent, true)
  );

  if (segmentHoverListener != null) {
    document.removeEventListener('mousemove', segmentHoverListener as any);
  }

  let unhoverTimeout: any = null;

  function segmentUnhover(useTimeout: boolean = true) {
    clearTimeout(unhoverTimeout);

    const action = () => {
      document.querySelectorAll('.owner-segment.active').forEach(el => el.classList.remove('active', 'highlight'));
      segmentHoverLabel.classList.add('hide');
    };

    if (useTimeout) {
      unhoverTimeout = setTimeout(() => action(), 200);
    } else {
      action();
    }
  }

  function segmentHover(el: HTMLElement, pageX: number, pageY: number) {
    segmentUnhover(false);

    const segmentIdx = toInt(el.getAttribute('data-segment-idx'));
    const segment = rev.segments[segmentIdx];

    for (let otherEl of Array.from(document.querySelectorAll(`.owner-segment[data-owner="${escapeHtml(segment.owner)}"]`))) {
      otherEl.classList.add('active', 'highlight');
    }

    segmentHoverLabel.classList.remove('hide');
    segmentHoverLabel.setAttribute('style', `left:${pageX}px;top:${pageY}px`);
    segmentHoverLabel.innerText = segment.owner;
  }

  segmentHoverListener = (e: MouseEvent) => {
    // ClientX/ClientY -> coordinates relative to viewport
    // PageX/PageY -> coordinates relative to page (<html> element)

    // elementsFromPoint takes in coordinates relative to viewport:
    const aceLine: HTMLElement = document.elementsFromPoint(e.clientX, e.clientY).find(el => el.classList.contains('ace_line')) as HTMLElement;
    if (!aceLine) {
      segmentUnhover();
      return;
    }

    const aceLineIdx = Array.from(aceLine.parentElement.children).indexOf(aceLine);
    const aceBackLine = aceLine.closest('.ace_static_highlight').querySelector('.ace_static_marker_back_layer').children.item(aceLineIdx);

    let found: boolean = false;
    for (let el of Array.from(aceBackLine.querySelectorAll<HTMLElement>('.owner-segment'))) {
      const rect = getElementOffset(el); // this returns coordinates relative to page, so we must use pageX/pageY below

      const xRange: IndexedRange = {start: rect.x, end: rect.x + rect.width};
      const yRange: IndexedRange = {start: rect.y, end: rect.y + rect.height};
      if (inRange(e.pageX, xRange) && inRange(e.pageY, yRange)) {
        found = true;
        segmentHover(el, e.pageX, e.pageY);
      }
    }
    if (!found) {
      segmentUnhover();
    }
  };

  document.addEventListener('mousemove', segmentHoverListener as any);
}

function revSegmentsToMarkers(content: string, segments: MwOwnSegment[]): Marker[] {
  const lines = content.split(/\n/g);
  const markers: Marker[] = [];

  let idx = 0;
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];

    const lineRange: IndexedRange = {
      start: idx,
      end: idx + line.length,
    };

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      const intersect = intersectRange(segment, lineRange);
      if (intersect) {
        const relStart = intersect.start - lineRange.start;
        const relEnd = intersect.end - lineRange.start;
        markers.push({
          line: lineIdx + 1,
          startCol: relStart,
          endCol: relEnd,
          token: `owner-segment`,
          attr: {
            'data-owner': segment.owner,
            'data-segment-idx': i
          }
        })
      }
    }

    idx += line.length;
  }

  return markers;
}
