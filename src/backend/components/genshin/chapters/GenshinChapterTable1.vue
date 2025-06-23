<template>
  <table class="article-table">
    <thead>
      <tr>
        <th>Chapter</th>
        <th>Act</th>
      </tr>
    </thead>
    <tbody>
      <template v-for="chapterName of keysOf(chapterSect)">
        <tr>
          <th>&nbsp;</th>
          <th>{{ chapterName }}</th>
        </tr>
        <template v-for="subChapterName of keysOf(chapterSect[chapterName])">
          <tr>
            <td>
              <div class="content">{{ subChapterName }}</div>
            </td>
            <td>
              <div class="content">
                <template v-for="[i, chapter] of chapterSect[chapterName][subChapterName].entries()">
                  <a class="secondary textAlignLeft spacer5-bottom valign" role="button" :href="`/genshin/chapters/${chapter.Id}`">
                    <img v-if="chapter.ChapterIcon" :src="`/images/genshin/${chapter.ChapterIcon}.png`" class="spacer10-right"
                         loading="lazy" decoding="async" style="width:48px;height:48px;background:#333;border-radius:50%;border:1px solid #fff;"/>
                    <div>
                      <template v-if="chapter.Summary.ActNumText">
                        <span>{{ chapter.Summary.ActNumText }}</span>
                        <span>&nbsp;&mdash;&nbsp;</span>
                      </template>
                      <strong class="act-name">{{ chapter.Summary.ActName }}</strong>
                    </div>
                  </a>
                  <hr v-if="i !== chapterSect[chapterName][subChapterName].length - 1" class="spacer5-bottom">
                </template>
              </div>
            </td>
          </tr>
        </template>
      </template>
    </tbody>
  </table>

</template>

<script setup lang="ts">
import { ChapterExcelConfigData } from '../../../../shared/types/genshin/quest-types.ts';
import { keysOf } from '../../../../shared/util/arrayUtil.ts';

defineProps<{
  chapterSect?: {[chapterName: string]: {[subChapterName: string]: ChapterExcelConfigData[]}}
}>();
</script>
