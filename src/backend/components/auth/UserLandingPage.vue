<template>
  <section class="card">
    <h2>Welcome to {{ SITE_TITLE }}</h2>
    <div class="content">
      <div class="valign">
        <a class="w50p" href="/genshin"><div class="genshin-button" style="height:150px"><span>Genshin Impact Tools</span></div></a>
        <a class="w50p" href="/hsr"><div class="hsr-button" style="height:150px"><span>Honkai Star Rail Tools</span></div></a>
      </div>
      <div class="valign">
        <a class="w50p" href="/zenless"><div class="zenless-button" style="height:150px"><span>Zenless Zone Zero Tools</span></div></a>
        <a class="w50p" href="/wuwa"><div class="wuwa-button" style="height:150px"><span>Wuthering Waves Tools</span></div></a>
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
</template>

<script setup lang="ts">
import { SITE_TITLE } from '../../loadenv.ts';
</script>
