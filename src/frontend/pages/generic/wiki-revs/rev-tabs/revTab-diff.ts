import { WikiRevAppState } from '../rev-app-main.ts';
import { DiffUI } from '../../../../util/DiffUI.ts';
import { listen } from '../../../../util/eventListen.ts';
import { ColorSchemeType, OutputFormatType } from 'diff2html/lib/types';
import { clearElements, frag1, isElementPartiallyInViewport } from '../../../../util/domutil.ts';
import { isNightmode } from '../../../../core/userPreferences/siteTheme.ts';
import { isset } from '../../../../../shared/util/genericUtil.ts';
import { templateIcon } from '../../../../util/templateIcons.ts';

let currDiffUI: DiffUI;
let didRender: boolean = false;

export function initRevDiffTab(state: WikiRevAppState) {
  clearElements('#rev-diff-header', '#rev-diff');
  didRender = false;
  renderRevDiffTab(state);
}

export function renderRevDiffTab(state: WikiRevAppState) {
  if (didRender) {
    return;
  }
  setTimeout(() => {
    if (document.querySelector('#tabpanel-revDiff').classList.contains('active')) {
      didRender = true;
      render(state);
    }
  })
}

function render(state: WikiRevAppState) {
  if (currDiffUI) {
    currDiffUI.destroy();
  }
  if (!state.rev.unifiedDiff) {
    document.querySelector('#rev-diff').innerHTML = `
      <div class="content">
        <p class="info-notice">No diff available for first revision. See <b>Rev Content</b> tab instead.</p>
      </div>`;
    return;
  }
  currDiffUI = new DiffUI('#rev-diff', {
    currContent: state.rev.content || '',
    prevContent: state.rev.prevContent || '',
    unifiedDiff: state.rev.unifiedDiff || '',
  }, {
    matching: 'lines',
    drawFileList: false,
    outputFormat: state.getPrefs().diffMode || 'side-by-side',
    colorScheme: isNightmode() ? ColorSchemeType.DARK : ColorSchemeType.LIGHT,
    synchronizedScroll: true,
    wordWrap: state.getPrefs().diffWordWrap,
    highlightOpts: {
      mode: 'ace/mode/wikitext'
    },
    postRender(instance) {
      addWordWrapMenu(state, instance);
      addFormatMenu(state, instance);
    }
  });
}

function addWordWrapMenu(state: WikiRevAppState, ui: DiffUI) {
  const currentValue: boolean = ui.getConfig().wordWrap || false;
  listen([
    {
      selector: '.option',
      event: 'click',
      multiple: true,
      handle(_event, target) {
        if (target.getAttribute('data-value') === 'on') {
          currDiffUI.applyConfig({ wordWrap: true });
          state.applyPrefs({ diffWordWrap: true });
        } else {
          currDiffUI.applyConfig({ wordWrap: false });
          state.applyPrefs({ diffWordWrap: false });
        }
      },
    },
  ], frag1(`
    <div class="valign posRel no-shrink spacer5-left">
      <button class="secondary small" ui-action="dropdown">
        <span class="valign">Word-Wrap:
          <strong class="current-option spacer3-horiz">${currentValue ? 'On' : 'Off'}</strong>
          ${templateIcon('chevron-down')}
        </span>
      </button>
      <div class="ui-dropdown">
        <div data-value="on" class="option${currentValue ? ' selected' : ''}" ui-action="dropdown-item">On</div>
        <div data-value="off" class="option${!currentValue ? ' selected' : ''}" ui-action="dropdown-item">Off</div>
      </div>
    </div>
  `)).appendRelTo('#rev-diff .d2h-file-header');
}

function addFormatMenu(state: WikiRevAppState, ui: DiffUI) {
  const currentFormat: OutputFormatType = ui.getConfig().outputFormat || 'side-by-side';
  listen([
    {
      selector: '.option',
      event: 'click',
      multiple: true,
      handle(_event, target) {
        const newMode = target.getAttribute('data-value') as OutputFormatType;
        currDiffUI.applyConfig({ outputFormat: newMode });
        state.applyPrefs({ diffMode: newMode });
      },
    },
  ], frag1(`
    <div class="valign posRel no-shrink spacer5-left">
      <button class="secondary small" ui-action="dropdown">
        <span class="valign">Format:
          <strong class="current-option spacer3-horiz">${currentFormat === 'side-by-side' ? 'Side-by-Side' : 'Line-by-Line'}</strong>
          ${templateIcon('chevron-down')}
        </span>
      </button>
      <div class="ui-dropdown">
        <div data-value="side-by-side" class="option${currentFormat === 'side-by-side' ? ' selected' :''}" ui-action="dropdown-item">Side-by-Side</div>
        <div data-value="line-by-line" class="option${currentFormat === 'line-by-line' ? ' selected' :''}" ui-action="dropdown-item">Line-by-Line</div>
      </div>
    </div>
  `)).appendRelTo('#rev-diff .d2h-file-header');
}
