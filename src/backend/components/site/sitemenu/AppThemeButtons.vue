<template>
  <div class="toggle-theme-buttons alignStretch button-group spacer5-right">
    <button :class="{secondary: true, selected: !isNightmode}" value="daymode"><Icon name="sun" /></button>
    <button :class="{secondary: true, selected: isNightmode}" value="nightmode"><Icon name="moon" /></button>
  </div>
</template>

<script setup lang="ts">
import { useTrace } from '../../../middleware/request/tracer.ts';
import Icon from '../../utility/Icon.vue';

const { ctx } = useTrace();

const isNightmode = ctx.pref('isNightmode', false);

defineProps<{

}>();
</script>
