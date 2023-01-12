import { startListeners } from '../../util/eventLoader';
import { LANG_CODE_TO_WIKI_CODE, LangCode } from '../../../shared/types/dialogue-types';
import { VoAppState } from './vo-tool';
import { flashTippy } from '../../util/tooltips';
import { copyToClipboard, downloadObjectAsJson, downloadTextAsFile } from '../../util/domutil';

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
      el: '#vo-app-export-copyText',
      ev: 'click',
      fn: function() {
        // noinspection JSIgnoredPromiseFromCall
        copyToClipboard(state.wikitext.getValue());

        let exportButton = document.querySelector<HTMLButtonElement>('#vo-app-export-button');
        flashTippy(exportButton, {content: 'Copied!', delay:[0,2000]});
      }
    },
    {
      el: '#vo-app-export-saveFile',
      ev: 'click',
      fn: function() {
        let value = state.wikitext.getValue();
        let wtAvatarName = state.avatar.NameText.replace(/ /g, '_');
        let wtLangCode = LANG_CODE_TO_WIKI_CODE[state.voLang];
        downloadTextAsFile(`${wtAvatarName}_${wtLangCode}.wt`, value);
      }
    },
    {
      el: '#vo-app-export-fetters',
      ev: 'click',
      fn: function() {
        // let wtAvatarName = state.avatar.NameText.replace(/ /g, '_');
        // downloadObjectAsJson(Object.assign(
        //   {}, { avatar: state.avatar},
        //   state.fetters
        // ), `${wtAvatarName}_Fetters.json`, 2);
      }
    }
  ]);
}