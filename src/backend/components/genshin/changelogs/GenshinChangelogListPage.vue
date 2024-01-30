<template>
  <section class="card">
    <h2 class="valign">
      <span>Changelogs</span>
    </h2>
    <div class="content">
      <p v-if="errorMessage" class="error-notice spacer10-bottom">{{ errorMessage }}</p>
      <ul>
        <template v-for="version of gameVersions">
          <li v-if="version.showChangelog">
            <a :href="`/changelog/${version.number}`">{{ version.previous }} &ndash; {{ version.number }}</a>
          </li>
        </template>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { GenshinVersions } from '../../../../shared/types/game-versions.ts';

defineProps<{
  errorMessage?: string
}>();

const gameVersions = GenshinVersions.slice().reverse();
</script>
