import { Listener } from '../../util/eventListen.ts';
import { recalculateAceLinePanelPositions } from '../ace/staticActions/wikitextLineActions.ts';

export function recalculateDesktopStickyHeader() {
  let scrollY = window.scrollY;
  let width = window.innerWidth;
  let hasClass = document.body.classList.contains('desktop-sticky-header');

  if (scrollY > 60 && width > 950) {
    if (!hasClass) {
      document.body.classList.add('desktop-sticky-header');
    }
  } else {
    if (hasClass) {
      document.body.classList.remove('desktop-sticky-header');
    }
  }
}

export const DesktopStickerHeaderListeners: Listener[] = [
  {
    selector: 'window',
    event: 'scroll',
    handle: function(_event) {
      recalculateDesktopStickyHeader();
      document.querySelectorAll('.ace_token-tooltip').forEach(el => el.remove());
    }
  },
  {
    selector: 'window',
    event: 'resize',
    handle: (_event) => {
      recalculateDesktopStickyHeader();
      recalculateAceLinePanelPositions();
    }
  }
];
