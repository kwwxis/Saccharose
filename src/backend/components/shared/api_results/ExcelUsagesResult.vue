<template>
  <div v-if="!embed" class="card result-count-card">
    <h2>Total Results: <span>{{ Object.keys(idToUsages).length }}</span></h2>
  </div>
  <div :style="embed ? `margin-top:10px` : ''">
    <section v-if="!embed && changeRecordRefs && changeRecordRefs.length" class="card">
      <h2>Change Record Refs</h2>
      <table class="article-table">
        <tr>
          <th>ID</th>
          <th>Excel File</th>
          <th>Version Added</th>
        </tr>
        <tr v-for="changeRecordRef of changeRecordRefs">
          <td>{{ changeRecordRef.recordKey }}</td>
          <td>{{ changeRecordRef.excelFile }}</td>
          <td>{{ changeRecordRef.version }}</td>
        </tr>
      </table>
    </section>
    <template v-for="id of Object.keys(idToUsages)">
      <template v-if="!embed">
        <section class="card">
          <h2>ID: <strong>{{ id }}</strong></h2>
          <div>
            <ExcelUsagesResultInner :id="id" :id-to-usages="idToUsages" :change-record-refs="changeRecordRefs" />
          </div>
        </section>
      </template>
      <template v-else>
        <ExcelUsagesResultInner :id="id" :id-to-usages="idToUsages" :change-record-refs="changeRecordRefs" />
      </template>
    </template>
  </div>
  <section v-if="!Object.keys(idToUsages).length" class="card">
    <div class="content">
      <strong>No results found.</strong>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IdToExcelUsages } from '../../../../shared/util/searchUtil.ts';
import { ChangeRecordRef } from '../../../../shared/types/changelog-types.ts';
import ExcelUsagesResultInner from './ExcelUsagesResultInner.vue';

defineProps<{
  idToUsages?: IdToExcelUsages,
  changeRecordRefs?: ChangeRecordRef[],
  embed?: boolean,
}>();
</script>
