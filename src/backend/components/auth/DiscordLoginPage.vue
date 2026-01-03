<template>
  <div class="wrapper" style="max-width:800px">
    <section class="card">
      <div class="content">
        <h2 class="spacer25-bottom open-sans-font dispFlex flexColumn alignCenter">
          <img src="/images/site/logo/Saccharose.webp" style="max-width:50px" class="spacer10-bottom" />
          <span>Welcome to {{ SITE_TITLE }}</span>
        </h2>

        <div class="justifyCenter spacer10-bottom" style="margin-top:-10px">
          <hr style="max-width:100px;width:100%" />
        </div>

        <div class="alignCenter w100p flexColumn">
          <p style="text-align: center;max-width:400px">
            This is an internal tool used by the editors of wikis related to certain games.</p>
          <p style="text-align: center;max-width:400px" class="info-notice spacer10-vert">
            To access {{ SITE_SHORT_TITLE }}, you must be an <strong>autoconfirmed</strong> editor on at least one of those wikis,
            or any of its other language interwikis, and have at least <strong>100 edits</strong>.
          </p>
        </div>

        <div class="justifyCenter spacer10-vert">
          <hr style="max-width:100px;width:100%" />
        </div>

        <div class="alignCenter w100p flexColumn">
          <p style="text-align: center;max-width:400px">Please login with Discord. {{ SITE_SHORT_TITLE }} will only have access to your Discord ID, username, avatar, and banner image.</p>

          <p style="text-align: center;
              max-width: 220px;
              line-height: 1.2em;
              margin-top: 10px;">
            <small>By logging into this site, you agree
              to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.</small>
          </p>

          <a :href="`/auth/discord?cont=` + myCont" role="button" class="spacer15-top spacer10-bottom primary primary--2 big">Login</a>
        </div>
      </div>
    </section>
    <section class="card">
      <div class="content">
        <p class="spacer5-bottom">Some tools are available to visitors:</p>
        <ul>
          <li><a href="/genshin/OL">Genshin Impact OL Tool</a></li>
          <li><a href="/hsr/OL">Star Rail OL Tool</a></li>
          <li><a href="/zenless/OL">Zenless Zone Zero OL Tool</a></li>
          <li><a href="/wuwa/OL">Wuthering Waves OL Tool</a></li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useTrace } from '../../middleware/request/tracer.ts';
import { SITE_SHORT_TITLE, SITE_TITLE } from '../../loadenv.ts';

const { cont } = defineProps<{
  cont?: string,
}>();

let myCont = cont;

if (!myCont) {
  myCont = useTrace().url;
}
</script>
