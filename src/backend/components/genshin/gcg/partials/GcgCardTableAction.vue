<template>
  <section class="card" :id="sectionId">
    <h2><b>Action Cards</b> / <span v-html="sectionNameHtml"></span></h2>
    <table class="article-table">
      <thead>
      <tr style="font-size: 14px;text-align: left;line-height: 16px;">
        <th>Icon</th>
        <th>ID</th>
        <th>Name</th>
        <th>Tag</th>
        <th>Cost</th>
        <th style="font-size:11px"><span style="white-space: nowrap">Obtainable /</span><br>Hidden</th>
      </tr>
      </thead>
      <tbody>
        <tr v-for="card of cards">
          <td>
            <div v-if="card.WikiImage" class="tcg-card-image">
              <img :src="`/images/genshin/${card.WikiImage}.png`" />
            </div>
          </td>
          <td><code style="font-size:15px">{{ String(card.Id).padStart(6, '0') }}</code></td>
          <td>
            <a :href="`/genshin/TCG/cards/${String(card.Id).padStart(6, '0')}`" role="button" class="spacer5-all secondary dispBlock textAlignLeft">{{ card.WikiName }}</a>
          </td>
          <td>
            <template v-for="tag of card.MappedTagList.filter(x => !!x.Type)">
              <GcgTag :tag="tag" />
            </template>
          </td>
          <td class="textAlignCenter">
            <template v-if="card.CostList && Array.isArray(card.CostList)">
              <template v-for="costItem of card.CostList.filter(x => !!x.CostType)">
                <div :class="`tcg-icon ${costItem.CostType}`">{{ costItem.Count }}</div>
              </template>
            </template>
          </td>
          <td class="textAlignCenter" style="font-size:14px;line-height:1.2em;">
            <span>
              <span v-if="card.IsCanObtain" style="color:green">Yes</span>
              <span v-else style="color:red">No</span>
            </span>
            <span>&nbsp;/&nbsp;</span>
            <span>
              <span v-if="card.IsHidden" style="color:red">Yes</span>
              <span v-else style="color:green">No</span>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { GCGCardExcelConfigData } from '../../../../../shared/types/genshin/gcg-types.ts';
import GcgTag from './GcgTag.vue';

defineProps<{
  sectionId: string,
  sectionNameHtml: string,
  cards: GCGCardExcelConfigData[],
}>();
</script>
