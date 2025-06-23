<template>
  <section class="card">
    <h2>Search Results</h2>
    <template v-if="stages.length > 0">
      <GcgStageTable :stages="stages" />
    </template>
    <template v-else>
      <div class="content">
        <p>No results found.</p>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { GCGGameExcelConfigData } from '../../../../shared/types/genshin/gcg-types.ts';
import GcgStageTable from './GcgStageTable.vue';

defineProps<{
  stages?: GCGGameExcelConfigData[]
}>();
</script>
