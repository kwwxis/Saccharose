import { listen } from '../../../util/eventListen.ts';
import { flashTippy } from '../../../util/tooltipUtil.ts';
import { createVoHandle } from './vo-handle.ts';
import { VoAppState } from './vo-tool.ts';
import { modalService } from '../../../util/modalService.ts';
import { createWikitextEditor } from '../../../core/ace/aceEditor.ts';
import { humanTiming } from '../../../../shared/util/genericUtil.ts';
import { sort } from '../../../../shared/util/arrayUtil.ts';
import { LangCode } from '../../../../shared/types/lang-types.ts';
import SiteMode, { SITE_MODE_HOME } from '../../../core/userPreferences/siteMode.ts';
import { frag1 } from '../../../util/domutil.ts';
import { toParam } from '../../../../shared/util/stringUtil.ts';
import {
  getAllVoAppSavedAvatars, putVoAppSavedAvatar,
  removeVoAppSavedAvatar,
  VoAppSavedAvatar, VoAppStorageMigration,
} from './vo-app-storage.ts';
import { CommonAvatar } from '../../../../shared/types/common-types.ts';

export async function VoAppWelcome(state: VoAppState) {
  if (!document.querySelector('#vo-app-welcome'))
    return;

  const recentListEl: HTMLElement = document.querySelector('#vo-app-welcome-recent-list');
  const welcomeNoticeEl: HTMLElement = document.querySelector('#vo-app-welcome-notice');
  const welcomeNoticeContentEl: HTMLElement = document.querySelector('#vo-app-welcome-notice-content');

  const recentAvatarsList: {
    avatarId: number,
    langCode: LangCode,
    lastUpdated: number,
    element: HTMLElement
  }[] = [];

  const trashIconHtml = document.querySelector('#icon-trash').innerHTML;
  const savedAvatars: VoAppSavedAvatar[] = await getAllVoAppSavedAvatars(state.savedAvatarStoreName);

  for (let savedAvatar of savedAvatars) {
    const avatar = state.avatars.find(avatar => avatar.Id === savedAvatar.avatarId);

    const element: HTMLElement = frag1(`
        <div class="vo-app-welcome-recent-avatar-wrapper w50p">
          <a id="vo-app-welcome-recent-avatar-${avatar.Id}"
             class="vo-app-welcome-recent-avatar secondary dispFlex textAlignLeft spacer5-all"
             href="${SITE_MODE_HOME}/character/VO/${toParam(avatar.NameText)}/${savedAvatar.langCode}"
             role="button">
            <img class="icon x32" src="${SiteMode.imagePathPrefix}${avatar.IconName}.png" loading="lazy" decoding="async" />
            <div class="spacer10-left spacer5-top" style="line-height:1em">
              <div>${avatar.NameText}</div>
              <small><strong>${savedAvatar.langCode} Text</strong> Last updated: ${humanTiming(savedAvatar.lastUpdated)}</small>
            </div>
            <div class="grow"></div>
            <button class="vo-app-welcome-recent-avatar-delete alignCenter justifyCenter" role="button"
                    ui-tippy-hover="Delete this data">${trashIconHtml}</button>
          </a>
        </div>
      `);

    function fancyDelete() {
      removeVoAppSavedAvatar(state.savedAvatarStoreName, savedAvatar.key);

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
      modalService.confirm('Confirm delete?', `Confirm you want to delete ${savedAvatar.langCode} text for ${avatar.NameText} VOs.`)
        .onConfirm(() => fancyDelete());
    });

    recentAvatarsList.push({
      avatarId: savedAvatar.avatarId,
      langCode: savedAvatar.langCode,
      lastUpdated: savedAvatar.lastUpdated,
      element
    });
  }

  if (VoAppStorageMigration.needsMigration()) {
    welcomeNoticeEl.classList.remove('hide');
    welcomeNoticeContentEl.innerHTML = `
      <p class="info-notice">
        <span class="dispBlock">You have local data stored in an old format, and as such it was not loaded.</span>
        <span class="dispBlock spacer10-top">To convert it to the new format, click the button below:</span>
      </p>
      <p class="valign spacer10-top">
        <button id="vo-app-welcome-notice-submit" class="primary">Convert to new format</button>
        <span class="spacer5-left">(page will automatically reload)</span>
      </p>
    `;
    listen([
      {
        selector: '#vo-app-welcome-notice-submit',
        event: 'click',
        async handle() {
          await VoAppStorageMigration.migrate();
        }
      }
    ], welcomeNoticeContentEl);
  }

  if (recentAvatarsList.length) {
    recentListEl.innerHTML = '';
    sort(recentAvatarsList, '-lastUpdated');
    for (let locallySavedAvatar of recentAvatarsList) {
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
        const templateName = voHandle.templateNode.templateName;
        if (templateName.toLowerCase() === 'vo/traveler') {
          character = 'Traveler';
        } else {
          character = voHandle.templateNode.getParam('character')?.value?.trim();
        }

        if (!character) {
          flashTippy(submitEl, {content: 'Template found but does not have a "character" parameter.', delay:[0,2000]});
          return;
        }

        const avatar: CommonAvatar<any> = state.avatars.find(avatar => avatar.NameText.toLowerCase() === character.toLowerCase());
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

        async function go() {
          state.eventBus.emit('VO-Lang-Changed', langCode);
          await putVoAppSavedAvatar(state.savedAvatarStoreName, {
            avatarId: avatar.Id,
            lastUpdated: Date.now(),
            langCode: langCode,
            wikitext: wikitext
          });
          setTimeout(() => window.location.href = SITE_MODE_HOME + '/character/VO/' + avatar.NameText + '/' + langCode);
        }

        const avatarConflict = recentAvatarsList.find(x => x.avatarId === avatar.Id && x.langCode === langCode);

        if (avatarConflict) {
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
