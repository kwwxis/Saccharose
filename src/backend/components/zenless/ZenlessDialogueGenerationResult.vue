<template>
  <section v-for="section of sections" class="card">
    <h2>Match ID: <strong>{{ section.id }}</strong></h2>
    <div class="content">
      <DialogueSection :section="section" />
    </div>
  </section>
  <section v-if="!sections.length" class="card">
    <div class="content">
      <strong>Dialogue not found.</strong>
      <p class="spacer5-bottom">Suggestions:</p>
      <ul>
        <li>Make sure you typed it correctly.</li>
        <li>If it's an autoplaying overworld line, it may be in <a :href="`/genshin/reminders?q=${query}`" target="_blank">ReminderExcelConfigData</a></li>
        <li>Try <a :href="`/genshin/textmap?q=${query}`" target="_blank">TextMap Search</a> as well.</li>
        <li>Is your input language correct?
          <p v-if="langSuggest && !langSuggest.matchesInputLangCode" class="error-notice spacer10-top">
            Your input language is <strong style="font-size:1.2em">{{ ctx.languages[ctx.inputLangCode] }}</strong>
            but the query you entered was detected to be <strong style="font-size:1.2em">{{ langSuggest.detected.langName }}</strong>
          </p>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">

import DialogueSection from '../utility/DialogueSection.vue';
import { DialogueSectionResult } from '../../util/dialogueSectionResult.ts';
import { LangSuggest } from '../../../shared/types/lang-types.ts';
import { getTrace } from '../../middleware/request/tracer.ts';

defineProps<{
  query: string,
  sections: DialogueSectionResult[],
  langSuggest?: LangSuggest
}>();

const { ctx } = getTrace();

</script>

<style scoped lang="scss">

</style>
