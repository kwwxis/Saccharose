<template>
  <div class="posRel">
    <button class="secondary small" ui-action="dropdown">
      <span class="valign">
        <strong class="current-option spacer3-horiz">
          <span class="option-text">{{ initialCurrentValue }}</span>
        </strong>
        <Icon name="chevron-down" />
      </span>
    </button>
    <div class="ui-dropdown">
      <template v-for="basePath of availableBasePaths">
        <div :class="optionInitialClass(basePath)"
             :ui-action="`dropdown-item; set-user-pref: preferredBasePaths, ${siteMode}|${basePath}`">
          <span class="option-text">{{ basePath }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  getAvailableBasePathsForSiteMode,
  getDefaultBasePathForSiteMode,
  SiteMode,
} from '../../../shared/types/site/site-mode-type.ts';
import Icon from '../utility/Icon.vue';
import { useTrace } from '../../middleware/request/tracer.ts';
import { SiteUserPrefsPreferredBasePaths } from '../../../shared/types/site/site-user-types.ts';

const { siteMode } = defineProps<{
  siteMode: SiteMode
}>();

const availableBasePaths = getAvailableBasePathsForSiteMode(siteMode);
const defaultBasePath = getDefaultBasePathForSiteMode(siteMode);

const { ctx } = useTrace();
const preferredBasePaths: SiteUserPrefsPreferredBasePaths = ctx.prefs.preferredBasePaths || {};

const initialCurrentValue = preferredBasePaths[siteMode] || defaultBasePath;

function optionInitialClass(myValue: string): string {
  if (myValue === initialCurrentValue) {
    return 'option selected';
  } else {
    return 'option';
  }
}
</script>

