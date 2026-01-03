<template>
  <section class="card">
    <h2 class="valign">
      <span>OL Combine</span>
    </h2>
    <div class="tab-list secondary" role="tablist">
      <a :href="`${ctx.siteHome}/OL`" role="tab" class="tab">Generate</a>
      <a :href="`${ctx.siteHome}/OL/combine`" role="tab" class="tab active">Combine</a>
    </div>
    <div class="content">
      <p class="spacer5-bottom">Combine multiple <WikiTemplateLink name="Other Languages" /> templates.
      Paste them below and they will be combined in sequential order.</p>
      <div class="field">
        <div id="ol-combine-input" class="input-style" style="width:100%;height:500px"></div>
      </div>
      <div class="field valign spacer10-top">
        <button class="ol-combine-submit primary primary--2">Combine</button>
        <div class="ol-combine-submit-pending hide loading small spacer5-left"></div>
      </div>
    </div>
  </section>
  <div id="ol-combine-result"></div>
</template>

<script setup lang="ts">
import WikiTemplateLink from '../utility/WikiTemplateLink.vue';
import { useTrace } from '../../middleware/request/tracer.ts';

const { ctx } = useTrace();
</script>
