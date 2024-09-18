<template>
  <section class="card">
    <h2>Excel Viewer</h2>
    <div class="content">
      <table class="article-table">
        <tr>
          <th colspan="3">Excel File List</th>
        </tr>
        <tr>
          <th>File Name</th>
          <th>Pretty Name</th>
          <th>Action</th>
        </tr>
        <tr v-for="excelFile of excels">
          <td>
            <code style="font-size:13px">{{ excelFile }}</code>
          </td>
          <td>
            <span style="font-size:14px">
              {{ camelCaseToTitleCase(removeSuffix(removeSuffix(excelFile, 'ConfigData'), 'Excel')) }}
            </span>
          </td>
          <td>
            <a role="button" class="secondary" style="font-size: 15px; margin: 3px 0;"
               :href="`${ctx.siteHome}/excel-viewer/${excelFile}`">View</a>
          </td>
        </tr>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { getTrace } from '../../middleware/request/tracer.ts';
import { camelCaseToTitleCase, removeSuffix } from '../../../shared/util/stringUtil.ts';

const { ctx } = getTrace();

defineProps<{
  excels: string[],
}>()
</script>

<style scoped lang="scss">

</style>
