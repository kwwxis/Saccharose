import { startListeners } from '../../util/eventLoader';
import { flashTippy } from '../../util/tooltips';
import { createVoHandle } from '../../../shared/vo-tool/vo-handle';
import { LangCode } from '../../../shared/types/dialogue-types';
import { VoAppState } from './vo-tool';

export function VoAppWelcome(state: VoAppState) {
  startListeners([
    {
      el: '#welcome-wt-submit',
      ev: 'click',
      fn: function() {
        let wikitext = document.querySelector<HTMLTextAreaElement>('#welcome-wt-input').value;
        let submitEl = document.querySelector<HTMLButtonElement>('#welcome-wt-submit');
        let spinnerEl = document.querySelector<HTMLButtonElement>('#welcome-wt-spinner');

        if (!wikitext) {
          flashTippy(submitEl, {content: 'Enter some text first!', delay:[0,2000]});
          return;
        }

        let voHandle = createVoHandle(wikitext);
        if (!voHandle.templateNode) {
          flashTippy(submitEl, {content: 'VO template not found!', delay:[0,2000]});
          return;
        }

        let character: string;
        let templateName = voHandle.templateNode.templateName;
        if (templateName.toLowerCase() === 'vo/traveler') {
          character = 'Traveler';
        } else {
          character = voHandle.templateNode.getParam('character')?.value;
        }

        if (!character) {
          flashTippy(submitEl, {content: 'Template found but does not have a "character" parameter.', delay:[0,2000]});
          return;
        }

        let avatar = state.avatars.find(avatar => avatar.NameText.toLowerCase() === character.toLowerCase());
        if (!avatar) {
          flashTippy(submitEl, {content: 'Not a valid character: ' + character, delay:[0,2000]});
          return;
        }

        let langCode: LangCode;
        let language = voHandle.templateNode.getParam('language')?.value?.toUpperCase();
        if (!language || language == 'EN') {
          langCode = 'EN';
        } else if (language == 'ZH' || language == 'ZHS' || language == 'ZHT' || language == 'ZH-TW'
          || language == 'CH' || language == 'CHS' || language == 'CHT') {
          langCode = 'CH';
        } else if (language == 'JP' || language == 'JA') {
          langCode = 'JP';
        } else if (language == 'KR' || language == 'KO') {
          langCode = 'KR';
        } else {
          flashTippy(submitEl, {content: 'Unknown value for language parameter: ' + language, delay:[0,2000]});
          return;
        }

        window.localStorage.setItem('CHAR_VO_WIKITEXT_' + langCode + '_' + avatar.Id, wikitext);
        window.location.href = '/character/VO/' + avatar.NameText;
      }
    }
  ]);
}