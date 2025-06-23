<template>
  <div class="card result-count-card">
    <h2>Total Results: <span>{{ olResults.length }}</span></h2>
  </div>
  <div v-for="(olResult, idx) of olResults" :id="`ol-result-card-${idx}`" class="card ol-result">
    <div class="content">
      <div class="fsplit">
        <h4 class="valign">
          <span class="expando" :ui-action="`expando: #ol-result-content-${idx}`"><Icon name="chevron-down" :size="17" /></span>
          <span style="opacity:0.6">TextMapHash:&nbsp;</span>
          <code>{{ olResult.textMapHash }}</code>
          <a v-if="req.isAuthenticated()" :href="`${ctx.siteHome}/excel-usages?q=${olResult.textMapHash}`"
             role="button" class="secondary small spacer5-left fontWeight500" target="_blank">Usages</a>
        </h4>
        <div class="valign">
          <button class="secondary ol-result-copy"
                  :ui-action="`copy: #ol-result-${idx}`"
                  ui-tippy-hover="Click to copy to clipboard"
                  ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
        </div>
      </div>
      <div :id="`ol-result-content-${idx}`">
        <template v-if="olResult.warnings?.length">
          <template v-for="warning of olResult.warnings">
            <p class="error-notice"><strong>Warning:</strong> <span v-html="warning"></span></p>
          </template>
        </template>
        <Wikitext :id="`ol-result-${idx}`" :for-ol="true" :markers="olResult.markers" :value="olResult.result" :extra-class-names="'spacer5-top'" />
        <template v-if="req.isAuthenticated() && olResult.duplicateTextMapHashes?.length">
          <h5>Duplicate TextMapHashes</h5>
          <p class="spacer5-bottom">List of TextMapHashes whose values are duplicates of {{olResult.textMapHash}} across all languages.<br>
            Click on a link to see where that hash is used or see
            <a :href="`${ctx.siteHome}/excel-usages?q=${olResult.textMapHash},${olResult.duplicateTextMapHashes.join(',')}`" target="_blank">all usages</a>.</p>
          <div style="max-width: 790px;
              padding: 0;
              display: flex;
              flex-wrap: wrap;">
            <a class="border-shade" role="button" style="min-width:85px" :href="`${ctx.siteHome}/excel-usages?q=${olResult.textMapHash}`" target="_blank">{{ olResult.textMapHash }}</a>
            <template v-for="textMapHash of olResult.duplicateTextMapHashes">
              <a class="border-shade" role="button" style="min-width:85px" :href="`${ctx.siteHome}/excel-usages?q=${textMapHash}`" target="_blank">{{ textMapHash }}</a>
            </template>
          </div>
        </template>
      </div>
    </div>
  </div>
  <div v-if="!olResults.length" class="card no-results-found">
    <div class="content">
      <p>No results found for <b>{{ searchText }}</b></p>
      <p class="spacer5-top">It's possible you might not have an exact match. Try using the <a :href="`${ctx.siteHome}/textmap`">TextMap Search</a> tool.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { OLResult } from '../../../domain/abstract/basic/OLgen.ts';
import { getTrace } from '../../../middleware/request/tracer.ts';
import Icon from '../../utility/Icon.vue';
import Wikitext from '../../utility/Wikitext.vue';

const { ctx, req } = getTrace();

defineProps<{
  olResults?: OLResult[],
  searchText?: string
}>();
</script>
