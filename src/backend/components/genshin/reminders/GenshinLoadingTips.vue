<template>
  <section class="card">
    <h2>Loading Tips</h2>
    <div class="tab-list" role="tablist">
      <a v-for="catName of catNames" :href="`/genshin/loading-tips/${catName}${tableFormat ? '?table=1' : ''}`"
         role="tab" :class="{tab: true, active: catName === selectedCat}">{{ catName }}</a>
    </div>
  </section>

  <section v-if="selectedCat && wikitext" class="card">
    <h2>{{ selectedCat }}</h2>
    <div class="content">
      <Wikitext :value="wikitext" />
    </div>
  </section>
  <section v-else-if="!wikitext && selectedCat" class="card">
    <div class="content">
      <p>Category not found: <strong>{{ selectedCat }}</strong></p>
    </div>
  </section>
  <section v-else class="card">
    <div class="content">
      <p>Choose a category.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import Wikitext from '../../utility/Wikitext.vue';

defineProps<{
  catNames?: string[],
  selectedCat?: string,
  tableFormat?: boolean,
  wikitext?: string,
}>();
</script>
