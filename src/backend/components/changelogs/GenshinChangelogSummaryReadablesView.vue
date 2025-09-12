<template>
  <div v-if="!readables.TotalCount">
    <p>(None)</p>
  </div>
  <template v-if="valuesOf(readables.BookCollections).length">
    <h4 class="content" style="padding-bottom:0">Book Collections</h4>
    <div class="content">
      <div class="w100p spacer-top" v-for="collection of valuesOf(readables.BookCollections)">
        <a class="secondary spacer3-all valign textAlignLeft" role="button" :href="`/genshin/readables/book-collection/${collection.Id}`">
          <img class="icon x32" :src="`/images/genshin/${collection.Books[0]?.Material?.Icon}.png`" loading="lazy" decoding="async" />
          <span class="spacer10-left">{{ collection.SuitNameText }}</span>
        </a>
        <div style="padding-left:20px">
          <div class="w100p" v-for="readable of collection.Books">
            <GenshinReadableLink :readable="readable" />
          </div>
        </div>
      </div>
    </div>
  </template>
  <template v-if="readables.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_QUEST').length">
    <h4 class="content" style="padding-bottom:0">Quest Items</h4>
    <div class="content dispFlex flexWrap alignStart">
      <div class="w50p" v-for="readable of readables.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_QUEST')">
        <GenshinReadableLink :readable="readable" />
      </div>
    </div>
  </template>
  <template v-if="readables.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_FLYCLOAK').length">
    <h4 class="content" style="padding-bottom:0">Glider Descriptions</h4>
    <div class="content dispFlex flexWrap alignStart">
      <div class="w50p" v-for="readable of readables.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_FLYCLOAK')">
        <GenshinReadableLink :readable="readable" />
      </div>
    </div>
  </template>
  <template v-if="readables.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_COSTUME').length">
    <h4 class="content" style="padding-bottom:0">Costume Descriptions</h4>
    <div class="content dispFlex flexWrap alignStart">
      <div class="w50p" v-for="readable of readables.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_COSTUME')">
        <GenshinReadableLink :readable="readable" />
      </div>
    </div>
  </template>
  <template v-if="readables.Weapons.length">
    <h4 class="content" style="padding-bottom:0">Weapons</h4>
    <div class="content dispFlex flexWrap alignStart">
      <div class="w50p" v-for="readable of readables.Weapons">
        <GenshinReadableLink :readable="readable" />
      </div>
    </div>
  </template>
  <template v-if="readables.Artifacts.length">
    <h4 class="content" style="padding-bottom:0">Artifacts</h4>
    <div class="content dispFlex flexWrap alignStart">
      <div class="w50p" v-for="readable of readables.Artifacts">
        <GenshinReadableLink :readable="readable" />
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { valuesOf } from '../../../shared/util/arrayUtil.ts';
import GenshinReadableLink from '../genshin/links/GenshinReadableLink.vue';
import { ReadableArchive } from '../../../shared/types/genshin/readable-types.ts';

defineProps<{
  readables: ReadableArchive
}>();
</script>
