<template>
  <section id="landing-header" class="card">
    <div class="posRel">
      <div class="bg"></div>
      <h2><span>{{ SITE_TITLE }}</span><br><small>kwwxis's Wuthering Waves Wiki Tools</small></h2>
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
        <li><strong>2024-06-01:</strong> Added "Media" pages</li>
        <li><strong>2024-06-01:</strong> Added "Excel Viewer" tool</li>
        <li><strong>2024-06-01:</strong> Added "Excel Usages" tool</li>
        <li><strong>2024-06-01:</strong> Added "TextMap Search" tool</li>
        <li><strong>2024-06-01:</strong> Added "Other Languages Generator" tool</li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { SITE_TITLE } from '../../loadenv.ts';
</script>
