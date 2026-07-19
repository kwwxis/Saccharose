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
          <div class="spacer10-horiz grow">
            <div class="fontWeight600">{{ normGenshinText(weapon.NameText) }}</div>
            <div class="valign spacer5-top">
              <GenshinStars :quality="weapon.RankLevel || 0" />
              <small class="opacity80p spacer5-left">{{ weapon.ItemTypeName }}</small>
              <div class="grow"></div>
              <small class="opacity80p" v-if="weapon.AddedAt">Added in {{ weapon.AddedAt.version.displayLabel }}</small>
            </div>
          </div>
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
import { useTrace } from '../../../middleware/request/tracer.ts';
import GenshinStars from '../links/GenshinStars.vue';

const { normGenshinText } = useTrace();

defineProps<{
  weapons?: WeaponExcelConfigData[],
  searchText?: string
}>();
</script>
