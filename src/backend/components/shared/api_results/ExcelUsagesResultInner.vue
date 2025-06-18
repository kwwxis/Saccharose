<template>
  <template v-if="Object.keys(idToUsages[id]).length">
    <template v-for="file of Object.keys(idToUsages[id])">
      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" :ui-action="`expando: [data-file-usages='${file}']`"><Icon name="chevron-down" :size="17" /></span>
        <span>File <strong>{{ file }}</strong>, {{ idToUsages[id][file].length }} matches:</span>
      </h3>
      <div :data-file-usages="file" class="content">
        <template v-for="(item, i) of idToUsages[id][file]">
          <div class="posRel">
            <div class="posAbs secondary-header" style="left:0;right:0;border-top:0;font-size:13px;padding:1px 10px;">
              <code>[{{ item.refIndex }}].{{ item.field }}</code>
              <small class="fr">Match {{ i + 1 }}</small>
            </div>
            <JsonText :markers="item.refObjectMarkers" :value="item.refObjectStringified" :extra-style="`padding-top:30px`" />
          </div>
        </template>
      </div>
    </template>
  </template>
  <template v-else>
    <div class="content">
      <p>No usages found.</p>
    </div>
  </template>
</template>

<script setup lang="ts">
import { IdToExcelUsages } from '../../../../shared/util/searchUtil.ts';
import { ChangeRecordRef } from '../../../../shared/types/changelog-types.ts';
import Icon from '../../utility/Icon.vue';
import JsonText from '../../utility/JsonText.vue';

defineProps<{
  id: string,
  idToUsages: IdToExcelUsages,
  changeRecordRefs: ChangeRecordRef[],
}>();
</script>
