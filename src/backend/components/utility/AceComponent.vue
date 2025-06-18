<template>
    <textarea :id="props.id" readonly
              class="w100p autosize"
              :class="{ 'seamless-input': props.seamless, ... additionalClasses }"
              :style="extraStyle"
              spellCheck="false"
              translate="no"
              :data-lang="lang"
              :data-lazy-load="lazyLoad"
              :data-mode="props.mode"
              :data-gutters="props.gutters ? 'true' : null"
              :data-show-text-map-hash="props.showTextMapHash ? 'true' : null"
              :data-markers="props.markers ? Marker.joining(props.markers) : null"
              :data-line-ids="props.lineIds ? stringifyCommonLineIds(props.lineIds) : null"
              :data-is-wiki-template-fragment="props.isWikiTemplateFragment ? 'true' : null"
              :value="props.value"></textarea>
</template>

<script setup lang="ts">
import { Marker } from '../../../shared/util/highlightMarker.ts';
import { CommonLineId, stringifyCommonLineIds } from '../../../shared/types/common-types.ts';
import { LangCode } from '../../../shared/types/lang-types.ts';

export type AceProps = {
  id?: string,

  gutters?: boolean,
  showTextMapHash?: boolean,

  seamless?: boolean,
  isWikiTemplateFragment?: boolean,
  lazyLoad?: boolean,

  lang?: LangCode,
  markers?: Marker[],
  lineIds?: CommonLineId[],

  mode?: string,
  extraClassNames?: string|string[],
  extraStyle?: string,
  forOl?: boolean,
  forOlWithCopyButton?: boolean,

  value?: string,
};

const props = defineProps<AceProps>();

let additionalClasses: {[cls: string]: boolean} = {};

if (typeof props.extraClassNames === 'string') {
  for (let cls of props.extraClassNames.split(/\s+/g)) {
    additionalClasses[cls] = true;
  }
}

if (Array.isArray(props.extraClassNames)) {
  for (let str of props.extraClassNames) {
    for (let cls of str.split(/\s+/g)) {
      additionalClasses[cls] = true;
    }
  }
}

if (props.forOl || props.forOlWithCopyButton)
  additionalClasses['ol-result-textarea'] = true;

if (props.forOlWithCopyButton)
  additionalClasses['ol-result-textarea--with-copy-button'] = true;
</script>
