<template>
  <a class="material-item" :href="`/genshin/${monster.AnimalDescribe ? 'wildlife' : 'enemies'}/${monster.Id}`">
    <div class="material-card">
      <div class="material-icon no-count" data-quality="0">
        <img v-if="monster.Describe?.Icon" :src="`/images/genshin/${monster.Describe?.Icon}.png`" loading="lazy" decoding="async" />
        <img v-else src="/images/genshin/static/Item_Unknown.png" loading="lazy" decoding="async" />
      </div>
    </div>
    <span class="dispBlock material-name">
      <span class="dispBlock">{{ monster.NameText || monster.Describe?.NameText || '(Unnamed)' }}</span>
    </span>
  </a>
</template>

<script setup lang="ts">
import { MonsterExcelConfigData } from '../../../shared/types/genshin/monster-types.ts';

defineProps<{
  monster: MonsterExcelConfigData
}>();
</script>
