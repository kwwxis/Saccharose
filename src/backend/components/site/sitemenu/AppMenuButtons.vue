<template>
  <div class="app-menu-buttons valign spacer10-right">
    <AppThemeButtons />
    <div class="posRel">
      <div class="valign" ui-action="dropdown" style="cursor:pointer">
        <img :src="ctx.discordAvatarUrl" class="framed-icon x32" />
        <Icon name="chevron-down" :size="20" />
      </div>
      <div class="ui-dropdown hide">
        <div class="label">@{{ user.discord_username }}</div>
        <a class="option valign" href="/settings">
          <Icon name="settings" :size="14" />
          <span class="spacer5-left">Settings</span>
        </a>
        <a class="option valign" href="/notices">
          <Icon name="file-text" :size="14" />
          <span class="spacer5-left">Site Notices</span>
        </a>
        <div class="option valign"
             ui-tippy-hover="{content: 'Copy link to page with your language and search settings', placement: 'left'}" ui-action="copy-pref-link"
             ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">
          <Icon name="link" :size="14" />
          <span class="spacer5-left">Copy direct link</span>
        </div>
        <span class="option-sep"></span>
        <a class="option" href="/auth/logout">Logout</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '../../utility/Icon.vue';
import { useTrace } from '../../../middleware/request/tracer.ts';
import AppThemeButtons from './AppThemeButtons.vue';

const { user, ctx } = useTrace();

defineProps<{

}>();
</script>
