<template>
  <template v-if="typeof quality === 'number' && quality > 0 && quality <= 5">
    <img :src="`/images/genshin/static/Icon_${quality}_Stars.png`" loading="lazy" decoding="async"
         :style="`height:${height || 18}px;width:auto;`"
         :alt="`${quality} stars${quality > 1 ? 's' :''}`"
         :title="`${quality} star${quality > 1 ? 's' :''}`" />
  </template>
</template>

<script setup lang="ts">
defineProps<{
  quality?: number,
  height?: number,
}>();
</script>
