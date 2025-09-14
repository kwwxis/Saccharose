<template>
  <div class="tcg-tag valign" style="padding:2px 0;font-size:15px">
    <template v-if="!GCG_TAGS_WITHOUT_ICONS.has(tag.Type)">
      <img :src="`/images/genshin/static/TCG/${tag.CategoryType}/${tag.Type}.png`"
           :class="`x20 tcg-icon tcg-tag-icon ${tag.Type}`" />
    </template>
    <template v-else>
      <span class="tcg-tag-icon tcg-icon tcg-tag-icon--no-image" title="No icon">?</span>
    </template>
    <span class="tcg-tag-name spacer5-left">{{ tag.NameText }}</span>
  </div>
</template>

<script setup lang="ts">
import { GCG_TAGS_WITHOUT_ICONS, GCGTagExcelConfigData } from '../../../../../shared/types/genshin/gcg-types.ts';

defineProps<{
  tag: GCGTagExcelConfigData,
}>();
</script>
