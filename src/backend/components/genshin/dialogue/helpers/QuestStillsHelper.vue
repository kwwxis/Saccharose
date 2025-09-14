<template>
  <section v-if="questsStillsByMainQuest" class="card">
    <h2>Quest Stills</h2>
    <template v-for="[mainQuestId, questStills] of Object.entries(questsStillsByMainQuest)">
      <h3>{{ questsStillsMainQuestNames[mainQuestId] || '(Non-quest)' }}</h3>
      <div class="content">
        <div class="alignStart flexWrap">
          <div v-for="questStill of questStills" class="w50p">
            <div class="image-frame spacer3-all">
              <img :src="`/serve-image/genshin/${questStill.imageName}.png/${questStill.wikiName}.png`" class="w100p" />
              <span class="image-label">{{ questStill.wikiName }}.png</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  questsStillsByMainQuest:    {[mainQuestId: number]: { imageName: string, wikiName: string}[] },
  questsStillsMainQuestNames: {[mainQuestId: number]: string },
}>();
</script>
