<template>
  <template v-if="byteSize >= 1_000_000">
    <span>{{ (byteSize / 1_000_000).toFixed(2) }} MB</span>
  </template>
  <template v-else>
    <span>{{ (byteSize / 1000).toFixed(2) }} KB</span>
  </template>
  <span>&nbsp;({{ byteSize }} bytes)</span>
</template>

<script setup lang="ts">
defineProps<{
  byteSize: number,
}>();
</script>
