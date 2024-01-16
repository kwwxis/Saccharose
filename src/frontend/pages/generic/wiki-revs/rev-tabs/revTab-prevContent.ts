import { WikiRevAppState } from '../rev-app-main.ts';
import { highlightWikitext } from '../../../../core/ace/aceHighlight.ts';
import { clearElements } from '../../../../util/domutil.ts';

export function initRevPrevContentTab(state: WikiRevAppState) {
  clearElements('#rev-prevContent-header', '#rev-prevContent');

  document.querySelector('#rev-prevContent').append(
    highlightWikitext({
      text: state.rev.prevContent || '',
      gutters: true,
    }),
  );
}
