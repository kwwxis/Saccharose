<template>
  <a :href="`/genshin/TCG/cards/${String(card.Id).padStart(6, '0')}`" class="tcg-card">
    <div class="tcg-card-image">
      <img v-if="card.WikiImage" :src="`/images/genshin/${card.WikiImage}.png`" loading="lazy" decoding="async" />
      <img v-else :src="`/images/genshin/static/TCG_Card_Unknown.png`" loading="lazy" decoding="async" />
    </div>
    <div class="tcg-card-name">{{ card.WikiName }}</div>
    <div v-if="isCharacterCard(card) && card.Hp" class="tcg-icon tcg-card-icon GCG_CHAR_HP">{{ card.Hp }}</div>
    <template v-if="isActionCard(card) && card.CostList && Array.isArray(card.CostList)">
      <template v-for="costItem of card.CostList.filter(x => !!x.CostType)">
        <div :class="{
          'tcg-icon': true,
          'tcg-card-icon': true,
          [costItem.CostType]: true
        }">{{ costItem.Count }}</div>
      </template>
    </template>
  </a>
</template>

<script setup lang="ts">
import { GCGCommonCard, isActionCard, isCharacterCard } from '../../../../shared/types/genshin/gcg-types.ts';

defineProps<{
  card: GCGCommonCard
}>();
</script>
