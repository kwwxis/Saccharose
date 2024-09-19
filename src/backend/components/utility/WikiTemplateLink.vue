<template>
  <span v-html="ctx.wikiTemplateLink(name)"></span>
</template>

<script setup lang="ts">
import { getTrace } from '../../middleware/request/tracer.ts';

defineProps<{
  name: string;
}>();

const {ctx} = getTrace();
</script>
