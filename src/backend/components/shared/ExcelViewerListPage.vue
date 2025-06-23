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
          <th>File Size</th>
          <th>Action</th>
        </tr>
        <tr v-for="excelFile of excels">
          <td>
            <code style="font-size:13px">{{ excelFile.name }}</code>
          </td>
          <td>
            <ByteSizeLabel :byte-size="excelFile.size" />
          </td>
          <td>
            <a role="button" class="secondary" style="font-size: 15px; margin: 3px 0;"
               :href="`${ctx.siteHome}/excel-viewer/${excelFile.name}`">View</a>
          </td>
        </tr>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { getTrace } from '../../middleware/request/tracer.ts';
import { FileAndSize } from '../../../shared/types/utility-types.ts';
import ByteSizeLabel from '../utility/ByteSizeLabel.vue';

const { ctx } = getTrace();

defineProps<{
  excels?: FileAndSize[],
}>()
</script>
