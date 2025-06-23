<template>
  <div v-for="result of searchResults">
    <a role="button" class="secondary dispBlock spacer5-bottom textAlignLeft" :href="`${ctx.siteHome}/revs/${result.pageid}`">
      <span><strong class="dispInlineBlock" style="min-width: 70px">{{ result.pageid }}</strong> {{ result.title }}</span>
    </a>
  </div>
</template>

<script setup lang="ts">
import { MwArticleSearchResult } from '../../../shared/mediawiki/mwTypes.ts';
import { getTrace } from '../../middleware/request/tracer.ts';

const { ctx } = getTrace();

defineProps<{
  searchResults?: MwArticleSearchResult[]
}>()
</script>

<style scoped lang="scss">

</style>
