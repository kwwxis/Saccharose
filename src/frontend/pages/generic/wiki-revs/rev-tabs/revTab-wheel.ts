import { WikiRevAppState } from '../rev-app-main.ts';
import { MwRevision } from '../../../../../shared/mediawiki/mwTypes.ts';
import { clearElements, frag1, isElementPartiallyInViewport } from '../../../../util/domutil.ts';

const numAddTabs: number = 5;
let currentMainTab: HTMLElement;

export function moveRevTabWheel(state: WikiRevAppState, selectTab: boolean = true) {
  let x: Element;
  const wheelInner: HTMLButtonElement = document.querySelector('#revTabWheelInner');
  const revIndex = state.pageRevisions.findIndex(r => r.revid === state.revId);

  if (!isElementPartiallyInViewport(wheelInner)) {
    window.scrollTo(0, 0);
  }

  if (!wheelInner.children.length || !wheelInner.querySelector(`.tab[data-revId="${state.revId}"]`)) {
    const hasExistingTabs: boolean = !!wheelInner.children.length;

    if (hasExistingTabs) {
      wheelInner.querySelectorAll('.tab').forEach(tab => tab.classList.add('out'));
    }

    setTimeout(() => {
      clearElements(wheelInner);

      const prevTabs = state.pageRevisions.slice(revIndex - numAddTabs, revIndex).map(r => makeTab(r, false, true));
      const nextTabs = state.pageRevisions.slice(revIndex + 1, revIndex + 1 + numAddTabs).map(r => makeTab(r, false, true));

      const mainTab = makeTab(state.rev, true, true);
      wheelInner.append(... prevTabs);
      wheelInner.append(mainTab);
      wheelInner.append(... nextTabs);

      setCenteredTabPos(mainTab, 'left');
      if (selectTab)
        mainTab.click();
      currentMainTab = mainTab;

      setTimeout(() => mainTab.classList.remove('out'), 0);

      const prevTabsReversed = prevTabs.slice().reverse();
      for (let i = 0; i < Math.max(prevTabsReversed.length, nextTabs.length); i++) {
        const prevTab = prevTabsReversed[i];
        const nextTab = nextTabs[i];

        if (prevTab) {
          setTimeout(() => prevTab.classList.remove('out'), (i+1)*50);
        }
        if (nextTab) {
          setTimeout(() => nextTab.classList.remove('out'), (i+1)*50);
        }
      }
    }, hasExistingTabs ? 100 : 0);
  } else {
    const newMainTab: HTMLElement = wheelInner.querySelector(`.tab[data-revId="${state.revId}"]`);
    let isLeftOfCurrentMainTab: boolean = false;

    if (currentMainTab) {
      let x = currentMainTab.previousElementSibling;
      while (x) {
        if (x === newMainTab) {
          isLeftOfCurrentMainTab = true;
          break;
        }
        x = x.previousElementSibling;
      }
    }

    if (selectTab)
      newMainTab.click();

    let tabsToTheLeft: HTMLElement[] = []; // ordered from closest to the main tab to furthest
    let tabsToTheRight: HTMLElement[] = []; // ordered from closest to the main tab to furthest

    x = newMainTab.nextElementSibling;
    while(x) {
      tabsToTheRight.push(x as HTMLElement);
      x = x.nextElementSibling;
    }

    x = newMainTab.previousElementSibling;
    while(x) {
      tabsToTheLeft.push(x as HTMLElement);
      x = x.previousElementSibling;
    }

    if (isLeftOfCurrentMainTab) {
      setCenteredTabPos(currentMainTab, 'left');

      if (tabsToTheRight.length > numAddTabs) {
        tabsToTheRight.slice(numAddTabs).forEach(el => el.remove());
      }

      setCenteredTabPos(currentMainTab, 'right');

      if (tabsToTheLeft.length < numAddTabs) {
        wheelInner.prepend(... state.pageRevisions.slice(revIndex - numAddTabs, revIndex - tabsToTheLeft.length).map(r => makeTab(r)));
      }

      window.requestAnimationFrame(() => {
        setCenteredTabPos(newMainTab, 'right');
      });
    } else {
      setCenteredTabPos(currentMainTab, 'right');

      if (tabsToTheLeft.length > numAddTabs) {
        tabsToTheLeft.slice(numAddTabs).forEach(el => el.remove());
      }

      setCenteredTabPos(currentMainTab, 'left');

      if (tabsToTheRight.length < numAddTabs) {
        wheelInner.append(... state.pageRevisions.slice(revIndex + 1 + tabsToTheRight.length, revIndex + 1 + numAddTabs).map(r => makeTab(r)));
      }

      window.requestAnimationFrame(() => {
        setCenteredTabPos(newMainTab, 'left');
      });
    }
    currentMainTab = newMainTab;
  }
}

function setCenteredTabPos(centeredTab: HTMLElement, from: 'left' | 'right') {
  if (!centeredTab) {
    return;
  }
  const wheelOuter: HTMLButtonElement = document.querySelector('#revTabWheel');
  const wheelInner: HTMLButtonElement = document.querySelector('#revTabWheelInner');

  wheelInner.querySelectorAll('.tab').forEach(el => el.classList.add('mini'));
  centeredTab.classList.remove('mini');

  if (from === 'left') {
    wheelInner.classList.remove('justifyEnd');
    wheelInner.classList.add('justifyStart');
  } else {
    wheelInner.classList.remove('justifyStart');
    wheelInner.classList.add('justifyEnd');
  }

  const outerRect = wheelOuter.getBoundingClientRect();
  const innerRect = wheelInner.getBoundingClientRect();
  const centerTabRect = centeredTab.getBoundingClientRect();

  // The 'left'/'right' edge position of the center tab relative to the inner wheel:
  const centerTabEdgeInnerRelPos: number =
    from === 'left'
      ? centerTabRect[from] - innerRect[from]
      : innerRect[from] - centerTabRect[from];

  // The 'center' position of the center tab relative to the inner wheel:
  const centerTabCenterInnerRelPos: number = centerTabEdgeInnerRelPos + (centerTabRect.width / 2);

  // The 'center' position of the inner wheel relative to the inner wheel:
  const innerWheelCenter: number = innerRect.width / 2;

  // The number of pixels to adjust the inner wheel after it's been centered:
  const centerTabDiff = innerWheelCenter - centerTabCenterInnerRelPos;

  // Center the inner wheel:
  const posToCenterInnerWheel = (outerRect.width / 2) - (innerRect.width / 2);

  wheelInner.style[from] = `${posToCenterInnerWheel + centerTabDiff}px`;
  if (from === 'left') {
    wheelInner.style.removeProperty('right');
  } else {
    wheelInner.style.removeProperty('left');
  }
}

function makeTab(rev: MwRevision, selected: boolean = false, isOut: boolean = false): HTMLElement {
  return frag1(`
    <button role="tab"
            id="tab-rev${rev.revid}"
            data-revId="${rev.revid}"
            class="tab no-shrink${selected ? ' selected' : ' mini'}${isOut ? ' out' :''}"
            ui-action="tab: #tabpanel-revSelect, revMainTabs">Rev #${rev.revid}</button>
  `);
}
