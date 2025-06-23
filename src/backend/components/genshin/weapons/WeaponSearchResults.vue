<template>
  <div class="card result-count-card">
    <h2>Total Results: <span>{{ weapons.length }}</span></h2>
  </div>
  <section v-if="weapons.length" class="card">
    <h2>Search Results</h2>
    <div class="content dispFlex flexWrap alignStart">
      <div v-for="weapon of weapons" class="w100p">
        <a :href="`/genshin/weapons/${weapon.Id}`" class="secondary spacer3-all valign textAlignLeft" role="button" style="padding:5px">
          <GenshinItem :item="weapon" :no-name="true" :no-count="true" :no-link="true" />
          <span class="spacer10-left">{{ weapon.NameText }}</span>
        </a>
      </div>
    </div>
  </section>
  <div v-else class="card no-results-found">
    <div class="content">
      <p>No results found for <b>{{ searchText }}</b></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { WeaponExcelConfigData } from '../../../../shared/types/genshin/weapon-types.ts';
import GenshinItem from '../links/GenshinItem.vue';

defineProps<{
  weapons?: WeaponExcelConfigData[],
  searchText?: string
}>();
</script>
