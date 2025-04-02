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
