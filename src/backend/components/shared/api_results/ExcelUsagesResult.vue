<template>
  <div v-if="!embed" class="card result-count-card">
    <h2>Total Results: <span>{{ Object.keys(scalarToUsages).length }}</span></h2>
  </div>
  <div :style="embed ? `margin-top:10px` : ''">
    <section v-if="!embed && amountOfIds > 1" class="card">
      <h2>Quick Jump</h2>
      <template v-for="id of Object.keys(scalarToUsages)">
        <div class="secondary-header valign">
          <a role="button" class="primary primary--2 small" :href="`#${toHtmlId(id)}`">Jump</a>
          <span class="spacer5-left">{{ id }}</span>
          <small class="spacer10-left">{{ numMatches(scalarToUsages, id) }} matches across {{ numFiles(scalarToUsages, id) }} files</small>
        </div>
      </template>
    </section>
    <section v-if="!embed && changeRecordRefs && changeRecordRefs.length" class="card">
      <h2>Change Record Refs</h2>
      <table class="article-table">
        <tr>
          <th>Scalar</th>
          <th>Excel File</th>
          <th>Version Added</th>
        </tr>
        <tr v-for="changeRecordRef of changeRecordRefs">
          <td>{{ changeRecordRef.key }}</td>
          <td>{{ changeRecordRef.excelFile }}</td>
          <td>{{ changeRecordRef.version?.displayLabel }}</td>
        </tr>
      </table>
    </section>
    <template v-for="scalar of Object.keys(scalarToUsages)">
      <template v-if="!embed">
        <section class="card excel-usage-result" :id="toHtmlId(scalar)">
          <h2 class="valign">
            <span class="expando spacer5-right" :ui-action="`expando: .excel-usage-result-content[data-scalar='${scalar}']`"><Icon name="chevron-down" :size="17" /></span>
            <strong>{{ scalar }}</strong>
            <small class="spacer10-left">{{ numMatches(scalarToUsages, scalar) }} matches across {{ numFiles(scalarToUsages, scalar) }} files</small>
            <template v-if="amountOfIds > 1">
              <span class="grow"></span>
              <a role="button" class="secondary small" href="#top">Back to top</a>
            </template>
          </h2>
          <div class="excel-usage-result-content" :data-scalar="scalar">
            <ExcelUsagesResultInner :scalar="scalar" :scalar-to-usages="scalarToUsages" :change-record-refs="changeRecordRefs" />
          </div>
        </section>
      </template>
      <template v-else>
        <ExcelUsagesResultInner :scalar="scalar" :scalar-to-usages="scalarToUsages" :change-record-refs="changeRecordRefs" />
      </template>
    </template>
  </div>
  <section v-if="!Object.keys(scalarToUsages).length" class="card">
    <div class="content">
      <strong>No results found.</strong>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ScalarToExcelUsages } from '../../../../shared/util/searchUtil.ts';
import { ExcelChangeRef } from '../../../../shared/types/changelog-types.ts';
import ExcelUsagesResultInner from './ExcelUsagesResultInner.vue';
import Icon from '../../utility/Icon.vue';
import { toHtmlId } from '../../../../shared/util/stringUtil.ts';

const {scalarToUsages} = defineProps<{
  scalarToUsages?: ScalarToExcelUsages,
  changeRecordRefs?: ExcelChangeRef[],
  embed?: boolean,
}>();

const amountOfIds = Object.keys(scalarToUsages).length;

function numFiles(scalarToUsages: ScalarToExcelUsages, scalar: string): number {
  return Object.keys(scalarToUsages[scalar]).length;
}

function numMatches(scalarToUsages: ScalarToExcelUsages, scalar: string): number {
  let sum = 0;
  for (const array of Object.values(scalarToUsages[scalar])) {
    sum += array.length;
  }
  return sum;
}
</script>
