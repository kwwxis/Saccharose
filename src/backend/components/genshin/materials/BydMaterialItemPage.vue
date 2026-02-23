<template>
  <template v-if="material">
    <section class="card">
      <h2>
        <span class="dispBlock" style="margin-top:-5px"><a role="button" class="secondary fontWeight600" style="font-size:14px;padding:3px 8px" href="/genshin/items">Back to items search</a></span>
        <span class="valign spacer10-top">
          <img class="framed-icon x36" :src="material.IconUrl" loading="lazy" decoding="async" />
          <span class="spacer15-left">{{ material.NameText }}</span>
        </span>
      </h2>
      <div class="content">
        <table class="article-table">
          <tr>
            <td style="width:150px" class="bold">ID</td>
            <td>{{ String(material.Id).padStart(6, '0') }}</td>
            <td rowspan="2" style="width:100px">
              <div class="fr">
                <GenshinItem :item="material" :no-name="true" :no-count="true" :no-link="true" />
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold">Name</td>
            <td>{{ normGenshinText(material.NameText) }}</td>
          </tr>
          <tr>
            <td class="bold">Description</td>
            <td colspan="2">
              <div class="posRel spacer5-top">
                <div style="padding-right:50px;">
                  <Wikitext id="item-desc" :value="normGenshinText(material.DescText)" :seamless="true" />
                </div>
                <button class="secondary small posAbs" ui-action="copy: #item-desc"
                        style="right: 0; top: 0;"
                        ui-tippy-hover="Click to copy to clipboard"
                        ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold">Quality</td>
            <td colspan="2">
              <div class="valign">
                <code style="font-size:14px" class="spacer10-right">{{ material.RankLevel || 0 }}</code>
                <GenshinStars :quality="material.RankLevel || 0" />
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold">Item Type Enum</td>
            <td colspan="2"><code style="font-size:14px">{{ material.BydMaterialType }}</code></td>
          </tr>
          <tr>
            <td class="bold">Global Item Limit</td>
            <td colspan="2">{{ material.GlobalItemLimit }}</td>
          </tr>
        </table>
      </div>
    </section>
    <section class="card" id="item-use" v-if="material.ItemUse.length">
      <h2>Item Use</h2>
      <div class="content">
        <p class="spacer10-bottom">This item has {{ material.ItemUse.length }} operations that occur upon use.</p>
        <h4>Meta Info</h4>
        <table class="article-table spacer10-bottom" style="font-size:15px">
          <tr>
            <td class="bold" style="width:200px">UseOnGain</td>
            <td style="width:80px">{{ material.UseOnGain }}</td>
            <td><small>(If the item should automatically be used when the player obtains the item.)</small></td>
          </tr>
          <tr>
            <td class="bold">MaxUseCount</td>
            <td>{{ material.MaxUseCount }}</td>
            <td><small>(Maximum amount that can be used in a single use-instance.)</small></td>
          </tr>
        </table>
        <template v-for="(itemUse, index) of material.ItemUse">
          <h4>Operation {{ index + 1 }}</h4>
          <div class="card">
            <table class="article-table" style="border:0;font-size:15px">
              <tr>
                <td class="bold" style="width:200px">
                  <div style="line-height:1em;padding:4px 0">
                    Use Op
                  </div>
                </td>
                <td>{{ itemUse.UseOp }}</td>
              </tr>
              <tr>
                <td class="bold">
                  <div style="line-height:1em;padding:4px 0">
                    Use Params
                  </div>
                </td>
                <td><JsonText :value="reformatPrimitiveArrays(JSON.stringify(itemUse.UseParam, null, 2))" :seamless="true" /></td>
              </tr>
              <tr>
                <td class="bold">
                  <div style="line-height:1em;padding:4px 0">
                    <span>More Context</span><br />
                    <small>(If implemented by site)</small>
                  </div>
                </td>
                <td>
                  <div v-if="itemUse.UseOp === 'BYD_MATERIAL_USE_GAIN_COSTUME' && material.LoadedItemUse.Costume">
                    <p class="spacer10-bottom">Unlocks costume:</p>
                    <a :href="`/genshin/byd/costumes/${material.LoadedItemUse.Costume.CostumeId}`">{{ material.LoadedItemUse.Costume.NameText }}</a>
                  </div>
                  <div v-if="itemUse.UseOp === 'BYD_MATERIAL_USE_GAIN_COSTUME_SUIT' && material.LoadedItemUse.CostumeSuit">
                    <p class="spacer10-bottom">Unlocks costume suit:</p>
                    <a :href="`/genshin/byd/costume-suits/${material.LoadedItemUse.CostumeSuit.SuitId}`">{{ material.LoadedItemUse.CostumeSuit.NameText }}</a>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </template>
      </div>
    </section>
    <section v-if="ol" id="ol" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right" ui-action="expando: #ol-content"><Icon name="chevron-down" :size="17" /></span>
        <span>OL</span>
        <span class="grow"></span>
        <button class="secondary small" ui-action="copy: #ol-textarea"
                ui-tippy-hover="Click to copy to clipboard"
                ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
      </h2>
      <div id="ol-content" class="content">
        <textarea id="ol-textarea" readonly class="ol-result-textarea w100p wikitext autosize" spellcheck="false" translate="no">{{ ol.result }}</textarea>
      </div>
    </section>
    <section id="raw-json" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right expand-action collapsed-state" ui-action="expando: #json-outer"><Icon name="chevron-down" :size="17" /></span>
        Raw JSON
      </h2>
      <div id="json-outer" class="content collapsed hide">
        <JsonText :value="JSON.stringify(material, null, 2)" />
      </div>
    </section>
  </template>
  <section v-else class="card">
    <h2>Item not found.</h2>
  </section>
</template>

<script setup lang="ts">
import Icon from '../../utility/Icon.vue';
import GenshinItem from '../links/GenshinItem.vue';
import { useTrace } from '../../../middleware/request/tracer.ts';
import GenshinStars from '../links/GenshinStars.vue';
import Wikitext from '../../utility/Wikitext.vue';
import ReadableTexts from '../readables/partials/ReadableTexts.vue';
import { OLResult } from '../../../../shared/types/ol-types.ts';
import JsonText from '../../utility/JsonText.vue';

import { reformatPrimitiveArrays } from '../../../../shared/util/stringUtil.ts';
import TcgCard from '../links/TcgCard.vue';
import { BydMaterialExcelConfigData } from '../../../../shared/types/genshin/beyond-types.ts';

const { normGenshinText } = useTrace();

defineProps<{
  title?: string,
  material?: BydMaterialExcelConfigData,
  ol?: OLResult
}>();
</script>

