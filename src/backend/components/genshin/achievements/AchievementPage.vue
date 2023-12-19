<template>

  <section class="card">
    <h2 class="valign">
      <img class="framed-icon x42" :src="`/images/genshin/${achievement.Goal.IconPath}.png`" loading="lazy" decoding="async" />
      <span class="spacer15-left">{{ achievement.TitleText }}</span>
      <span class="grow"></span>
      <span class="alignEnd flexColumn">
        <a href="/achievements" role="button" class="secondary small dispBlock spacer5-bottom">Back to all categories</a>
        <a :href="`/achievements/${toParam(achievement.Goal.NameText)}`" role="button" class="secondary small dispBlock">
          Back to {{ achievement.Goal.NameText }}
        </a>
      </span>
    </h2>
    <div class="content">
      <table class="article-table">
        <thead>
        <tr>
          <th colspan="2">Property Table</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <td class="bold">ID</td>
          <td class="w70p">{{ achievement.Id }}</td>
        </tr>
        <tr>
          <td class="bold">Name</td>
          <td class="w70p">{{ achievement.TitleText }}</td>
        </tr>
        <tr>
          <td class="bold">Category</td>
          <td class="w70p">{{ achievement.Goal.NameText }}</td>
        </tr>
        <tr>
          <td class="bold">Description</td>
          <td class="w70p">
            <Wikitext id="achievement-desc" seamless :value="normGenshinText(achievement.DescText)" />
          </td>
        </tr>
        <tr>
          <td class="bold">Order ID</td>
          <td class="w70p">{{ achievement.OrderId }}</td>
        </tr>
        <tr>
          <td class="bold">Primogem Count</td>
          <td class="w70p">{{ achievement?.FinishReward?.RewardSummary?.PrimogemCount || 'n/a' }}</td>
        </tr>
        <tr>
          <td class="bold">Is Hidden?</td>
          <td class="w70p">{{ achievement.IsHidden ? 'Yes' : 'No' }}</td>
        </tr>
        <tr>
          <td class="bold">Trigger Info</td>
          <td class="w70p">
            <AchievementTriggerDesc :achievement="achievement" />
          </td>
        </tr>
        </tbody>
      </table>
      <div class="spacer10-top">
        <Wikitext :value="wikitext" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import AchievementTriggerDesc from './AchievementTriggerDesc.vue';
import Wikitext from '../../utility/Wikitext.vue';
import { AchievementExcelConfigData } from '../../../../shared/types/genshin/achievement-types';
import { toParam } from '../../../routing/viewUtilities';
import { getTrace } from '../../../middleware/request/tracer';

const { normGenshinText } = getTrace();

const props = defineProps<{
  achievement: AchievementExcelConfigData,
  wikitext: string,
}>();

const { achievement, wikitext } = props;
</script>