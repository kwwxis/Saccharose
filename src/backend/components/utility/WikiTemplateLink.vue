<template>
  <span v-html="ctx.wikiTemplateLink(name, noLink)"></span>
</template>

<script setup lang="ts">
import { getTrace } from '../../middleware/request/tracer.ts';

defineProps<{
  name: string,
  noLink?: boolean,
}>();

const {ctx} = getTrace();
</script>
