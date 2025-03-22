<template>
  <section id="landing-header" class="card">
    <div class="posRel">
      <img src="/images/site/logo/ZZZ_logo_shadow.png" />
      <h2><span>{{ SITE_TITLE }}</span><small>kwwxis's Zenless Zone Zero Wiki Tools</small></h2>
      <div class="bg"></div>
    </div>
  </section>
  <section class="card">
    <div class="content">
      <h4>Welcome</h4>
      <p>Check out the tools in the sidebar to the right to get started.</p>
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
