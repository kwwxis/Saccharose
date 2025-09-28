<template>
  <template v-if="furn">
    <section class="card">
      <h2>
        <span class="dispBlock" style="margin-top:-5px"><a role="button" class="secondary fontWeight600" style="font-size:14px;padding:3px 8px" href="/genshin/furnishings">Back to furnishings list</a></span>
        <span class="valign spacer10-top">
          <img class="framed-icon x50" :src="`/images/genshin/${furn.IconUrl || furn.Icon || furn.ItemIcon}.png`" loading="lazy" decoding="async" />
          <span class="spacer15-left">{{ normGenshinText(furn.NameText) }}</span>
          <span class="grow"></span>
          <a :href="furn.DownloadIconUrl" role="button" class="primary primary--2 small valign">
            <Icon name="download" :size="17" :props="{class: 'spacer5-right'}" />
            Download icon for wiki
          </a>
        </span>
      </h2>
      <div class="content">
        <table class="article-table">
          <tr>
            <td style="width:150px" class="bold">ID</td>
            <td>{{ String(furn.Id).padStart(6, '0') }}</td>
          </tr>
          <tr>
            <td class="bold">Name</td>
            <td>{{ normGenshinText(furn.NameText) }}</td>
          </tr>
          <tr>
            <td class="bold">Description</td>
            <td>
              <Wikitext :value="normGenshinText(furn.DescText)" :seamless="true" />
            </td>
          </tr>
          <tr>
            <td class="bold">Interior/Exterior?</td>
            <td><span>{{ (furn.IsInterior && furn.IsExterior) ? 'Interior & Exterior' : (furn.IsInterior ? 'Interior' : 'Exterior') }}</span></td>
          </tr>
          <tr>
            <td class="bold">Category</td>
            <td>{{ furn.CategoryNameText }}</td>
          </tr>
          <tr>
            <td class="bold">Subcategory</td>
            <td>{{ furn.TypeNameText }}</td>
          </tr>
          <tr>
            <td class="bold">Adeptal Energy</td>
            <td>{{ furn.Comfort }}</td>
          </tr>
          <tr>
            <td class="bold">Load</td>
            <td>{{ furn.Cost }}</td>
          </tr>
          <tr>
            <td class="bold">Reduced Load</td>
            <td>{{ furn.DiscountCost }}</td>
          </tr>
          <tr>
            <td class="bold">Related Item<br>or Blueprint</td>
            <td>
              <template v-if="furn.RelatedMaterial">
                <GenshinItem :item="furn.RelatedMaterial" />
              </template>
              <span v-else>n/a</span>
            </td>
          </tr>
          <template v-if="furn.MappedSourceTextList">
            <tr v-for="obtainText of furn.MappedSourceTextList">
              <td class="bold">How to Obtain</td>
              <td>{{ obtainText }}</td>
            </tr>
          </template>
          <tr v-if="furn.HomeWorldAnimal">
            <td class="bold">Related Monster</td>
            <td>
              <GenshinLbLink :monster="furn.HomeWorldAnimal.Monster" />
            </td>
          </tr>
        </table>
      </div>
    </section>
    <section v-if="furn.MakeData" class="card">
      <h2>Creation</h2>
      <div class="content">
        <p>First time creation grants {{ furn.MakeData.Exp }} trust.</p>
      </div>
      <div class="content alignStart">
        <template v-for="inputItem of furn.MakeData.MaterialItems">
          <GenshinItem :item="inputItem.Material" :item-count="inputItem.Count" />
        </template>
      </div>
    </section>
    <section class="card">
      <h2 class="valign">
        <span>Wikitext</span>
        <span class="grow"></span>
        <button class="secondary small" ui-action="copy: #wikitext"
                ui-tippy-hover="Click to copy to clipboard"
                ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
      </h2>
      <div class="content">
        <p class="info-notice spacer5-bottom">Review the wikitext carefully to make sure it's correct before saving anywhere to the actual wiki.</p>
        <p class="info-notice spacer10-bottom">Remember to add the version to the <WikiTemplateLink name="Change History" /> template.</p>
        <Wikitext id="wikitext" :value="wikitext" />
      </div>
    </section>
    <section v-if="ol" class="card">
      <h2 class="valign">
        <span>OL Standalone</span>
        <span class="grow"></span>
        <button class="secondary small" ui-action="copy: #ol-textarea"
                ui-tippy-hover="Click to copy to clipboard"
                ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
      </h2>
      <div class="content">
        <Wikitext id="ol-textarea" :value="ol.result" :for-ol="true" />
      </div>
    </section>
    <section class="card">
      <h2 class="valign">
        <span>Raw JSON</span>
        <span class="grow"></span>
        <button class="secondary" ui-action="toggle: #json-outer">
          <span class="inactive-only">Show</span>
          <span class="active-only">Hide</span>
        </button>
      </h2>
      <div id="json-outer" class="content hide">
        <JsonText :value="safeStringify(furn, null, 2)" />
      </div>
    </section>
  </template>
  <section v-else class="card">
    <h2>Furnishing not found.</h2>
    <div class="content">
      <a role="button" class="secondary fontWeight600" style="font-size:14px;padding:3px 8px" href="/genshin/furnishings">
        <Icon name="chevron-left" />
        <span>Back to furnishings list</span>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { HomeWorldFurnitureExcelConfigData } from '../../../../shared/types/genshin/homeworld-types.ts';
import GenshinItem from '../links/GenshinItem.vue';
import WikiTemplateLink from '../../utility/WikiTemplateLink.vue';
import Wikitext from '../../utility/Wikitext.vue';
import JsonText from '../../utility/JsonText.vue';
import { safeStringify } from '../../../../shared/util/genericUtil.ts';
import Icon from '../../utility/Icon.vue';
import { getTrace } from '../../../middleware/request/tracer.ts';
import GenshinLbLink from '../links/GenshinLbLink.vue';
import { OLResult } from '../../../../shared/types/ol-types.ts';

const { normGenshinText } = getTrace();

defineProps<{
  furn: HomeWorldFurnitureExcelConfigData,
  wikitext: string,
  ol: OLResult,
}>();
</script>
