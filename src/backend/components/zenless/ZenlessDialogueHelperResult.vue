<template>
  <section class="card">
    <div class="content">
      <DialogueSection :section="section" :no-title="true" :no-top-line="true" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { DialogueSectionResult } from '../../domain/genshin/dialogue/dialogue_util.ts';
import DialogueSection from '../genshin/dialogue/DialogueSection.vue';

const { section } = defineProps<{
  section: DialogueSectionResult
}>()
</script>
