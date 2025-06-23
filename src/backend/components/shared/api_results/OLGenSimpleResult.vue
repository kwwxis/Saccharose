<template>
  <template v-if="olResult">
    <template v-if="olResult.warnings?.length">
      <template v-for="warning of olResult.warnings">
        <p class="error-notice"><strong>Warning:</strong> <span v-html="warning"></span></p>
      </template>
    </template>
    <Wikitext :value="olResult.result" :markers="olResult.markers" :for-ol-with-copy-button="true" />
  </template>
  <template v-else>
    <p class="no-results-found info-notice">No results found for <b>{{ searchText }}</b></p>
  </template>
</template>

<script setup lang="ts">
import { OLResult } from '../../../domain/abstract/basic/OLgen.ts';
import Wikitext from '../../utility/Wikitext.vue';

defineProps<{
  olResult?: OLResult,
  searchText?: string
}>();
</script>
