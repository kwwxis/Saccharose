<template>
  <section class="card">
    <h2 class="valign">
      <a :href="`${ctx.siteHome}/changelog`" style="text-decoration: none">Changelogs</a>
      <Icon name="chevron-right" />
      <span>{{ currentVersion.previous }} &ndash; {{ currentVersion.number }}</span>
    </h2>

    <div class="tab-list" role="tablist">
      <a :href="`${ctx.siteHome}/changelog/${currentVersion.number}`" role="tab" class="tab" v-if="currentVersion.hasChangelogSummary">
        Summary
      </a>

      <a :href="`${ctx.siteHome}/changelog/${currentVersion.number}/textmap`" role="tab" class="tab" v-if="currentVersion.showTextmapChangelog">
        TextMap
      </a>

      <a :href="`${ctx.siteHome}/changelog/${currentVersion.number}/excels`" role="tab" class="tab active" v-if="currentVersion.showExcelChangelog">
        Excels
      </a>
    </div>

    <div id="tabpanel-byExcels" role="tabpanel" class="tabpanel active">
      <div class="content">
        <p class="info-notice">Only certain Excel files are available in this list, if you'd like one that's not present
          here to be added, let kwwxis know.</p>
      </div>
      <template v-for="excelFileChanges of sort(valuesOf(excelChangelog), 'name')">
        <h3 class="secondary-header valign">{{ excelFileChanges.name }}</h3>
        <div class="content">
          <dl>
            <dt>Added records</dt>
            <dd>{{ valuesOf(excelFileChanges.changedRecords).filter(r => r.changeType === 'added').length }}</dd>
            <dt>Updated records</dt>
            <dd>{{ valuesOf(excelFileChanges.changedRecords).filter(r => r.changeType === 'updated').length }}</dd>
            <dt>Removed records</dt>
            <dd>{{ valuesOf(excelFileChanges.changedRecords).filter(r => r.changeType === 'removed').length }}</dd>
            <dt>
              <a role="button" class="secondary spacer5-top" :href="`${ctx.siteHome}/changelog/${currentVersion.number}/excels/${excelFileChanges.name}`">Browse records</a>
            </dt>
            <dd><!-- intentionally empty --></dd>
          </dl>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { sort, valuesOf } from '../../../shared/util/arrayUtil.ts';
import { GameVersion } from '../../../shared/types/game-versions.ts';
import { ExcelFullChangelog } from '../../../shared/types/changelog-types.ts';
import Icon from '../utility/Icon.vue';
import { getTrace } from '../../middleware/request/tracer.ts';

const { ctx } = getTrace();

defineProps<{
  currentVersion?: GameVersion,
  excelChangelog?: ExcelFullChangelog,
}>();
</script>
