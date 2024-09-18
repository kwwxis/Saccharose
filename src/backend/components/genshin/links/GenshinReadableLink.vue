<template>
  <a class="secondary spacer3-all valign textAlignLeft" role="button" :href="`/genshin/readables/item/${readable.Id}`">
    <img class="icon x32" :src="`/images/genshin/${readable.Icon}.png`" loading="lazy" decoding="async" />
    <span v-if="!readable?.Document || readable.TitleText === readable?.Document?.TitleText"
          class="spacer10-left">{{ readable.TitleText }}</span>
    <div v-else class="spacer10-left">
      <small class="dispBlock">{{ readable.TitleText }}</small>
      <div>{{ readable.Document.TitleText }}</div>
    </div>
  </a>
</template>

<script setup lang="ts">
import { Readable } from '../../../../shared/types/genshin/readable-types.ts';

defineProps<{
  readable: Readable
}>()
</script>
