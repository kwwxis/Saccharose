<template>
  <div class="card">
    <h2>Result</h2>
    <div class="content">
      <Wikitext :value="combineResult.result" />
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
