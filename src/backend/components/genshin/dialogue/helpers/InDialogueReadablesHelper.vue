<template>
  <section v-if="inDialogueReadables && Object.keys(inDialogueReadables).length" class="card">
    <h2>In-Dialogue Readables</h2>
    <template v-for="[mainQuestId, readables] of Object.entries(inDialogueReadables)">
      <h3>{{ inDialogueReadablesMainQuestNames[mainQuestId] || '(Non-quest)' }}</h3>
      <div class="content">
        <template v-for="readable of readables">
          <GenshinReadableLink :readable="readable" />
        </template>
        <div class="alignStart flexWrap">
          <template v-for="readable of readables">
            <template v-for="item of readable.Items">
              <template v-if="item.ReadableText.Images && item.ReadableText.Images.length">
                <template v-for="image of item.ReadableText.Images">
                  <div class="w25p">
                    <div class="image-frame spacer3-all bordered">
                      <img :src="`/images/genshin/${image}.png`" class="w100p" />
                      <span class="image-label">{{ image }}</span>
                    </div>
                  </div>
                </template>
              </template>
            </template>
          </template>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { Readable } from '../../../../../shared/types/genshin/readable-types.ts';
import GenshinReadableLink from '../../links/GenshinReadableLink.vue';

defineProps<{
  inDialogueReadables?:                {[mainQuestId: number]: Readable[] },
  inDialogueReadablesMainQuestNames?:  {[mainQuestId: number]: string },
}>();
</script>

