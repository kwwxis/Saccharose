<template>
  <div class="readable-text-module">
    <template v-for="{item, itemRef} of items">
      <div class="card readable-text-module-item" style="margin:0" :data-ref="itemRef">
        <div class="secondary-header valign" style="padding-bottom:10px">
          <div class="spacer5-left">{{ item.IsAlternate ? 'Alternate ' : '' }}Page &ndash; {{ item.Page }}</div>
          <div class="grow"></div>
          <div class="button-group">
            <button v-for="expanded of item.ReadableTextAllLanguages" role="tab"
                    :id="`tab-${itemRef}-${expanded.LangCode}`"
                    :class="[`tab`, `secondary`, `small`, {'active': expanded.LangCode === item.ReadableText.LangCode}]"
                    :data-lang="expanded.LangCode"
                    :ui-action="`tab: #tabpanel-${itemRef}-${expanded.LangCode}, tabgroup-${itemRef}`">{{ expanded.LangCode }}</button>
          </div>
        </div>

        <div role="tabpanel"
             :id="`tabpanel-${itemRef}-${expanded.LangCode}`"
             :aria-labelledby="`tab-${itemRef}-${expanded.LangCode}`" :data-lang="expanded.LangCode"
             class="readadble-text-module-item-langtext tabpanel"
             :class="{'active': expanded.LangCode === item.ReadableText.LangCode, 'hide': expanded.LangCode !== item.ReadableText.LangCode}"
             v-for="expanded of item.ReadableTextAllLanguages">
          <!-- TAB LIST START -->
          <div class="tab-list secondary valign" role="tablist">
            <button role="tab" :id="`tab-${itemRef}-${expanded.LangCode}-text`" class="tab active"
                    :ui-action="`tab: #tabpanel-${itemRef}-${expanded.LangCode}-text, tabgroup-${itemRef}-${expanded.LangCode}`">Text</button>
            <button role="tab" :id="`tab-${itemRef}-${expanded.LangCode}-dialogue`" class="tab"
                    :ui-action="`tab: #tabpanel-${itemRef}-${expanded.LangCode}-dialogue, tabgroup-${itemRef}-${expanded.LangCode}`">As Dialogue</button>
            <button role="tab" :id="`tab-${itemRef}-${expanded.LangCode}-template`" class="tab"
                    :ui-action="`tab: #tabpanel-${itemRef}-${expanded.LangCode}-template, tabgroup-${itemRef}-${expanded.LangCode}`">As Template</button>
            <button v-if="expanded.Images?.length"
                    role="tab" :id="`tab-${itemRef}-${expanded.LangCode}-images`" class="tab"
                    :ui-action="`tab: #tabpanel-${itemRef}-${expanded.LangCode}-images, tabgroup-${itemRef}-${expanded.LangCode}`">Images</button>
            <button role="tab" :id="`tab-${itemRef}-${expanded.LangCode}-changes`" class="tab"
                    :ui-action="`tab: #tabpanel-${itemRef}-${expanded.LangCode}-changes, tabgroup-${itemRef}-${expanded.LangCode}`">
              Content History ({{ item.ReadableChangesGroup?.[expanded.LangCode]?.ranges?.length || 0 }})
            </button>
          </div>
          <!-- TAB LIST END -->

          <!-- TAB PANEL: TEXT -->
          <div role="tabpanel" :aria-labelledby="`tab-${itemRef}-${expanded.LangCode}-text`" class="tabpanel content active" :id="`tabpanel-${itemRef}-${expanded.LangCode}-text`" data-for="text">
            <div class="valign spacer5-bottom">
              <ReadableTextsMetaProps :item="item" />
              <div class="grow"></div>
              <button class="secondary small"
                      :ui-action="`copy: #tabpanel-${itemRef}-${expanded.LangCode} .tabpanel[data-for='text'] .wikitext-container .wikitext.active`"
                      ui-tippy-hover="Click to copy to clipboard"
                      ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
            </div>
            <div class="wikitext-container" data-for="text">
              <Wikitext :lang="expanded.LangCode"
                        :markers="expanded.Markers?.AsNormal"
                        :value="expanded.AsNormal"
                        :extra-class-names="'active'"
                        :extra-style="'padding-right:46px'" />
            </div>
          </div>

          <!-- TAB PANEL: DIALOGUE -->
          <div role="tabpanel" :aria-labelledby="`tab-${itemRef}-${expanded.LangCode}-dialogue`" class="tabpanel content hide" :id="`tabpanel-${itemRef}-${expanded.LangCode}-dialogue`" data-for="dialogue">
            <div class="valign spacer5-bottom">
              <ReadableTextsMetaProps :item="item" />
              <div class="grow"></div>
              <button class="dialogue-indent-button secondary small plus" ui-tippy-hover="Increase indent"
                      :ui-action="`wikitext-indent: #tabpanel-${itemRef}-${expanded.LangCode} .tabpanel[data-for='dialogue'] .wikitext-container .wikitext.active, increase`"><Icon name="plus" :size="16" /></button>
              <button class="dialogue-indent-button secondary small minus" ui-tippy-hover="Decrease indent"
                      :ui-action="`wikitext-indent: #tabpanel-${itemRef}-${expanded.LangCode} .tabpanel[data-for='dialogue'] .wikitext-container .wikitext.active, decrease`"><Icon name="minus" :size="16" /></button>
              <button class="secondary small spacer3-left"
                      :ui-action="`copy: #tabpanel-${itemRef}-${expanded.LangCode} .tabpanel[data-for='dialogue'] .wikitext-container .wikitext.active`"
                      ui-tippy-hover="Click to copy to clipboard"
                      ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
            </div>
            <div class="wikitext-container" data-for="dialogue">
              <Wikitext :lang="expanded.LangCode"
                        :markers="expanded.Markers?.AsDialogue"
                        :value="expanded.AsDialogue"
                        :extra-class-names="'active'" />
            </div>
          </div>

          <!-- TAB PANEL: TEMPLATE -->
          <div role="tabpanel" :aria-labelledby="`tab-${itemRef}-${expanded.LangCode}-template`" class="tabpanel content hide" :id="`tabpanel-${itemRef}-${expanded.LangCode}-template`" data-for="template">
            <div class="valign spacer5-bottom">
              <ReadableTextsMetaProps :item="item" />
              <div class="grow"></div>
              <button class="secondary small"
                      :ui-action="`copy: #tabpanel-${itemRef}-${expanded.LangCode} .tabpanel[data-for='template'] .wikitext-container .wikitext.active`"
                      ui-tippy-hover="Click to copy to clipboard"
                      ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
            </div>
            <div class="wikitext-container" data-for="template">
              <Wikitext :lang="expanded.LangCode"
                        :markers="expanded.Markers?.AsTemplate"
                        :value="expanded.AsTemplate"
                        :extra-class-names="'active'" />
            </div>
          </div>

          <!-- TAB PANEL: IMAGES -->
          <div v-if="expanded.Images?.length" role="tabpanel" :aria-labelledby="`tab-${itemRef}-${expanded.LangCode}-images`" class="tabpanel content hide" :id="`tabpanel-${itemRef}-${expanded.LangCode}-images`" data-for="images">
            <fieldset v-for="image of expanded.Images" class="spacer5-top">
              <legend>{{ image }}</legend>
              <img :src="`/images/genshin/${image}.png`" />
            </fieldset>
          </div>

          <!-- TAB PANEL: TEMPLATE -->
          <div role="tabpanel" :aria-labelledby="`tab-${itemRef}-${expanded.LangCode}-changes`" class="tabpanel content hide" :id="`tabpanel-${itemRef}-${expanded.LangCode}-changes`" data-for="changes">
            <div v-if="item.ReadableChangesGroup?.[expanded.LangCode]?.ranges?.length">
              <div class="content">
                <p>First added in {{ item.ReadableChangesGroup[expanded.LangCode].ranges[0]?.startVersion.displayLabel }}.</p>
                <p v-if="item.ReadableChangesGroup[expanded.LangCode].ranges[0]?.startVersion.number === '1.4'">
                  The site's change history only begins at 1.4 so it may have actually been aded in an earlier version.
                </p>
              </div>
              <div class="content">
                <div class="card" v-for="range of item.ReadableChangesGroup[expanded.LangCode].ranges">
                  <h3 class="valign">
                    <span class="fontWeight500 spacer5-right opacity70p">Diff:</span>
                    <span>{{ range.prevContentVersion?.displayLabel || range.startVersion.displayLabel }} &ndash; {{ range.startVersion.displayLabel }}</span>
                    <span class="fontWeight400 spacer10-left opacity30p">/</span>
                    <span class="fontWeight500 spacer5-right spacer10-left opacity70p">Range:</span>
                    <span>{{ range.startVersion.displayLabel }} &ndash; {{ range.endVersion.displayLabel }}</span>
                  </h3>
                  <div>
                    <div class="standard-diff-ui"
                         :data-prev-content="range.prevContentText"
                         :data-curr-content="range.contentText"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="content" v-else>
              <p>Content change history not available for some reason - likely a bug.</p>
            </div>
          </div>
          <!-- END TAB PANELS -->
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
import JsonText from '../../../utility/JsonText.vue';
import { ReadableChangesGroup } from '../../../../../shared/types/changelog-types.ts';

const {readable} = defineProps<{
  readable?: Readable
}>();

const items = readable.Items.map((item, itemIdx) => {
  let itemRef = `readable-${readable.Id}-${itemIdx}`;
  return {
    item,
    itemIdx,
    itemRef,
  };
})
</script>
