<template>
  <section class="card">
    <h2>Avatar Condition Dialogue</h2>
    <div class="content">
      <p>Talks where at least one of the begin conditions involves a specific avatar.</p>
    </div>
    <div v-if="avatars" class="content dispFlex flexWrap alignStart">
      <template v-for="avatar of avatars">
        <div class="w50p">
          <a class="secondary spacer3-all valign textAlignLeft" role="button"
             :href="`/genshin/avatar-cond-dialogue/${toParam(avatar.NameText)}`">
            <img class="icon x32" :src="`/images/genshin/${avatar.IconName}.png`" loading="lazy" decoding="async" />
            <span class="spacer10-left">{{ avatar.NameText }}</span>
          </a>
        </div>
      </template>
    </div>
  </section>
  <div v-if="result">
    <div v-if="avatar">
      <section class="card toolbar-avatar-name valign">
        <img class="icon x32" :src="`/images/genshin/${avatar.IconName}.png`" loading="lazy" decoding="async" />
        <strong>{{avatar.NameText}}</strong>
        <span class="grow"></span>
        <a role="button" href="/genshin/avatar-cond-dialogue" class="primary primary--2 small">
          <Icon name="chevron-left" />
          <span>Return to character list</span>
        </a>
      </section>
    </div>
    <div v-else>
      <section class="card">
        <div class="content">Avatar not found.</div>
      </section>
    </div>
    <QuestStillsHelper :quests-stills-by-main-quest="questsStillsByMainQuest"
                       :quests-stills-main-quest-names="questsStillsMainQuestNames" />
    <InDialogueReadablesHelper :in-dialogue-readables="inDialogueReadables"
                               :in-dialogue-readables-main-quest-names="inDialogueReadablesMainQuestNames" />
    <div class="result-wrapper">
      <section class="card">
        <template v-if="result.nonQuestDialogue.length">
          <h3 class="valign">
            <span class="expando" :ui-action="`expando: #non-quest-dialogue`"><Icon name="chevron-down" :size="17" /></span>
            <span>Non-Quest Dialogue</span>
          </h3>
          <div :id="`non-quest-dialogue`">
            <div v-for="section of result.nonQuestDialogue" class="content">
              <DialogueSection :section="section" />
            </div>
          </div>
        </template>
        <template v-if="result.homeWorldDialogue.length">
          <h3 class="valign">
            <span class="expando" :ui-action="`expando: #homeworld-dialogue`"><Icon name="chevron-down" :size="17" /></span>
            <span>Serenitea Pot Dialogue</span>
          </h3>
          <div :id="`homeworld-dialogue`">
            <div v-for="section of result.homeWorldDialogue" class="content">
              <DialogueSection :section="section" />
            </div>
          </div>
        </template>
        <template v-if="result.questDialogue.length">
          <h3 class="valign">
            <span class="expando" :ui-action="`expando: #quest-dialogue`"><Icon name="chevron-down" :size="17" /></span>
            <span>Quest Dialogue</span>
          </h3>
          <div :id="`quest-dialogue`">
            <template v-for="section of result.questDialogue">
              <div class="content">
                <DialogueSection :section="section" />
              </div>
            </template>
          </div>
        </template>
        <template v-if="!result.nonQuestDialogue.length && !result.homeWorldDialogue.length && !result.questDialogue.length">
          <div class="content">
            <p>No results</p>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AvatarExcelConfigData } from '../../../../shared/types/genshin/avatar-types.ts';
import { TalkExcelAvatarBeginCondResult } from '../../../domain/genshin/dialogue/basic_dialogue_generator.ts';
import { toParam } from '../../../../shared/util/stringUtil.ts';
import Icon from '../../utility/Icon.vue';
import DialogueSection from '../../utility/DialogueSection.vue';
import { Readable } from '../../../../shared/types/genshin/readable-types.ts';
import InDialogueReadablesHelper from './helpers/InDialogueReadablesHelper.vue';
import QuestStillsHelper from './helpers/QuestStillsHelper.vue';

defineProps<{
  avatar?: AvatarExcelConfigData,
  avatars?: AvatarExcelConfigData[],
  result?: TalkExcelAvatarBeginCondResult,

  questsStillsByMainQuest?:           {[mainQuestId: number]: { imageName: string, wikiName: string}[] },
  questsStillsMainQuestNames?:        {[mainQuestId: number]: string },

  inDialogueReadables?:               {[mainQuestId: number]: Readable[] },
  inDialogueReadablesMainQuestNames?: {[mainQuestId: number]: string },
}>();
</script>
