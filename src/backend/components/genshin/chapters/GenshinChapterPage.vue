<template>
  <template v-if="chapterNotFound">
    <section class="card">
      <h2>Chapter not found for {{ requestId }}</h2>
      <div class="content">
        <a href="/genshin/chapters" role="button" class="secondary spacer10-bottom">
          <Icon name="chevron-left" />
          <span>Back to chapter list</span>
        </a>
      </div>
    </section>
  </template>
  <template v-else-if="!!chapter">
    <section class="card">
      <h2>
        <template v-if="chapter.Summary.ActNumText">
          <span>{{ chapter.Summary.ActNumText }}</span>
          <span>&mdash;</span>
        </template>
        <strong class="act-name">{{ chapter.Summary.ActName }}</strong>
      </h2>
      <div class="content">
        <a href="/genshin/chapters" role="button" class="secondary spacer10-bottom">
          <Icon name="chevron-left" /><span>Back to chapter list</span>
        </a>
        <table class="article-table">
          <thead>
            <tr>
              <th colspan="3">Property Table</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="chapter.Summary.ChapterNumText">
              <tr>
                <td class="bold" colspan="2">Chapter</td>
                <td class="w70p">{{ chapter.Summary.ChapterNumText }}</td>
              </tr>
            </template>
            <template v-if="chapter.Summary.ChapterNum && chapter.Summary.ChapterNum >= 0">
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold">Chapter Number Int</td>
                <td class="w70p">{{ chapter.Summary.ChapterNum }}</td>
              </tr>
            </template>
            <template v-if="chapter.Summary.ChapterRoman">
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold">Chapter Number Roman</td>
                <td class="w70p">{{ chapter.Summary.ChapterRoman }}</td>
              </tr>
            </template>

            <template v-if="chapter.Summary.ChapterName">
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold">Sub Chapter</td>
                <td class="w70p">{{ chapter.Summary.ChapterName }}</td>
              </tr>
            </template>

            <template v-if="chapter.Summary.ActNumText">
              <tr>
                <td class="bold" colspan="2">Act Number</td>
                <td class="w70p">{{ chapter.Summary.ActNumText }}</td>
              </tr>
            </template>
            <template v-if="chapter.Summary.ActNum && chapter.Summary.ActNum >= 0">
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold">Act Number Int</td>
                <td class="w70p">{{ chapter.Summary.ActNum }}</td>
              </tr>
            </template>
            <template v-if="chapter.Summary.ActRoman">
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold">Act Number Roman</td>
                <td class="w70p">{{ chapter.Summary.ActRoman }}</td>
              </tr>
            </template>
            <template v-if="chapter.Summary.ActType">
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold">Act Type</td>
                <td class="w70p">{{ chapter.Summary.ActType }}</td>
              </tr>
            </template>
              <tr>
                <td class="bold" colspan="2">Act Name</td>
                <td class="w70p">{{ chapter.Summary.ActName }}</td>
              </tr>
            <template v-if="chapter.Type === 'AQ'">
              <tr>
                <td class="bold" colspan="2">AQ Code</td>
                <td class="w70p">{{ chapter.Summary.AQCode }}</td>
              </tr>
            </template>
            <template v-if="chapter.NeedPlayerLevel">
              <tr>
                <td class="bold" colspan="2">Minimum Adventure Rank</td>
                <td class="w70p">{{ chapter.NeedPlayerLevel }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </section>
    <section class="card">
      <h2>Quests</h2>
      <div class="content">
        <p class="info-notice spacer20-bottom">
          {{ SITE_SHORT_TITLE }} usually puts quests in the right order in most cases, but you should double-check. The Excel data doesn't make it obvious
          what order quests are in. So they need to be programmatically ordered based on various clues. Whether subquests can be correctly
          identified is a hit-or-miss (e.g. <a href="/genshin/chapters/10070">Vimana Agama</a> is correctly ordered but
          <a href="/genshin/chapters/10055">From Dusk to Dawn in Byakuyakoku</a> is not). {{ SITE_SHORT_TITLE }}'s ordering for hangout chapters is completely unreliable.</p>
        <GenshinChapterListItem :quests="chapter.OrderedQuests" />
      </div>
    </section>
    <section class="card">
      <h2>Other Languages</h2>
      <div class="content">
        <template v-if="chapterOL.mainChapterName">
          <strong class="dispBlock spacer5-top">TextMapHash: {{ chapterOL.mainChapterName.textMapHash }}</strong>
          <Wikitext :value="chapterOL.mainChapterName.result" :for-ol="true" />
        </template>

        <template v-if="chapterOL.subChapterName && chapterOL.subChapterName !== chapterOL.mainChapterName">
          <strong class="dispBlock spacer5-top">TextMapHash: {{ chapterOL.subChapterName.textMapHash }}</strong>
          <Wikitext :value="chapterOL.subChapterName.result" :for-ol="true" />
        </template>

        <template v-if="chapterOL.actName">
          <strong class="dispBlock spacer5-top">TextMapHash: {{ chapterOL.actName.textMapHash }}</strong>
          <Wikitext :value="chapterOL.actName.result" :for-ol="true" />
        </template>
      </div>
    </section>
    <section class="card">
      <h2>JSON</h2>
      <JsonText :value="JSON.stringify(chapter, null, 2)" />
    </section>
  </template>
  <template v-else-if="!!chapters">
    <section class="card">
      <h2>Archon Quest</h2>
      <div class="content">
        <GenshinChapterTable1 :chapter-sect="chapters.AQ" />
      </div>
    </section>
    <section class="card">
      <h2>Story Quest</h2>
      <div class="content">
        <GenshinChapterTable1 :chapter-sect="chapters.SQ" />
      </div>
    </section>
    <section class="card">
      <h2>Event Quest</h2>
      <div class="content">
        <GenshinChapterTable2 :chapter-sect="chapters.EQ" />
      </div>
    </section>
    <section class="card">
      <h2>World Quest</h2>
      <div class="content">
        <GenshinChapterTable2 :chapter-sect="chapters.WQ" />
      </div>
    </section>
  </template>
</template>

<script setup lang="ts">
import {
  ChapterCollection,
  ChapterExcelConfigData,
  ChapterOLView,
} from '../../../../shared/types/genshin/quest-types.ts';
import Icon from '../../utility/Icon.vue';
import GenshinChapterTable1 from './GenshinChapterTable1.vue';
import GenshinChapterTable2 from './GenshinChapterTable2.vue';
import JsonText from '../../utility/JsonText.vue';
import GenshinChapterListItem from './GenshinChapterListItem.vue';
import Wikitext from '../../utility/Wikitext.vue';
import { SITE_SHORT_TITLE } from '../../../loadenv.ts';

defineProps<{
  chapterNotFound?: boolean,
  requestId?: string,
  chapters?: ChapterCollection,
  chapter?: ChapterExcelConfigData,
  chapterOL?: ChapterOLView
}>();
</script>
