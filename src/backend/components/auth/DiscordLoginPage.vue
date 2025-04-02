<template>
  <div class="wrapper" style="max-width:800px">
    <section class="card">
      <div class="content">
        <h2 class="spacer25-bottom open-sans-font dispFlex flexColumn alignCenter">
          <img src="/images/site/logo/Sucrose.png" style="max-width:50px" class="spacer10-bottom" />
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

          <a :href="`/auth/discord?cont=` + myCont" role="button" class="spacer15-top spacer10-bottom primary primary--2 big">Login</a>
        </div>
      </div>
    </section>
    <section class="card">
      <h2 style="text-align: center">Rebranding to "nickjr.wiki" is cancelled</h2>
      <div class="content">
        <p class="spacer15-bottom" style="font-size: 16px;line-height: 25px;max-width: 650px;margin: 0 auto;">After careful consideration, I have decided to revert <strong>nickjr.wiki</strong> back to
          <strong>saccharose.wiki</strong> &mdash; not because it wasn't a perfect name, but because it was <em>too</em> perfect.</p>

        <p class="spacer15-bottom" style="font-size: 16px;line-height: 25px;max-width: 650px;margin: 0 auto;">The sheer power of the name <strong>nickjr.wiki</strong> was simply too much for the
          mortal realm to handle. The very fabric of wiki editing reality began to warp under its weight.
          Users reported an overwhelming sense of awe upon visiting the site, with some claiming they could hear
          an ethereal chorus chanting <strong>"SolarMist"</strong> and <strong>"nickjr"</strong> in the background.
          A few brave souls tried to use the tool as usual, but found themselves paralyzed by the sheer magnitude of its new identity.</p>

        <p style="font-size: 16px;line-height: 25px;max-width: 650px;margin: 0 auto;">In the end, I realized that humanity is not yet ready for <strong>nickjr.wiki</strong>. Perhaps one day,
          when our collective understanding of wiki editing has evolved to a higher plane of existence, the world will
          once again be worthy of its glory. Until then, we humbly return to <strong>saccharose.wiki</strong>, a name more suited
          to the fragile constraints of mortal comprehension.</p>
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
