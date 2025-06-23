<template>
  <HtmlScript :nonce="nonce" :content="`
    window.typeTree = ${JSON.stringify(typeTree)};
    `" />
  <div class="alignStart">
    <div style="flex-basis:15%; min-width:220px">
      <section class="card">
        <h2>Category Filters</h2>
        <div id="filter-loading-panel" class="content valign" style="min-height:52px">
          <div class="valign spacer10-left">
            <span class="loading"></span>
            <span class="spacer10-left fontWeight600">Loading filters...</span>
          </div>
        </div>
        <ul id="type-tree"></ul>
      </section>
    </div>
    <div style="flex-basis: 85%; padding-left: 20px;">
      <section class="card">
        <h2>Furnishings</h2>
        <div class="content valign">
          <div class="posRel valign grow">
            <input id="filter-quick-search" class="grow spacer5-left" type="text" placeholder="Quick search" />
            <span id="filter-quick-search-pending" class="loading small posAbs hide" style="right:10px;top:0;bottom:0;margin:auto"></span>
          </div>
        </div>
      </section>
      <section class="card">
        <table class="article-table">
          <thead>
          <tr style="font-size: 14px;text-align: left;line-height: 16px;">
            <th>Icon</th>
            <th>ID</th>
            <th>Name</th>
            <th>Categories</th>
            <th>Quality</th>
            <th>Adeptal<br>Energy</th>
            <th>Load</th>
            <th>Reduced<br>Load</th>
          </tr>
          </thead>
          <tbody>
            <tr v-for="furn of furnitureList" class="furnishing-row" style="font-size:15px"
                :data-id="furn.Id"
                :data-name="furn.NameText"
                :data-category="furn.CategoryNameText"
                :data-subcategory="furn.TypeNameText"
                :data-filter-tokens="furn.FilterTokens.join(',')">
              <td>
                <img v-if="furn.IconUrl || furn.Icon || furn.ItemIcon"
                     class="framed-icon x42"
                     :src="`/images/genshin/${furn.IconUrl || furn.Icon || furn.ItemIcon}.png`"
                     loading="lazy" decoding="async" />
              </td>
              <td><span class="code" style="font-size:14px">{{ String(furn.Id).padStart(6, '0') }}</span></td>
              <td><a :href="`/genshin/furnishings/${furn.Id}`" role="button" class="secondary border-light textAlignLeft"
                     v-html="escapeHtmlAllowEntities(furn.NameText)"></a></td>
              <td style="font-size:14px;line-height:20px;">
                <span>{{ (furn.IsInterior && furn.IsExterior) ? 'Interior & Exterior' : (furn.IsInterior ? 'Interior' : 'Exterior') }}</span><br>
                <span>{{ furn.CategoryNameText }}</span><br>
                <span>{{ furn.TypeNameText }}</span>
              </td>
              <td><span><GenshinStars :quality="furn.RankLevel" /></span></td>
              <td><span>{{ furn.Comfort }}</span></td>
              <td><span>{{ furn.Cost }}</span></td>
              <td><span>{{ furn.DiscountCost }}</span></td>
            </tr>
          </tbody>
        </table>
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
import { getTrace } from '../../../middleware/request/tracer.js';
import GenshinStars from '../links/GenshinStars.vue';
import { escapeHtmlAllowEntities } from '../../../../shared/util/stringUtil.ts';

const { nonce } = getTrace();

defineProps<{
  furnitureList: HomeWorldFurnitureExcelConfigData[],
  typeTree: HomeWorldFurnitureTypeTree,
}>();
</script>
