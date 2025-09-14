<template>
  <template v-if="result && result.id">
    <section :class="`card${cardBordered ? ' bordered' : ''}`" style="margin-bottom:10px">
      <h2 class="valign" style="padding:4px 10px;font-size:14px">
        <template v-if="result.text || result.warn">
          <span class="expando" :ui-action="`expando: #result-${result.id}`"><Icon name="chevron-down" :size="17" /></span>
        </template>
        <span style="font-size:15px">{{ result.type }}:</span>&nbsp;<strong style="font-size:14px">{{ result.id }}</strong>
        <span class="secondary-label small spacer10-left" style="opacity:0.8">{{ result.voFile }}</span>
        <span class="grow"></span>
        <template v-if="result.text">
          <button class="secondary small" :ui-action="`copy: #wikitext-${result.id}`"
                  ui-tippy-hover="Click to copy to clipboard"
                  ui-tippy-flash="{content:'Copied!', delay: [0,2000]}"
                  style="margin:-5px 0">Copy</button>
        </template>
        <template v-if="result.type === 'Dialog'">
          <a role="button" class="secondary small spacer3-left" target="_blank"
             :href="`/genshin/branch-dialogue?q=${result.id}`"
             ui-tippy-hover="Open in branch dialogue"
             style="margin:-5px 0"><Icon name="external-link" :size="17" /></a>
        </template>
      </h2>
      <template v-if="result.text || result.warn">
        <div :id="`result-${result.id}`">
          <template v-if="result.warn">
            <div class="content" style="padding:5px">
              <p class="warning-notice">{{ result.warn }}</p>
            </div>
          </template>
          <template v-if="result.text">
            <div class="dialogue-section content" style="padding:5px;margin-bottom:0;">
              <textarea :id="`wikitext-${result.id}`" readonly class="w100p wikitext autosize" spellcheck="false" translate="no">{{ result.text }}</textarea>
            </div>
          </template>
        </div>
      </template>
    </section>
  </template>
  <template v-else>
    <section :class="`card${cardBordered ? ' bordered' : ''}`" style="margin-bottom:10px">
      <div class="content">
        <p>No results for: <code class="fontWeight600">{{ result.file }}</code></p>
      </div>
    </section>
  </template>
</template>

<script setup lang="ts">
import { VoToDialogueEntry } from '../../../../controllers/genshin/api/DialogueResources.ts';
import Icon from '../../../utility/Icon.vue';

defineProps<{
  result: VoToDialogueEntry,
  cardBordered?: boolean,
}>();
</script>
