<template>
  <div v-if="noLink || !itemLink" class="material-item" :class="{ 'no-name': noName, 'small': small }">
    <GenshinItemInner v-bind="props" />
  </div>
  <a v-else class="material-item" :class="{ 'no-name': noName, 'small': small }"
     :href="`/genshin/${itemLink}/${item.Id}`">
    <GenshinItemInner v-bind="props" />
  </a>
</template>

<script setup lang="ts">
import { MaterialExcelConfigData } from '../../../../shared/types/genshin/material-types.ts';
import { WeaponExcelConfigData } from '../../../../shared/types/genshin/weapon-types.ts';
import { HomeWorldFurnitureExcelConfigData } from '../../../../shared/types/genshin/homeworld-types.ts';
import { ReliquaryExcelConfigData } from '../../../../shared/types/genshin/artifact-types.ts';
import GenshinItemInner from './GenshinItemInner.vue';
import { BydMaterialExcelConfigData } from '../../../../shared/types/genshin/beyond-types.ts';
import { AvatarExcelConfigData, isAvatar } from '../../../../shared/types/genshin/avatar-types.ts';

export type GenshinItemComponentProps = {
  item?: MaterialExcelConfigData|WeaponExcelConfigData|HomeWorldFurnitureExcelConfigData|ReliquaryExcelConfigData|BydMaterialExcelConfigData|AvatarExcelConfigData,
  itemCount?: number,
  noCount?: boolean,
  noLink?: boolean,
  noName?: boolean,
  small?: boolean,
};

const props = defineProps<GenshinItemComponentProps>();
const { item } = props;

const itemLink = isAvatar(item)
  ? null
  : (
    (item.ItemType === 'ITEM_WEAPON' ? 'weapons' : '') ||
    (item.ItemType === 'ITEM_FURNITURE' ? 'furnishings' : '') ||
    (item.ItemType === 'ITEM_RELIQUARY' ? 'artifacts' : '') ||
    (item.ItemType === 'ITEM_BEYOND_MATERIAL' ? 'byd/items' : '') ||
    (item.ItemType === 'ITEM_BEYOND_MATERIAL' ? 'byd/items' : '') ||
    'items'
  );

</script>
