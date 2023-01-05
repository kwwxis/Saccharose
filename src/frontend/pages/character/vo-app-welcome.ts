import { startListeners } from '../../util/eventLoader';
import { flashTippy } from '../../util/tooltips';
import { createVoHandle } from '../../../shared/vo-tool/vo-handle';
import { LangCode } from '../../../shared/types/dialogue-types';
import { VoAppState } from './vo-tool';
import { toInt } from '../../../shared/util/numberUtil';
import { closeDialog, DIALOG_MODAL, openDialog } from '../../util/dialog';
import { createWikitextEditor } from '../../util/ace/wikitextEditor';

export function VoAppWelcome(state: VoAppState) {
  const recentEl = document.querySelector('#vo-app-welcome-recent');
  const recentListEl = document.querySelector('#vo-app-welcome-recent-list');
  let anyRecents = false;

  let locallySavedAvatars: {avatarId: number, langCode: LangCode}[] = [];

  for (let i = 0; i < localStorage.length; i++){
    let key = localStorage.key(i);
    if (key.startsWith('CHAR_VO_WIKITEXT_')) {
      let keyParts: string[] = key.split('_');
      let avatarId: number = toInt(keyParts.pop());
      let langCode: LangCode = keyParts.pop() as LangCode;

      let avatar = state.avatars.find(avatar => avatar.Id === avatarId);
      if (avatar) {
        locallySavedAvatars.push({ avatarId: avatar.Id, langCode });
        anyRecents = true;
        recentListEl.insertAdjacentHTML('beforeend', `
        <div class="w50p">
          <a id="vo-app-welcome-recent-avatar-${avatar.Id}"
             class="vo-app-welcome-recent-avatar secondary dispFlex textAlignLeft spacer5-all"
             href="/character/VO/${avatar.NameText.replace(' ', '_')}"
             role="button">
            <img class="icon x32" src="/images/genshin/${avatar.IconName}.png" />
            <span class="spacer10-left">${avatar.NameText}</span>
          </a>
        </div>
      `);
      }
    }
  }
  if (anyRecents) {
    recentEl.classList.remove('hide');
  }

  let inputEditor = createWikitextEditor('welcome-wt-input');

  startListeners([
    {
      el: '#welcome-wt-submit',
      ev: 'click',
      fn: function() {
        let wikitext = inputEditor.getValue();
        let submitEl = document.querySelector<HTMLButtonElement>('#welcome-wt-submit');

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

        function go() {
          state.eventBus.emit('VO-Lang-Changed', langCode);
          window.localStorage.setItem('CHAR_VO_WIKITEXT_' + langCode + '_' + avatar.Id, wikitext);
          setTimeout(() => window.location.href = '/character/VO/' + avatar.NameText);
        }

        let locallySavedAvatar = locallySavedAvatars.find(x => x.avatarId === avatar.Id);
        if (locallySavedAvatar) {
          openDialog(`
            <h2>Are you sure?</h2>
            <div class="content">
              <p>You already have locally-saved wikitext for <strong>${avatar.NameText}</strong> (${langCode})</p>
              <p>If you proceed, then it'll be overwritten with what you just pasted.</p>
            </div>
            <div class="buttons">
              <button class="primary danger">Overwrite</button>
              <button ui-action="close-modals" class="primary cancel">Cancel</button>
            </div>
          `, DIALOG_MODAL, {
            callback(el) {
              startListeners([
                {
                  el: '.primary.danger',
                  ev: 'click',
                  fn() {
                    closeDialog();
                    go();
                  }
                }
              ], el);
            }
          });
        } else {
          go();
        }
      }
    }
  ]);
}