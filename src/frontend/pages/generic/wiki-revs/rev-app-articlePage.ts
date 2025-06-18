import './WikiRevisions.styles.scss';
import { genericEndpoints } from '../../../core/endpoints.ts';
import { SITE_MODE } from '../../../core/userPreferences/siteMode.ts';
import { constrainNumber, isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { ScriptJobPostResult, ScriptJobState } from '../../../../backend/util/scriptJobs.ts';
import { MwRevision } from '../../../../shared/mediawiki/mwTypes.ts';
import { escapeHtml } from '../../../../shared/util/stringUtil.ts';
import { humanTiming } from '../../../../shared/util/genericUtil.ts';
import { createElement } from '../../../util/domutil.ts';
import { listen } from '../../../util/eventListen.ts';
import { WikiRevAppState } from './rev-app-main.ts';
import { revSelect } from './rev-app-revPage.ts';
import { templateIcon } from '../../../util/templateIcons.ts';
import { mapBy } from '../../../../shared/util/arrayUtil.ts';
import { OverlayScrollbars } from 'overlayscrollbars';
import { isNightmode } from '../../../core/userPreferences/siteTheme.ts';
import { createRevListHtml } from './util/mwRevItem.ts';
import { ScriptJobPollContext } from '../../../util/ScriptJobPollContext.ts';

let sideOverlayScroll: OverlayScrollbars;

function setInitError(message: string){
  const revHomeEl: HTMLElement = document.getElementById('tabpanel-revHome');
  revHomeEl.innerHTML = `<div class="content"><p class="warn-notice">${escapeHtml(message)}</p></div>`;
}

export async function revAppArticlePage(state: WikiRevAppState, skipArticleCache: boolean = false) {
  if (!isInt(state.pageId)) {
    return;
  }

  const revHomeEl: HTMLElement = document.getElementById('tabpanel-revHome');
  revHomeEl.innerHTML = `
      <div class="content valign">
        <span class="loading x24"></span>
        <span class="loading-label spacer15-left">Posting script job, please wait...</span>
      </div>
  `;

  if (!state.page) {
    setInitError(`Article not found for page ID ${state.pageId}`);
    return;
  }

  let postResult: ScriptJobPostResult<'mwRevSave'>;
  try {
    postResult = await genericEndpoints.simplePostJob.send({action: 'mwRevSave', pageid: state.pageId, siteMode: SITE_MODE, skipArticleCache });
    if (!postResult?.job?.job_id) {
      setInitError(`Script job post failure.`);
      return;
    }
  } catch (e) {
    setInitError(`Script job post failure.`);
    return;
  }

  console.log('Article Info', state.page);
  console.log('Script Job Posted:', postResult.job);

  if (postResult.posted === 'not_needed') {
    revHomeEl.innerHTML = `
      <h3 class="secondary-header">
        <span>Script job run log</span>
        <button id="run-log-expando" class="secondary small collapse-action expanded-state spacer5-left"
                ui-action="expando: #run-log-wrapper">
          <span class="expanded-only">Collapse</span>
          <span class="collapsed-only">Expand</span>
        </button>
      </h3>
      <div id="run-log-wrapper" class="content expanded">
        <p>No need to run job: Saccharose is already at the latest revision for this article.</p>
      </div>
    `;
    await loadRevList(state);
  } else {
    revHomeEl.innerHTML = `
      <h3 class="secondary-header">
        <span>Script job run log</span>
        <button id="run-log-expando" class="secondary small collapse-action expanded-state spacer5-left"
                ui-action="expando: #run-log-wrapper">
          <span class="expanded-only">Collapse</span>
          <span class="collapsed-only">Expand</span>
        </button>
      </h3>
      <div id="run-log-wrapper" class="content expanded">
        <p>Successfully posted script job: ${postResult.message}</p>
        <p>Job ID: <span class="code">${postResult.job.job_id}</span></p>
        <p>You can exit this page and come back if it's taking a while. The job will continue running in the background.</p>
        <div id="run-log" class="code" style="font-size: 12px; line-height: 1.8em; padding: 15px 1px 0"></div>
      </div>
    `;

    new ScriptJobPollContext(
      postResult.job.job_id,
      '#run-log',
      async job => {
        await loadRevList(state);
      },
      null,
      null,
      (job, runLogEl) => {
        return runLogEl.innerHTML.includes('Computing ownership segments') ? 1000 : 200;
      }
    ).start();
  }
}

async function loadRevList(state: WikiRevAppState) {
  window.requestAnimationFrame(() => {
    if (document.querySelector('#run-log-wrapper').classList.contains('expanded')) {
      document.querySelector<HTMLElement>('#run-log-expando').click();
    }
  });

  const revHomeEl: HTMLElement = document.getElementById('tabpanel-revHome');
  const revAppSideContent: HTMLElement = document.querySelector('#revApp-sideContent');

  const revListEl: HTMLElement = createElement('div', {
    id: 'rev-list',
    innerHTML: `
      <h3 class="secondary-header valign">
        <span>Revisions List</span>
      </h3>
      <div class="content valign">
        <p class="info-notice inline grow valign">
          <span class="grow valign">Select a revision below. Results may be cached.
            <span class="valign" ui-tippy-hover="${escapeHtml(JSON.stringify({
              content: `New revisions may not be shown as the latest revision number is cached (${
                isInt(state.page.cacheExpiry) && toInt(state.page.cacheExpiry) >= Date.now()
                  ? 'refreshes in ' + humanTiming(toInt(state.page.cacheExpiry), {suffix: ''})
                  : 'just refreshed'
              }).<br><br>Either wait for it to refresh or click the &quot;Force Refresh&quot; button.`,
              allowHTML: true,
            }))}">${templateIcon('info')}</span>
         </span>
          <button id="rev-force-article-refresh" class="secondary small spacer5-left no-shrink">Force Refresh</button>
        </p>
        <div class="posRel fontWeight500 no-shrink spacer5-left">
          <button class="secondary" ui-action="dropdown: #rev-sort-dropdown">
            <span class="valign">Sort: <strong id="rev-sort-dropdown-current" class="spacer3-horiz">Newest to Oldest</strong> ${templateIcon('chevron-down')}</span>
          </button>
          <div id="rev-sort-dropdown" class="ui-dropdown">
            <div data-value="flexColumnReverse" class="option selected" ui-action="dropdown-item">Newest to Oldest</div>
            <div data-value="flexColumn" class="option" ui-action="dropdown-item">Oldest to Newest</div>
          </div>
        </div>
      </div>
      <div id="rev-list-body" class="content dispFlex flexColumnReverse"></div>
    `
  });
  revHomeEl.append(revListEl);

  const revListBody: HTMLElement = document.querySelector('#rev-list-body');
  const revisions: MwRevision[] = await genericEndpoints.getRevisions.send({ siteMode: SITE_MODE, pageid: state.page.pageid });
  state.pageRevisions = revisions;
  state.revisionsById = mapBy(revisions, 'revid');

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
    },
    {
      selector: '#rev-force-article-refresh',
      event: 'click',
      handle() {
        revAppArticlePage(state, true);
      }
    }
  ], revListEl);

  revListBody.innerHTML = createRevListHtml(state, revisions);
  revAppSideContent.innerHTML = createRevListHtml(state, revisions, true);

  if (sideOverlayScroll) {
    sideOverlayScroll.destroy();
  }
  sideOverlayScroll = OverlayScrollbars(document.querySelector<HTMLElement>('#revApp-sideContent'), {
    scrollbars: {
      theme: isNightmode() ? 'os-theme-light' : 'os-theme-dark',
      autoHide: 'leave'
    },
    overflow: {
      x: 'hidden'
    }
  });

  listen([
    {
      selector: '.mw-rev-open',
      event: 'click',
      multiple: true,
      handle(event, target) {
        event.preventDefault();
        event.stopPropagation();

        const mwRevEl: HTMLElement = target.closest('.mw-rev');
        state.revId = toInt(mwRevEl.getAttribute('data-revid'));
        revSelect(state);
      }
    }
  ]);

  if (state.revId) {
    await revSelect(state);
  } else {
    state.revId = state.page.lastrevid;
    await revSelect(state, false);
  }
}

