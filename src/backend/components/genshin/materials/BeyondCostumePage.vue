<template>
  <template v-if="costume">
    <section class="card">
      <h2>
        <span class="dispBlock" style="margin-top:-5px"><a role="button" class="secondary fontWeight600" style="font-size:14px;padding:3px 8px" href="/genshin/items">Back to items search</a></span>
        <span class="valign spacer10-top">
          <img class="framed-icon x36" :src="costume.IconUrl" loading="lazy" decoding="async" />
          <span class="spacer15-left">{{ costume.NameText }}</span>
        </span>
      </h2>
      <div class="content">
        <table class="article-table">
          <tr>
            <td style="width:150px" class="bold">ID</td>
            <td>{{ String(costume.CostumeId).padStart(6, '0') }}</td>
            <td rowspan="2" style="width:100px">
              <div class="fr">
                <img class="framed-icon x96" :src="costume.IconUrl" loading="lazy" decoding="async" />
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold">Name</td>
            <td>{{ normGenshinText(costume.NameText) }}</td>
          </tr>
          <tr>
            <td class="bold">Description</td>
            <td colspan="2">
              <div class="posRel spacer5-top">
                <div style="padding-right:50px;">
                  <Wikitext id="item-desc" :value="normGenshinText(costume.DescriptionText)" :seamless="true" />
                </div>
                <button class="secondary small posAbs" ui-action="copy: #item-desc"
                        style="right: 0; top: 0;"
                        ui-tippy-hover="Click to copy to clipboard"
                        ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold">Body Type</td>
            <td colspan="2">{{ costume.BodyType.join(', ') }}</td>
          </tr>
          <tr>
            <td class="bold">Color Scheme</td>
            <td colspan="2">{{ costume.ColorScheme.join(', ') }}</td>
          </tr>
        </table>
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
        <JsonText :value="JSON.stringify(costume, null, 2)" />
      </div>
    </section>
  </template>
  <section v-else class="card">
    <h2>Costume not found.</h2>
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
import {
  BeyondCostumeExcelConfigData,
  BeyondCostumeSuitExcelConfigData,
  BydMaterialExcelConfigData,
} from '../../../../shared/types/genshin/beyond-types.ts';

const { normGenshinText } = useTrace();

defineProps<{
  title?: string,
  costume?: BeyondCostumeExcelConfigData,
  ol?: OLResult
}>();
</script>

