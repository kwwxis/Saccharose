<template>
  <div class="dialogue-section" :id="section.id" :data-similarity-group="section.similarityGroupId"
       :style="customStyle">
  <h4 v-if="!noTitle" class="dialogue-section-header valign">
    <span class="dialogue-section-expando" :ui-action="`expando: #dialogue-section-content-${section.id}`"
          v-html="icon('chevron-down', 17)"></span>
    <span v-if="!section.isHtmlTitle" class="dialogue-section-title">{{ section.title }}</span>
    <span v-else class="dialogue-section-title" v-html="section.title"></span>
    <span v-if="section.helptext"
          :ui-tippy-hover="section.helptext"
          ui-tippy-html="true"
          class="dispInlineFlex spacer5-left"
          style="height:14px;width:14px;opacity:0.8"
          v-html="icon('info', 14)"></span>
    <template v-if="section.similarityGroupId">
      <div class="grow"></div>
      <span class="secondary-label small spacer5-top">Similarity Group #{{section.similarityGroupId}}></span>
    </template>
  </h4>
  <div :id="`dialogue-section-content-${section.id}`" class="dialogue-section-content">
    <div class="dialogue-section-toolbar valign">
      <div v-if="section.metadata && Object.keys(section.metadata).length" class="valign meta-props">
        <div v-for="metaProp of section.metadata" class="prop">
          <span class="prop-label">{{ metaProp.label }}</span>
          <span v-if="metaProp.values && metaProp.values.length" class="prop-values">
            <template v-for="val of metaProp.values">
              <a v-if="val.link" class="prop-value" :href="val.link" :target="val.link.startsWith('#') ? null : '_blank'"
                 :ui-tippy-hover="val.tooltip">{{ val.value }}</a>
              <span v-else class="prop-value" :ui-tippy-hover="val.tooltip">{{ val.value }}</span>
            </template>
          </span>
        </div>
      </div>
      <template v-if="section.wikitext || (section.children && section.children.length)">
        <div class="grow"></div>
        <button v-if="section.wikitext"
                class="secondary small"
                :ui-action="`copy: #wikitext-${section.id}`"
                ui-tippy-hover="Click to copy to clipboard"
                ui-tippy-flash="{content:'Copied!', delay: [0,2000]}"
                style="margin:0 0 5px">Copy</button>
        <button v-if="section.children && section.children.length"
                class="secondary small"
                :ui-action="`copy-all: #wikitext-${section.id}, .wikitext-array-${section.id}, .wikitext-childOf-${section.id}; copy-sep: ${section.copyAllSep.replace(/\n/g, '\\n')}`"
                ui-tippy-hover="Click to copy to clipboard (including child sections)"
                ui-tippy-flash="{content:'Copied!', delay: [0,2000]}"
                style="margin:0 0 5px 5px; white-space: nowrap;">Copy All</button>
        <div class="valign">
          <button class="dialogue-indent-button secondary small plus" ui-tippy-hover="Increase indent"
                  :ui-action="`wikitext-indent: #wikitext-${section.id}, increase`"
                  style="margin:0 0 5px 5px"
                  v-html="icon('plus', 16)"></button>
          <button class="dialogue-indent-button secondary small minus" ui-tippy-hover="Decrease indent"
                  :ui-action="`wikitext-indent: #wikitext-${section.id}, decrease`"
                  style="margin:0 0 5px 0"
                  v-html="icon('minus', 16)"></button>
        </div>
      </template>
    </div>
    <div v-if="section.htmlMessage" class="dialogue-section-info-message" v-html="section.htmlMessage"></div>
    <Wikitext v-if="section.wikitext"
              :id="`wikitext-${section.id}`"
              :extra-class-names="['dialogue-section-wikitext', ... (parentIds || []).map(s => 'wikitext-childOf-' + s)]"
              :gutters="section.showGutter"
              :markers="section.wikitextMarkers"
              :line-ids="section.wikitextLineIds"
              :value="section.wikitext" />
    <template v-if="section.wikitextArray">
      <template v-for="(item, idx) in section.wikitextArray">
        <div class="valign">
          <h4 class="spacer5-top">{{ item.title || `Array Item ${idx + 1}` }}</h4>
          <div class="grow"></div>
          <button class="secondary small"
                  :ui-action="`copy: #wikitext-${section.id}-${idx}`"
                  ui-tippy-hover="Click to copy to clipboard"
                  ui-tippy-flash="{content:'Copied!', delay: [0,2000]}"
                  style="margin:0 0 5px">Copy</button>
          <button class="dialogue-indent-button secondary small plus"
                  ui-tippy-hover="Increase indent"
                  :ui-action="`wikitext-indent: #wikitext-${section.id}-${idx}, increase`"
                  style="margin:0 0 5px 5px"
                  v-html="icon('plus', 16)"></button>
          <button class="dialogue-indent-button secondary small minus"
                  ui-tippy-hover="Decrease indent"
                  :ui-action="`wikitext-indent: #wikitext-${section.id}-${idx}, decrease`"
                  style="margin:0 0 5px 0"
                  v-html="icon('minus', 16)"></button>
        </div>
        <Wikitext :id="`wikitext-${section.id}-${idx}`"
                  :value="item.wikitext"
                  :extra-class-names="[`wikitext-array-${section.id}`, 'dialogue-section-wikitext', ... (parentIds || []).map(s => 'wikitext-childOf-' + s)]"
                  :gutters="section.showGutter"
                  :markers="item.markers" />
      </template>
    </template>
  </div>
  <div class="dialogue-section-children">
    <template v-for="subSection of section.children">
      <DialogueSection :section="subSection" :parent-ids="(parentIds || []).concat(section.id)" :no-title="noTitle" />
    </template>
  </div>
  </div>
</template>

<script setup lang="ts">
import { DialogueSectionResult } from '../../../domain/genshin/dialogue/dialogue_util.ts';
import Wikitext from '../../utility/Wikitext.vue';
import { icon } from '../../../routing/viewUtilities.ts';
import { uuidv4 } from '../../../../shared/util/uuidv4.ts';

let customStyle: {[prop: string]: string} = {};

const props = defineProps<{
  section: DialogueSectionResult,
  parentIds?: string[],
  noTitle?: boolean,
  noTopLine?: boolean,
}>();

if (!props.section.id) {
  props.section.id = 'UUID-'+uuidv4();
}

if (props.noTopLine) {
  customStyle['border-top'] = '0';
}
</script>
