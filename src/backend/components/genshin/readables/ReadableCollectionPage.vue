<template>
  <section class="card">
    <h2>{{ title }}</h2>
    <div v-if="ol" class="content">
      <div class="valign">
        <h3>Infobox</h3>
        <div class="grow"></div>
        <button class="secondary small" ui-action="copy: #infobox"
                ui-tippy-hover="Click to copy to clipboard"
                ui-tippy-flash="{content:'Copied!', delay: [0,2000]}"
                style="margin:5px 0">Copy</button>
      </div>
      <Wikitext id="infobox" :value="infobox" />
      <div class="valign">
        <h3>OL</h3>
        <div class="grow"></div>
        <button class="secondary small" ui-action="copy: #ol-textarea"
                ui-tippy-hover="Click to copy to clipboard"
                ui-tippy-flash="{content:'Copied!', delay: [0,2000]}"
                style="margin:5px 0">Copy</button>
      </div>
      <Wikitext id="ol-textarea" :for-ol="true" :value="ol.result" />
    </div>
  </section>
  <section v-for="(book, idx) of collection.Books" class="card">
    <h2>{{ book?.Material?.NameText }}</h2>
    <div class="content">
      <a class="dispInlineBlock spacer10-bottom" :href="`/genshin/readables/item/${book.Id}`">Direct Link</a>
      <table v-if="book.Material" class="article-table">
        <tbody>
        <tr>
          <td class="bold">Image</td>
          <td class="w70p"><img class="icon x36" :src="`/images/genshin/${book?.Material?.Icon}.png`" loading="lazy" decoding="async" /></td>
        </tr>
        <tr>
          <td class="bold">Rarity</td>
          <td class="w70p">{{ book?.Material?.RankLevel }}</td>
        </tr>
        <tr>
          <td class="bold">Name</td>
          <td class="w70p">{{ book?.Material?.NameText }}</td>
        </tr>
        <tr>
          <td class="bold">Type</td>
          <td class="w70p">{{ book?.Material?.TypeDescText }}</td>
        </tr>
        <tr>
          <td class="bold">Desc.</td>
          <td class="w70p">{{ normGenshinText(book?.Material?.DescText) }}</td>
        </tr>
        </tbody>
      </table>
    </div>
    <div class="content">
      <ReadableTexts :readable="book" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { BookSuitExcelConfigData, Readable } from '../../../../shared/types/genshin/readable-types.ts';
import { getTrace } from '../../../middleware/request/tracer.ts';
import ReadableTexts from './partials/ReadableTexts.vue';
import Wikitext from '../../utility/Wikitext.vue';
import { OLResult } from '../../../../shared/types/ol-types.ts';

const { normGenshinText } = getTrace();

defineProps<{
  title?: string,
  collection?: BookSuitExcelConfigData,
  infobox?: string,
  ol?: OLResult,
}>();
</script>
