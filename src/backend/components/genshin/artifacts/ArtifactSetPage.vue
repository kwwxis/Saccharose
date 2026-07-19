<template>
  <template v-if="set">
    <section class="card">
      <h2>
        <span class="valign spacer10-top">
          <img class="framed-icon x36" :src="`/images/genshin/${set.SetIcon}.png`" loading="lazy" decoding="async" />
          <span class="spacer15-left">{{ set.SetNameText }}</span>
        </span>
      </h2>
      <div class="content">
        <table class="article-table">
          <tr>
            <td style="width:150px" class="bold" colspan="2">ID</td>
            <td>{{ String(set.SetId).padStart(6, '0') }}</td>
          </tr>
          <tr>
            <td class="bold" colspan="2">Name</td>
            <td>{{ normGenshinText(set.SetNameText) }}</td>
          </tr>
          <template v-if="set.EquipAffixList?.length">
            <tr v-for="affix of set.EquipAffixList">
              <td></td>
              <td class="bold">Level {{ (affix.Level || 0) + 1 }}</td>
              <td><Wikitext :value="normGenshinText(affix.DescText)" :seamless="true" /></td>
            </tr>
          </template>
        </table>
        <div class="card bordered" v-if="set.InjectedOL" style="margin-top:-1px;margin-bottom:0">
          <h3 class="valign">
            <span class="expando spacer5-right expand-action collapsed-state" ui-action="expando: #set-name-ol-outer">
              <Icon name="chevron-down" :size="17" />
            </span>
            <span>Set Name OL</span>
            <span class="grow"></span>
            <button class="secondary small" ui-action="copy: #set-name-ol-textarea"
                    ui-tippy-hover="Click to copy to clipboard"
                    ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
          </h3>
          <div id="set-name-ol-outer" class="content collapsed hide">
            <Wikitext id="set-name-ol-textarea" :for-ol="true" :value="set.InjectedOL.result"  />
          </div>
        </div>
      </div>
    </section>
    <section id="set-slots" class="card">
      <div class="content">
        <fieldset v-for="slot of valuesOf(set.ArtifactSlots)" class="spacer10-bottom">
          <legend>{{ slot.EquipName }}</legend>
          <div class="content alignStart">
            <GenshinItem :item="slot.RANK_4" :no-link="true" class="spacer10-right" />
            <GenshinItem :item="slot.RANK_5" :no-link="true" class="spacer10-right" />
            <div class="spacer10-left">
              <h4 class="spacer8-left">Description</h4>
              <Wikitext :value="normGenshinText(slot.RANK_4.DescText)" :seamless="true" />
              <h4 class="spacer8-left spacer10-top">Story</h4>
              <a class="spacer8-left valign fontWeight500" :href="`/genshin/readables/item/${slot.RANK_4.StoryId}`" style="font-size:18px" target="_blank">
                <span class="spacer5-right" style="font-size:15px">Readable</span><Icon name="external-link" :size="16" />
              </a>
            </div>
          </div>
          <div class="content">
            <div class="card bordered" v-if="slot.InjectedOL" style="margin-bottom:0">
              <h3 class="valign">
                <span class="expando spacer5-right expand-action collapsed-state" :ui-action="`expando: #slot-${slot.EquipType}-ol-outer`">
                  <Icon name="chevron-down" :size="17" />
                </span>
                <span>Slot Name OL</span>
                <span class="grow"></span>
                <button class="secondary small" :ui-action="`copy: #slot-${slot.EquipType}-ol-textarea`"
                        ui-tippy-hover="Click to copy to clipboard"
                        ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
              </h3>
              <div :id="`slot-${slot.EquipType}-ol-outer`" class="content collapsed hide">
                <Wikitext :id="`slot-${slot.EquipType}-ol-textarea`" :for-ol="true" :value="slot.InjectedOL.result"  />
              </div>
            </div>
          </div>
        </fieldset>
      </div>
    </section>
  </template>
  <section v-else class="card">
    <h2>Artifact set not found.</h2>
  </section>
</template>

<script setup lang="ts">
import Icon from '../../utility/Icon.vue';
import { useTrace } from '../../../middleware/request/tracer.ts';

import { ReliquarySetExcelConfigData } from '../../../../shared/types/genshin/artifact-types.ts';
import { valuesOf } from '../../../../shared/util/arrayUtil.ts';
import GenshinItem from '../links/GenshinItem.vue';
import Wikitext from '../../utility/Wikitext.vue';
import ReadableTexts from '../readables/partials/ReadableTexts.vue';

const { normGenshinText } = useTrace();

defineProps<{
  title?: string,
  set?: ReliquarySetExcelConfigData,
}>();
</script>

