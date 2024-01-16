// noinspection CssUnusedSymbol

import { WikiRevAppState } from '../rev-app-main.ts';
import { isNightmode } from '../../../../core/userPreferences/siteTheme.ts';
import { MwOwnSegment } from '../../../../../backend/mediawiki/mwOwnSegmentHolder.ts';
import { Marker } from '../../../../../shared/util/highlightMarker.ts';
import { IndexedRange, intersectRange, sort } from '../../../../../shared/util/arrayUtil.ts';
import { defaultMap } from '../../../../../shared/util/genericUtil.ts';
import { escapeHtml } from '../../../../../shared/util/stringUtil.ts';
import { listen, runWhenDOMContentLoaded } from '../../../../util/eventListen.ts';
import { highlightWikitext } from '../../../../core/ace/aceHighlight.ts';
import { toInt } from '../../../../../shared/util/numberUtil.ts';
import { clearElements, createElement, frag1 } from '../../../../util/domutil.ts';
import { createRevListHtml } from '../util/mwRevItem.ts';

// region Entrypoint
// --------------------------------------------------------------------------------------------------------------
export function initRevContentTab(state: WikiRevAppState) {
  clearElements('#rev-content-header', '#rev-content');
  initMainContent(state);
  initOwnerList(state);
  initSegmentHover(state);
}
// endregion

// region Owner List
// --------------------------------------------------------------------------------------------------------------
type RevOwnerList = { [owner: string]: { owner: string, textSize: number } };

function buildOwnerList(state: WikiRevAppState): RevOwnerList {
  const ownerList: RevOwnerList = defaultMap((owner: string) => ({
    owner,
    textSize: 0,
  }));

  for (let segment of state.rev.segments) {
    ownerList[segment.owner].textSize += segment.value.length;
  }

  return ownerList;
}

function initOwnerList(state: WikiRevAppState) {
  const ownerList: RevOwnerList = buildOwnerList(state);

  listen([
    {
      event: 'click',
      selector: '.rev-contributor',
      multiple: true,
      handle(_event, target) {
        if (target.classList.contains('selected')) {
          return;
        }

        document.querySelectorAll('.rev-contributor').forEach(el => el.classList.remove('selected'));
        target.classList.add('selected');

        const mode = target.getAttribute('data-highlight-mode');

        if (mode === 'none') {
          state.applyPrefs({ diffHighlightHover: false });
          setTimeout(() => {
            setHighlightOwner(null);
          });
        } else if (mode === 'hover') {
          state.applyPrefs({ diffHighlightHover: true });
          setTimeout(() => {
            setHighlightOwner(null);
          });
        } else if (mode === 'owner') {
          state.applyPrefs({ diffHighlightHover: null });
          setTimeout(() => {
            setHighlightOwner(target.getAttribute('data-owner'));
          })
        }
      }
    }
  ], frag1(`
    <div class="content">
      <div class="rev-contributors dispFlex alignStart flexWrap">
        <button data-highlight-mode="none" class="rev-contributor secondary${!state.getPrefs().diffHighlightHover ? ' selected' : ''}">
          <span class="rev-contributor-name">No Highlight</span>
        </button>
        <button data-highlight-mode="hover" class="rev-contributor secondary${state.getPrefs().diffHighlightHover ? ' selected' : ''}"
              ui-tippy-hover="{content: '<div class=&quot;spacer10-bottom&quot;><strong>Yellow:</strong> same edit<br /></div><strong>Blue:</strong> other edits by same user', allowHTML: true}">
          <span class="rev-contributor-name">Hover Highlight</span>
        </button>
        ${sort(Object.values(ownerList), '-textSize').map(item => `
          <button data-highlight-mode="owner" data-owner="${escapeHtml(item.owner)}" class="rev-contributor secondary">
            <span class="rev-contributor-name">${escapeHtml(item.owner)}</span>
            <span class="rev-contributor-percent secondary-label">${((item.textSize / state.rev.content.length) * 100.0).toFixed(2)}%</span>
          </button>
        `).join('')}
      </div>
    </div>
  `)).appendRelTo('#rev-content-header');
}
// endregion

// region Main Content
// --------------------------------------------------------------------------------------------------------------
function initMainContent(state: WikiRevAppState) {
  const revContentEl: HTMLElement = document.querySelector('#rev-content');
  revContentEl.innerHTML = '';

  revContentEl.append(
    highlightWikitext({
      text: state.rev.content,
      gutters: true,
      markers: revSegmentsToMarkers(state.rev.content, state.rev.segments),
    }),
  );
}

// region Segment Highlighting
// --------------------------------------------------------------------------------------------------------------
let segmentHoverListener: Function = null;
let currentHighlightOwner: string = null;
let segmentUnhoverMarkerTimeout: any = null;
let segmentUnhoverLabelTimeout: any = null;

const segmentHoverLabel: HTMLElement = createElement('div', {
  class: 'segment-hover-label',
  style: 'opacity:0',
});

runWhenDOMContentLoaded(() => document.body.append(segmentHoverLabel));

function initSegmentHover(state: WikiRevAppState) {
  if (segmentHoverListener != null) {
    document.removeEventListener('mousemove', segmentHoverListener as any);
  }

  setHighlightOwner(null);

  function segmentUnhover() {
    clearTimeout(segmentUnhoverMarkerTimeout);
    clearTimeout(segmentUnhoverLabelTimeout);

    if (state.getPrefs().diffHighlightHover) {
      segmentUnhoverMarkerTimeout = setTimeout(() => {
        setHighlightOwner(null);
      }, 100);
    }

    segmentUnhoverLabelTimeout = setTimeout(() => {
      segmentHoverLabel.style.setProperty('opacity', '0');
      segmentHoverLabel.classList.remove('active');
    }, 40);
  }

  function segmentHover(el: HTMLElement) {
    clearTimeout(segmentUnhoverMarkerTimeout);
    clearTimeout(segmentUnhoverLabelTimeout);

    const segmentIdx: number = toInt(el.getAttribute('data-segment-idx'));
    const segment: MwOwnSegment = state.rev.segments[segmentIdx];

    if (state.getPrefs().diffHighlightHover) {
      setHighlightOwner(segment.owner, segment.revId);
    }

    if (state.getPrefs().diffHighlightHover || currentHighlightOwner === segment.owner) {
      segmentHoverLabel.classList.add('active');
      // segmentHoverLabel.innerHTML = `${escapeHtml(segment.owner)} #${segment.revId}
      //   <br />${escapeHtmlAllowEntities(state.revisionsById[segment.revId]?.comment || '(No comment)')}`;
      segmentHoverLabel.innerHTML = createRevListHtml(state, [state.revisionsById[segment.revId]]);
      segmentHoverLabel.style.setProperty('opacity', '1');
    }

    if (!state.getPrefs().diffHighlightHover && currentHighlightOwner !== segment.owner) {
      segmentUnhover();
    }
  }

  document.addEventListener('mousemove', segmentHoverListener = (e: MouseEvent) => {
    // ClientX/ClientY -> coordinates relative to viewport
    // PageX/PageY -> coordinates relative to page (<html> element)

    segmentHoverLabel.style.setProperty('left', e.clientX + 'px');
    segmentHoverLabel.style.setProperty('top', e.clientY + 'px');

    // elementFromPoint takes in coordinates relative to viewport:
    const aceToken: HTMLElement = document.elementFromPoint(e.clientX, e.clientY)?.closest('.owner-segment') as HTMLElement;
    if (!aceToken) {
      segmentUnhover();
      return;
    } else {
      segmentHover(aceToken);
    }
  });
}

function setHighlightOwner(ownerName: string, primaryRevId?: number) {
  currentHighlightOwner = ownerName;

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
    if (primaryRevId) {
      // language=CSS
      style.textContent = `
      body.nightmode .owner-segment[data-owner="${CSS.escape(ownerName)}"] {
        background: hsl(204deg 90% 60% / 20%);
        transition: background 20ms linear;
      }
      body.nightmode .owner-segment[data-owner="${CSS.escape(ownerName)}"][data-revid="${primaryRevId}"] {
        color: hsl(41deg 15.23% 86.25%);
        background: hsl(47.08deg 72.86% 66.35% / 20%);
        transition: background 20ms linear;
      }
      `;
    } else {
      // language=CSS
      style.textContent = `
      body.nightmode .owner-segment[data-owner="${CSS.escape(ownerName)}"] {
        color: hsl(41deg 15.23% 86.25%);
        background: hsl(47.08deg 72.86% 66.35% / 20%);
        transition: background 20ms linear;
      }
      `;
    }
  } else {
    if (primaryRevId) {
      // language=CSS
      style.textContent = `
      .owner-segment[data-owner="${CSS.escape(ownerName)}"] {
        background: hsl(204deg 90% 60% / 25%);
        transition: background 20ms linear;
      }
      .owner-segment[data-owner="${CSS.escape(ownerName)}"][data-revid="${primaryRevId}"] {
        background: hsl(60deg 96% 69% / 100%);
        transition: background 20ms linear;
      }
      `;
    } else {
      // language=CSS
      style.textContent = `
      .owner-segment[data-owner="${CSS.escape(ownerName)}"] {
        background: hsl(60deg 96% 69% / 100%);
        transition: background 20ms linear;
      }
      `;
    }
  }
}
// endregion

// region Revision Segments to Highlight Markers
// --------------------------------------------------------------------------------------------------------------
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
          'data-segment-idx': i,
          'data-revid': segment.revId,
        });
        markers.push(marker);
      }
    }

    idx += lineLength;
  }

  return markers;
}
// endregion

// endregion
