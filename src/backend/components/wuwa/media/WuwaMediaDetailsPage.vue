<template>
  <section class="card">
    <h2>Media List</h2>
    <div class="tab-list" role="tablist">
      <a href="/wuwa/media/list" role="tab" class="tab">List</a>
      <a href="/wuwa/media/search" role="tab" class="tab">Search</a>
      <button role="tab" class="tab active">Image Details</button>
    </div>
  </section>

  <section class="card" v-if="!entity">
    <h2>Image not found: {{ pathImageName }}</h2>
  </section>

  <section class="card" v-if="entity">
    <h2>Image Info</h2>
    <div id="media-details" class="content">
      <div class="media-image">
        <div class="image-frame no-max-width">
          <div class="image-obj">
            <img :src="`/images/wuwa/${entity.image_name}.png`" />
          </div>
          <div class="image-label">{{ entity.image_name }}</div>
        </div>
      </div>
    </div>
    <dl>
      <dt>Image Name</dt>
      <dd>{{ entity.image_name }}</dd>
      <dt>Image Dimensions</dt>
      <dd>
        <span>{{ entity.image_width }} &times; {{ entity.image_height }}</span>
      </dd>
      <dt>Image Size</dt>
      <dd>
        <ByteSizeLabel :byte-size="entity.image_size" />
      </dd>
    </dl>
  </section>

  <section class="card" v-if="entity">
    <h2>Usages</h2>
    <div v-for="usageEntity of processedEntities">
      <h3 class="secondary-header">{{ usageEntity.fileName }}</h3>
      <div class="content" v-for="row of usageEntity.rows">
        <JsonText :value="row.jsonText" :markers="row.markers" />
      </div>
    </div>
    <div class="content" v-if="!processedEntities.length">
      <p>No usages found in ExcelBinOutput. This does not necessarily mean that the image is or isn't used anywhere in-game.</p>
    </div>
  </section>
</template>
<script setup lang="ts">
import { ImageIndexEntity } from '../../../../shared/types/image-index-types.ts';
import JsonText from '../../utility/JsonText.vue';
import { Marker } from '../../../../shared/util/highlightMarker.ts';
import ByteSizeLabel from '../../utility/ByteSizeLabel.vue';

const {entity, usageEntities} = defineProps<{
  entity?: ImageIndexEntity,
  usageEntities?: {[fileName: string]: any[]},
  pathImageName?: string,
}>();

type ProcessedUsageEntity = {
  fileName: string,
  rows: {
    rowData: any,
    jsonText: string,
    markers: Marker[]
  }[]
};

function getUsageEntities(): ProcessedUsageEntity[] {
  let out: ProcessedUsageEntity[] = [];
  for (let [fileName, rows] of Object.entries(usageEntities)) {
    out.push({
      fileName,
      rows: rows.map(rowData => {
        const jsonText = JSON.stringify(rowData, null, 2);
        const markers = Marker.create(entity.image_name, jsonText);
        return {
          rowData,
          jsonText,
          markers,
        };
      })
    });
  }
  return out;
}

const processedEntities: ProcessedUsageEntity[] = getUsageEntities();
</script>
