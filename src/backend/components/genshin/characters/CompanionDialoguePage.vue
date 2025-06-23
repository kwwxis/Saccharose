<template>
  <section class="card">
    <h2 v-if="companion" class="valign">
      <img class="framed-icon x42" :src="`/images/genshin/${companion.CommonIcon}.png`" loading="lazy" decoding="async" />
      <span class="spacer15-left">Serenitea Pot Companion Dialogue &mdash; {{ companion.CommonName }}</span>
    </h2>
    <h2 v-else>Serenitea Pot Companion Dialogue</h2>

    <div v-if="companions && companions.length" class="content dispFlex flexWrap alignStart">
      <div v-for="companion of companions" class="w50p">
        <a class="secondary spacer3-all valign textAlignLeft" role="button" :href="`/genshin/character/companion-dialogue/${toParam(companion.CommonName)}`">
          <img class="icon x32" :src="`/images/genshin/${companion.CommonIcon}.png`" loading="lazy" decoding="async" />
          <span class="spacer10-left">{{ companion.CommonName }}</span>
        </a>
      </div>
    </div>

    <template v-if="dialogue">
      <div v-if="dialogue.length" class="content">
        <div class="dialogue-container">
          <template v-for="section of dialogue">
            <DialogueSection :section="section" />
          </template>
        </div>
      </div>
      <div v-else class="content">
        <p>Serenitea Pot Companion not found.</p>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { HomeWorldNPCExcelConfigData } from '../../../../shared/types/genshin/homeworld-types.ts';
import { DialogueSectionResult } from '../../../util/dialogueSectionResult.ts';
import DialogueSection from '../../utility/DialogueSection.vue';
import { toParam } from '../../../../shared/util/stringUtil.ts';

defineProps<{
  companions?: HomeWorldNPCExcelConfigData[]
  companion?: HomeWorldNPCExcelConfigData,
  dialogue?: DialogueSectionResult[]
}>()
</script>
