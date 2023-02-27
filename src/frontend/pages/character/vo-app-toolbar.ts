import { startListeners } from '../../util/eventLoader';
import { LANG_CODE_TO_WIKI_CODE, LangCode } from '../../../shared/types/dialogue-types';
import { VoAppState } from './vo-tool';
import { flashTippy } from '../../util/tooltips';
import { copyToClipboard, downloadObjectAsJson, downloadTextAsFile } from '../../util/domutil';
import { modalService } from '../../util/modalService';
import { ucFirst } from '../../../shared/util/stringUtil';
import { GeneralEventBus } from '../../generalEventBus';
import { VoAppPreloadOptions } from './vo-app-preload';

export function VoAppToolbar(state: VoAppState) {
  function overwriteModal(type: 'story' | 'combat') {
    if (!state.fetters) {
      alert('Fetters not yet loaded. Please wait a bit and then retry.');
      return;
    }
    let opts: VoAppPreloadOptions = {};
    modalService.confirm(`
          <h2 style="line-height:40px;">Preload ${ucFirst(type)} Template</h2>
          <div class="modal-inset">
            <div class="info-notice">
              <p>This will <em>completely</em> overwrite any existing wikitext you have for the VO ${ucFirst(type)} template.
              Any wikitext outside of the template will be unaffected.</p>
              <p>If you don't already have the template, then it'll append it to the end.</p>
            </div>
            <fieldset class="spacer10-top">
              <legend>Preload Options</legend>
              <div class="field spacer5-horiz" style="padding-right:30px">
                <label class="ui-checkbox dispBlock" style="padding-left:5px;font-size:13px;">
                  <input type="checkbox" name="noIncludeFileParam" value="true" />
                  <span>Do not include <code>file</code> parameter.</span>
                </label>
              </div>
              <div class="field spacer5-horiz" style="padding-right:30px">
                <label class="ui-checkbox dispBlock" style="padding-left:5px;font-size:13px;">
                  <input type="checkbox" name="swapTitleSubtitle" value="true" />
                  <span>Swap <code>title/tx</code> and <code>subtitle/tl</code> values when applicable.</span>
                </label>
              </div>
            </fieldset>
          </div>
        `, {
      modalCssStyle: 'max-width:800px;max-height:750px',
      blocking: true,
      onConfirm(modalEl: HTMLElement) {
        modalEl.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach(inputEl => {
          if (inputEl.checked) {
            opts[inputEl.name] = true;
          }
        });
        state.eventBus.emit('VO-Wikitext-OverwriteFromFetters', type, opts);
      },
      onCancel() {
        // Do nothing
      }
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