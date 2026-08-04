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
    <h2 class="valign">
      <span>Excel Viewer &ndash; <strong>{{ fileName }}</strong></span>
      <span class="grow"></span>
      <a role="button" class="secondary small" :href="`${ctx.siteHome}/excel-viewer`">Back to excel list</a>
    </h2>
    <div class="content">
      <template v-if="fileSize">
        <p>File not supported for Excel Viewer UI (file too big): {{ fileName }}</p>
        <p>Max supported size is 20 MB</p>
        <p>Size of requested file is: <ByteSizeLabel :byte-size="fileSize" /></p>
        <hr class="spacer20-vert" />
        <p class="spacer10-bottom">You may still download the raw ExcelBinOutput JSON file:</p>

        <a :href="`${ctx.siteHome}/excel-viewer/${fileName}/raw-download`"
           role="button" ui-action="toast" :data-toast="`{title: 'Download started', content: 'Downloading ${fileName}.json'}`"
           class="primary">Download</a>
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

const { ctx, nonce } = useTrace();

defineProps<{
  fileName?: string,
  fileSize?: number,
  json?: any[],
  jumpToRowIndex?: number,
}>();
</script>
