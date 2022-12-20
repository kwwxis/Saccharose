import { pageMatch } from '../../pageMatch';
import './vo-common.scss';
import { AvatarExcelConfigData } from '../../../shared/types/general-types';
import { LANG_CODES, LANG_CODES_TO_NAME, LangCode } from '../../../shared/types/dialogue-types';
import { VoAppWelcome } from './vo-app-welcome';
import Cookies from 'js-cookie';
import { VoAppSidebar } from './vo-app-sidebar';
import { VoAppToolbar } from './vo-app-toolbar';
import { VoAppWikitext } from './vo-app-wikitext';
import { VoAppEditor } from './vo-app-editor';
import * as ace from 'brace';
import { EventBus } from '../../util/eventBus';
import { CharacterFetters } from '../../../shared/types/fetter-types';

export class VoAppState {
  avatars: AvatarExcelConfigData[];
  avatar: AvatarExcelConfigData;
  fetters: CharacterFetters;
  voLang: LangCode;
  wikitext: ace.Editor;
  eventBus: EventBus;

  constructor() {
    this.avatars = (<any> window).avatars;
    this.avatar = (<any> window).avatar;
    this.fetters = (<any> window).fetters;
    this.voLang = (Cookies.get('VO-App-LangCode') as LangCode) || 'EN';
    this.eventBus = new EventBus<any>('VO-App-EventBus');

    if (!LANG_CODES.includes(this.voLang)) {
      this.eventBus.emit('VO-Lang-Changed', 'EN');
    }

    this.init();
  }

  init() {
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