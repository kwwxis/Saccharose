<template>
  <div class="card">
    <h2 class="valign">
      <span>Result</span>
      <span class="grow"></span>
      <button class="secondary small" ui-action="copy: #ol-combine-result-text"
              ui-tippy-hover="Click to copy to clipboard"
              ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
    </h2>
    <div class="content">
      <Wikitext id="ol-combine-result-text" :value="combineResult.result" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Wikitext from '../../utility/Wikitext.vue';
import { OLCombinedResult } from '../../../../shared/types/ol-types.ts';

defineProps<{
  combineResult?: OLCombinedResult
}>();
</script>
