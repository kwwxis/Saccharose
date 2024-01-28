<template>
  <section class="card">
    <h2>Settings</h2>
    <div class="form-box">
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
</template>

<script setup lang="ts">
import { SiteUser, SiteUserProvider } from '../../middleware/auth/SiteUserProvider.ts';
import { getTrace } from '../../middleware/request/tracer.ts';
import Icon from '../utility/Icon.vue';
import { toBoolean } from '../../../shared/util/genericUtil.ts';

let request = getTrace().req;
let isNightmode: boolean = toBoolean(request.context.cookie('nightmode'));
let user: SiteUser = request.user;
let avatarUrl: string = SiteUserProvider.getAvatarUrl(user);
</script>
