<template>
  <template v-if="json">
    <HtmlScript :nonce="nonce" :content="`
    window.excelData = ${JSON.stringify(json)};
    window.excelFileName = '${fileName}';
    `" />
    <div id="excelViewerContainer"></div>
  </template>
  <section v-else class="card">
    <h2>Excel Viewer</h2>
    <div class="content">
      <template v-if="fileSize">
        <p>File not supported for Excel Viewer (file too big): {{ fileName }}</p>
        <p>Max size is 20 MB</p>
        <p>Size of requested file is: <ByteSizeLabel :byte-size="fileSize" /></p>
      </template>
      <template v-else>
        <p>File not found: {{ fileName }}</p>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { getTrace } from '../../middleware/request/tracer.js';
import HtmlScript from '../utility/HtmlScript.vue';
import ByteSizeLabel from '../utility/ByteSizeLabel.vue';

const { ctx, nonce } = getTrace();

defineProps<{
  fileName?: string,
  fileSize?: number,
  json?: any[],
}>();
</script>
