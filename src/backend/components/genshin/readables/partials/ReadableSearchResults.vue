<template>
  <div class="card result-count-card">
    <h2>Total Results: <span>{{ searchView.TitleResults.length }} title results &amp; {{ searchView.ContentResults.length }}> content results</span></h2>
  </div>
  <section v-if="searchView.TitleResults.length" class="card">
    <h2>Title Match Results</h2>
    <div class="content dispFlex flexWrap alignStart">
      <div v-for="readable of searchView.TitleResults" class="w100p">
        <GenshinReadableLink :readable="readable" />
      </div>
    </div>
  </section>
  <template v-if="searchView.ContentResults.length">
    <section v-for="(readable, idx) of searchView.ContentResults" class="card">
      <h2>Content Match Result #{{ idx + 1 }}</h2>
      <div class="content">
        <GenshinReadableLink :readable="readable" />
        <div class="spacer3-all">
          <ReadableTexts :readable="readable" />
        </div>
      </div>
    </section>
  </template>
  <div v-if="!searchView.TitleResults.length && !searchView.ContentResults.length" class="card no-results-found">
    <div class="content">
      <p>No results found for <b>{{ searchText }}</b></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ReadableSearchResult } from '../../../../../shared/types/genshin/readable-types.ts';
import GenshinReadableLink from '../../links/GenshinReadableLink.vue';
import ReadableTexts from './ReadableTexts.vue';

defineProps<{
  searchView?: ReadableSearchResult,
  searchText?: string,
}>();
</script>
