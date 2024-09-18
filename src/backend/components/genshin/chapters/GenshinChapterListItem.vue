<template>
  <template v-for="item of quests">
    <a role="button" class="quest-search-result-item secondary dispBlock spacer5-bottom textAlignLeft" :href="`/genshin/quests/${item.quest.Id}`" :data-id="item.quest.Id">
      <strong>ID {{ item.quest.Id }}:&nbsp;</strong>
      <span>{{ item.quest.TitleText }}</span>
    </a>
    <div v-if="item.subquests && item.subquests.length" class="spacer15-left">
      <GenshinChapterListItem :quests="item.subquests" />
    </div>
  </template>
</template>

<script setup lang="ts">
import { QuestOrderItem } from '../../../domain/genshin/dialogue/dialogue_util.ts';

defineProps<{
  quests: QuestOrderItem[],
}>()
</script>
