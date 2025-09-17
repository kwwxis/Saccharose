<template>
  <QuestStillsHelper :quests-stills-by-main-quest="questsStillsByMainQuest"
                     :quests-stills-main-quest-names="questsStillsMainQuestNames" />
  <InDialogueReadablesHelper :in-dialogue-readables="inDialogueReadables"
                             :in-dialogue-readables-main-quest-names="inDialogueReadablesMainQuestNames" />
  <section v-for="section of sections" class="card">
    <h2>Match ID: <strong>{{ section.id }}</strong></h2>
    <div class="content">
      <DialogueSection :section="section" />
    </div>
  </section>
  <template v-if="!sections.length">
    <section class="card">
      <div class="content">
        <strong>Dialogue not found.</strong>
        <p class="spacer5-bottom">Suggestions:</p>
        <ul>
          <li>Make sure you typed it correctly.</li>
          <li>If it's an autoplaying overworld line, it may be in <a :href="`/genshin/reminders?q=${query}`" target="_blank">ReminderExcelConfigData</a></li>
          <li>Try <a :href="`/genshin/textmap?q=${query}`" target="_blank">TextMap Search</a> as well.</li>
          <li>Is your input language correct?
            <template v-if="langSuggest && !langSuggest.matchesInputLangCode">
              <p class="error-notice spacer10-top">
                Your input language is <strong style="font-size:1.2em">{{ ctx.languages[ctx.inputLangCode] }}</strong>
                but the query you entered was detected to be <strong style="font-size:1.2em">{{ langSuggest.detected.langName }}</strong>
              </p>
            </template>
          </li>
        </ul>
      </div>
    </section>
  </template>
</template>

<script setup lang="ts">
import { DialogueSectionResult } from '../../../../util/dialogueSectionResult.ts';
import { LangSuggest } from '../../../../../shared/types/lang-types.ts';
import { Readable } from '../../../../../shared/types/genshin/readable-types.ts';
import QuestStillsHelper from '../helpers/QuestStillsHelper.vue';
import InDialogueReadablesHelper from '../helpers/InDialogueReadablesHelper.vue';
import DialogueSection from '../../../utility/DialogueSection.vue';
import { getTrace } from '../../../../middleware/request/tracer.ts';

const { ctx } = getTrace();

defineProps<{
  sections: DialogueSectionResult[],
  query: string,
  langSuggest?: LangSuggest,

  questsStillsByMainQuest?:           {[mainQuestId: number]: { imageName: string, wikiName: string}[] },
  questsStillsMainQuestNames?:        {[mainQuestId: number]: string },

  inDialogueReadables?:               {[mainQuestId: number]: Readable[] },
  inDialogueReadablesMainQuestNames?: {[mainQuestId: number]: string },
}>();
</script>
