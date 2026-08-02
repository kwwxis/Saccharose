<template>
  <span id="top" style="height:0;width:0;opacity:0"></span>
  <header id="header" class="thin-border">
    <div class="left">
      <a id="site-title" :href="ctx.siteHome || '/'" aria-label="Site title">
        <div id="site-logo-bg"></div>
        <div id="site-logo-fg">
          <img src="/images/site/logo/Saccharose.webp" style="width:45px;height:auto" />
        </div>
        <span id="site-title-text" style="line-height:21px">{{ ctx.siteTitle }}</span>
      </a>
      <AppModeSelector v-if="!isBasic" dropdown-id="site-mode-dropdown" />
    </div>
    <div class="right">
      <a v-if="isBasic && !ctx.isAuthenticated()" :href="`/auth/discord?cont=${url}`" role="button" class="spacer15-right primary primary--2">Login</a>
      <template v-if="!isBasic">
        <AppLanguageSelector />
        <AppMenuButtons />
        <div id="mobile-menu-trigger" class="alignStretch">
          <button id="mobile-menu-button" ui-action="toggle: 200, #mobile-menu, #mobile-menu-body-cover; toggle-class: body, mobile-menu-open">
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"
                 stroke-linecap="round" stroke-linejoin="round" shape-rendering="crispEdges" class="icon icon-menu">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="13" y1="18" x2="21" y2="18"></line>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"
                 stroke-linecap="round" stroke-linejoin="round" class="icon icon-close">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </template>
    </div>
  </header>
  <div class="content">
    <template v-if="isBasic">
      <slot />
    </template>
    <div v-if="!isBasic" id="app-wrapper" class="wrapper">
      <div v-if="siteNoticeBanners.length" class="site-notice-container">
        <div v-for="siteNotice of siteNoticeBanners"
             :data-site-notice="siteNotice.id"
             :class="`site-notice ${siteNotice.notice_type}-notice open-sans-font spacer10-bottom alignStart`"
             style="font-size: 13.5px;">
          <div class="site-notice-icon spacer10-right spacer10-top no-shrink">
            <Icon v-if="siteNotice.notice_type === 'info'" name="info" />
            <Icon v-if="siteNotice.notice_type === 'warning'" name="alert-triangle" />
            <Icon v-if="siteNotice.notice_type === 'error'" name="alert-octagon" />
            <Icon v-if="siteNotice.notice_type === 'success'" name="info" />
          </div>
          <div class="site-notice-panel grow">
            <h3 class="site-notice-title" v-html="siteNotice.notice_title"></h3>
            <div v-if="siteNotice.notice_body" class="site-notice-body" v-html="siteNotice.notice_body"></div>
          </div>
          <div class="site-notice-buttons spacer10-top no-shrink">
            <a v-if="siteNotice.notice_link" role="button" :href="siteNotice.notice_link" class="primary primary--2 spacer5-right">View details</a>
            <button class="primary primary--2 primary--green-pulse" :ui-action="`dismiss-site-notice: ${siteNotice.id}`">Dismiss</button>
          </div>
        </div>
      </div>

      <div v-if="ctx.hasQuerySettings()" class="card">
        <div class="content valign">
          <Icon name="link" :props="{style: 'margin-right:10px;flex-shrink:0;'}" />
          <div>
            <p style="font-size:14px">
              <strong style="font-size:15px">Direct Link:</strong>
              You have visited a link with a specific {{ sentenceJoin(ctx.getQuerySettings().map(item => item.prop)) }} set in the URL. This has not affected your own user preferences.
            </p>
            <p>
              <template v-for="(item, index) in ctx.getQuerySettings()" :key="item.prop">
                <span>{{ item.prop }}: <code class="fontWeight600">{{ item.value }}</code></span>
                <code v-if="index < ctx.getQuerySettings().length - 1" class="separator">&nbsp;/&nbsp;</code>
              </template>
            </p>
          </div>
        </div>
      </div>
      <div class="alignStart">
        <main id="app-main">
          <slot />
        </main>
        <aside id="app-sidebar" class="right" v-html="sidebarHtml"></aside>
      </div>
    </div>
  </div>
  <template v-if="!isBasic">
    <div id="mobile-menu" class="hide thin-border">
      <AppModeSelector dropdown-id="site-mode-dropdown-mobile" :no-border-light="true" dropdown-extra-class="secondary-label" />
      <AppMenuButtons />
      <div class="spacer15-vert">
        <AppLanguageSelector />
      </div>
      <div id="mobile-menu-sidebar-outlet"></div>
    </div>
    <div id="mobile-menu-body-cover" class="hide"></div>
  </template>
  <footer>
    <div class="wrapper valign">
      <section class="credit">
        <p>{{ env.SITE_TITLE }}</p>
      </section>
      <section class="footer-links">
        <a href="https://genshin-impact.fandom.com/">Genshin Wiki</a>
        <a href="https://honkai-star-rail.fandom.com/">Honkai Star Rail Wiki</a>
        <a href="https://zenless-zone-zero.fandom.com/">Zenless Zone Zero Wiki</a>
        <a href="https://wutheringwaves.fandom.com/">Wuthering Waves Wiki</a>
        <a href="/terms">Terms of Service</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/contact">Contact</a>
        <a v-if="!isBasic" href="https://github.com/kwwxis/Saccharose">Source Code</a>
      </section>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useTrace } from '../../../middleware/request/tracer.ts';
import Icon from '../../utility/Icon.vue';
import AppLanguageSelector from '../sitemenu/AppLanguageSelector.vue';
import AppMenuButtons from '../sitemenu/AppMenuButtons.vue';
import AppModeSelector from '../sitemenu/AppModeSelector.vue';
import RawHtml from '../../utility/RawHtml.vue';
import { sentenceJoin } from '../../../../shared/util/stringUtil.ts';
import { SiteNotice } from '../../../../shared/types/site/site-user-types.ts';

const { ctx, env, url } = useTrace();

const { appSidebarOverlayScroll } = defineProps<{
  isBasic: boolean,
  appSidebarOverlayScroll?: boolean,
  siteNoticeBanners?: SiteNotice[],
}>();

const sidebarHtml = ctx.createSiteSidebarHtml(appSidebarOverlayScroll || false);
</script>
