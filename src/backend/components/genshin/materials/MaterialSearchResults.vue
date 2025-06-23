<template>
  <div class="card result-count-card">
    <h2>Total Results: <span>{{ materials.length }}</span></h2>
  </div>
  <section v-if="materials.length" class="card">
    <h2>Search Results</h2>
    <div class="content dispFlex flexWrap alignStart">
      <div v-for="material of materials" class="w100p">
        <a :href="`/genshin/items/${material.Id}`" class="secondary spacer3-all valign textAlignLeft" role="button" style="padding:5px">
          <GenshinItem :item="material" :no-name="true" :no-count="true" :no-link="true" />
          <span class="spacer10-left">{{ material.NameText }}</span>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { MaterialExcelConfigData } from '../../../../shared/types/genshin/material-types.ts';
import GenshinItem from '../links/GenshinItem.vue';

defineProps<{
  materials?: MaterialExcelConfigData[],
  searchText?: string,
}>();
</script>
