<template>
  <section class="card">
    <h2>Furnishings</h2>
  </section>
  <section class="card">
    <table class="article-table">
      <thead>
      <tr style="font-size: 14px;text-align: left;line-height: 16px;">
        <th>ID</th>
        <th>Name</th>
        <th>Image</th>
      </tr>
      </thead>
      <tbody>
        <tr class="furnishing-set-row" v-for="suite of suites" :data-id="suite.SuiteId">
          <td>{{suite.SuiteId}}</td>
          <td>{{suite.SuiteNameText}}</td>
          <td style="width:250px">
            <img v-if="suite.ItemIcon" class="w100p" style="height:120px;width:auto"
                 :src="`/serve-image/genshin/${suite.ItemIcon}.png/Furnishing Set ${encodeURIComponent(suite.SuiteNameText)} Display.png`"
                 loading="lazy" decoding="async" />
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { FurnitureSuiteExcelConfigData } from '../../../../shared/types/genshin/homeworld-types';

const props = defineProps<{
  suites: FurnitureSuiteExcelConfigData[]
}>();

const { suites } = props;
</script>