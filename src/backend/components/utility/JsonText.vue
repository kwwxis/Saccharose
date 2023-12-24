<template>
  <AceComponent v-bind="yourProps"></AceComponent>
</template>

<script setup lang="ts">
import AceComponent, { AceProps } from './AceComponent.vue';
const myProps = defineProps<AceProps>();
const yourProps: AceProps = Object.assign({}, myProps);

if (typeof yourProps.extraClassNames === 'string') {
  yourProps.extraClassNames = [yourProps.extraClassNames, 'json'];
} else if (Array.isArray(yourProps.extraClassNames)) {
  yourProps.extraClassNames = yourProps.extraClassNames.concat('json');
} else {
  yourProps.extraClassNames = ['json'];
}
</script>