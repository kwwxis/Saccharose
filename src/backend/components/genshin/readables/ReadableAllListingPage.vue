<template>
  <section class="card">
    <h2>Book Collections</h2>
    <div class="content dispFlex flexWrap alignStart">
      <div v-for="collection of Object.values(archive.BookCollections)" class="w50p">
        <a class="secondary spacer3-all valign textAlignLeft" role="button" :href="`/genshin/readables/book-collection/${collection.Id}`">
          <img class="icon x32" :src="`/images/genshin/${collection.Books[0]?.Material?.Icon}.png`" loading="lazy" decoding="async" />
          <span class="spacer10-left">{{ collection.SuitNameText }}</span>
        </a>
      </div>
    </div>
  </section>
  <section class="card">
    <h2>Quest Items</h2>
    <div class="content dispFlex flexWrap alignStart">
      <div v-for="readable of archive.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_QUEST')" class="w50p">
        <GenshinReadableLink :readable="readable" />
      </div>
    </div>
  </section>
  <section class="card">
    <h2>Glider Descriptions</h2>
    <div class="content dispFlex flexWrap alignStart">
      <div v-for="readable of archive.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_FLYCLOAK')" class="w50p">
        <GenshinReadableLink :readable="readable" />
      </div>
    </div>
  </section>
  <section class="card">
    <h2>Costume Descriptions</h2>
    <div class="content dispFlex flexWrap alignStart">
      <div v-for="readable of archive.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_COSTUME')" class="w50p">
        <GenshinReadableLink :readable="readable" />
      </div>
    </div>
  </section>
  <section class="card">
    <h2>Weapons</h2>
    <div class="content dispFlex flexWrap alignStart">
      <div v-for="readable of archive.Weapons" class="w50p">
        <GenshinReadableLink :readable="readable" />
      </div>
    </div>
  </section>
  <section class="card">
    <h2>Artifacts</h2>
    <div class="content dispFlex flexWrap alignStart">
      <div v-for="readable of archive.Artifacts" class="w50p">
        <GenshinReadableLink :readable="readable" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ReadableArchive } from '../../../../shared/types/genshin/readable-types.ts';
import GenshinReadableLink from '../links/GenshinReadableLink.vue';

defineProps<{
  archive?: ReadableArchive
}>();
</script>
