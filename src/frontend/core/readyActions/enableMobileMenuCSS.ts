import { getScrollbarWidth } from '../../util/domutil.ts';

export default function() {
  const scrollbarWidth = getScrollbarWidth();
  document.head.insertAdjacentHTML('beforeend',
    `<style>body.mobile-menu-open, body.disable-scroll { margin-right: ${scrollbarWidth}px; }\n` +
    `body.mobile-menu-open #header { padding-right: ${scrollbarWidth}px; }\n` +
    `body.disable-scroll { overflow-y: hidden; }\n` +
    `body.desktop-sticky-header.disable-scroll #header {margin-right: ${scrollbarWidth}px} ` +
    `.collapsed { height: 0; overflow: hidden; }\n` +
    `</style>`
  );
}
