<template>
  <section class="card">
    <h2 class="valign">
      <a href="/changelog" style="text-decoration: none">Changelogs</a>
      <Icon name="chevron-right" />
      <a :href="`/changelog/${genshinVersion.number}`" style="text-decoration: none">{{ genshinVersion.previous }} &ndash; {{ genshinVersion.number }}</a>
      <Icon name="chevron-right" />
      <span>{{ excelFileChanges.name }}</span>
    </h2>

    <div id="tablist-changedRecords" class="tab-list" role="tablist">
      <button id="tab-addedRecords" role="tab" class="tab active" ui-action="tab: #tabpanel-addedRecords, changedRecords">
        Added Records ({{ Object.values(excelFileChanges.changedRecords).filter(r => r.changeType === 'added').length }})
      </button>
      <button id="tab-updatedRecords" role="tab" class="tab" ui-action="tab: #tabpanel-updatedRecords, changedRecords">
        Updated Records ({{ Object.values(excelFileChanges.changedRecords).filter(r => r.changeType === 'updated').length }})
      </button>
      <button id="tab-removedRecords" role="tab" class="tab" ui-action="tab: #tabpanel-removedRecords, changedRecords">
        Removed Records ({{ Object.values(excelFileChanges.changedRecords).filter(r => r.changeType === 'removed').length }})
      </button>
    </div>

    <div id="tabpanel-addedRecords" role="tabpanel" aria-labelledby="tab-addedRecords" class="tabpanel active">
      <template v-for="record of Object.values(excelFileChanges.changedRecords).filter(r => r.changeType === 'added')">
        <hr />
        <h3 class="secondary-header">
          <span>Record ID: <strong>{{ record.key }}</strong></span>
        </h3>
        <div>
          <JsonText :value="JSON.stringify(record.addedRecord, null, 2)" :lazy-load="true" :seamless="true" />
        </div>
      </template>
      <div class="content" v-if="Object.values(excelFileChanges.changedRecords).filter(r => r.changeType === 'added').length === 0">
        <p class="info-notice">None</p>
      </div>
    </div>
    <div id="tabpanel-updatedRecords" role="tabpanel" aria-labelledby="tab-updatedRecords" class="tabpanel hide">
      <template v-for="record of Object.values(excelFileChanges.changedRecords).filter(r => r.changeType === 'updated')">
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
            <tr v-for="field of (record.updatedFields || [])">
              <td class="code"><strong>{{ field.field }}</strong></td>
              <td class="code">{{ field.oldValue || '(none)' }}</td>
              <td class="code">{{ field.newValue || '(none)' }}</td>
              <td style="padding:0">
                <table class="article-table" style="border-top:0" v-if="field.textChanges?.length">
                  <tr style="border-top:0">
                    <th style="border-top:0">Language</th>
                    <th style="border-top:0">Old Text</th>
                    <th style="border-top:0">New Text</th>
                  </tr>
                  <template v-for="textChange of field.textChanges">
                    <tr>
                      <td>{{ LANG_CODES_TO_NAME[textChange.langCode] }} ({{ textChange.langCode }})</td>
                      <td class="code">{{ textChange.oldValue }}</td>
                      <td class="code">{{ textChange.newValue }}</td>
                    </tr>
                  </template>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </template>
      <div class="content" v-if="Object.values(excelFileChanges.changedRecords).filter(r => r.changeType === 'updated').length === 0">
        <p class="info-notice">None</p>
      </div>
    </div>
    <div id="tabpanel-removedRecords" role="tabpanel" aria-labelledby="tab-removedRecords" class="tabpanel hide">
      <template v-for="record of Object.values(excelFileChanges.changedRecords).filter(r => r.changeType === 'removed')">
        <hr />
        <h3 class="secondary-header">
          <span>Record ID: <strong>{{ record.key }}</strong></span>
        </h3>
        <div>
          <JsonText :value="JSON.stringify(record.removedRecord, null, 2)" :lazy-load="true" :seamless="true" />
        </div>
      </template>
      <div class="content" v-if="Object.values(excelFileChanges.changedRecords).filter(r => r.changeType === 'removed').length === 0">
        <p class="info-notice">None</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { GameVersion } from '../../../../shared/types/game-versions.ts';
import { ExcelFileChanges, FullChangelog } from '../../../../shared/types/changelog-types.ts';
import { LANG_CODES_TO_NAME } from '../../../../shared/types/lang-types.ts';
import JsonText from '../../utility/JsonText.vue';
import Icon from '../../utility/Icon.vue';

defineProps<{
  genshinVersion: GameVersion,
  fullChangelog: FullChangelog,
  excelFileChanges: ExcelFileChanges,
}>()
</script>
