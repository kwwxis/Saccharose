<template>
  <div class="wrapper">
    <section class="card">
      <h2 class="open-sans-font">Banned</h2>
      <div class="content">
        <div class="error-notice">
          <p>You have been banned from using {{ SITE_TITLE }}. If you wish to appeal, please see the contact page.</p>
          <p v-if="reason"><strong>Reason:</strong> {{ reason }}</p>
        </div>

        <hr class="spacer15-vert" />

        <h3 class="open-sans-font">Banned User Info</h3>
        <p>You are logged in as:</p>

        <div class="form-box">
          <div class="field valign">
            <label style="min-width: 125px">Discord User</label>
            <div class="valign">
              <img :src="avatarUrl" class="framed-icon x48" />
              <div class="dispFlex flexColumn spacer5-left">
                <span style="font-size:15px" class="open-sans-font fontWeight600">@{{ user.discord_username }}</span>
              </div>
            </div>
          </div>
          <div v-if="user.wiki_username" class="field valign spacer20-top">
            <label style="min-width: 125px">Fandom Wiki User</label>
            <div class="valign">
              <img :src="user.wiki_avatar" class="framed-icon x48" />
              <div class="dispFlex flexColumn spacer5-left">
                <span style="font-size:15px" class="open-sans-font fontWeight600">User:{{ user.wiki_username || '-' }}</span>
              </div>
            </div>
          </div>
          <div class="field valign spacer20-top">
            <label style="min-width: 125px">
              <a role="button" class="secondary" href="/auth/logout">Logout</a>
            </label>
          </div>
        </div>

        <hr class="spacer15-vert" />

        <h3 class="open-sans-font">Links</h3>

        <ul class="spacer10-top">
          <li><a href="/contact">Contact</a></li>
          <li><a href="/terms">Term of Service</a></li>
          <li><a href="/privacy">Privacy Policy</a></li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { SiteUserProvider } from '../../middleware/auth/SiteUserProvider.ts';
import { useTrace } from '../../middleware/request/tracer.ts';
import { SITE_TITLE } from '../../loadenv.ts';

defineProps<{
  reason?: string,
}>();

let { user } = useTrace();
let avatarUrl: string = SiteUserProvider.getAvatarUrl(user);
</script>
