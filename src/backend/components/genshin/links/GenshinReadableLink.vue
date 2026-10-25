<template>
  <a class="secondary spacer3-all valign textAlignLeft" role="button" :href="`/genshin/readables/item/${readable.Id}`">
    <img class="icon x32" :src="`/images/genshin/${readable.PrimaryVariantIcon}.png`" loading="lazy" decoding="async" />
    <div class="spacer10-left">
      <div>{{ normGenshinText(readable?.Document?.TitleText) }}</div>
      <div :class="{'spacer5-top': !!readable?.Document?.TitleText && shownVariants.length > 0}">
        <small class="dispBlock opacity80p" v-for="variant of shownVariants" :key="variant.type">
          <span class="secondary-label small spacer5-right">
            <span v-if="variant.type == 'Material'">Item</span>
            <span v-else-if="variant.type == 'Artifact'">Artifact</span>
            <span v-else-if="variant.type == 'Weapon'">Weapon</span>
            <span v-else-if="variant.type == 'Flycloak'">Wind Glider</span>
            <span v-else-if="variant.type == 'Costume'">Costume</span>
          </span>
          <span>{{ normGenshinText(variant.info.TitleText) }}</span>
        </small>
      </div>
    </div>
    <div class="grow"></div>
    <div>
      <div><small>Doc ID: {{ readable.Id }}</small></div>
      <div class="opacity80p" v-if="readable.AddedAtVersion">
        <small>Added in {{ readable.AddedAtVersion.displayLabel }}</small>
      </div>
    </div>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Readable } from '../../../../shared/types/genshin/readable-types.ts';
import { useTrace } from '../../../middleware/request/tracer.ts';

const { normGenshinText } = useTrace();

const props = defineProps<{
  readable?: Readable
}>();

const shownVariants = computed(() => {
  const types = props.readable?.VariantTypes || [];
  const docTitleText = props.readable?.Document?.TitleText;
  return types
    .map(type => ({ type, info: props.readable?.Variants?.[type] }))
    .filter(variant => !!variant.info && variant.info.TitleText !== docTitleText);
});
</script>
