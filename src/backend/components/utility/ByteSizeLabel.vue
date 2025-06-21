<template>
  <template v-if="byteSize >= 1_000_000_000">
    <span><span class="code" style="font-size:0.9em">{{ (byteSize / 1_000_000_000).toFixed(2) }}</span> GB</span>
  </template>
  <template v-else-if="byteSize >= 1_000_000">
    <span><span class="code" style="font-size:0.9em">{{ (byteSize / 1_000_000).toFixed(2) }}</span> MB</span>
  </template>
  <template v-else>
    <span><span class="code" style="font-size:0.9em">{{ (byteSize / 1000).toFixed(2) }}</span> KB</span>
  </template>
  <span v-if="!noFullSize">&nbsp;(<span class="code" style="font-size:0.9em">{{ byteSize }}</span> bytes)</span>
</template>

<script setup lang="ts">
defineProps<{
  byteSize: number,
  noFullSize?: boolean,
}>();
</script>
