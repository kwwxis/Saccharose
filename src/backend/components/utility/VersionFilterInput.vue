<template>

  <div class="posRel">
    <input id="versionFilter" type="text" placeholder="Version filter"
           style="max-width: 250px;width: 100%;padding-right:25px"/>
    <span :ui-tippy="JSON.stringify(tippyOpts)"
          class="dispInlineFlex" style="height:16px;width:16px;position:absolute;right:5px;top:0;bottom:0;margin:auto 0;opacity:0.6">
            <Icon name="info" :size="16" />
          </span>
    <button class="version-filter-clear input-clear-button hide"><Icon name="x-circle" /></button>
  </div>
</template>

<script setup lang="ts">
import Icon from './Icon.vue';

let { versionFilterMoreInfo } = defineProps<{
  versionFilterMoreInfo?: string,
}>();

// language=HTML
const tippyContent = `
<strong>Version filter</strong>
<ul>
  <li>Versions and version ranges should be separated by comma or semicolon.</li>
  <li>Ranges are supported using a dash, e.g. <code>2.4-3.0</code></li>
  <li>Forward ranges are supported using a plus sign, e.g. <code>2.4+</code> (inclusive of 2.4)</li>
</ul>
`;

const tippyOpts = {
  content: `${tippyContent}${versionFilterMoreInfo ? '<div class="spacer5-top">' + versionFilterMoreInfo + '</div>' : ''}`,
  delay: [200, 100],
  allowHTML: true,
};
</script>
