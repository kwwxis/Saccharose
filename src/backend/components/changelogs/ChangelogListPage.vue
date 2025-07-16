<template>
  <section class="card">
    <h2 class="valign">
      <span>Changelogs</span>
    </h2>
    <div class="content">
      <p v-if="errorMessage" class="error-notice spacer10-bottom">{{ errorMessage }}</p>
      <template v-for="version of gameVersionsToList">
        <div class="secondary-label valign spacer5-bottom" v-if="version.showTextmapChangelog">
          <span>{{ version.previous }} &ndash; {{ version.number }}</span>

          <span class="grow"></span>

          <a v-if="version.hasChangelogSummary" role="button" class="primary primary--2"
             :href="`${ctx.siteHome}/changelog/${version.number}`"><Icon name="info" /><span class="spacer5-left">Summary</span></a>

          <a v-if="version.showTextmapChangelog" role="button" class="primary primary--2"
             :href="`${ctx.siteHome}/changelog/${version.number}/textmap`"><Icon name="file-text" /><span class="spacer5-left">Textmap</span></a>

          <a v-if="version.showExcelChangelog" role="button" class="primary primary--2"
             :href="`${ctx.siteHome}/changelog/${version.number}/excels`"><Icon name="table" /><span class="spacer5-left">Excels</span></a>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { GameVersion } from '../../../shared/types/game-versions.ts';
import { getTrace } from '../../middleware/request/tracer.ts';
import Icon from '../utility/Icon.vue';

const { ctx } = getTrace();

const { gameVersions } = defineProps<{
  gameVersions: GameVersion[];
  errorMessage?: string
}>();

const gameVersionsToList = gameVersions.slice().reverse();
</script>
