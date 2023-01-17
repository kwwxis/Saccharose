import { startListeners } from '../../util/eventLoader';
import { LANG_CODE_TO_WIKI_CODE, LangCode } from '../../../shared/types/dialogue-types';
import { VoAppState } from './vo-tool';
import { flashTippy } from '../../util/tooltips';
import { copyToClipboard, downloadObjectAsJson, downloadTextAsFile } from '../../util/domutil';
import { DIALOG_CONFIRM, openDialog } from '../../util/dialog';

export function VoAppToolbar(state: VoAppState) {
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
        openDialog(`
          <h2 class="spacer20-bottom">Confirm overwrite</h2>
          <p class="error-notice">This will <em>completely</em> overwrite any existing wikitext you have for the VO Story template.</p>
          <p>If you don't already have the template, then it'll append it to the end.</p>
          <p>Are you sure you want to proceed?</p>
        `, DIALOG_CONFIRM, {
          blocking: true,
          onConfirm() {
            state.eventBus.emit('VO-Wikitext-OverwriteFromFetters', 'story');
          },
          onCancel() {
            // Do nothing
          }
        });
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
        openDialog(`
          <h2 class="spacer20-bottom">Confirm overwrite</h2>
          <p class="error-notice">This will <em>completely</em> overwrite any existing wikitext you have for the VO Combat template.</p>
          <p>If you don't already have the template, then it'll append it to the end.</p>
          <p>Are you sure you want to proceed?</p>
        `, DIALOG_CONFIRM, {
          blocking: true,
          onConfirm() {
            state.eventBus.emit('VO-Wikitext-OverwriteFromFetters', 'combat');
          },
          onCancel() {
            // Do nothing
          }
        });
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