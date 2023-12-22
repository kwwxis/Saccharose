<template>
  <div v-if="noLink" class="material-item" :class="{ 'no-name': noName }">
    <GenshinItemInner v-bind="props" />
  </div>
  <a v-else class="material-item" :class="{ 'no-name': noName }"
     :href="`/${itemLink}/${item.Id}`">
    <GenshinItemInner v-bind="props" />
  </a>
</template>

<script setup lang="ts">
import { MaterialExcelConfigData } from '../../../shared/types/genshin/material-types';
import { WeaponExcelConfigData } from '../../../shared/types/genshin/weapon-types';
import { HomeWorldFurnitureExcelConfigData } from '../../../shared/types/genshin/homeworld-types';
import { ReliquaryExcelConfigData } from '../../../shared/types/genshin/artifact-types';
import GenshinItemInner from './GenshinItemInner.vue';

export type GenshinItemComponentProps = {
  item: MaterialExcelConfigData|WeaponExcelConfigData|HomeWorldFurnitureExcelConfigData|ReliquaryExcelConfigData,
  itemCount?: number,
  noCount?: boolean,
  noLink?: boolean,
  noName?: boolean,
};

const props = defineProps<GenshinItemComponentProps>();
const { item } = props;

const itemLink =
  (item.ItemType === 'ITEM_WEAPON' ? 'weapons' : '') ||
  (item.ItemType === 'ITEM_FURNITURE' ? 'furnishings' : '') ||
  (item.ItemType === 'ITEM_RELIQUARY' ? 'artifacts' : '') ||
  'items';

</script>