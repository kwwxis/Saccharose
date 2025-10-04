<template>
  <div v-if="!embed" class="card result-count-card">
    <h2>Total Results: <span>{{ Object.keys(idToUsages).length }}</span></h2>
  </div>
  <div :style="embed ? `margin-top:10px` : ''">
    <section v-if="!embed && amountOfIds > 1" class="card">
      <h2>Quick Jump</h2>
      <template v-for="id of Object.keys(idToUsages)">
        <div class="secondary-header valign">
          <a role="button" class="primary primary--2 small" :href="`#${toHtmlId(id)}`">Jump</a>
          <span class="spacer5-left">{{ id }}</span>
          <small class="spacer10-left">{{ numMatches(idToUsages, id) }} matches across {{ numFiles(idToUsages, id) }} files</small>
        </div>
      </template>
    </section>
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
          <td>{{ changeRecordRef.version?.displayLabel }}</td>
        </tr>
      </table>
    </section>
    <template v-for="id of Object.keys(idToUsages)">
      <template v-if="!embed">
        <section class="card excel-usage-result" :id="toHtmlId(id)">
          <h2 class="valign">
            <span class="expando spacer5-right" :ui-action="`expando: .excel-usage-result-content[data-id='${id}']`"><Icon name="chevron-down" :size="17" /></span>
            ID:&nbsp;<strong>{{ id }}</strong>
            <small class="spacer10-left">{{ numMatches(idToUsages, id) }} matches across {{ numFiles(idToUsages, id) }} files</small>
            <template v-if="amountOfIds > 1">
              <span class="grow"></span>
              <a role="button" class="secondary small" href="#top">Back to top</a>
            </template>
          </h2>
          <div class="excel-usage-result-content" :data-id="id">
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
import Icon from '../../utility/Icon.vue';
import { toHtmlId } from '../../../../shared/util/stringUtil.ts';

const {idToUsages} = defineProps<{
  idToUsages?: IdToExcelUsages,
  changeRecordRefs?: ChangeRecordRef[],
  embed?: boolean,
}>();

const amountOfIds = Object.keys(idToUsages).length;

function numFiles(idToUsages: IdToExcelUsages, id: string): number {
  return Object.keys(idToUsages[id]).length;
}

function numMatches(idToUsages: IdToExcelUsages, id: string): number {
  let sum = 0;
  for (const array of Object.values(idToUsages[id])) {
    sum += array.length;
  }
  return sum;
}
</script>
