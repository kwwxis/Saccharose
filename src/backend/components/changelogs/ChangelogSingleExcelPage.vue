<template>
  <meta id="x-addedRecords-excelFileName" name="x-addedRecords-excelFileName" :content="`${excelFileChanges.name} - New Records ${currentVersion.previous} - ${currentVersion.number}`" />
  <meta id="x-addedRecords-excelData" name="x-addedRecords-excelData" :content="JSON.stringify(valuesOf(excelFileChanges.changedRecords).filter(r => r.changeType === 'added').map(r => r.addedRecord))" />

  <section class="card spacer10-bottom">
    <h2 class="valign">
      <a :href="`${ctx.siteHome}/changelog`" style="text-decoration: none">Changelogs</a>
      <Icon name="chevron-right" />
      <span>{{ currentVersion.previous }} &ndash; {{ currentVersion.number }}</span>
    </h2>

    <div class="tab-list" role="tablist">
      <a :href="`${ctx.siteHome}/changelog/${currentVersion.number}`" role="tab" class="tab">
        Summary
      </a>

      <a :href="`${ctx.siteHome}/changelog/${currentVersion.number}/textmap`" role="tab" class="tab">
        TextMap
      </a>

      <a :href="`${ctx.siteHome}/changelog/${currentVersion.number}/excels`" role="tab" class="tab active">
        Excels
      </a>
    </div>
  </section>

  <section class="card">
    <h2>{{ excelFileChanges.name }}</h2>
    <div id="tablist-changedRecords" class="tab-list" role="tablist">
      <button id="tab-addedRecords" role="tab" class="tab" :class="{'active': activeTab === 'added'}" ui-action="tab: #tabpanel-addedRecords, changedRecords; set-query-param: tab=added">
        Added Records ({{ valuesOf(excelFileChanges.changedRecords).filter(r => r.changeType === 'added').length }})
      </button>
      <button id="tab-updatedRecords" role="tab" class="tab" :class="{'active': activeTab === 'updated'}" ui-action="tab: #tabpanel-updatedRecords, changedRecords; set-query-param: tab=updated">
        Updated Records ({{ valuesOf(excelFileChanges.changedRecords).filter(r => r.changeType === 'updated').length }})
      </button>
      <button id="tab-removedRecords" role="tab" class="tab" :class="{'active': activeTab === 'removed'}" ui-action="tab: #tabpanel-removedRecords, changedRecords; set-query-param: tab=removed">
        Removed Records ({{ valuesOf(excelFileChanges.changedRecords).filter(r => r.changeType === 'removed').length }})
      </button>
    </div>

    <div id="tabpanel-addedRecords" role="tabpanel" aria-labelledby="tab-addedRecords" class="tabpanel active">
      <div class="content" v-if="valuesOf(excelFileChanges.changedRecords).filter(r => r.changeType === 'added').length === 0">
        <p class="info-notice">None</p>
      </div>
      <div v-else>
        <hr />
        <div id="tablist-addedRecords" class="tab-list secondary" role="tablist">
          <button id="tab-addedRecords-excelViewer" role="tab" class="tab active" ui-action="tab: #tabpanel-addedRecords-excelViewer, addedRecordsTabs">Excel Viewer</button>
          <button id="tab-addedRecords-json" role="tab" class="tab" ui-action="tab: #tabpanel-addedRecords-json, addedRecordsTabs">JSON</button>
        </div>
        <div id="tabpanel-addedRecords-excelViewer" class="tabpanel active"></div>
        <div id="tabpanel-addedRecords-json" class="tabpanel hide">
          <template v-for="record of valuesOf(excelFileChanges.changedRecords).filter(r => r.changeType === 'added')">
            <hr />
            <h3 class="secondary-header">
              <span>Record ID: <strong>{{ record.key }}</strong></span>
            </h3>
            <div>
              <JsonText :value="JSON.stringify(record.addedRecord, null, 2)" :lazy-load="true" :seamless="true" />
            </div>
          </template>
        </div>
      </div>
    </div>
    <div id="tabpanel-updatedRecords" role="tabpanel" aria-labelledby="tab-updatedRecords" class="tabpanel hide">
      <template v-for="record of valuesOf(excelFileChanges.changedRecords).filter(r => r.changeType === 'updated')">
        <hr />
        <h3 class="secondary-header">
          <span>Record ID: <strong>{{ record.key }}</strong></span>
        </h3>
        <div style="padding-left: 15px;font-size:14px">
          <table class="article-table" style="border-top:0;border-right:0">
            <tr style="border-top:0">
              <th style="border-top:0;text-align:left">Field Name</th>
              <th style="border-top:0;text-align:left">Old Value</th>
              <th style="border-top:0;text-align:left">New Value</th>
              <th style="border-top:0;text-align:left">Text Changes</th>
            </tr>
            <tr v-for="field of valuesOf(record.updatedFields)">
              <td class="code" style="vertical-align: top"><strong>{{ field.field }}</strong></td>
              <td class="code" style="vertical-align: top">
                <span v-if="isset(field.oldValue)" class="dispInlineBlock" style="max-width:300px;overflow-wrap: break-word;">{{ field.oldValue }}</span>
                <span v-else style="font-style: italic">(none)</span>
              </td>
              <td class="code" style="vertical-align: top">
                <span v-if="isset(field.newValue)" class="dispInlineBlock" style="max-width:300px;overflow-wrap: break-word;">{{ field.newValue }}</span>
                <span v-else style="font-style: italic">(none)</span>
              </td>
              <td style="padding:0">
                <table class="article-table" style="border-top:0" v-if="field.textChanges?.length">
                  <tr style="border-top:0">
                    <th style="border-top:0">Language</th>
                    <th style="border-top:0;white-space: nowrap">Old Text</th>
                    <th style="border-top:0;white-space: nowrap">New Text</th>
                  </tr>
                  <template v-for="textChange of field.textChanges">
                    <tr>
                      <td style="vertical-align: top">{{ LANG_CODES_TO_NAME[textChange.langCode] }} ({{ textChange.langCode }})</td>
                      <td class="code" style="vertical-align: top">
                        <Wikitext v-if="textChange.oldValue" :value="textChange.oldValue" :seamless="true" />
                        <span v-else style="font-style: italic">(none)</span>
                      </td>
                      <td class="code" style="vertical-align: top">
                        <Wikitext v-if="textChange.newValue" :value="textChange.newValue" :seamless="true" />
                        <span v-else style="font-style: italic">(none)</span>
                      </td>
                    </tr>
                  </template>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </template>
      <div class="content" v-if="valuesOf(excelFileChanges.changedRecords).filter(r => r.changeType === 'updated').length === 0">
        <p class="info-notice">None</p>
      </div>
    </div>
    <div id="tabpanel-removedRecords" role="tabpanel" aria-labelledby="tab-removedRecords" class="tabpanel hide">
      <template v-for="record of valuesOf(excelFileChanges.changedRecords).filter(r => r.changeType === 'removed')">
        <hr />
        <h3 class="secondary-header">
          <span>Record ID: <strong>{{ record.key }}</strong></span>
        </h3>
        <div>
          <JsonText :value="JSON.stringify(record.removedRecord, null, 2)" :lazy-load="true" :seamless="true" />
        </div>
      </template>
      <div class="content" v-if="valuesOf(excelFileChanges.changedRecords).filter(r => r.changeType === 'removed').length === 0">
        <p class="info-notice">None</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { GameVersion } from '../../../shared/types/game-versions.ts';
import {
  ExcelFileChanges,
  FullChangelog,
} from '../../../shared/types/changelog-types.ts';
import { LANG_CODES_TO_NAME } from '../../../shared/types/lang-types.ts';
import JsonText from '../utility/JsonText.vue';
import Icon from '../utility/Icon.vue';
import Wikitext from '../utility/Wikitext.vue';
import { isset } from '../../../shared/util/genericUtil.ts';
import { valuesOf } from '../../../shared/util/arrayUtil.ts';
import { getTrace } from '../../middleware/request/tracer.ts';

const { ctx } = getTrace();

defineProps<{
  currentVersion?: GameVersion,
  fullChangelog?: FullChangelog,
  excelFileChanges?: ExcelFileChanges,
  activeTab?: 'added' | 'updated' | 'removed'
}>();
</script>
