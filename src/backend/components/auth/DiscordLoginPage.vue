<template>
  <div class="wrapper" style="max-width:800px">
    <section class="card">
      <div class="content">
        <h2 class="spacer25-bottom open-sans-font dispFlex flexColumn alignCenter">
          <img src="/images/site/logo/paininick.webp" style="max-width:50px" class="spacer10-bottom" />
          <span style="font-family:'Comic Sans MS', 'Open Sans', sans-serif">Welcome to {{ SITE_TITLE }}</span>
        </h2>

        <div class="justifyCenter spacer10-bottom" style="margin-top:-10px">
          <hr style="max-width:100px;width:100%" />
        </div>

        <div class="alignCenter w100p flexColumn">
          <p style="text-align: center;max-width:400px">
            This is an internal tool used by the editors of non-official wikis related to HoYoverse games.</p>
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

          <a :href="`/auth/discord?cont=` + myCont" role="button" class="spacer15-top spacer10-bottom primary primary--2 big">Login to the new "nickjr.wiki" experience</a>
        </div>
      </div>
    </section>
    <section class="card">
      <h2 style="text-align: center">Rebranding Announcement: "nickjr.wiki"</h2>
      <div class="content">
        <p class="spacer15-bottom" style="font-size: 16px;line-height: 25px;max-width: 650px;margin: 0 auto;">After careful consideration and extensive research, I have determined that "saccharose.wiki" simply does not
          capture the true essence of our wiki community. In recognition of the invaluable contributions, unwavering dedication,
          and undeniable aura of sheer wiki mastery exhibited by one of the most esteemed editors, I am proud to announce the rebranding to <strong>nickjr.wiki</strong>.</p>

        <p class="spacer15-bottom" style="font-size: 16px;line-height: 25px;max-width: 650px;margin: 0 auto;">This decision was made following a rigorous selection process in which various alternative names were proposed,
          debated, and ultimately discarded in favor of the only logical choice. I believe this change better reflects
          the core values of our wiki: knowledge, collaboration, and, most importantly, the overwhelming and inescapable presence of <strong>SolarMist/nickjr</strong>.</p>

        <p style="font-size: 16px;line-height: 25px;max-width: 650px;margin: 0 auto;">I look forward to this new chapter in the tool's history and appreciate your support in embracing the nickjr.wiki era.</p>
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
import { getTrace } from '../../middleware/request/tracer.ts';
import { SITE_SHORT_TITLE, SITE_TITLE } from '../../loadenv.ts';

const { cont } = defineProps<{
  cont?: string,
}>();

let myCont = cont;

if (!myCont) {
  myCont = getTrace().req.url;
}
</script>
