<template>
  <div class="posRel">
    <button class="secondary small" ui-action="dropdown">
      <span class="valign">
        <strong class="current-option spacer3-horiz" v-html="levelOptionInitialLabel(confId, thingId)"></strong>
        <Icon name="chevron-down" />
      </span>
    </button>
    <div class="ui-dropdown">
      <div :class="levelOptionInitialClass(confId, thingId, 'shown')"
           :ui-action="`dropdown-item; set-user-pref: siteMenuShown, ${confId}|${thingId}|shown`">
        <span class="option-text color-green">Shown</span>
      </div>
      <div :class="levelOptionInitialClass(confId, thingId, 'collapsed')"
           :ui-action="`dropdown-item; set-user-pref: siteMenuShown, ${confId}|${thingId}|collapsed`">
        <span class="option-text color-yellow">Collapsed</span>
      </div>
      <div :class="levelOptionInitialClass(confId, thingId, 'hidden')"
           :ui-action="`dropdown-item; set-user-pref: siteMenuShown, ${confId}|${thingId}|hidden`">
        <span class="option-text color-red">Hidden</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '../utility/Icon.vue';
import { SiteMenuShown, SiteMenuShownType } from '../../../shared/types/site/site-user-types.ts';
import { useTrace } from '../../middleware/request/tracer.ts';

defineProps<{
  confId: string;
  thingId: string;
}>();

const { ctx } = useTrace();
const sidebarShown: SiteMenuShown = ctx.prefs.siteMenuShown || {};

function levelOptionInitialLabel(confId: string, thingId: string): string {
  if (sidebarShown[confId]?.[thingId] === 'collapsed') {
    return '<span class="option-text color-yellow">Collapsed</span>';
  } else if (sidebarShown[confId]?.[thingId] === 'hidden') {
    return '<span class="option-text color-red">Hidden</span>';
  } else {
    return '<span class="option-text color-green">Shown</span>';
  }
}

function levelOptionInitialClass(confId: string, thingId: string, thingState: SiteMenuShownType): string {
  if (sidebarShown[confId]?.[thingId] === thingState) {
    return 'option selected';
  } if (!sidebarShown[confId]?.[thingId] && thingState === 'shown') {
    return 'option selected';
  } else {
    return 'option';
  }
}
</script>
