<template>
  <p class="info-notice spacer10-bottom" style="
    font-size: 15px;
  ">There is no save button. All settings changes save automatically.</p>
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
            <option v-for="langCode of Object.keys(ctx.languages)"
                    :value="langCode"
                    :selected="ctx.inputLangCode === langCode">{{ ctx.languages[langCode] }}</option>
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
            <option v-for="langCode of Object.keys(ctx.languages)"
                    :value="langCode"
                    :selected="ctx.outputLangCode === langCode">{{ ctx.languages[langCode] }}</option>
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
    <h2>Preferred Site Mode Base Paths</h2>
    <div class="content">
      <p>You can still go to links that use another base path other than your preferred base path, but they'll
      redirect to your preferred base path.</p>
    </div>
    <div class="content form-box">
      <div class="field valign">
        <label style="min-width: 150px">Genshin</label>
        <div class="valign">
          <SettingsSiteModeBasePathOption site-mode="genshin" />
        </div>
      </div>
      <div class="field valign spacer20-top">
        <label style="min-width: 150px">Honkai Star Rail</label>
        <div class="valign">
          <SettingsSiteModeBasePathOption site-mode="hsr" />
        </div>
      </div>
      <div class="field valign spacer20-top">
        <label style="min-width: 150px">Zenless Zone Zero</label>
        <div class="valign">
          <SettingsSiteModeBasePathOption site-mode="zenless" />
        </div>
      </div>
      <div class="field valign spacer20-top">
        <label style="min-width: 150px">Wuthering Waves</label>
        <div class="valign">
          <SettingsSiteModeBasePathOption site-mode="wuwa" />
        </div>
      </div>
    </div>
  </section>

  <section class="card">
    <h2>Other Settings</h2>
    <div class="content form-box">
      <div class="field flexColumn">
        <label style="min-width: 150px">VO Prefix Disabled Languages</label>
        <p>Check any languages you wish to <i>not</i> have VO prefixes generated for within dialogue results.</p>
        <div class="valign flexWrap" style="font-size: 14.5px">
          <label v-for="langCode of voPrefixDisableLangCodesAvailable" class="valign spacer5-vert spacer15-right">
            <input type="checkbox" :checked="voPrefixDisabledLangCodes.includes(langCode)"
              :ui-action="`set-user-pref: voPrefixDisabledLangs, ${langCode}|#{input.checked}`"/>
            <span class="spacer3-left">{{ langCode }}</span>
          </label>
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
            <div class="valign no-shrink spacer5-left">
              <SettingsSidebarLevelOption :conf-id="conf.id" :thing-id="section.id" />
            </div>
          </div>
          <div class="level-2" v-for="content of section.content">
            <div v-if="content.name" class="level-option valign" :data-parity="levelOptionNextParity()">
              <span v-html="content.name" class="grow"></span>
              <div class="valign no-shrink spacer5-left">
                <SettingsSidebarLevelOption :conf-id="conf.id" :thing-id="content.id" />
              </div>
            </div>
            <div class="level-3" v-for="item of content.items">
              <div class="level-option valign" :data-parity="levelOptionNextParity()">
                <span v-html="item.name" class="grow"></span>
                <div class="valign no-shrink spacer5-left">
                  <SettingsSidebarLevelOption :conf-id="conf.id" :thing-id="item.id" />
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
import { useTrace } from '../../middleware/request/tracer.ts';
import Icon from '../utility/Icon.vue';
import { SiteMenuShown, SiteMenuShownType, SiteUser } from '../../../shared/types/site/site-user-types.ts';
import SearchModeInput from '../utility/SearchModeInput.vue';
import { SiteSidebar } from '../../../shared/types/site/site-sidebar-types.ts';
import { LANG_CODES, LangCode } from '../../../shared/types/lang-types.ts';
import SettingsSidebarLevelOption from './SettingsSidebarLevelOption.vue';
import SettingsSiteModeBasePathOption from './SettingsSiteModeBasePathOption.vue';

let { user, ctx } = useTrace();

let isNightmode: boolean = ctx.prefs.isNightmode || false;
let avatarUrl: string = SiteUserProvider.getAvatarUrl(user);
let sidebarConfigs: SiteSidebar[] = Object.values(ctx.allSiteSidebarConfig);

const voPrefixDisableLangCodesAvailable: LangCode[] = LANG_CODES.filter(x => x !== 'CH');
let voPrefixDisabledLangCodes: LangCode[] = Array.isArray(ctx.prefs.voPrefixDisabledLangs)
  ? ctx.prefs.voPrefixDisabledLangs : [];

let sidebarConfigItemCounter: number = 0;
function levelOptionNextParity(): string {
  return sidebarConfigItemCounter++ % 2 === 0 ? 'even' : 'odd';
}
</script>
