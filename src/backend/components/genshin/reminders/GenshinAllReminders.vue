<template>
  <section class="card">
    <h2>All Reminder Dialogue</h2>
    <div class="tab-list" role="tablist">
      <button :id="`tab-${group.id}`" class="tab" v-for="group of reminderGroups"
              :ui-action="`tab: #tabpanel-${group.id}, reminderGroups`">{{ group.title }}</button>
    </div>
    <div class="content">
      <div class="dialogue-container">
        <div v-for="group of reminderGroups" :id="`tabpanel-${group.id}`" role="tabpanel" :aria-labelledby="`tab-${group.id}`"
             class="tabpanel hide">
          <template v-for="section of group.children">
            <dialogue-section :section="section" />
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { DialogueSectionResult } from '../../../domain/genshin/dialogue/dialogue_util.ts';
import DialogueSection from '../dialogue/DialogueSection.vue';

const { reminderGroups } = defineProps<{
  reminderGroups: DialogueSectionResult[]
}>()
</script>

<style scoped lang="scss">

</style>
