<template>
  <template v-if="json">
    <HtmlScript :nonce="nonce" :content="`
    window.excelData = ${JSON.stringify(json)};
    `" />
    <HtmlScript :nonce="nonce" :content="`
    window.excelFileName = '${fileName}';
    window.excelJumpToRowIndex = ${isInt(jumpToRowIndex) ? jumpToRowIndex : -1};
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
import { useTrace } from '../../middleware/request/tracer.js';
import HtmlScript from '../utility/HtmlScript.vue';
import ByteSizeLabel from '../utility/ByteSizeLabel.vue';
import { isInt } from '../../../shared/util/numberUtil.ts';

const { nonce } = useTrace();

defineProps<{
  fileName?: string,
  fileSize?: number,
  json?: any[],
  jumpToRowIndex?: number,
}>();
</script>
