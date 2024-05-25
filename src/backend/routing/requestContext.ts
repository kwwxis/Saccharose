import crypto from 'crypto';
import { getWebpackBundleFileNames, WebpackBundles } from './webpackBundle.ts';
import createHtmlElement from 'create-html-element';
import { getNodeEnv, SITE_TITLE, SiteAuthEnabled } from '../loadenv.ts';
import { CompareTernary, ternary } from '../../shared/util/genericUtil.ts';
import { DEFAULT_LANG, LANG_CODES, LANG_CODES_TO_NAME } from '../../shared/types/lang-types.ts';
import { SEARCH_MODES } from '../../shared/util/searchUtil.ts';
import { Request } from 'express';
import {
  RequestLocals,
  RequestViewStack,
} from './routingTypes.ts';
import { renderToString as renderVueToString } from 'vue/server-renderer';
import { App } from 'vue';
import { isVueApp } from './router.ts';
import { SiteUserProvider } from '../middleware/auth/SiteUserProvider.ts';
import { basename } from 'path';
import { removeSuffix, SbOut } from '../../shared/util/stringUtil.ts';
import { SiteMenuShownEntry, SitePrefName, SiteUserPrefs } from '../../shared/types/site/site-user-types.ts';
import { SiteSidebar } from '../../shared/types/site/site-sidebar-types.ts';
import { icon } from './viewUtilities.ts';

export type RequestSiteMode = 'genshin' | 'hsr' | 'zenless';

/**
 * A payload object used to make updates to {@link RequestContext}
 */
export type RequestContextUpdate = {
  title?: string | ((req: Request) => Promise<string>);
  layouts?: (string|App)[];
  bodyClass?: string[];
  locals?: RequestLocals;
};

/**
 * Only one instance per request. This class may hold information about the request as well as have some utility
 * methods.
 */
export class RequestContext {
  private _req: Request;

  // Data Properties:
  title: string;
  bodyClass: string[];
  htmlMetaProps: { [name: string]: string } = {};
  siteMode: RequestSiteMode;

  // Internal Views:
  viewStack: RequestViewStack;
  viewStackPointer: RequestViewStack;
  virtualStaticViews: {[vname: string]: string} = {};
  private virtualStaticViewCounter: number = 0;

  // Technical Properties:
  nonce = crypto.randomBytes(16).toString('hex');
  webpackBundles: WebpackBundles;

  constructor(req: Request) {
    this._req = req;
    this.title = '';
    this.bodyClass = [];
    this.viewStack = { viewName: 'RouterRootView' };
    this.viewStackPointer = this.viewStack;
    this.webpackBundles = getWebpackBundleFileNames();

    if (req.path.toLowerCase().startsWith('/hsr')) {
      this.siteMode = 'hsr';
    } else if (req.path.toLowerCase().startsWith('/zenless')) {
      this.siteMode = 'zenless';
    } else {
      this.siteMode = 'genshin';
    }
    this.htmlMetaProps['x-site-mode'] = this.siteMode;
    this.htmlMetaProps['x-site-mode-home'] = this.siteHome;
    this.htmlMetaProps['x-site-mode-name'] = this.siteModeName;
    this.htmlMetaProps['x-site-mode-wiki-domain'] = this.siteModeWikiDomain;
  }

  async createStaticVirtualView(html: string|App): Promise<string> {
    let viewName: string = 'virtual-static-views/' + this.virtualStaticViewCounter++;

    if (typeof html !== 'string') {
      // if (isValidReactElement(html)) {
      //   const reactElement: ReactElement = html;
      //   html = renderReactToString(reactElement);
      // } else
      if (isVueApp(html)) {
        const vueApp: App = html;
        html = await renderVueToString(vueApp);

        if (vueApp._component?.__name) {
          viewName = 'vue/' + vueApp._component.__name;
        } else if (vueApp._component?.__file) {
          viewName = 'vue/' + removeSuffix(basename(vueApp._component?.__file), '.vue');
        }
      } else {
        console.error('createStaticVirtualView: illegal argument', html);
        throw 'createStaticVirtualView: illegal argument';
      }
    }

    this.virtualStaticViews[viewName] = html;
    return viewName;
  }

  get siteAuthEnabled(): boolean {
    return SiteAuthEnabled;
  }

  get discordAvatarUrl(): string {
    return SiteAuthEnabled ? SiteUserProvider.getAvatarUrl(this._req.user) : '';
  }

  get siteHome(): string {
    switch (this.siteMode) {
      case 'hsr':
        return '/hsr';
      case 'zenless':
        return '/zenless';
      case 'genshin':
      default:
        return '';
    }
  }

  get siteModeName(): string {
    switch (this.siteMode) {
      case 'hsr':
        return 'Honkai Star Rail';
      case 'zenless':
        return 'Zenless Zone Zero';
      case 'genshin':
      default:
        return 'Genshin Impact';
    }
  }

  get siteModeCssClass(): string {
    switch (this.siteMode) {
      case 'hsr':
        return 'page--hsr';
      case 'zenless':
        return 'page--zenless';
      case 'genshin':
      default:
        return 'page--genshin';
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
      case 'genshin':
      default:
        wikiDomain = 'genshin-impact.fandom.com';
        break;
    }
    return wikiDomain;
  }

  templateLink(template: string): string {
    return '{{' + createHtmlElement({
      name: 'a',
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

  getAllViewNames() {
    let pointer: RequestViewStack = this.viewStack;
    let names = [];
    while (pointer) {
      names.push(pointer.viewName);
      pointer = pointer.subviewStack;
    }
    return names;
  }

  get siteUserPrefs(): SiteUserPrefs {
    return this._req?.user?.prefs || {};
  }

  canPopViewStack(): boolean {
    return this.viewStackPointer.parent && this.viewStackPointer.parent.viewName !== 'RouterRootView';
  }

  popViewStack(): boolean {
    if (!this.canPopViewStack()) {
      return false;
    }
    this.viewStackPointer = this.viewStackPointer.parent;
    this.viewStackPointer.subviewName = undefined;
    this.viewStackPointer.subviewStack = undefined;
    return true;
  }

  hasBodyClass(bodyClass: string) {
    return this.bodyClass.includes(bodyClass);
  }

  bodyClassTernary(bodyClass: string, ifIncludes?: any, ifNotIncludes?: any): any {
    return this.hasBodyClass(bodyClass) ? (ifIncludes || '') : (ifNotIncludes || '');
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
    return this.siteUserPrefs[prefName] || orElse;
  }

  prefTernary<T extends SitePrefName>(prefName: T): CompareTernary<SiteUserPrefs[T]> {
    return ternary(this.siteUserPrefs[prefName]).setDefaultElse('');
  }

  get siteTitle() {
    return SITE_TITLE;
  }

  getFormattedPageTitle(customTitle?: string) {
    if (!customTitle) {
      customTitle = this.title;
    }
    return customTitle ? `${customTitle} | ${SITE_TITLE}` : SITE_TITLE;
  }

  get bodyClassString() {
    return this.bodyClass ? this.bodyClass.join(' ') : '';
  }

  get languages() {
    let copy = Object.assign({}, LANG_CODES_TO_NAME);
    delete copy['CH'];
    return copy;
  }

  get inputLangCode() {
    return this._req.user?.prefs?.inputLangCode|| DEFAULT_LANG;
  }

  get outputLangCode() {
    return this._req.user?.prefs?.outputLangCode || DEFAULT_LANG;
  }

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

  createSiteSidebarHtml(appSidebarOverlayScroll: boolean = false): string {
    const sb: SbOut = new SbOut();
    const conf = this.siteSidebarConfig;

    sb.append(`
    <section class="app-sidebar-header card" data-id="${conf.id}">
      <h2 class="valign" style="padding:6px 10px">
        <img src="${conf.header.icon}" style="width:28px;height:auto;${conf.header.iconExtraStyle || ''}" />
        <span class="spacer10-left">${conf.header.name}</span>
      </h2>
    </section>
    `);
    sb.line(`<div class="app-sidebar-content" data-id="${conf.id}"${appSidebarOverlayScroll ? ' data-overlayscrollbars-initialize': ''}>`);

    const chevronDownHtml: string = icon('chevron-down', 17);

    const shownConfig: SiteMenuShownEntry = this._req?.user?.prefs?.siteMenuShown?.[conf.id] || {};

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

          let itemSelected: boolean = this.hasBodyClass(item.bodyClass);

          sb.line(`<div class="app-sidebar-level-3${item.rightSideButton ? ' valign button-group' : ''}${itemSelected ? ' selected' : ''}" data-id="${item.id}">`);

          sb.line(`<a class="secondary dispBlock spacer3 textAlignLeft${item.rightSideButton ? ' grow' : ''}${itemSelected ? ' selected' : ''}"
                           role="button" href="${item.link}">${item.name}</a>`);

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
    return {
      genshin: {
        id: 'genshinImpactMenu',
        header: {
          icon: '/images/site/logo/Sucrose.webp',
          name: 'Genshin Impact',
        },
        sections: [
          {
            id: 'basic-tools',
            name: 'Basic Tools',
            content: [
              {
                id: 'basic-tools-content',
                items: [
                  { id: 'textmap-search', name: 'Textmap Search', link: '/textmap',  bodyClass: 'page--textmap' },
                  { id: 'ol-generator', name: 'OL Generator', link: '/OL', bodyClass: 'page--OL' },
                  { id: 'changelog', name: 'Changelog', link: '/changelog', bodyClass: 'page--changelog' },
                ]
              }
            ]
          },
          {
            id: 'generic-data-tools',
            name: 'Generic Data Tools',
            content: [
              {
                id: 'excel-data',
                name: 'Excel Data',
                items: [
                  { id: 'excel-usages', name: 'Identifier Usages', link: '/id-usages', bodyClass: 'page--id-usages' },
                  { id: 'excel-viewer', name: 'Excel Viewer', link: '/excel-viewer', bodyClass: 'page--excel-viewer' },
                ]
              },
              {
                id: 'media-data',
                name: 'Media Data',
                items: [
                  { id: 'media', name: 'Media', link: '/media', bodyClass: 'page--media' },
                ]
              },
              {
                id: 'wiki-data',
                name: 'Wiki Data',
                items: [
                  { id: 'wiki-revs', name: 'Wiki Revisions', link: '/revs', bodyClass: 'page--revs' },
                ]
              }
            ]
          },
          {
            id: 'quests-and-dialogue',
            name: 'Quests &amp; Dialogue',
            content: [
              {
                id: 'dialogue-generators',
                name: 'Excel Data',
                items: [
                  { id: 'quests', name: 'Quest Dialogue', link: '/quests', bodyClass: 'page--quests' },
                  { id: 'branch-dialogue', name: 'Single Branch Dialogue', link: '/branch-dialogue', bodyClass: 'page--branch-dialogue' },
                  { id: 'npc-dialogue', name: 'NPC Dialogue', link: '/npc-dialogue', bodyClass: 'page--npc-dialogue' },
                  { id: 'reminders', name: 'Reminder Dialogue', link: '/reminders', bodyClass: 'page--reminders' },
                  { id: 'vo-to-dialogue', name: 'VO File to Dialogue', link: '/vo-to-dialogue', bodyClass: 'page--vo-to-dialogue' },
                ]
              },
              {
                id: 'qd-lists',
                name: 'Lists',
                items: [
                  { id: 'chapters', name: 'Chapters', link: '/chapters', bodyClass: 'page--chapters' },
                  { id: 'all-reminders', name: 'All Reminder Dialogue', link: '/reminders/all', bodyClass: 'page--all-reminders' },
                ]
              }
            ]
          },
          {
            id: 'items-and-archive',
            name: 'Items &amp; Archive',
            content: [
              {
                id: 'items-group',
                name: 'Items',
                items: [
                  { id: 'items', name: 'Items', link: '/items', bodyClass: 'page--items' },
                  { id: 'weapons', name: 'Weapons', link: '/weapons', bodyClass: 'page--weapons' },
                ]
              },
              {
                id: 'general-archive',
                name: 'General Archive',
                items: [
                  { id: 'achievements', name: 'Achievements', link: '/achievements', bodyClass: 'page--achievements', rightSideButton: { name: 'Search', link: '/achievements/search' } },
                  { id: 'loading-tips', name: 'Loading Tips', link: '/loading-tips', bodyClass: 'page--loading-tips' },
                  { id: 'tutorials', name: 'Tutorials', link: '/tutorials', bodyClass: 'page--tutorials', rightSideButton: { name: 'Search', link: '/tutorials/search' } },
                  { id: 'viewpoints', name: 'Viewpoints', link: '/viewpoints', bodyClass: 'page--viewpoints' },
                ]
              },
              {
                id: 'living-beings',
                name: 'Living Beings',
                items: [
                  { id: 'enemies', name: 'Enemies', link: '/enemies', bodyClass: 'page--enemies' },
                  { id: 'wildlife', name: 'Wildlife', link: '/wildlife', bodyClass: 'page--wildlife' },
                  { id: 'non-codex-enemies', name: 'Non-Codex', link: '/enemies/non-codex', bodyClass: 'page--non-codex-enemies' },
                ]
              },
              {
                id: 'readables',
                name: 'Readables',
                items: [
                  { id: 'readables-search', name: 'Search Readables', link: '/readables/search', bodyClass: 'page--readables-search' },
                  { id: 'readables-all', name: 'All Readables', link: '/readables', bodyClass: 'page--readables' },
                ]
              },
              {
                id: 'serenitea-pot',
                name: 'Serenitea Pot',
                items: [
                  { id: 'furniture', name: 'Furnishings', link: '/furnishings', bodyClass: 'page--furniture' },
                  { id: 'furniture-set', name: 'Furnishing Sets', link: '/furnishing-sets', bodyClass: 'page--furniture-set' },
                ]
              }
            ]
          },
          {
            id: 'character-info',
            name: 'Character Info',
            content: [
              {
                id: 'character-info-content',
                items: [
                  { id: 'character-stories', name: 'Character Stories', link: '/character/stories', bodyClass: 'page--character-stories' },
                  { id: 'serenitea-pot-dialogue', name: 'Serenitea Pot Dialogue', link: '/character/companion-dialogue', bodyClass: 'page--companion-dialogue' },
                  { id: 'vo-tool', name: 'Character VO Tool', link: '/character/VO', bodyClass: 'page--vo-tool' },
                ]
              }
            ]
          },
          {
            id: 'tcg',
            name: 'Genius Invokation TCG',
            content: [
              {
                id: 'tcg-main-data',
                name: 'Main Data',
                items: [
                  { id: 'tcg-cards', name: 'TCG Cards', link: '/TCG/cards', bodyClass: 'page--tcg-card' },
                  { id: 'tcg-stages', name: 'TCG Stages', link: '/TCG/stages', bodyClass: 'page--tcg-stage', rightSideButton: {
                    name: 'Search',
                    link: '/TCG/stages/search'
                  } },
                ]
              },
              {
                id: 'tcg-other-data',
                name: 'Other Data',
                items: [
                  { id: 'tcg-rules', name: 'TCG Rules', link: '/TCG/rules', bodyClass: 'page--tcg-rules' },
                  { id: 'tcg-tutorial-text', name: 'TCG Tutorial Text', link: '/TCG/tutorial-text', bodyClass: 'page--tcg-tutorial-text' },
                ]
              }
            ]
          },
        ]
      },
      hsr: {
        id: 'starRailMenu',
        header: {
          icon: '/images/site/logo/March_7th_Sticker_1.webp',
          name: 'Honkai Star Rail',
        },
        sections: [
          {
            id: 'basic-tools',
            name: 'Basic Tools',
            content: [
              {
                id: 'basic-tools-content',
                items: [
                  { id: 'textmap-search', name: 'Textmap Search', link: '/hsr/textmap',  bodyClass: 'page--textmap' },
                  { id: 'ol-generator', name: 'OL Generator', link: '/hsr/OL', bodyClass: 'page--OL' },
                ]
              }
            ]
          },
          {
            id: 'generic-data-tools',
            name: 'Generic Data Tools',
            content: [
              {
                id: 'excel-data',
                name: 'Excel Data',
                items: [
                  { id: 'excel-usages', name: 'Identifier Usages', link: '/hsr/id-usages', bodyClass: 'page--id-usages' },
                  { id: 'excel-viewer', name: 'Excel Viewer', link: '/hsr/excel-viewer', bodyClass: 'page--excel-viewer' },
                ]
              },
              {
                id: 'media-data',
                name: 'Media Data',
                items: [
                  { id: 'media', name: 'Media', link: '/hsr/media', bodyClass: 'page--media' },
                ]
              }
            ]
          },
          {
            id: 'misc-tools',
            name: 'Misc Tools',
            content: [
              {
                id: 'misc-tools-content',
                items: [
                  { id: 'loading-tips', name: 'Loading Tips', link: '/hsr/loading-tips',  bodyClass: 'page--loading-tips' },
                  { id: 'vo-toool', name: 'VO Tool', link: '/hsr/character/VO', bodyClass: 'page--vo-tool' },
                ]
              }
            ]
          }
        ]
      },
      zenless: {
        id: 'zenlessMenu',
        header: {
          icon: '/images/site/logo/Belle.webp',
          iconExtraStyle: 'border-radius:50%',
          name: 'Zenless Zone Zero',
        },
        sections: [
          {
            id: 'basic-tools',
            name: 'Basic Tools',
            content: [
              {
                id: 'basic-tools-content',
                items: [
                  { id: 'textmap-search', name: 'Textmap Search', link: '/zenless/textmap',  bodyClass: 'page--textmap' },
                  { id: 'ol-generator', name: 'OL Generator', link: '/zenless/OL', bodyClass: 'page--OL' },
                  { id: 'excel-usages', name: 'Identifier Usages', link: '/zenless/id-usages', bodyClass: 'page--id-usages' },
                ]
              }
            ]
          }
        ]
      }
    }
  }
}
