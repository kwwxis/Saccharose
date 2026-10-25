<template>
  <section class="card">
    <h2>All Reminder Dialogue</h2>
    <div class="tab-list" role="tablist">
      <a href="/genshin/reminders/all" class="tab"
              :class="{active: !version}">Landing</a>
      <a href="/genshin/reminders/all/unknown">Unknown Version ({{ unknownCount }})</a>
      <a :href="`/genshin/reminders/all/${ver.version.number}`" class="tab" :class="{active: ver.version.number === version?.number}"
              v-for="ver of versionCounts"><strong>{{ ver.version.number }}</strong> ({{ ver.count }})</a>
    </div>
    <div class="content">
      <div class="dialogue-container">
        <div v-if="!version" class="tabpanel active" role="tabpanel">
          <p>Select a tab.</p>
        </div>
        <template v-else>
          <div v-for="group of reminderGroups" role="tabpanel" class="tabpanel">
            <dialogue-section :section="group" />
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import DialogueSection from '../../utility/DialogueSection.vue';
import { DialogueSectionResult } from '../../../util/dialogueSectionResult.ts';
import { GameVersion } from '../../../../shared/types/game-versions.ts';
import { ReminderExcelByVersionCounts } from '../../../../shared/types/genshin/dialogue-types.ts';
import { toHtmlId } from '../../../../shared/util/stringHtmlUtil.ts';

const { reminderGroups } = defineProps<{
  version?: GameVersion,
  reminderGroups?: DialogueSectionResult[],
  versionCounts: ReminderExcelByVersionCounts,
  unknownCount: number,
}>()
</script>

<style scoped lang="scss">

</style>
