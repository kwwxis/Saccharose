<template>
  <section class="card">
    <h2>General Settings</h2>
    <div class="content form-box">
      <div class="field valign">
        <label style="min-width: 150px">Theme</label>
        <div class="toggle-theme-buttons alignStretch button-group">
          <button :class="{
            secondary: true,
            selected: !isNightmode
          }" value="daymode"><Icon name="sun" /></button>
          <button :class="{
            secondary: true,
            selected: isNightmode
          }" value="nightmode"><Icon name="moon" /></button>
        </div>
      </div>

      <div class="field valign spacer20-top">
        <label style="min-width: 150px">Data Language</label>
        <div class="input-language-selector header-language-selector">
          <div class="header-language-selector-title valign"
               ui-tippy="{allowHTML: true, content: 'The language for text fields (e.g. searching for quests/dialogue)',delay:[200, 100]}">
            <strong>Input Language</strong>
            <span class="dispInlineBlock spacer5-left" style="height:14px;width:14px;font-size:0;opacity:0.5">
              <Icon name="info" :size="14" />
            </span>
          </div>
          <select class="header-language-selector-input" name="inputLangCode" title="Input Language">
            <option v-for="langCode of Object.keys(request.context.languages)"
                    :value="langCode"
                    :selected="request.context.inputLangCode === langCode">{{ request.context.languages[langCode] }}</option>
          </select>
        </div>
        <div class="output-language-selector header-language-selector">
          <div class="header-language-selector-title valign"
               ui-tippy="{allowHTML: true, content: 'The language for output results (e.g. quest dialogue generation / single branch dialogue results).<br>OL results are unaffected by this.',delay:[200, 100]}">
            <strong>Output Language</strong>
            <span class="dispInlineBlock spacer5-left" style="height:14px;width:14px;font-size:0;opacity:0.5">
              <Icon name="info" :size="14" />
            </span>
          </div>
          <select class="header-language-selector-input" name="outputLangCode" title="Output Language">
            <option v-for="langCode of Object.keys(request.context.languages)"
                    :value="langCode"
                    :selected="request.context.outputLangCode === langCode">{{ request.context.languages[langCode] }}</option>
          </select>
        </div>
      </div>

      <div class="field valign spacer20-top">
        <label style="min-width: 150px">Search Mode</label>
        <div class="valign">
          <SearchModeInput :standalone-style="true" />
        </div>
      </div>

      <div class="field valign spacer20-top">
        <label style="min-width: 150px">Discord User</label>
        <div class="valign">
          <img :src="avatarUrl" class="framed-icon x48" />
          <div class="dispFlex flexColumn spacer5-left">
            <span style="font-size:15px" class="open-sans-font fontWeight600">@{{ user.discord_username }}</span>
            <a href="/auth/logout">Logout</a>
          </div>
        </div>
      </div>

      <div class="field valign spacer20-top">
        <label style="min-width: 150px">Fandom Wiki User</label>
        <div class="valign">
          <img :src="user.wiki_avatar" class="framed-icon x48" />
          <div class="dispFlex flexColumn spacer5-left">
            <span style="font-size:15px" class="open-sans-font fontWeight600">User:{{ user.wiki_username }}</span>
            <a id="auth-uncheck" style="text-decoration: underline;cursor:pointer">De-register</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="card">
    <h2>Sidebar Configuration</h2>
    <div class="user-settings-sidebar-configuration" v-for="conf of sidebarConfigs">
      <h3 class="secondary-header">{{ conf.header.name }}</h3>
      <div class="content">
        <div v-for="section of conf.sections" class="spacer10-left">
          <label class="valign">
            <span v-html="section.name" class="grow"></span>
            <span class="dispFlex button-group">
              <button :class="thingClass(conf.id, section.id, 'shown')" :ui-action="`set-user-pref: siteMenuShown, ${conf.id}|${section.id}|shown; remove-class: parent > button, selected; add-class: self, selected`">Shown</button>
              <button :class="thingClass(conf.id, section.id, 'collapsed')" :ui-action="`set-user-pref: siteMenuShown, ${conf.id}|${section.id}|collapsed; remove-class: parent > button, selected; add-class: self, selected`">Collapsed</button>
              <button :class="thingClass(conf.id, section.id, 'hidden')" :ui-action="`set-user-pref: siteMenuShown, ${conf.id}|${section.id}|hidden; remove-class: parent > button, selected; add-class: self, selected`">Hidden</button>
            </span>
          </label>
          <div v-for="content of section.content" class="spacer10-left">
            <label v-if="content.name" class="valign">
              <span v-html="content.name" class="grow"></span>
              <span class="dispFlex button-group">
                <button :class="thingClass(conf.id, content.id, 'shown')" :ui-action="`set-user-pref: siteMenuShown, ${conf.id}|${content.id}|shown; remove-class: parent > button, selected; add-class: self, selected`">Shown</button>
                <button :class="thingClass(conf.id, content.id, 'collapsed')" :ui-action="`set-user-pref: siteMenuShown, ${conf.id}|${content.id}|collapsed; remove-class: parent > button, selected; add-class: self, selected`">Collapsed</button>
                <button :class="thingClass(conf.id, content.id, 'hidden')" :ui-action="`set-user-pref: siteMenuShown, ${conf.id}|${content.id}|hidden; remove-class: parent > button, selected; add-class: self, selected`">Hidden</button>
              </span>
            </label>
            <div v-for="item of content.items" class="spacer10-left">
              <label class="valign">
                <span v-html="item.name" class="grow"></span>
                <span class="dispFlex button-group">
                  <button :class="thingClass(conf.id, item.id, 'shown')" :ui-action="`set-user-pref: siteMenuShown, ${conf.id}|${item.id}|shown; remove-class: parent > button, selected; add-class: self, selected`">Shown</button>
                  <button disabled :class="thingClass(conf.id, item.id, 'collapsed')" :ui-action="`set-user-pref: siteMenuShown, ${conf.id}|${item.id}|collapsed; remove-class: parent > button, selected; add-class: self, selected`">Collapsed</button>
                  <button :class="thingClass(conf.id, item.id, 'hidden')" :ui-action="`set-user-pref: siteMenuShown, ${conf.id}|${item.id}|hidden; remove-class: parent > button, selected; add-class: self, selected`">Hidden</button>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { SiteUserProvider } from '../../middleware/auth/SiteUserProvider.ts';
import { getTrace } from '../../middleware/request/tracer.ts';
import Icon from '../utility/Icon.vue';
import { SiteMenuShown, SiteMenuShownType, SiteUser } from '../../../shared/types/site/site-user-types.ts';
import SearchModeInput from '../utility/SearchModeInput.vue';
import { SiteSidebar } from '../../../shared/types/site/site-sidebar-types.ts';

let request = getTrace().req;
let user: SiteUser = request.user;

let isNightmode: boolean = request.user.prefs.isNightmode || false;
let avatarUrl: string = SiteUserProvider.getAvatarUrl(user);
let sidebarConfigs: SiteSidebar[] = Object.values(request.context.allSiteSidebarConfig);
let sidebarShown: SiteMenuShown = request.user.prefs.siteMenuShown || {};

function thingClass(confId: string, thingId: string, thingState: SiteMenuShownType): string {
  if (sidebarShown[confId]?.[thingId] === thingState) {
    return 'secondary selected';
  } if (!sidebarShown[confId]?.[thingId] && thingState === 'shown') {
    return 'secondary selected';
  } else {
    return 'secondary';
  }
}

</script>
