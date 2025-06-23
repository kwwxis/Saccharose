<template>
  <div class="card">
    <h2>Result</h2>
    <div class="content">
      <Wikitext :value="combineResult.result" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { OLCombinedResult } from '../../../domain/abstract/basic/OLgen.ts';
import Wikitext from '../../utility/Wikitext.vue';

defineProps<{
  combineResult?: OLCombinedResult
}>();
</script>
