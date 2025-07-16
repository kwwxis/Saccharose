<template>
  <section class="card">
    <h2 class="valign">
      <span>NPC Dialogue Generator</span>
      <span class="grow"></span>
      <button id="npc-dialogue-info-button" class="secondary">Info</button>
    </h2>
    <div class="content">
      <p class="spacer10-bottom">Generate dialogue for a specific NPC. You can also enter a specific NPC ID.</p>
      <div class="field valign">
        <div class="valign grow" style="max-width:700px">
          <div class="posRel valign grow">
            <input class="npc-dialogue-generate-input grow" type="text" placeholder="Enter the exact name of an NPC (case insensitive)" />
            <button class="npc-dialogue-generate-input-paste input-paste-button"><Icon name="clipboard" /></button>
            <button class="npc-dialogue-generate-input-clear input-clear-button hide"><Icon name="x-circle" /></button>
          </div>
          <button class="npc-dialogue-generate-submit primary primary--2 spacer5-left">Generate</button>
        </div>
        <div class="npc-dialogue-generate-submit-pending hide loading small spacer5-left"></div>
      </div>
    </div>
  </section>
  <div id="npc-dialogue-generate-result"></div>
</template>

<script setup lang="ts">
import Icon from '../../utility/Icon.vue';

defineProps<{

}>();
</script>
