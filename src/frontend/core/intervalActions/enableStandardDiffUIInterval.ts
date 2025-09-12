import { toBoolean } from '../../../shared/util/genericUtil.ts';
import { isElementPartiallyInViewport } from '../../util/domutil.ts';
import { createDiffUIFullDiff, DiffUI } from '../../util/DiffUI.ts';
import { isNightmode } from '../userPreferences/siteTheme.ts';
import { ColorSchemeType } from 'diff2html/lib/types';

export function enableStandardDiffUIInterval() {
  document.querySelectorAll<HTMLElement>('.standard-diff-ui:not(.standard-diff-ui-processed)').forEach(el => {
    if (el.closest('.hide'))
      return;
    if (el.hasAttribute('data-lazy-load') && toBoolean(el.getAttribute('data-lazy-load')) && !isElementPartiallyInViewport(el))
      return;

    el.classList.add('standard-diff-ui-processed');

    let prevContent: string = el.getAttribute('data-prev-content') || '';
    let currContent: string = el.getAttribute('data-curr-content') || '';
    let name: string = el.getAttribute('data-name') || 'Diff';

    new DiffUI(el, createDiffUIFullDiff(name, prevContent, currContent), {
      matching: 'lines',
      drawFileList: false,
      drawFileHeader: false,
      outputFormat: 'line-by-line',
      colorScheme: isNightmode() ? ColorSchemeType.DARK : ColorSchemeType.LIGHT,
      synchronizedScroll: true,
      wordWrap: true,
      highlightOpts: {
        mode: 'ace/mode/wikitext'
      },
    });
  });
}
