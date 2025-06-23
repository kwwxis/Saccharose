<template>
  <template v-if="mainQuests && mainQuests.length">
    <h4>Quest Search Results</h4>
    <template v-for="mainQuest of mainQuests">
      <a role="button" class="quest-search-result-item secondary dispBlock spacer5-bottom textAlignLeft"
         :href="`/genshin/quests/${mainQuest.Id}`" :data-id="mainQuest.Id">
        <strong>ID {{ mainQuest.Id }}:&nbsp;</strong>
        <span>{{ mainQuest.TitleText || '(No title)' }}</span>
      </a>
    </template>
  </template>
  <div v-if="mainQuests && mainQuests.length && chapters && chapters.length" class="spacer10-vert"></div>
  <template v-if="chapters && chapters.length">
    <h4>Chapter Search Results</h4>
    <template v-for="chapter of chapters">
      <div class="chapter-search-result-item">
        <a class="secondary spacer3-all valign textAlignLeft" role="button" :href="`/genshin/chapters/${chapter.Id}`" target="_blank">
          <img v-if="chapter.ChapterIcon"
               :src="`/images/genshin/${chapter.ChapterIcon}.png`" class="spacer10-right" loading="lazy" decoding="async"
               style="width:48px;height:48px;background:#333;border-radius:50%;border:1px solid #fff;"/>
          <template v-if="chapter.Summary.ChapterNumText">
            <span>{{ chapter.Summary.ChapterNumText }}</span>
            <span>&nbsp;&mdash;&nbsp;</span>
          </template>
          <template v-if="chapter.Summary.ChapterName">
            <span>{{ chapter.Summary.ChapterName }}</span>
            <span>&nbsp;&mdash;&nbsp;</span>
          </template>
          <template v-if="chapter.Summary.ActNumText">
            <span>{{ chapter.Summary.ActNumText }}</span>
            <span>:&nbsp;</span>
          </template>
          <strong>{{ chapter.Summary.ActName }}</strong>
        </a>
        <div style="padding-left:72px">
          <GenshinChapterListItem :quests="chapter.OrderedQuests" />
        </div>
      </div>
    </template>
  </template>
  <template v-if="(!mainQuests || !mainQuests.length) && (!chapters || !chapters.length)">
    <p>No results found.</p>
  </template>
</template>

<script setup lang="ts">
import { ChapterExcelConfigData, MainQuestExcelConfigData } from '../../../../shared/types/genshin/quest-types.ts';
import GenshinChapterListItem from '../chapters/GenshinChapterListItem.vue';

defineProps<{
  mainQuests?: MainQuestExcelConfigData[],
  chapters?: ChapterExcelConfigData[],
}>();
</script>
