<template>
  <section class="card">
    <h2>Site Notices</h2>
    <div class="content">
      <p>View all current and past site notices, ordered from latest to oldest.</p>
    </div>
    <div class="content site-notice-container">
      <template v-for="siteNotice of notices">
        <div :data-site-notice="siteNotice.id"
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
            <a v-if="siteNotice.notice_link" role="button" :href="siteNotice.notice_link"
               class="primary primary--2 spacer5-right">View notice</a>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import Icon from '../utility/Icon.vue';
import { SiteNotice } from '../../../shared/types/site/site-user-types.ts';

const { notices } = defineProps<{
  notices: SiteNotice[]
}>();
</script>
