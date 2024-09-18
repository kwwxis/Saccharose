<template>
  <section class="card">
    <div class="content">
      <DialogueSection :section="section" :no-title="true" :no-top-line="true" />
    </div>
  </section>
</template>

<script setup lang="ts">
import DialogueSection from '../utility/DialogueSection.vue';
import { DialogueSectionResult } from '../../util/dialogueSectionResult.ts';

const { section } = defineProps<{
  section: DialogueSectionResult
}>()
</script>
