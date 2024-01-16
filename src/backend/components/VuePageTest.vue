<template>
  <div class="hello">
    <p>My message: {{ msg }}</p>
  </div>

  <div id="my-test"></div>

  <br>
  <br>

  <div id="my-test2">
    <span>Hello World!
      <span style="font-style:italic" v-html="`{{My Template<span style='font-weight:bold;font-size:1.2em'>|myarg</span> = foobar}} [[My Link]]`"></span>
    </span>
    Testing test
  </div>
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
