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
            <span style="font-size:15px" class="open-sans-font fontWeight600">User:{{ user.wiki_username || '(n/a)' }}</span>
            <a v-if="user.wiki_username" id="auth-uncheck" style="text-decoration: underline;cursor:pointer">De-register</a>
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
        <div class="level-1" v-for="section of conf.sections">
          <div class="level-option valign" :data-parity="levelOptionNextParity()">
            <span v-html="section.name" class="grow"></span>
            <div class="valign posRel no-shrink spacer5-left">
              <button class="secondary small" ui-action="dropdown">
                <span class="valign">
                  <strong class="current-option spacer3-horiz" v-html="levelOptionInitialLabel(conf.id, section.id)"></strong>
                  <Icon name="chevron-down" />
                </span>
              </button>
              <div class="ui-dropdown">
                <div :class="levelOptionInitialClass(conf.id, section.id, 'shown')"
                     :ui-action="`dropdown-item; set-user-pref: siteMenuShown, ${conf.id}|${section.id}|shown`">
                  <span class="option-text color-green">Shown</span>
                </div>
                <div :class="levelOptionInitialClass(conf.id, section.id, 'collapsed')"
                     :ui-action="`dropdown-item; set-user-pref: siteMenuShown, ${conf.id}|${section.id}|collapsed`">
                  <span class="option-text color-yellow">Collapsed</span>
                </div>
                <div :class="levelOptionInitialClass(conf.id, section.id, 'hidden')"
                     :ui-action="`dropdown-item; set-user-pref: siteMenuShown, ${conf.id}|${section.id}|hidden`">
                  <span class="option-text color-red">Hidden</span>
                </div>
              </div>
            </div>
          </div>
          <div class="level-2" v-for="content of section.content">
            <div v-if="content.name" class="level-option valign" :data-parity="levelOptionNextParity()">
              <span v-html="content.name" class="grow"></span>
              <div class="valign posRel no-shrink spacer5-left">
                <button class="secondary small" ui-action="dropdown">
                  <span class="valign">
                    <strong class="current-option spacer3-horiz" v-html="levelOptionInitialLabel(conf.id, content.id)"></strong>
                    <Icon name="chevron-down" />
                  </span>
                </button>
                <div class="ui-dropdown">
                  <div :class="levelOptionInitialClass(conf.id, content.id, 'shown')"
                       :ui-action="`dropdown-item; set-user-pref: siteMenuShown, ${conf.id}|${content.id}|shown`">
                    <span class="option-text color-green">Shown</span>
                  </div>
                  <div :class="levelOptionInitialClass(conf.id, content.id, 'collapsed')"
                       :ui-action="`dropdown-item; set-user-pref: siteMenuShown, ${conf.id}|${content.id}|collapsed`">
                    <span class="option-text color-yellow">Collapsed</span>
                  </div>
                  <div :class="levelOptionInitialClass(conf.id, content.id, 'hidden')"
                       :ui-action="`dropdown-item; set-user-pref: siteMenuShown, ${conf.id}|${content.id}|hidden`">
                    <span class="option-text color-red">Hidden</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="level-3" v-for="item of content.items">
              <div class="level-option valign" :data-parity="levelOptionNextParity()">
                <span v-html="item.name" class="grow"></span>
                <div class="valign posRel no-shrink spacer5-left">
                  <button class="secondary small" ui-action="dropdown">
                    <span class="valign">
                      <strong class="current-option spacer3-horiz" v-html="levelOptionInitialLabel(conf.id, item.id)"></strong>
                      <Icon name="chevron-down" />
                    </span>
                  </button>
                  <div class="ui-dropdown">
                    <div :class="levelOptionInitialClass(conf.id, item.id, 'shown')"
                         :ui-action="`dropdown-item; set-user-pref: siteMenuShown, ${conf.id}|${item.id}|shown`">
                      <span class="option-text color-green">Shown</span>
                    </div>
                    <div :class="levelOptionInitialClass(conf.id, item.id, 'collapsed')"
                         :ui-action="`dropdown-item; set-user-pref: siteMenuShown, ${conf.id}|${item.id}|collapsed`">
                      <span class="option-text color-yellow">Collapsed</span>
                    </div>
                    <div :class="levelOptionInitialClass(conf.id, item.id, 'hidden')"
                         :ui-action="`dropdown-item; set-user-pref: siteMenuShown, ${conf.id}|${item.id}|hidden`">
                      <span class="option-text color-red">Hidden</span>
                    </div>
                  </div>
                </div>
              </div>
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
let sidebarConfigItemCounter: number = 0;

function levelOptionNextParity(): string {
  return sidebarConfigItemCounter++ % 2 === 0 ? 'even' : 'odd';
}

function levelOptionInitialLabel(confId: string, thingId: string): string {
  if (sidebarShown[confId]?.[thingId] === 'collapsed') {
    return '<span class="option-text color-yellow">Collapsed</span>';
  } else if (sidebarShown[confId]?.[thingId] === 'hidden') {
    return '<span class="option-text color-red">Hidden</span>';
  } else {
    return '<span class="option-text color-green">Shown</span>';
  }
}

function levelOptionInitialClass(confId: string, thingId: string, thingState: SiteMenuShownType): string {
  if (sidebarShown[confId]?.[thingId] === thingState) {
    return 'option selected';
  } if (!sidebarShown[confId]?.[thingId] && thingState === 'shown') {
    return 'option selected';
  } else {
    return 'option';
  }
}

</script>
