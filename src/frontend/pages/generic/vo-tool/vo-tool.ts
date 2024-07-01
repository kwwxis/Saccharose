import './vo-tool-styles.scss';
import { VoAppWelcome } from './vo-app-welcome.ts';
import { VoAppSidebar } from './vo-app-sidebar.ts';
import { VoAppToolbar } from './vo-app-toolbar.ts';
import { VoAppWikitextEditor } from './vo-app-wikitext.ts';
import { VoAppVisualEditor } from './vo-app-visual.ts';
import { EventBus } from '../../../util/eventBus.ts';
import { DEFAULT_LANG, LANG_CODES, LANG_CODES_TO_NAME, LangCode } from '../../../../shared/types/lang-types.ts';
import { CommonAvatar, CommonVoiceOverGroup } from '../../../../shared/types/common-types.ts';
import { VoAppPreloadConfig, VoAppPreloadOptions } from './vo-preload-types.ts';
import { OverlayScrollbars } from 'overlayscrollbars';
import { StoreNames } from 'idb/build/entry';
import { VoAppSavedAvatarDatabase } from './vo-app-storage.ts';
import SiteMode from '../../../core/userPreferences/siteMode.ts';
import { isNightmode } from '../../../core/userPreferences/siteTheme.ts';
import { getOutputLanguage, onOutputLanguageChanged } from '../../../core/userPreferences/siteLanguage.ts';
import { VoHandle } from './vo-handle.ts';

export interface VoAppConfig {
  fetchVoiceCollection: (avatar: CommonAvatar) => Promise<CommonVoiceOverGroup>,
  pageUrl: string,
  mainCharacterLabel: string,
  isMainCharacter: (avatar: CommonAvatar) => boolean,
  preloadConfig: VoAppPreloadConfig,

  enforcePropOrder: string[],

  storyTemplateNames: string[],
  combatTemplateNames: string[],
}

export type VoAppEventBusConfig = {
  'VO-Init-Called': [VoAppState],
  'VO-Init-VoiceOversLoaded': [],
  'VO-Lang-Changed': [LangCode],

  'VO-Visual-RequestHandle': ['story' | 'combat', (value: VoHandle) => void],
  'VO-Visual-Reload': [string],
  'VO-Visual-ReloadError': ['story' | 'combat', any, string],

  'VO-Wikitext-OverwriteFromVoiceOvers': ['story' | 'combat', VoAppPreloadOptions],
  'VO-Wikitext-RequestValue': [(value: string) => void],
  'VO-Wikitext-SetFromVoHandle': [VoHandle|VoHandle[], boolean?],
  'VO-Wikitext-LocalLoad': [],
  'VO-Wikitext-LocalSave': [],
  'VO-Wikitext-SetValue': [string],
};

export class VoAppState {
  avatars: CommonAvatar[];
  avatar: CommonAvatar;
  voiceOverGroup: CommonVoiceOverGroup;
  interfaceLang: LangCode;
  eventBus: EventBus<VoAppEventBusConfig>;
  config: VoAppConfig;
  savedAvatarStoreName: StoreNames<VoAppSavedAvatarDatabase>;

  constructor(configSupplier: () => VoAppConfig) {
    this.config = configSupplier();

    this.avatars = (<any> window).avatars;
    this.avatar = (<any> window).avatar;
    this.interfaceLang = getOutputLanguage();
    this.eventBus = new EventBus<VoAppEventBusConfig>('VO-App-EventBus');
    this.savedAvatarStoreName = `${SiteMode.storagePrefix}.SavedAvatars`;

    if (!LANG_CODES.includes(this.voLang)) {
      this.eventBus.emit('VO-Lang-Changed', DEFAULT_LANG);
    }

    this.scrollInit();
    this.init();
  }

  get voLang(): LangCode {
    return (<any> window).voLangCode;
  }

  get savedAvatarKey(): string {
    return this.avatar ? `${this.avatar.Id}_${this.voLang}` : null;
  }

  set voLang(newCode: LangCode) {
    const prevCode = this.voLang;

    if (newCode === 'CHS' || newCode === 'CHT') {
      newCode = 'CH';
    }
    if (newCode !== 'EN' && newCode !== 'CH' && newCode !== 'JP' && newCode !== 'KR') {
      newCode = 'EN';
    }
    (<any> window).voLangCode = newCode;
    (<any> window).voLangName = LANG_CODES_TO_NAME[newCode];

    if (prevCode) {
      window.history.replaceState({}, null,
        window.location.href.replace(new RegExp(`\\/${prevCode}\\b`), `/${newCode}`));
    }
  }

  get voLangName(): string {
    return (<any> window).voLangName;
  }

  isMainCharacter(avatar?: CommonAvatar) {
    return this.config.isMainCharacter(avatar || this.avatar);
  }

  scrollInit() {
    setTimeout(() => {
      OverlayScrollbars(document.querySelector<HTMLElement>('#vo-tool-sidebar-list'), {
        scrollbars: {
          theme: isNightmode() ? 'os-theme-light' : 'os-theme-dark',
          autoHide: 'leave'
        },
        overflow: {
          x: 'hidden'
        }
      });
      OverlayScrollbars(document.querySelector<HTMLElement>('#app-sidebar .app-sidebar-content'), {
        scrollbars: {
          theme: isNightmode ? 'os-theme-light' : 'os-theme-dark',
          autoHide: 'leave'
        },
        overflow: {
          x: 'hidden'
        }
      });
    });
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

    onOutputLanguageChanged((newLangCode: LangCode) => {
      this.interfaceLang = newLangCode;
    });

    this.eventBus.on('VO-Lang-Changed', (langCode: LangCode) => {
      const prevCode = this.voLang;
      this.voLang = langCode;
      console.log('[VO-App] Lang Code Changed:', 'from', prevCode, 'to', this.voLang, '('+this.voLangName+')');

      if (document.querySelector('#vo-app-toolbar')) {
        document.querySelectorAll('.vo-app-language-option').forEach(el => el.classList.remove('selected'));
        document.querySelector(`.vo-app-language-option[data-value="${langCode}"]`).classList.add('selected');
        document.querySelector('#vo-app-language-current').innerHTML = this.voLangName;
      }

      this.eventBus.emit('VO-Wikitext-LocalLoad');
    });
  }
}

export async function initializeVoTool(configSupplier: () => VoAppConfig): Promise<void> {
  const state: VoAppState = new VoAppState(configSupplier);
  await VoAppSidebar(state);
  await VoAppWelcome(state);
  await VoAppToolbar(state);
  await VoAppVisualEditor(state);
  await VoAppWikitextEditor(state);
}
