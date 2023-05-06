import { startListeners } from '../../../util/eventLoader';
import { VoAppState } from './vo-tool';
import { flashTippy } from '../../../util/tooltips';
import { copyToClipboard, downloadObjectAsJson, downloadTextAsFile } from '../../../util/domutil';
import { ModalRef, modalService } from '../../../util/modalService';
import { ucFirst } from '../../../../shared/util/stringUtil';
import { GeneralEventBus } from '../../../generalEventBus';
import { VoAppPreloadOptions } from './vo-app-preload';
import { resolveObjectPath } from '../../../../shared/util/arrayUtil';
import { LANG_CODE_TO_WIKI_CODE, LangCode } from '../../../../shared/types/lang-types';

export function VoAppToolbar(state: VoAppState) {
  function overwriteModal(type: 'story' | 'combat') {
    if (!state.fetters) {
      alert('Fetters not yet loaded. Please wait a bit and then retry.');
      return;
    }
    let opts: VoAppPreloadOptions = {};

    const createFieldModeOption = (field: string, paramFillProp?: string): string => {
      return `
        <fieldset class="spacer10-top">
          <legend><code>${field}</code> field mode</legend>
          <div class="field spacer5-horiz" style="padding-right:30px">
            <label class="ui-radio dispBlock" style="padding-left:5px;font-size:13px;">
              <input type="radio" name="paramFill.${paramFillProp || field}" value="fill" checked />
              <span>Filled</span>
            </label>
            <label class="ui-radio dispBlock" style="padding-left:5px;font-size:13px;">
              <input type="radio" name="paramFill.${paramFillProp || field}" value="remove" />
              <span>Removed</span>
            </label>
            <label class="ui-radio dispBlock" style="padding-left:5px;font-size:13px;">
              <input type="radio" name="paramFill.${paramFillProp || field}" value="empty" />
              <span>Empty</span>
            </label>
          </div>
        </fieldset>
      `;
    }

    modalService.confirm(`Preload ${ucFirst(type)} Template`, `
          <div class="info-notice">
            <p>This will <em>completely</em> overwrite any existing wikitext you have for the VO ${ucFirst(type)} template.
            Any wikitext outside of the template will be unaffected.</p>
            <p>If you don't already have the template, then it'll append it to the end.</p>
          </div>
          <fieldset class="spacer10-top">
            <legend>Preload Options</legend>
            <div class="field spacer5-horiz" style="padding-right:30px">
              <label class="ui-checkbox dispBlock" style="padding-left:5px;font-size:13px;">
                <input type="checkbox" name="swapTitleSubtitle" value="true" />
                <span>Swap <code>title/tx</code> and <code>subtitle/tl</code> values when applicable.</span>
              </label>
            </div>
            <div class="content spacer10-top" style="padding-bottom:0;">
              <hr class="spacer10-bottom opacity50p" />
              <p>The options below apply after any field swaps if swapping is enabled.</p>
              ${createFieldModeOption('title')}
              ${createFieldModeOption('subtitle')}
              ${createFieldModeOption('file')}
              ${createFieldModeOption('tl')}
              ${createFieldModeOption('tx', 'tx*')}
            </div>
          </fieldset>
        `, {
      modalClass: 'modal-lg',
      modalCssStyle: 'max-height:750px',
      contentClass: 'modal-inset'
    }).onConfirm((ref: ModalRef) => {
      ref.outerEl.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach(inputEl => {
        if (inputEl.checked) {
          resolveObjectPath(opts, inputEl.name, 'set', true);
        }
      });
      ref.outerEl.querySelectorAll<HTMLInputElement>('input[type=radio]').forEach(inputEl => {
        if (inputEl.checked) {
          resolveObjectPath(opts, inputEl.name, 'set', inputEl.value);
        }
      });
      state.eventBus.emit('VO-Wikitext-OverwriteFromFetters', type, opts);
    });
  }
  startListeners([
    {
      el: '.vo-app-language-option',
      ev: 'click',
      multiple: true,
      fn: function(event, target) {
        let targetValue = target.getAttribute('data-value');
        state.eventBus.emit('VO-Lang-Changed', targetValue as LangCode);
      }
    },
    {
      el: '.vo-app-interfacelang-option',
      ev: 'click',
      multiple: true,
      fn: function(event, target) {
        let targetValue = target.getAttribute('data-value');
        GeneralEventBus.emit('outputLangCodeChanged', targetValue as LangCode);
      }
    },
    {
      el: '#vo-app-load-fromWikitext',
      ev: 'click',
      fn: function() {
        let tabButton = document.querySelector<HTMLButtonElement>('#tab-wikitext');
        tabButton.click();
        let wikitext = document.querySelector<HTMLElement>('#wikitext-editor');
        flashTippy(wikitext, {content: 'Paste the wikitext here!', delay:[0,2000]});
      }
    },
    {
      el: '#vo-app-load-fromStoryFetters',
      ev: 'click',
      fn: function() {
        if (!state.fetters) {
          alert('Fetters not yet loaded. Please wait a bit and then retry.');
          return;
        }
        overwriteModal('story');
      }
    },
    {
      el: '#vo-app-load-fromCombatFetters',
      ev: 'click',
      fn: function() {
        if (!state.fetters) {
          alert('Fetters not yet loaded. Please wait a bit and then retry.');
          return;
        }
        overwriteModal('combat');
      }
    },
    {
      el: '#vo-app-export-copyText',
      ev: 'click',
      fn: function() {
        state.eventBus.emit('VO-Wikitext-RequestValue', (value: string) => {
          copyToClipboard(value);

          let exportButton = document.querySelector<HTMLButtonElement>('#vo-app-export-button');
          flashTippy(exportButton, {content: 'Copied!', delay:[0,2000]});
        });
      }
    },
    {
      el: '#vo-app-export-saveFile',
      ev: 'click',
      fn: function() {
        state.eventBus.emit('VO-Wikitext-RequestValue', (value: string) => {
          let wtAvatarName = state.avatar.NameText.replace(/ /g, '_');
          let wtLangCode = LANG_CODE_TO_WIKI_CODE[state.voLang];
          downloadTextAsFile(`${wtAvatarName}_${wtLangCode}.wt`, value);
        });
      }
    },
    {
      el: '#vo-app-export-fetters',
      ev: 'click',
      fn: function() {
        if (!state.fetters) {
          alert('Fetters not yet loaded. Please wait a bit and then retry.');
          return;
        }
        let wtAvatarName = state.avatar.NameText.replace(/ /g, '_');
        downloadObjectAsJson(state.fetters, `${wtAvatarName}_Fetters.json`, 2);
      }
    }
  ]);
}