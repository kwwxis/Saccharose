<template>
  <table class="article-table">
    <tr>
      <th>Title</th>
      <th v-if="showCategory">Category</th>
      <th>Description</th>
      <th>Primos</th>
      <th>Hidden</th>
      <th>Trigger</th>
    </tr>
    <tr v-for="achievement of achievements" style="font-size:0.9em;line-height:1.4em">
      <td>
        <div style="font-weight:600;font-size:0.95em">
          <a :href="`/genshin/achievements/${achievement.Id}`">{{ achievement.TitleText }}</a>
        </div>
      </td>
      <td v-if="showCategory">{{ achievement.Goal.NameText }}</td>
      <td>
        <div>{{ normGenshinText(achievement.DescText) || 'n/a' }}</div>
        <div class="valign meta-props spacer5-top">
          <div class="prop">
            <span class="prop-label">ID</span>
            <span class="prop-values">
              <span class="prop-value">{{ achievement.Id }}</span>
            </span>
          </div>
          <div class="prop">
            <span class="prop-label">Order ID</span>
            <span class="prop-values">
              <span class="prop-value">{{ achievement.OrderId }}</span>
            </span>
          </div>
        </div>
      </td>
      <td>{{ achievement?.FinishReward?.RewardSummary?.PrimogemCount || 'n/a' }}</td>
      <td>{{ achievement.IsHidden ? 'Yes' : 'No' }}</td>
      <td><AchievementTriggerDesc :achievement="achievement" /></td>
    </tr>
  </table>
</template>

<script setup lang="ts">
import { AchievementExcelConfigData } from '../../../../shared/types/genshin/achievement-types.ts';
import { getTrace } from '../../../middleware/request/tracer.ts';
import AchievementTriggerDesc from './AchievementTriggerDesc.vue';

const { normGenshinText } = getTrace();

defineProps<{
  achievements: AchievementExcelConfigData[],
  showCategory: boolean,
}>();
</script>
