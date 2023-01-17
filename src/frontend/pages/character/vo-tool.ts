import { pageMatch } from '../../pageMatch';
import './vo-common.scss';
import { LANG_CODES, LANG_CODES_TO_NAME, LangCode } from '../../../shared/types/dialogue-types';
import { VoAppWelcome } from './vo-app-welcome';
import Cookies from 'js-cookie';
import { VoAppSidebar } from './vo-app-sidebar';
import { VoAppToolbar } from './vo-app-toolbar';
import { VoAppWikitext } from './vo-app-wikitext';
import { VoAppEditor } from './vo-app-editor';
import { EventBus } from '../../util/eventBus';
import { CharacterFetters } from '../../../shared/types/fetter-types';
import { AvatarExcelConfigData } from '../../../shared/types/avatar-types';
import { endpoints } from '../../endpoints';

export class VoAppState {
  avatars: AvatarExcelConfigData[];
  avatar: AvatarExcelConfigData;
  fetters: CharacterFetters;
  voLang: LangCode;
  eventBus: EventBus;

  constructor() {
    this.avatars = (<any> window).avatars;
    this.avatar = (<any> window).avatar;
    this.voLang = (Cookies.get('VO-App-LangCode') as LangCode) || 'EN';
    this.eventBus = new EventBus('VO-App-EventBus');

    if (!LANG_CODES.includes(this.voLang)) {
      this.eventBus.emit('VO-Lang-Changed', 'EN');
    }

    this.init();
  }

  get isTraveler() {
    return [10000005, 10000007].includes(this.avatar.Id);
  }

  init() {
    if (this.avatar) {
      endpoints.getFetters(this.avatar.Id).then((fetters: CharacterFetters) => {
        this.fetters = fetters;
        this.fetters.avatar = this.avatar;
        this.eventBus.emit('VO-FettersLoaded');
        document.querySelector('#vo-app-loadingFettersStatus').classList.add('hide');
      });
    }

    this.eventBus.on('VO-Lang-Changed', (langCode: LangCode) => {
      console.log('[VO-App] Lang Code Changed:', langCode);
      if (!LANG_CODES.includes(langCode)) {
        langCode = 'EN';
      }

      this.voLang = langCode;
      let langText = LANG_CODES_TO_NAME[langCode];
      Cookies.set('VO-App-LangText', langText, { expires: 365 });
      Cookies.set('VO-App-LangCode', langCode, { expires: 365 });

      if (document.querySelector('#vo-app-toolbar')) {
        document.querySelectorAll('.vo-app-language-option').forEach(el => el.classList.remove('selected'));
        document.querySelector(`.vo-app-language-option[data-value="${langCode}"]`).classList.add('selected');
        document.querySelector('#vo-app-language-current').innerHTML = langText;
      }

      this.eventBus.emit('VO-Wikitext-LocalLoad');
    });
  }
}

pageMatch('pages/character/vo-tool', () => {
  const state = new VoAppState();

  VoAppSidebar(state);
  if (document.querySelector('#vo-app-welcome')) {
    VoAppWelcome(state);
  }
  if (state.avatar) {
    VoAppToolbar(state);
    VoAppEditor(state);
    VoAppWikitext(state);
  }
});