import { listen } from '../../../util/eventListen.ts';
import { flashTippy } from '../../../util/tooltips.ts';
import { createVoHandle } from './vo-handle.ts';
import { VoAppState } from './vo-tool.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { modalService } from '../../../util/modalService.ts';
import { createWikitextEditor } from '../../../util/ace/wikitextEditor.ts';
import { humanTiming } from '../../../../shared/util/genericUtil.ts';
import { sort } from '../../../../shared/util/arrayUtil.ts';
import { LangCode } from '../../../../shared/types/lang-types.ts';
import { SITE_MODE_HOME } from '../../../siteMode.ts';
import { frag1 } from '../../../util/domutil.ts';
import { toParam } from '../../../../shared/util/stringUtil.ts';

export function VoAppWelcome(state: VoAppState) {
  if (!document.querySelector('#vo-app-welcome'))
    return;

  const recentEl: HTMLElement = document.querySelector('#vo-app-welcome-recent');
  const recentListEl: HTMLElement = document.querySelector('#vo-app-welcome-recent-list');

  const locallySavedAvatars: {
    avatarId: number,
    langCode: LangCode,
    lastUpdateTime: number,
    element: HTMLElement
  }[] = [];

  const trashIconHtml = document.querySelector('#icon-trash').innerHTML;

  for (let i = 0; i < localStorage.length; i++){
    const key = localStorage.key(i);
    if (key.startsWith(state.config.storagePrefix + 'CHAR_VO_WIKITEXT_') && !key.endsWith('_UPDATETIME')) {
      const keyParts: string[] = key.split('_');
      const avatarId: number = toInt(keyParts.pop());
      const langCode: LangCode = keyParts.pop() as LangCode;

      const lastUpdatedTimeStr: string = localStorage.getItem(key+'_UPDATETIME');
      const lastUpdateTime: number = lastUpdatedTimeStr ? parseInt(lastUpdatedTimeStr) : 0;

      const avatar = state.avatars.find(avatar => avatar.Id === avatarId);
      if (!avatar)
        continue;

      const element: HTMLElement = frag1(`
        <div class="vo-app-welcome-recent-avatar-wrapper w50p">
          <a id="vo-app-welcome-recent-avatar-${avatar.Id}"
             class="vo-app-welcome-recent-avatar secondary dispFlex textAlignLeft spacer5-all"
             href="${SITE_MODE_HOME}/character/VO/${toParam(avatar.NameText)}/${langCode}"
             role="button">
            <img class="icon x32" src="${state.config.imagePathPrefix}${avatar.IconName}.png" loading="lazy" decoding="async" />
            <div class="spacer10-left spacer5-top" style="line-height:1em">
              <div>${avatar.NameText}</div>
              <small><strong>${langCode} Text</strong> Last updated: ${humanTiming(lastUpdateTime)}</small>
            </div>
            <div class="grow"></div>
            <button class="vo-app-welcome-recent-avatar-delete alignCenter justifyCenter" role="button"
                    ui-tippy-hover="Delete this data">${trashIconHtml}</button>
          </a>
        </div>
      `);

      function fancyDelete() {
        localStorage.removeItem(key);
        localStorage.removeItem(key + '_UPDATETIME');

        const inner: HTMLElement = element.querySelector('.vo-app-welcome-recent-avatar');
        const rect = element.getBoundingClientRect();
        const innerRect = inner.getBoundingClientRect();

        element.classList.add('posRel');
        element.setAttribute('style',
          `width:${rect.width}px;height:${rect.height}px;overflow:hidden;opacity:1;pointer-events:none;` +
          `transition:width 200ms ease-out,opacity 1000ms linear`);

        inner.setAttribute('style', `position:absolute;top:0;left:0;width:${innerRect.width}px;height:${innerRect.height}px`);
        window.requestAnimationFrame(() => {
          element.style.width = '0px';
          element.style.opacity = '0';
        });
      }

      const deleteButton: HTMLElement = element.querySelector('.vo-app-welcome-recent-avatar-delete');
      deleteButton.addEventListener('click', evt => {
        evt.stopPropagation();
        evt.preventDefault();
        modalService.confirm('Confirm delete?', `Confirm you want to delete ${langCode} text for ${avatar.NameText} VOs.`)
          .onConfirm(() => fancyDelete());
      })


      locallySavedAvatars.push({
        avatarId: avatar.Id,
        langCode,
        lastUpdateTime,
        element
      });
    }
  }

  if (locallySavedAvatars.length) {
    recentListEl.innerHTML = '';
    sort(locallySavedAvatars, '-lastUpdateTime');
    for (let locallySavedAvatar of locallySavedAvatars) {
      recentListEl.insertAdjacentElement('beforeend', locallySavedAvatar.element);
    }
  } else {
    recentListEl.innerHTML = '<p>(None)</p>';
  }

  const inputEditor = createWikitextEditor('welcome-wt-input');

  listen([
    {
      selector: '#welcome-wt-submit',
      event: 'click',
      handle: function() {
        let wikitext = inputEditor.getValue();
        let submitEl = document.querySelector<HTMLButtonElement>('#welcome-wt-submit');

        if (!wikitext) {
          flashTippy(submitEl, {content: 'Enter some text first!', delay:[0,2000]});
          return;
        }

        let voHandle = createVoHandle(wikitext, state.config);
        if (!voHandle || !voHandle.templateNode) {
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
          window.localStorage.setItem(state.config.storagePrefix + 'CHAR_VO_WIKITEXT_' + langCode + '_' + avatar.Id, wikitext);
          window.localStorage.setItem(state.config.storagePrefix + 'CHAR_VO_WIKITEXT_' + langCode + '_' + avatar.Id + '_UPDATETIME', String(Date.now()));
          setTimeout(() => window.location.href = SITE_MODE_HOME + '/character/VO/' + avatar.NameText);
        }

        let locallySavedAvatar = locallySavedAvatars.find(x => x.avatarId === avatar.Id);
        if (locallySavedAvatar) {
          modalService.confirm(`Are you sure?`, `
            <p>You already have locally-saved wikitext for <strong>${avatar.NameText}</strong> (${langCode})</p>
            <p>If you proceed, then it'll be overwritten with what you just pasted.</p>
          `, {
            confirmButtonText: 'Overwrite',
            confirmButtonClass: 'primary danger',
            cancelButtonText: 'Cancel',
            cancelButtonClass: 'primary'
          }).onConfirm(() => {
            go();
          });
        } else {
          go();
        }
      }
    }
  ]);
}
