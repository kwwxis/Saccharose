<template>
  <div class="card result-count-card">
    <h2>Total Results: <span>{{ achievements.length }}</span></h2>
  </div>

  <section v-if="achievements.length" class="card">
    <AchievementListingTable :achievements="achievements" :show-category="true" />
  </section>
  <div v-else class="card no-results-found">
    <div class="content">
      <p>No results found for <b>{{ searchText }}</b></p>
    </div>
  </div>
</template>

<script setup lang="ts">

import AchievementListingTable from './AchievementListingTable.vue';
import { AchievementExcelConfigData } from '../../../../shared/types/genshin/achievement-types.ts';

defineProps<{
  achievements: AchievementExcelConfigData[],
  searchText: string,
}>();
</script>
