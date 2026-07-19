<template>
  <div class="card result-count-card">
    <h2>Total Results: <span>{{ materials.length }}</span></h2>
  </div>
  <section v-if="materials.length" class="card">
    <h2>Search Results</h2>
    <div class="content dispFlex flexWrap alignStart">
      <div v-for="material of materials" class="w100p">
        <a :href="`/genshin/byd/items/${material.Id}`" class="secondary spacer3-all valign textAlignLeft" role="button" style="padding:5px">
          <GenshinItem :item="material" :no-name="true" :no-count="true" :no-link="true" />
          <div class="spacer10-horiz grow">
            <div class="fontWeight600">{{ normGenshinText(material.NameText) }}</div>
            <div class="valign spacer5-top">
              <GenshinStars :quality="material.RankLevel || 0" />
              <small class="opacity80p spacer5-left">{{ material.BydMaterialType }}</small>
              <div class="grow"></div>
              <small class="opacity80p" v-if="material.AddedAt">Added in {{ material.AddedAt.version.displayLabel }}</small>
            </div>
          </div>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { BydMaterialExcelConfigData } from '../../../../shared/types/genshin/beyond-types.ts';
import GenshinItem from '../links/GenshinItem.vue';
import GenshinStars from '../links/GenshinStars.vue';
import { useTrace } from '../../../middleware/request/tracer.ts';

const { normGenshinText } = useTrace();

defineProps<{
  materials?: BydMaterialExcelConfigData[],
  searchText?: string,
}>();
</script>
