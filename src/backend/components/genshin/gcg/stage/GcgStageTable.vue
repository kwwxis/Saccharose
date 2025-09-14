<template>
  <table class="article-table">
    <thead>
      <tr style="font-size: 14px;text-align: left;line-height: 16px;">
        <th>Icon</th>
        <th>ID</th>
        <th>Character</th>
        <th>Stage</th>
        <th>Internal<br>Type</th>
        <th>Wiki<br>Group</th>
        <th>Wiki<br>Type</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="stage of stages" style="font-size:15px">
        <td>
          <img v-if="stage?.Reward?.TalkDetailIcon" :src="`/images/genshin/${stage.Reward.TalkDetailIcon.IconName}.png`" class="framed-icon x42" />
        </td>
        <td>
          <span class="code" style="font-size:14px">{{ String(stage.Id).padStart(6, '0') }}</span>
        </td>
        <td>
          <span>{{ stage.WikiCharacter }}</span>
        </td>
        <td>
          <a :href="`/genshin/TCG/stages/${String(stage.Id).padStart(6, '0')}`" role="button"
             class="spacer5-all secondary dispBlock textAlignLeft">{{ stage.WikiLevelName }}</a>
        </td>
        <td>
          <span class="code" style="font-size:14px">{{ stage.LevelType }}</span>
        </td>
        <td>
          <span style="display:inline-block;font-size:14px;line-height:18px;">{{ stage.WikiGroup || 'No Group' }}</span>
        </td>
        <td>
          <span style="display:inline-block;font-size:14px;line-height:18px;">{{ stage.WikiType || 'No Type' }}</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { GCGGameExcelConfigData } from '../../../../../shared/types/genshin/gcg-types.ts';

defineProps<{
  stages?: GCGGameExcelConfigData[]
}>();
</script>
