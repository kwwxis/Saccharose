<template>
  <section class="card">
    <h2>Quick Jump</h2>
    <template v-for="res of Object.values(resultMap)">
      <h3 class="valign">
          <span>
            <span>NPC ID:&nbsp;</span>
            <strong>{{ res.npcId }}</strong>
          </span>
        <span class="spacer5-left">&ndash;</span>
        <span class="spacer5-left">{{ res.npc.NameText }}</span>
        <span class="secondary-label small spacer10-left"><small class="fontWeight700">Body Type:</small>&nbsp;<span>{{ res.npc.BodyType }}</span></span>
      </h3>
      <div class="content">
        <template v-if="res.nonQuestDialogue.length">
          <fieldset>
            <legend>Non-Quest Dialogue</legend>
            <div class="content alignStart flexWrap" style="padding-top:0;">
              <div v-for="section of res.nonQuestDialogue" class="w25p">
                <a role="button" class="spacer5-all secondary dispBlock textAlignLeft"
                   :href="`#${section.id}`">{{ snakeToTitleCase(section.id) }}</a>
              </div>
            </div>
          </fieldset>
        </template>
        <template v-if="res.questDialogue.length">
          <fieldset>
            <legend>Quest Dialogue</legend>
            <div class="content" style="padding-top:0;margin-top:-15px">
              <template v-for="questSection of res.questDialogue">
                <fieldset class="spacer15-top">
                  <legend>
                    <span>{{ questSection.originalData.questId }}:</span>
                    <a :href="`/genshin/quests/${questSection.originalData.questId}`" target="_blank" style="text-decoration: none">
                      <span>{{ questSection.originalData.questName || '(No title)' }}</span>
                    </a>
                  </legend>
                  <div class="content alignStart flexWrap" style="padding-top:0;">
                    <template v-for="section of questSection.children">
                      <div class="w25p">
                        <a role="button" class="spacer5-all secondary dispBlock textAlignLeft"
                           :href="`#${section.id}`">{{ snakeToTitleCase(section.id) }}</a>
                      </div>
                    </template>
                  </div>
                </fieldset>
              </template>
            </div>
          </fieldset>
        </template>
        <template v-if="!res.nonQuestDialogue.length && !res.questDialogue.length">
          <p>No results</p>
        </template>
      </div>
    </template>
    <template v-if="reminders.length">
      <h3>Non-Identifier Specific</h3>
      <div class="content">
        <fieldset>
          <legend>Reminders</legend>
          <div class="content alignStart flexWrap" style="padding-top:0;">
            <div v-for="reminder of reminders" class="w25p">
              <a role="button" class="spacer5-all secondary dispBlock textAlignLeft"
                 :href="`#${reminder.id}`">{{ snakeToTitleCase(reminder.id) }}</a>
            </div>
          </div>
        </fieldset>
      </div>
    </template>
  </section>
  <QuestStillsHelper :quests-stills-by-main-quest="questsStillsByMainQuest"
                     :quests-stills-main-quest-names="questsStillsMainQuestNames" />
  <InDialogueReadablesHelper :in-dialogue-readables="inDialogueReadables"
                             :in-dialogue-readables-main-quest-names="inDialogueReadablesMainQuestNames" />
  <div class="result-wrapper">
    <section v-for="res of Object.values(resultMap)" class="card">
      <h2 class="valign">
        <small>
          <span>NPC ID:&thinsp;</span>
          <strong>{{ res.npcId }}</strong>
        </small>
        <span class="spacer5-left">&ndash;</span>
        <span class="spacer5-left">{{ res.npc.NameText }}</span>
        <span class="secondary-label small spacer10-left"><small class="fontWeight700">Body Type:</small>&nbsp;<span>{{ res.npc.BodyType }}</span></span>
      </h2>
      <template v-if="res.nonQuestDialogue.length">
        <h3 class="valign">
          <span class="expando" :ui-action="`expando: #non-quest-dialogue-${res.npcId}`"><Icon name="chevron-down" :size="17" /></span>
          <span>Non-Quest Dialogue</span>
        </h3>
        <div :id="`non-quest-dialogue-${res.npcId}`">
          <div v-for="section of res.nonQuestDialogue" class="content">
            <DialogueSection :section="section" />
          </div>
        </div>
      </template>
      <template v-if="res.questDialogue.length">
        <h3 class="valign">
          <span class="expando" :ui-action="`expando: #quest-dialogue-${res.npcId}`"><Icon name="chevron-down" :size="17" /></span>
          <span>Quest Dialogue</span>
        </h3>
        <div :id="`quest-dialogue-${res.npcId}`">
          <template v-for="section of res.questDialogue">
            <div class="content">
              <DialogueSection :section="section" />
            </div>
          </template>
        </div>
      </template>
      <template v-if="!res.nonQuestDialogue.length && !res.questDialogue.length">
        <div class="content">
          <p>No results</p>
        </div>
      </template>
    </section>
    <template v-if="reminders.length">
      <section class="card">
        <h2>Non-Identifier Specific</h2>
        <template v-if="reminders.length">
          <h3 class="valign">
            <span class="expando" ui-action="expando: #reminders"><Icon name="chevron-down" :size="17" /></span>
            <span>Reminders</span>
          </h3>
          <div id="reminders">
            <template v-for="reminder of reminders">
              <div class="content">
                <DialogueSection :section="reminder" />
              </div>
            </template>
          </div>
        </template>
      </section>
    </template>
    <template v-if="!Object.keys(resultMap).length">
      <section class="card">
        <div class="content">
          <strong>NPC not found.</strong>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Readable } from '../../../../../shared/types/genshin/readable-types.ts';
import { NpcDialogueResultSet } from '../../../../domain/genshin/dialogue/basic_dialogue_generator.ts';
import InDialogueReadablesHelper from '../helpers/InDialogueReadablesHelper.vue';
import QuestStillsHelper from '../helpers/QuestStillsHelper.vue';
import { snakeToTitleCase } from '../../../../../shared/util/stringUtil.ts';
import DialogueSection from '../../../utility/DialogueSection.vue';
import Icon from '../../../utility/Icon.vue';

const {resultSet} = defineProps<{
  resultSet: NpcDialogueResultSet,

  questsStillsByMainQuest:            {[mainQuestId: number]: { imageName: string, wikiName: string}[] },
  questsStillsMainQuestNames:         {[mainQuestId: number]: string },

  inDialogueReadables:                {[mainQuestId: number]: Readable[] },
  inDialogueReadablesMainQuestNames:  {[mainQuestId: number]: string },
}>();

const resultMap = resultSet.resultMap;
const reminders = resultSet.reminders;
</script>
