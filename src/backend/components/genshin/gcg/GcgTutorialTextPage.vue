<template>
  <section class="card">
    <h2>TCG Tutorial Text</h2>
    <div class="content">
      <div class="dialogue-container">
        <DialogueSection :section="dialogue" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { DialogueSectionResult } from '../../../util/dialogueSectionResult.ts';
import DialogueSection from '../../utility/DialogueSection.vue';

defineProps<{
  dialogue: DialogueSectionResult
}>();
</script>
