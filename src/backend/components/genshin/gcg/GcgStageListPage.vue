<template>
  <section class="card">
    <h2>TCG Stages</h2>
    <div class="tab-list secondary" role="tablist">
      <a href="/genshin/TCG/stages" role="tab" id="tab-list" class="tab active">List</a>
      <a href="/genshin/TCG/stages/search" role="tab" id="tab-search" class="tab">Search</a>
    </div>
    <div class="content">
      <fieldset>
        <legend>Groups &amp; Types</legend>
        <div class="content alignStretch flexWrap" style="padding-top:0;max-width:80%;font-size:15px">
          <template v-for="[groupName, stagesByType] of loopStages()">
            <div v-for="typeName of Object.keys(stagesByType)" class="w100p">
              <a role="button" class="spacer5-all secondary dispBlock textAlignLeft"
                 :href="`#${toParam(groupName) + '_' + toParam(typeName)}`"><b>{{ groupName }}</b> / {{ typeName }}</a>
            </div>
          </template>
        </div>
      </fieldset>
    </div>
  </section>
  <template v-for="[groupName, stagesByType] of loopStages()">
    <template v-for="[typeName, stages] of loopStagesByType(stagesByType)">
      <section class="card" :id="toParam(groupName) + '_' + toParam(typeName)">
        <h2>{{ groupName }} / {{ typeName }}</h2>
        <GcgStageTable :stages="stages" />
      </section>
    </template>
  </template>
</template>

<script setup lang="ts">
import { GCGGameExcelConfigData } from '../../../../shared/types/genshin/gcg-types.ts';
import { toParam } from '../../../../shared/util/stringUtil.ts';
import GcgStageTable from './GcgStageTable.vue';

const {stagesByGroupAndType} = defineProps<{
  stagesByGroupAndType: {[group: string]: {[type: string]: GCGGameExcelConfigData[]}}
}>();


function loopStages(): [string, {[type: string]: GCGGameExcelConfigData[]}][] {
  return Object.entries(stagesByGroupAndType);
}

function loopStagesByType(stagesByType: {[type: string]: GCGGameExcelConfigData[]}): [string, GCGGameExcelConfigData[]][] {
  return Object.entries(stagesByType);
}
</script>
