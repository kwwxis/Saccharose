<template>
  <HtmlScript :nonce="nonce" :content="`
    window.typeTree = ${JSON.stringify(typeTree)};
    window.furnitureList = ${JSON.stringify(furnitureList)};
    `" />
  <div id="furniture-list-parent" class="alignStart">
    <div id="category-filter-column">
      <section class="card">
        <h2 class="valign">Category Filters</h2>
        <div id="type-tree-scroller">
          <div id="filter-loading-panel" class="content valign" style="min-height:52px">
            <div class="valign spacer10-left">
              <span class="loading"></span>
              <span class="spacer10-left fontWeight600">Loading filters...</span>
            </div>
          </div>
          <ul id="type-tree"></ul>
        </div>
      </section>
    </div>
    <div id="furniture-grid-column">
      <section class="card">
        <h2 class="valign content">
          <span>Furnishings</span>
          <div class="posRel valign grow spacer10-left">
            <input id="filter-quick-search" class="grow spacer5-left" type="text" placeholder="Quick search" />
            <span id="filter-quick-search-pending" class="loading small posAbs hide" style="right:10px;top:0;bottom:0;margin:auto"></span>
          </div>
        </h2>
        <div id="furniture-grid" class="furniture-grid hide"></div>
        <div id="furniture-grid-loading" class="furniture-grid-loading card valign justifyCenter ag-theme-alpine">
          <h1 class="valign justifyCenter">
            <span class="loading x36"></span>
            <span class="loading-label spacer15-left">Loading table...</span>
          </h1>
        </div>
      </section>
    </div>
  </div>

</template>

<script setup lang="ts">
import {
  HomeWorldFurnitureExcelConfigData,
  HomeWorldFurnitureTypeTree,
} from '../../../../shared/types/genshin/homeworld-types.ts';
import HtmlScript from '../../utility/HtmlScript.vue';
import { useTrace } from '../../../middleware/request/tracer.js';

const { nonce } = useTrace();

defineProps<{
  furnitureList: HomeWorldFurnitureExcelConfigData[],
  typeTree: HomeWorldFurnitureTypeTree,
}>();
</script>
