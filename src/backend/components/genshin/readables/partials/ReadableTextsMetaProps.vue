<template>
  <div class="valign meta-props no-margin">
    <div class="prop">
      <span class="prop-label">Path</span>
      <span class="prop-values">
            <span class="prop-value for-lang-path">{{ item.ReadableText.LangPath }}</span>
          </span>
    </div>
    <div v-if="item.MainQuestTrigger" class="prop">
      <span class="prop-label">Quest Condition</span>
      <span class="prop-values">
        <a :href="`/genshin/quests/${item.MainQuestTrigger.Id}`" class="prop-value"
           :ui-tippy-hover="item.MainQuestTrigger.TitleText">{{ item.MainQuestTrigger.Id }}</a>
        <span class="prop-value">{{ item.MainQuestTrigger.TitleText }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ReadableItem } from '../../../../../shared/types/genshin/readable-types.ts';

defineProps<{
  item?: ReadableItem
}>();
</script>
