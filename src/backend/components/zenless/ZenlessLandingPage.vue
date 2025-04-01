<template>
  <section id="landing-header" class="card">
    <div class="posRel">
      <img src="/images/site/logo/ZZZ_logo_shadow.png" />
      <h2><span>{{ SITE_TITLE }}</span><small>Zenless Zone Zero Wiki Tools</small></h2>
      <div class="bg"></div>
    </div>
  </section>
  <section class="card">
    <div class="content">
      <h4>Welcome</h4>
      <p>Check out the tools in the sidebar to the right to get started.</p>
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
  <section id="landing-changelog" class="card">
    <h2>Changelog</h2>
    <div class="content">
      <ul>
        <li><strong>2023-08-12:</strong> Added ability to ctrl/command-click on links and templates in wikitext results to open wiki link in new tab</li>
        <li><strong>2023-08-12:</strong> Added option to OL generator to include the section header</li>
        <li><strong>2023-08-11:</strong> Added ability to search on raw textmap</li>
        <li><strong>2023-08-11:</strong> Fixed unnecessary nested bolds/italics and fixed wikitext syntax highlighter crashing on certain bold/italic quote combinations.</li>
        <li><strong>2023-05-06:</strong> Added "TextMap Search" tool</li>
        <li><strong>2023-05-06:</strong> Added "Other Languages Generator" tool</li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { SITE_TITLE } from '../../loadenv.ts';
</script>
