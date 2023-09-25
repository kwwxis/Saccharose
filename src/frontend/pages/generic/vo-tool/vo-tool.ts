import './vo-tool-styles.scss';
import Cookies from 'js-cookie';
import { VoAppWelcome } from './vo-app-welcome';
import { VoAppSidebar } from './vo-app-sidebar';
import { VoAppToolbar } from './vo-app-toolbar';
import { VoAppWikitextEditor } from './vo-app-wikitext';
import { VoAppVisualEditor } from './vo-app-visual';
import { EventBus } from '../../../util/eventBus';
import { GeneralEventBus } from '../../../generalEventBus';
import { DEFAULT_LANG, LANG_CODES, LANG_CODES_TO_NAME, LangCode } from '../../../../shared/types/lang-types';
import { CommonAvatar, CommonVoiceOverGroup } from '../../../../shared/types/common-types';
import { VoAppPreloadConfig } from './vo-preload-types';

export interface VoAppConfig {
  storagePrefix: string,
  imagePathPrefix: string,
  fetchVoiceCollection: (avatar: CommonAvatar) => Promise<CommonVoiceOverGroup>,
  isMainCharacter: (avatar: CommonAvatar) => boolean,
  preloadConfig: VoAppPreloadConfig,
}

export class VoAppState {
  avatars: CommonAvatar[];
  avatar: CommonAvatar;
  voiceOverGroup: CommonVoiceOverGroup;
  voLang: LangCode;
  interfaceLang: LangCode;
  eventBus: EventBus;
  config: VoAppConfig;

  constructor(configSupplier: () => VoAppConfig) {
    this.config = configSupplier();

    this.avatars = (<any> window).avatars;
    this.avatar = (<any> window).avatar;
    this.voLang = (Cookies.get('VO-App-LangCode') as LangCode) || DEFAULT_LANG;
    this.interfaceLang = (Cookies.get('outputLangCode') as LangCode) || DEFAULT_LANG;
    this.eventBus = new EventBus('VO-App-EventBus');

    if (!LANG_CODES.includes(this.voLang)) {
      this.eventBus.emit('VO-Lang-Changed', DEFAULT_LANG);
    }

    this.init();
  }

  isMainCharacter(avatar?: CommonAvatar) {
    return this.config.isMainCharacter(avatar || this.avatar);
  }

  init() {
    this.eventBus.emit('VO-Init-Called', this);

    if (this.avatar) {
      this.config.fetchVoiceCollection(this.avatar).then((collection: CommonVoiceOverGroup) => {
        this.voiceOverGroup = collection;
        this.eventBus.emit('VO-Init-VoiceOversLoaded');
        document.querySelector('#vo-app-loading-status').classList.add('hide');
      });
    }

    GeneralEventBus.on('outputLangCodeChanged', (newLangCode: LangCode) => {
      this.interfaceLang = newLangCode;
    });

    this.eventBus.on('VO-Lang-Changed', (langCode: LangCode) => {
      console.log('[VO-App] Lang Code Changed:', langCode);
      if (!LANG_CODES.includes(langCode)) {
        langCode = DEFAULT_LANG;
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

export function initializeVoTool(configSupplier: () => VoAppConfig): void {
  const state = new VoAppState(configSupplier);

  VoAppSidebar(state);
  if (document.querySelector('#vo-app-welcome')) {
    VoAppWelcome(state);
  }
  if (state.avatar) {
    VoAppToolbar(state);
    VoAppVisualEditor(state);
    VoAppWikitextEditor(state);
  }
}