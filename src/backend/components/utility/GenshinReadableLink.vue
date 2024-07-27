<template>
  <a class="secondary spacer3-all valign textAlignLeft" role="button" :href="`/genshin/readables/item/${readableView.Id}`">
    <img class="icon x32" :src="`/images/genshin/${readableView.Icon}.png`" loading="lazy" decoding="async" />
    <span v-if="!readableView?.Document || readableView.TitleText === readableView?.Document?.TitleText"
          class="spacer10-left">{{ readableView.TitleText }}</span>
    <div v-else class="spacer10-left">
      <small class="dispBlock">{{ readableView.TitleText }}</small>
      <div>{{ readableView.Document.TitleText }}</div>
    </div>
  </a>
</template>

<script setup lang="ts">
import { ReadableView } from '../../../shared/types/genshin/readable-types.ts';

defineProps<{
  readableView: ReadableView
}>()
</script>
