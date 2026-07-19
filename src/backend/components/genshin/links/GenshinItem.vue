<template>
  <div v-if="noLink || !itemLink" :class="cssClasses">
    <GenshinItemInner v-bind="props" />
  </div>
  <a v-else :class="cssClasses" :href="`/genshin/${itemLink}/${item.Id}`">
    <GenshinItemInner v-bind="props" />
  </a>
</template>

<script setup lang="ts">
import { MaterialExcelConfigData } from '../../../../shared/types/genshin/material-types.ts';
import { WeaponExcelConfigData } from '../../../../shared/types/genshin/weapon-types.ts';
import { HomeWorldFurnitureExcelConfigData } from '../../../../shared/types/genshin/homeworld-types.ts';
import { ReliquaryExcelConfigData } from '../../../../shared/types/genshin/artifact-types.ts';
import GenshinItemInner from './GenshinItemInner.vue';
import {
  BeyondCostumeExcelConfigData, BeyondCostumeSuitExcelConfigData,
  BydMaterialExcelConfigData, isBeyondCostume, isBeyondCostumeSuit,
} from '../../../../shared/types/genshin/beyond-types.ts';
import { AvatarExcelConfigData, isAvatar } from '../../../../shared/types/genshin/avatar-types.ts';

export type GenshinItemComponentProps = {
  item?: MaterialExcelConfigData|WeaponExcelConfigData|HomeWorldFurnitureExcelConfigData|ReliquaryExcelConfigData
    |BydMaterialExcelConfigData|AvatarExcelConfigData|BeyondCostumeExcelConfigData|BeyondCostumeSuitExcelConfigData,
  itemCount?: number,
  noCount?: boolean,
  noLink?: boolean,
  noName?: boolean,
  small?: boolean,
  class?: string|string[]|Record<string, boolean>,
};

const props = defineProps<GenshinItemComponentProps>();
const { item } = props;

const itemLink = (() => {
  if (!item) {
    return null;
  } else if (isAvatar(item)) {
    return null;
  } else if (isBeyondCostume(item)) {
    return 'byd/costumes';
  } else if (isBeyondCostumeSuit(item)) {
    return 'byd/costume-suits';
  } else if (item.ItemType === 'ITEM_WEAPON') {
    return 'weapons';
  } else if (item.ItemType === 'ITEM_FURNITURE') {
    return 'furnishings';
  } else if (item.ItemType === 'ITEM_RELIQUARY') {
    return 'artifacts';
  } else if (item.ItemType === 'ITEM_BEYOND_MATERIAL') {
    return 'byd/items';
  }
})();

const cssClasses = {
  'material-item': true,
  'no-name': props.noName,
  'small': props.small,
};

if (typeof props.class === 'string') {
  cssClasses[props.class] = true;
} else if (Array.isArray(props.class)) {
  for (const cls of props.class) {
    cssClasses[cls] = true;
  }
} else if (typeof props.class === 'object') {
  Object.assign(cssClasses, props.class);
}
</script>
