<template>
  <div class="card result-count-card">
    <h2 class="valign">
      <span>{{ results.length + talkResultsCount }} results</span>
      <span class="grow"></span>
      <button class="secondary small" ui-action="copy-all: .wikitext; copy-sep: \n"
              ui-tippy-hover="Click to copy all to clipboard"
              ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy All</button>
    </h2>
  </div>

  <template v-for="result of results">
    <VoToDialogueSingleResult :result="result" />
  </template>

  <template v-for="talkResult of talkResults">
    <div class="card" style="margin-bottom:10px">
      <h2 class="valign">
        <span class="expando" :ui-action="`expando: #talkresult-${talkResult.talkId}`"><Icon name="chevron-down" :size="17" /></span>
        <span>Talk:</span>&nbsp;<strong>{{ talkResult.talkId }}</strong>
        <span class="grow"></span>
        <a role="button" class="secondary spacer3-left" target="_blank"
           :href="`/genshin/branch-dialogue?q=${talkResult.talkId}`"
           ui-tippy-hover="Open talk in branch dialogue"
           style="margin:-5px 0;font-size:14px"><Icon name="external-link" :size="17" /></a>
      </h2>
      <div class="content" :id="`talkresult-${talkResult.talkId}`">
        <template v-for="result of talkResult.results">
          <VoToDialogueSingleResult :result="result" :card-bordered="true" />
        </template>
      </div>
    </div>
  </template>

  <template v-if="!results.length && !talkResults.length">
    <section class="card">
      <div class="content">
        <strong>No input entered.</strong>
      </div>
    </section>
  </template>
</template>

<script setup lang="ts">
import { VoToDialogueEntry } from '../../../../controllers/genshin/api/DialogueResources.ts';
import Icon from '../../../utility/Icon.vue';
import VoToDialogueSingleResult from './VoToDialogueSingleResult.vue';

defineProps<{
  results: VoToDialogueEntry[],
  talkResults: {talkId: string, results: VoToDialogueEntry[]}[],
  talkResultsCount: number,
}>();
</script>
