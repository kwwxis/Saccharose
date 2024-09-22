<template>
  <section class="card">
    <h2>VO File to Dialogue</h2>
    <div class="content form-box">
      <p class="spacer10-bottom">Enter the VO file name and get the corresponding text line, not including subsequent dialog lines. One file name per line.</p>
      <div class="field valign">
        <textarea class="search-input grow" placeholder="Enter VO file name(s), one per line." style="min-height:200px;resize:vertical;"></textarea>
      </div>
      <div class="field valign spacer10-top">
        <button class="search-submit primary primary--2">Search</button>
        <div class="search-submit-pending hide loading small spacer5-left"></div>
      </div>
      <hr class="spacer5" />
      <p style="padding:5px;font-size:0.85em">Accepted format: case-insensitive, underscores or spaces,
        "<code>File:</code>" prefix optional, "<code>.ogg</code>" extension optional, can be in the
        <span style="white-space: nowrap">"<WikiTemplateLink name="A" />"</span>
        template with or without additional parameters.<br/>Examples:</p>
      <ul style="font-size:0.85em">
        <li style="margin:0"><code>vo mdaq006 3 paimon 01.ogg</code></li>
        <li style="margin:0"><code>File:vo_mdaq006_3_paimon_01.ogg</code> </li>
        <li style="margin:0"><code v-html="'{{A|vo mdaq006 3 paimon 01.ogg}}'"></code></li>
      </ul>
      <p style="padding:5px;font-size:0.85em">Currently only supports showing the text for dialogue and reminders,
        other types such as fetters will only show the type and ID.</p>
    </div>
  </section>
  <div id="search-result"></div>
</template>

<script setup lang="ts">
import WikiTemplateLink from '../../utility/WikiTemplateLink.vue';
</script>
