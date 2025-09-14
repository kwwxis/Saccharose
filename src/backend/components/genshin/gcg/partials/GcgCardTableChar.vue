<template>
  <section class="card" :id="sectionId">
    <h2 v-html="sectionNameHtml"></h2>
    <table class="article-table">
      <thead>
      <tr style="font-size: 14px;text-align: left;line-height: 16px;">
        <th>Icon</th>
        <th>ID</th>
        <th>Name</th>
        <th>Health</th>
        <th>Element</th>
        <th>Weapon</th>
        <th>Faction</th>
        <th style="font-size:11px">Obtainable</th>
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
            <a :href="`/genshin/TCG/cards/${String(card.Id).padStart(6, '0')}`" role="button" class="spacer5-all secondary textAlignLeft valign">
              <img v-if="card.CharIcon" class="icon framed x32 spacer10-right"
                   :src="`/images/genshin/${card.CharIcon}.png`" style="margin-left:-5px;border-radius:50%" />
              <span>{{ card.WikiName }}</span>
            </a>
          </td>
          <td>
            <div v-if="card.Hp" class="tcg-icon GCG_CHAR_HP">{{ card.Hp }}</div>
          </td>
          <td style="font-size:14px;line-height:1.1em">
            <template v-for="tag of card.MappedTagList.filter(x => !!x.Type && x.CategoryType === 'GCG_TAG_IDENTIFIER_ELEMENT')">
              <GcgTag :tag="tag" />
            </template>
          </td>
          <td style="font-size:14px;line-height:1.1em">
            <template v-for="tag of card.MappedTagList.filter(x => !!x.Type && x.CategoryType === 'GCG_TAG_IDENTIFIER_WEAPON')">
              <GcgTag :tag="tag" />
            </template>
          </td>
          <td style="font-size:14px;line-height:1.1em">
            <template v-for="tag of card.MappedTagList.filter(x => !!x.Type && x.CategoryType === 'GCG_TAG_IDENTIFIER_CHAR')">
              <GcgTag :tag="tag" />
            </template>
          </td>
          <td class="textAlignCenter" style="font-size:14px">
            <span v-if="card.IsCanObtain" style="color:green">Yes</span>
            <span v-else style="color:red">No</span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { GCGCharExcelConfigData } from '../../../../../shared/types/genshin/gcg-types.ts';
import GcgTag from './GcgTag.vue';

defineProps<{
  sectionId: string,
  sectionNameHtml: string,
  cards: GCGCharExcelConfigData[],
}>();
</script>
