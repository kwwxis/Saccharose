<template>
  <meta id="x-changelog-version" name="x-changelog-version" :content="genshinVersion.number" />
  <meta id="x-tmdiff-added" name="x-tmdiff-added" :content="JSON.stringify(textmapChanges.added)" />
  <meta id="x-tmdiff-removed" name="x-tmdiff-removed" :content="JSON.stringify(textmapChanges.removed)" />
  <meta id="x-tmdiff-updated" name="x-tmdiff-updated" :content="JSON.stringify(textmapChanges.updated)" />

  <section class="card">
    <h2 class="valign">
      <a href="/genshin/changelog" style="text-decoration: none">Changelogs</a>
      <Icon name="chevron-right" />
      <a :href="`/genshin/changelog/${genshinVersion.number}`" style="text-decoration: none">{{ genshinVersion.previous }} &ndash; {{ genshinVersion.number }}</a>
      <Icon name="chevron-right" />
      <span>TextMap</span>
    </h2>

    <div id="tablist-changedEntries" class="tab-list" role="tablist">
      <button id="tab-addedEntries" role="tab" class="tab" :class="{'active': activeTab === 'added'}" ui-action="tab: #tabpanel-addedEntries, changedEntries; set-query-param: tab=added">
        Added Entries ({{ Object.keys(textmapChanges.added).length }})
      </button>
      <button id="tab-updatedEntries" role="tab" class="tab" :class="{'active': activeTab === 'updated'}" ui-action="tab: #tabpanel-updatedEntries, changedEntries; set-query-param: tab=updated">
        Updated Entries ({{ Object.keys(textmapChanges.updated).length }})
      </button>
      <button id="tab-removedEntries" role="tab" class="tab" :class="{'active': activeTab === 'removed'}" ui-action="tab: #tabpanel-removedEntries, changedEntries; set-query-param: tab=removed">
        Removed Entries ({{ Object.keys(textmapChanges.removed).length }})
      </button>
    </div>

    <div id="tabpanel-addedEntries" role="tabpanel" aria-labelledby="tab-addedEntries" class="tabpanel">
      <div id="grid-addedEntries"></div>
    </div>

    <div id="tabpanel-updatedEntries" role="tabpanel" aria-labelledby="tab-updatedEntries" class="tabpanel hide">
      <div id="grid-updatedEntries"></div>
    </div>

    <div id="tabpanel-removedEntries" role="tabpanel" aria-labelledby="tab-removedEntries" class="tabpanel hide">
      <div id="grid-removedEntries"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { GameVersion } from '../../../../shared/types/game-versions.ts';
import {
  TextMapChangesAsRows,
} from '../../../../shared/types/changelog-types.ts';
import Icon from '../../utility/Icon.vue';

defineProps<{
  genshinVersion: GameVersion,
  textmapChanges: TextMapChangesAsRows,
  activeTab: 'added' | 'updated' | 'removed'
}>();
</script>
