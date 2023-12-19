<template>
  <template v-html="html"></template>
</template>

<script setup lang="ts">
import { icon } from '../../routing/viewUtilities';
import { FeatherAttributes } from 'feather-icons';

const props = defineProps<{
  name: string,
  size?: number,
  props?: FeatherAttributes
}>();

const html = icon(props.name, props.size, props.props);
</script>

<style scoped lang="scss">

</style>