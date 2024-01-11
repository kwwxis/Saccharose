<template>
  <div class="hello">
    <p>My message: {{ msg }}</p>
  </div>

  <div id="my-test"></div>
</template>

<script setup lang="ts">
import { getTrace } from '../middleware/request/tracer.ts';

defineProps<{
  msg: string,
}>();

const request = getTrace();
</script>

<style scoped lang="scss">
.hello {
  border: 1px solid #ccc;
}
</style>
