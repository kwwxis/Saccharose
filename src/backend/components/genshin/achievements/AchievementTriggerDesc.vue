<template>
  <div class="code" style="word-break:break-all;max-width:300px;font-size:0.8em">{{
    achievement?.TriggerConfig?.TriggerType?.startsWith('TRIGGER_')
    ? achievement?.TriggerConfig?.TriggerType?.slice('TRIGGER_'.length)
    : (achievement?.TriggerConfig?.TriggerType || 'n/a')
    }}</div>

  <div class="code" v-if="achievement?.TriggerConfig?.TriggerType !== 'TRIGGER_OPEN_WORLD_CHEST'"
       style="word-break:break-all;max-width:300px;font-size:0.8em">{{ JSON.stringify(achievement?.TriggerConfig?.ParamList || 'n/a') }}}</div>

  <template v-if="achievement.TriggerConfig.TriggerQuests.length">
    <template v-for="mq of achievement.TriggerConfig.TriggerQuests">
      <a class="dispBlock" :href="`/quests/${ mq.Id }`">{{ mq.TitleText || `${mq.Id}: (No title)` }}}</a>
    </template>
  </template>

  <div v-if="achievement.TriggerConfig.CityNameText"><b>City Name:</b> {achievement.TriggerConfig.CityNameText}</div>
</template>

<script setup lang="ts">
import { AchievementExcelConfigData } from '../../../../shared/types/genshin/achievement-types.ts';

const props = defineProps<{ achievement: AchievementExcelConfigData }>();
const achievement = props.achievement;
</script>
