<template>
  <table class="article-table">
    <template v-for="chapterName of keysOf(chapterSect)">
      <thead>
        <tr><th>{{ chapterName }}</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="content dispFlex flexWrap alignStretch">
              <div v-for="chapter of chapterSect[chapterName]" class="w50p dispFlex alignStretch">
                <a class="w100p secondary valign spacer5-all textAlignLeft" role="button" :href="`/genshin/chapters/${chapter.Id}`">
                  <img v-if="chapter.ChapterIcon" :src="`/images/genshin/${chapter.ChapterIcon}.png`"
                       class="spacer10-right" loading="lazy" decoding="async"
                       style="width:48px;height:48px;background:#333;border-radius:50%;border:1px solid #fff;"/>
                  <div>
                    <template v-if="chapter.Summary.ActNumText">
                      <span>{{ chapter.Summary.ActNumText }}</span>
                      <span>&nbsp;&mdash;&nbsp;</span>
                    </template>
                    <strong class="act-name">{{ chapter.Summary.ActName }}</strong>
                  </div>
                </a>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </template>
  </table>
</template>

<script setup lang="ts">
import { ChapterExcelConfigData } from '../../../../shared/types/genshin/quest-types.ts';
import { keysOf } from '../../../../shared/util/arrayUtil.ts';

defineProps<{
  chapterSect: {[chapterName: string]: ChapterExcelConfigData[]}
}>();
</script>
