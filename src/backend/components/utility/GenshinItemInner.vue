<template>
  <div class="material-card">
    <div class="material-icon"
         :class="{'no-count': noCount}"
         :data-quality="item.RankLevel || 0">
      <img v-if="item.Icon" :src="imageUrl" loading="lazy" decoding="async" />
      <img v-else src="/images/genshin/static/Item_Unknown.png" loading="lazy" decoding="async" />
    </div>
    <img v-if="effectIcon" class="effect-icon" :src="`/images/genshin/${effectIcon}.png`" loading="lazy" decoding="async" />
    <div v-if="!noCount && itemCount" class="material-count">{{ itemCount }}</div>
    <div v-if="!noCount && !itemCount" class="material-count">&mdash;</div>
  </div>
  <span v-if="!noName" class="material-name">{{ item.NameText }}</span>
</template>

<script setup lang="ts">
import { GenshinItemComponentProps } from './GenshinItem.vue';

const { item, itemCount } = defineProps<GenshinItemComponentProps>();
const effectIcon: string = (<any> item).EffectIcon;
const imageUrl = (<any> item).IconUrl ? (<any> item).IconUrl : `/images/genshin/${item.Icon}.png`;
</script>