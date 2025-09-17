<template>
  <div v-if="props" class="valign meta-props">
    <div v-for="prop of props" class="prop">
      <span class="prop-label">{{ prop.label }}</span>
      <span v-if="prop.values && prop.values.length" class="prop-values">
        <template v-for="val of prop.values">
          <a v-if="val.link" class="prop-value"
             :class="{fontWeight600: val.bold, unblankIfSameUrl: true}"
             :href="val.link"
             :target="val.link.startsWith('#') ? null : '_blank'"
             :ui-tippy-hover="val.tooltip">{{ val.value }}</a>
          <span v-else class="prop-value" :class="{fontWeight600: val.bold}" :ui-tippy-hover="val.tooltip">{{ val.value }}</span>
        </template>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MetaProp } from '../../util/metaProp.ts';

defineProps<{
  props: MetaProp[],
}>();
</script>
