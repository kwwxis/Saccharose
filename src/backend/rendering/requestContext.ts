import crypto from 'crypto';
import { getWebpackBundleFileNames, WebpackBundles } from './webpackBundle.ts';
import createHtmlElement from 'create-html-element';
import { getNodeEnv, SITE_TITLE } from '../loadenv.ts';
import { CompareTernary, ternary } from '../../shared/util/genericUtil.ts';
import { DEFAULT_LANG, LANG_CODES, LANG_CODES_TO_NAME, LangCode } from '../../shared/types/lang-types.ts';
import { DEFAULT_SEARCH_MODE, SEARCH_MODES, SearchMode } from '../../shared/util/searchUtil.ts';
import { Request } from 'express';
import { SiteUserProvider } from '../middleware/auth/SiteUserProvider.ts';
import { escapeHtml, SbOut } from '../../shared/util/stringUtil.ts';
import {
  SiteMenuShownEntry,
  SitePrefName,
  SiteUserPrefs,
  VisitorPrefsCookieName,
} from '../../shared/types/site/site-user-types.ts';
import { SiteSidebar } from '../../shared/types/site/site-sidebar-types.ts';
import { iconSvg } from '../../shared/util/iconProvider.ts';
import { SIDEBAR_CONFIG } from './appSidebarConfig.ts';
import {
  getDefaultBasePathForSiteMode,
  getSiteModeFromPath,
  SiteMode,
} from '../../shared/types/site/site-mode-type.ts';
import { createThinRequest, ThinRequest } from './thinRequest.ts';
import { RequestCommonLocals } from './customRouter.ts';

export type LayoutType = 'basic' | 'app' | 'empty' | 'visitor';

/**
 * Only one instance per request. This class may hold information about the request as well as have some utility
 * methods.
 */
export class RequestContext {
  private readonly _req: ThinRequest;
  private _cachedPrefs: SiteUserPrefs;

  // Data Properties:
  private title: string;
  private bodyClass: string[];
  private htmlMetaProps: { [name: string]: string } = {};
  readonly siteMode: SiteMode;

  // Technical Properties:
  readonly nonce: string = crypto.randomBytes(16).toString('hex');
  readonly webpackBundles: WebpackBundles = getWebpackBundleFileNames();

  layoutType: LayoutType = 'basic';

  constructor(req: Request) {
    this._req = createThinRequest(req);
    this.title = '';
    this.bodyClass = [];

    this.siteMode = getSiteModeFromPath(req.path);
    this.htmlMetaProps['x-site-mode'] = this.siteMode;
    this.htmlMetaProps['x-site-mode-home'] = this.siteHome;
    this.htmlMetaProps['x-site-mode-name'] = this.siteModeName;
    this.htmlMetaProps['x-site-mode-wiki-domain'] = this.siteModeWikiDomain;
    this.htmlMetaProps['x-site-mode-preferred-base-path'] = this.siteModePreferredBasePath;
    this.htmlMetaProps['x-wss-url'] = ENV.WSS_URL;
  }

  setHtmlMetaProp(name: string, value: string) {
    this.htmlMetaProps[name] = escapeHtml(value);
  }

  getHtmlMetaProps(): { [name: string]: string } {
    return this.htmlMetaProps;
  }

  update(payload: RequestCommonLocals) {
    if (!payload)
      return;

    if (payload.bodyClass && payload.bodyClass.length) {
      this.bodyClass = this.bodyClass.concat(
        typeof payload.bodyClass === 'function'
          ? payload.bodyClass(this._req)
          : payload.bodyClass
      );
    }
    if (payload.title) {
      this.title = typeof payload.title === 'function'
        ? payload.title(this._req)
        : payload.title;
    }
    if (payload.title) {
      this.title = typeof payload.title === 'function'
        ? payload.title(this._req)
        : payload.title;
    }
    if (payload.layoutType) {
      this.layoutType = typeof payload.layoutType === 'function'
        ? payload.layoutType(this._req)
        : payload.layoutType;
    }
  }

  hasBodyClass(bodyClass: string) {
    return this.bodyClass.includes(bodyClass);
  }

  get bodyClassString() {
    return this.bodyClass ? this.bodyClass.join(' ') : '';
  }

  // region SITE MODE
  // --------------------------------------------------------------------------------------------------------------
  get siteHome(): string {
    switch (this.siteMode) {
      case 'hsr':
        return '/hsr';
      case 'zenless':
        return '/zenless';
      case 'wuwa':
        return '/wuwa';
      case 'genshin':
        return '/genshin'
      default:
        return '';
    }
  }

  get siteModePreferredBasePath(): string {
    return this.prefs.preferredBasePaths?.[this.siteMode] || getDefaultBasePathForSiteMode(this.siteMode);
  }

  get siteModeName(): string {
    switch (this.siteMode) {
      case 'hsr':
        return 'Honkai Star Rail';
      case 'zenless':
        return 'Zenless Zone Zero';
      case 'wuwa':
        return 'Wuthering Waves';
      case 'genshin':
        return 'Genshin Impact';
      case 'unset':
      default:
        return 'Home';
    }
  }

  get siteModeCssClass(): string {
    switch (this.siteMode) {
      case 'hsr':
        return 'page--hsr';
      case 'zenless':
        return 'page--zenless';
      case 'wuwa':
        return 'page--wuwa';
      case 'genshin':
        return 'page--genshin';
      default:
        return 'page--unset';
    }
  }

  get siteModeWikiDomain(): string {
    let wikiDomain: string;
    switch (this.siteMode) {
      case 'hsr':
        wikiDomain = 'honkai-star-rail.fandom.com';
        break;
      case 'zenless':
        wikiDomain = 'zenless-zone-zero.fandom.com';
        break;
      case 'wuwa':
        wikiDomain = 'wutheringwaves.fandom.com';
        break;
      case 'genshin':
        wikiDomain = 'genshin-impact.fandom.com';
        break;
      default:
        wikiDomain = 'community.fandom.com';
        break;
    }
    return wikiDomain;
  }
  // endregion

  // region MISC UTILITIES
  // --------------------------------------------------------------------------------------------------------------

  isAuthenticated(): boolean {
    return this._req.isAuthenticated();
  }

  get discordAvatarUrl(): string {
    return SiteUserProvider.getAvatarUrl(this._req.user);
  }

  wikiTemplateLink(template: string, noLink: boolean = false): string {
    return '{{' + createHtmlElement({
      name: noLink ? 'span' : 'a',
      attributes: {
        href: 'https://' + this.siteModeWikiDomain + '/wiki/Template:' + template.replaceAll(' ', '_'),
        target: '_blank',
        style: 'text-decoration:none',
      },
      text: template,
    }) + '}}';
  }

  get isDevelopment() {
    return getNodeEnv() === 'development';
  }

  get isProduction() {
    return getNodeEnv() === 'production';
  }
  // endregion

  // region SITE/PAGE TITLE
  // --------------------------------------------------------------------------------------------------------------
  get siteTitle() {
    return SITE_TITLE;
  }

  getFormattedPageTitle(customTitle?: string) {
    if (!customTitle) {
      customTitle = this.title;
    }
    return customTitle ? `${customTitle} | ${SITE_TITLE}` : SITE_TITLE;
  }
  // endregion

  // region COOKIE & PREF UTILITIES
  // --------------------------------------------------------------------------------------------------------------
  get prefs(): SiteUserPrefs {
    if (this._cachedPrefs) {
      return this._cachedPrefs;
    } else if (this.isAuthenticated()) {
      return this._req.user?.prefs || {};
    } else {
      let cookieVal: string = this._req.cookies[VisitorPrefsCookieName];

      try {
        if (!!cookieVal && cookieVal.startsWith('{')) {
          this._cachedPrefs = JSON.parse(cookieVal);
          return this._cachedPrefs;
        }
      } catch (ignore) {}

      return {};
    }
  }

  cookies(): Record<string, any> {
    return this._req.cookies;
  }

  cookie(cookieName: string, orElse: string = '') {
    let cookieValue: string = this._req.cookies[cookieName];
    return cookieValue || orElse;
  }

  cookieTernary(cookieName: string): CompareTernary<string> {
    let cookieValue: string = this._req.cookies[cookieName];
    return ternary(cookieValue).setDefaultElse('');
  }

  pref<T extends SitePrefName>(prefName: T, orElse?: SiteUserPrefs[T]): SiteUserPrefs[T] {
    return this.prefs[prefName] || orElse;
  }

  prefBool<T extends SitePrefName, V>(prefName: T, valueIfTrue: V, valueIfFalse: V): V {
    return this.prefs[prefName] ? valueIfTrue : valueIfFalse;
  }

  prefTernary<T extends SitePrefName>(prefName: T): CompareTernary<SiteUserPrefs[T]> {
    return ternary(this.prefs[prefName]).setDefaultElse('');
  }

  // region LANGUAGE CONSTANTS
  // --------------------------------------------------------------------------------------------------------------
  get languages() {
    let copy = Object.assign({}, LANG_CODES_TO_NAME);
    delete copy['CH'];
    return copy;
  }

  get languageCodes(): LangCode[] {
    return LANG_CODES.filter(code => code !== 'CH');
  }
  // endregion

  // region USER OPTIONS
  // --------------------------------------------------------------------------------------------------------------
  get inputLangCode() {
    const req = this._req;
    if (typeof req.query['input'] === 'string' && (LANG_CODES as string[]).includes(req.query['input'])) {
      return req.query['input'] as LangCode;
    } else {
      return this.prefs.inputLangCode || DEFAULT_LANG;
    }
  }

  get outputLangCode() {
    const req = this._req;
    if (typeof req.query['output'] === 'string' && (LANG_CODES as string[]).includes(req.query['output'])) {
      return req.query['output'] as LangCode;
    } else {
      return this.prefs.outputLangCode || DEFAULT_LANG;
    }
  }

  get searchMode() {
    const req = this._req;
    if (typeof req.query['searchMode'] === 'string' && (SEARCH_MODES as string[]).includes(req.query['searchMode'])) {
      return req.query['searchMode'] as SearchMode;
    } else {
      return this.prefs.searchMode || DEFAULT_SEARCH_MODE;
    }
  }
  // endregion

  // region DIRECT LINK SETTINGS
  // --------------------------------------------------------------------------------------------------------------
  hasQuerySettings() {
    return this._req.query['input'] || this._req.query['output'] || this._req.query['searchMode'];
  }

  getQuerySettings(): { prop: string, value: string }[] {
    let out = [];
    if (typeof this._req.query['input'] === 'string' && (LANG_CODES as string[]).includes(this._req.query['input'])) {
      out.push({ prop: 'Input Language', value: this._req.query['input'] });
    }
    if (typeof this._req.query['output'] === 'string' && (LANG_CODES as string[]).includes(this._req.query['output'])) {
      out.push({ prop: 'Output Language', value: this._req.query['output'] });
    }
    if (typeof this._req.query['searchMode'] === 'string' && (SEARCH_MODES as string[]).includes(this._req.query['searchMode'])) {
      out.push({ prop: 'Search Mode', value: this._req.query['searchMode'] });
    }
    return out;
  }
  // endregion

  // region SIDEBAR
  // --------------------------------------------------------------------------------------------------------------

  createSiteSidebarHtml(appSidebarOverlayScroll: boolean = false): string {
    const sb: SbOut = new SbOut();
    const conf = this.siteSidebarConfig;

    sb.append(`
    <section class="app-sidebar-header card" data-id="${conf.id}">
      <h2 class="valign" style="padding:6px 10px">
        ${conf.header.icon ? `<img src="${conf.header.icon}" style="width:28px;height:auto;${conf.header.iconExtraStyle || ''}" />` : ''}
        <span class="spacer10-left">${conf.header.name}</span>
      </h2>
    </section>
    `);
    sb.line(`<div class="app-sidebar-content" data-id="${conf.id}"${appSidebarOverlayScroll ? ' data-overlayscrollbars-initialize': ''}>`);

    const chevronDownHtml: string = iconSvg('chevron-down', 17);

    const shownConfig: SiteMenuShownEntry = this.prefs.siteMenuShown?.[conf.id] || {};

    for (let section of conf.sections) {
      if (shownConfig[section.id] === 'hidden')
        continue;

      const sectionIsCollapsed = shownConfig[section.id] === 'collapsed';
      sb.line(`<section class="card app-sidebar-level-1" data-id="${section.id}">`);
      sb.line(`<h2 class="valign">`);
      sb.line(`<span class="grow">${section.name}</span>`);
      sb.line(`<span class="expando other-direction no-bg${sectionIsCollapsed ? ' expand-action collapsed-state' : ' collapse-action expanded-state'}"
        ui-action="expando: [data-id=&quot;${section.id}&quot;] > .app-sidebar-level-1-content, previous .expando; set-user-pref: siteMenuShown, ${conf.id}|${section.id}|toggle">${chevronDownHtml}</span>`)
      sb.line(`</h2>`)
      sb.line(`<div class="content app-sidebar-level-1-content${sectionIsCollapsed ? ' collapsed hide' : ' expanded'}">`);

      for (let contentIdx = 0; contentIdx < section.content.length; contentIdx++) {
        const content = section.content[contentIdx];
        if (shownConfig[content.id] === 'hidden')
          continue;

        const contentIsCollapsed = shownConfig[content.id] === 'collapsed';
        sb.line(`<div class="app-sidebar-level-2${contentIdx === 0 ? '' : ' spacer10-top'}" data-id="${content.id}">`);
        if (content.name) {
          sb.line(`<h4 class="valign">`);
          sb.line(`<span class="grow">${content.name}</span>`);
          sb.line(`<span class="expando other-direction no-bg${contentIsCollapsed ? ' expand-action collapsed-state' : ' collapse-action expanded-state'}" style="opacity:0.5"
            ui-action="expando: [data-id=&quot;${content.id}&quot;] > .app-sidebar-level-2-content, previous .expando; set-user-pref: siteMenuShown, ${conf.id}|${content.id}|toggle">${chevronDownHtml}</span>`)
          sb.line(`</h4>`)
        }
        sb.line(`<div class="app-sidebar-level-2-content${contentIsCollapsed ? ' collapsed hide' : ' expanded'}">`);
        for (let item of content.items) {
          if (shownConfig[item.id] === 'hidden' || shownConfig[item.id] === 'collapsed')
            continue;

          let itemSelected: boolean = item.bodyClass && this.hasBodyClass(item.bodyClass);

          sb.line(`<div class="app-sidebar-level-3${item.rightSideButton ? ' valign button-group' : ''}${itemSelected ? ' selected' : ''}" data-id="${item.id}">`);

          sb.line(`<a class="secondary valign spacer3 textAlignLeft${item.rightSideButton ? ' grow' : ''}${itemSelected ? ' selected' : ''}"
                           role="button" href="${item.link}">`);
          sb.append(`<span>${item.name}</span>`);
          if (item.beta) {
            sb.append(`<span class="grow"></span>`)
            sb.append(`<span class="secondary-label small">Beta</span>`);
          }
          sb.append('</a>');

          if (item.rightSideButton) {
            sb.line(`<a class="secondary dispBlock spacer3 textAlignLeft${itemSelected ? ' selected' : ''}" role="button" href="${item.rightSideButton.link}"
                             style="font-size:15.5px">${item.rightSideButton.name}</a>`);
          }

          sb.line(`</div>`);
        }
        sb.line(`</div>`);
        sb.line(`</div>`);
      }
      sb.line(`</div>`);
      sb.line(`</section>`);
    }
    sb.line('</div>');

    return sb.toString();
  }

  get siteSidebarConfig(): SiteSidebar {
    return this.allSiteSidebarConfig[this.siteMode];
  }

  get allSiteSidebarConfig(): { [siteMode: string]: SiteSidebar } {
    return SIDEBAR_CONFIG;
  }
  // endregion
}
