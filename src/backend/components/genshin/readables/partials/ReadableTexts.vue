<template>
  <div class="readable-text-module-container">
    <template v-for="{item, itemRef, selRef} of items">
      <div class="card readable-text-module readable-text-module--not-loaded" style="margin:0" :data-ref="itemRef">
        <input type="hidden" name="readable-text-module-data" :value="JSON.stringify(item.Expanded)" />
        <h3>{{ item.IsAlternate ? 'Alternate ' : '' }}Page &ndash; {{ item.Page }}</h3>
        <div class="tab-list secondary valign" role="tablist">
          <button role="tab" :id="`tab-${itemRef}-text`" class="tab main-tab active"
                  :ui-action="`tab: #tabpanel-${itemRef}-text, tabgroup-${itemRef}`">Text</button>
          <button role="tab" :id="`tab-${itemRef}-dialogue`" class="tab main-tab"
                  :ui-action="`tab: #tabpanel-${itemRef}-dialogue, tabgroup-${itemRef}`">As Dialogue</button>
          <button role="tab" :id="`tab-${itemRef}-template`" class="tab main-tab"
                  :ui-action="`tab: #tabpanel-${itemRef}-template, tabgroup-${itemRef}`">As Template</button>
          <button v-if="item.ReadableImages?.length"
                  role="tab" :id="`tab-${itemRef}-images`" class="tab main-tab"
                  :ui-action="`tab: #tabpanel-${itemRef}-images, tabgroup-${itemRef}`">Images</button>
          <div class="grow"></div>
          <template v-for="expanded of item.Expanded">
            <button role="tab" :id="`tab-${itemRef}-lang-${expanded.LangCode}`" :data-lang="expanded.LangCode"
                    :class="`tab${expanded.LangCode === item.ReadableText.LangCode ? ' active' : ''} small lang-switch-tab`">{{ expanded.LangCode }}</button>
          </template>
        </div>
        <div role="tabpanel" :aria-labelledby="`tab-${itemRef}-text`" class="tabpanel content active" :id="`tabpanel-${itemRef}-text`" data-for="text">
          <div class="valign spacer5-bottom">
            <ReadableTextsMetaProps :item="item" />
            <div class="grow"></div>
            <button class="secondary small"
                    :ui-action="`copy: ${selRef} .tabpanel[data-for='text'] .wikitext-container .wikitext.active`"
                    ui-tippy-hover="Click to copy to clipboard"
                    ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
          </div>
          <div class="wikitext-container" data-for="text">
            <Wikitext :lang="item.ReadableText.LangCode"
                      :markers="item.ReadableText.Markers?.AsNormal"
                      :value="item.ReadableText.AsNormal"
                      :extra-class-names="'active'"
                      :extra-style="'padding-right:46px'" />
          </div>
        </div>

        <div role="tabpanel" :aria-labelledby="`tab-${itemRef}-dialogue`" class="tabpanel content hide" :id="`tabpanel-${itemRef}-dialogue`" data-for="dialogue">
          <div class="valign spacer5-bottom">
            <ReadableTextsMetaProps :item="item" />
            <div class="grow"></div>
            <button class="dialogue-indent-button secondary small plus" ui-tippy-hover="Increase indent"
                    :ui-action="`wikitext-indent: ${selRef} .tabpanel[data-for='dialogue'] .wikitext-container .wikitext.active, increase`"><Icon name="plus" :size="16" /></button>
            <button class="dialogue-indent-button secondary small minus" ui-tippy-hover="Decrease indent"
                    :ui-action="`wikitext-indent: ${selRef} .tabpanel[data-for='dialogue'] .wikitext-container .wikitext.active, decrease`"><Icon name="minus" :size="16" /></button>
            <button class="secondary small spacer3-left"
                    :ui-action="`copy: ${selRef} .tabpanel[data-for='dialogue'] .wikitext-container .wikitext.active`"
                    ui-tippy-hover="Click to copy to clipboard"
                    ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
          </div>
          <div class="wikitext-container" data-for="dialogue">
            <Wikitext :lang="item.ReadableText.LangCode"
                      :markers="item.ReadableText.Markers?.AsDialogue"
                      :value="item.ReadableText.AsDialogue"
                      :extra-class-names="'active'" />
          </div>
        </div>

        <div role="tabpanel" :aria-labelledby="`tab-${itemRef}-template`" class="tabpanel content hide" :id="`tabpanel-${itemRef}-template`" data-for="template">
          <div class="valign spacer5-bottom">
            <ReadableTextsMetaProps :item="item" />
            <div class="grow"></div>
            <button class="secondary small"
                    :ui-action="`copy: ${selRef} .tabpanel[data-for='template'] .wikitext-container .wikitext.active`"
                    ui-tippy-hover="Click to copy to clipboard"
                    ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
          </div>
          <div class="wikitext-container" data-for="template">
            <Wikitext :lang="item.ReadableText.LangCode"
                      :markers="item.ReadableText.Markers?.AsTemplate"
                      :value="item.ReadableText.AsTemplate"
                      :extra-class-names="'active'" />
          </div>
        </div>

        <div v-if="item.ReadableImages?.length" role="tabpanel" :aria-labelledby="`tab-${itemRef}-images`" class="tabpanel content hide" :id="`tabpanel-${itemRef}-images`" data-for="images">
          <fieldset v-for="image of item.ReadableImages" class="spacer5-top">
            <legend>{{ image }}</legend>
            <img :src="`/images/genshin/${image}.png`" />
          </fieldset>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Readable } from '../../../../../shared/types/genshin/readable-types.ts';
import ReadableTextsMetaProps from './ReadableTextsMetaProps.vue';
import Icon from '../../../utility/Icon.vue';
import Wikitext from '../../../utility/Wikitext.vue';

const {readable} = defineProps<{
  readable: Readable
}>();

const items = readable.Items.map((item, itemIdx) => {
  let itemRef = `readable-${readable.Id}-${itemIdx}`;
  let selRef = `.readable-text-module[data-ref="${itemRef}"]`;
  return {
    item,
    itemIdx,
    itemRef,
    selRef,
  };
})
</script>
