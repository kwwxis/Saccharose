import { genericEndpoints } from '../../../core/endpoints.ts';
import { SITE_MODE, SITE_MODE_HOME } from '../../../core/userPreferences/siteMode.ts';
import { humanTiming, isEmpty, timeConvert } from '../../../../shared/util/genericUtil.ts';
import { escapeHtml } from '../../../../shared/util/stringUtil.ts';
import { initRevPrevContentTab } from './rev-tabs/revTab-prevContent.ts';
import { WikiRevAppState } from './rev-app-main.ts';
import { initRevContentTab } from './rev-tabs/revTab-content.ts';
import { initRevDiffTab } from './rev-tabs/revTab-diff.ts';
import { moveRevTabWheel } from './rev-tabs/revTab-wheel.ts';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { MwTagMap } from '../../../../shared/mediawiki/mwTypes.ts';

export async function revSelect(state: WikiRevAppState, selectTab: boolean = true) {
  if (!isInt(state.revId)) {
    return;
  }

  if (selectTab) {
    window.history.replaceState({}, null, `${SITE_MODE_HOME}/revs/${state.pageId}/${state.revId}`);
  }
  await fetchRev(state);
  if (!state.rev) {
    console.error('Error: rev not found for ' + state.revId);
    window.history.replaceState({}, null, `${SITE_MODE_HOME}/revs/${state.pageId}`);
    return;
  }
  updateSelectedRevButtonsAndLabels(state, selectTab);
  scrollRevAppSide(state);
  moveRevTabWheel(state, selectTab);
  updateRevProps(state);
  initRevDiffTab(state);
  initRevContentTab(state);
  initRevPrevContentTab(state);
  selectPreferredTab(state);
}

function selectPreferredTab(state: WikiRevAppState) {
  const prefs = state.getPrefs();
  if (prefs.revTabId) {
    document.getElementById(prefs.revTabId)?.click();
  } else {
    // Default to "Rev Diff" tab if no preference
    document.getElementById('tab-revDiff').click();
  }
}

async function fetchRev(state: WikiRevAppState) {
  state.rev = (await genericEndpoints.getRevisions.get({
    siteMode: SITE_MODE,
    revid: state.revId,
    loadMode: 'contentAndPrev',
  }))?.[0];
  console.log('Rev-Select:', state.rev);
}

function updateSelectedRevButtonsAndLabels(state: WikiRevAppState, selectTab: boolean) {
  // Update labels:
  document.querySelectorAll<HTMLElement>('.curr-rev-id').forEach(el => el.innerText = String(state.revId));

  // Update buttons:
  document.querySelectorAll('.mw-rev').forEach(revEl => {
    if (selectTab && toInt(revEl.getAttribute('data-revid')) === state.revId) {
      revEl.classList.add('selected');
    } else {
      revEl.classList.remove('selected');
    }
  });
}

function scrollRevAppSide(state: WikiRevAppState) {
  const sideContent: HTMLElement = document.querySelector('#revApp-sideContent');
  const selectedRevInSide: HTMLElement = sideContent.querySelector('.mw-rev.selected');
  if (!selectedRevInSide) {
    return;
  }
  selectedRevInSide.parentElement.scrollTo({
    left: 0,
    top: Math.max(0, selectedRevInSide.offsetTop - (sideContent.offsetHeight / 2) + (selectedRevInSide.offsetHeight / 2)),
    behavior: 'smooth',
  });
}

function updateRevProps(state: WikiRevAppState) {
  const deltaSize: string = (state.rev.size - state.rev.prevSize) >= 0 ? `+${state.rev.size - state.rev.prevSize}` : String(state.rev.size - state.rev.prevSize);

  const revPropsEl: HTMLElement = document.querySelector('#rev-props');
  revPropsEl.innerHTML = `
  <div class="content">
    <div class="dispFlex alignStart">
      <div class="w50p">
        <dl class="spacer5-right">
          <dt>Revision Author</dt>
          <dd>${escapeHtml(state.rev.user)}</dd>
          <dt>Tags</dt>
          <dd>
            ${state.rev.minor ? '<span class="fontWeight700 spacer5-right" title="Minor change" style="opacity:0.8;font-size:0.95em">(m)</span>' : ''}
            ${isEmpty(state.rev.tags) ? '(No tags)' : state.rev.tags.map(tag => MwTagMap[tag] || tag).join(', ')}
          </dd>
        </dl>
      </div>
      <div class="w50p">
        <dl class="spacer5-left">
          <dt>Revision Time</dt>
          <dd>${timeConvert(new Date(state.rev.timestamp))} (${humanTiming(new Date(state.rev.timestamp))})</dd>
          <dt>Revision Size</dt>
          <dd>${state.rev.size} (<span class="fontWeight600 ${deltaSize.startsWith('+') ? 'mw-rev-green' : 'mw-rev-red'}">${deltaSize}</span>)</dd>
        </dl>
      </div>
    </div>
    <dl class="w100p">
      <dt>Comment</dt>
      <dd>${escapeHtml(state.rev.comment || '(none)')}</dd>
    </dl>
  </div>
  `;
}
