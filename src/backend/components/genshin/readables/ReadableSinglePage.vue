<template>
  <template v-if="readable">
    <section class="card">
      <h2>{{ title }}</h2>
      <table v-if="readable.Material" class="article-table" style="border:0">
        <tbody>
          <tr>
            <td class="bold">Item Icon</td>
            <td class="w70p"><img class="icon x36" :src="`/images/genshin/${readable?.Material?.Icon}.png`" loading="lazy" decoding="async" /></td>
          </tr>
          <tr>
            <td class="bold">Item Quality</td>
            <td class="w70p">
              <div class="valign">
                <code class="spacer10-right">{{ readable?.Material?.RankLevel }}</code>
                <GenshinStars :quality="readable?.Material?.RankLevel" />
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold">Item Name</td>
            <td class="w70p">{{ readable?.Material?.NameText }}</td>
          </tr>
          <tr>
            <td class="bold">Document Title</td>
            <td class="w70p">{{ readable?.Document?.TitleText }}</td>
          </tr>
          <tr>
            <td class="bold">Type</td>
            <td class="w70p">{{ readable?.Material?.TypeDescText }}</td>
          </tr>
          <tr>
            <td class="bold">Desc.</td>
            <td class="w70p">
              <Wikitext :value="normGenshinText(readable?.Material?.DescText)" :seamless="true" />
            </td>
          </tr>
          <tr>
            <td class="bold">Item</td>
            <td class="w70p">
              <GenshinItem :item="readable?.Material" :no-name="true" />
            </td>
          </tr>
        </tbody>
      </table>
      <table v-if="readable.Artifact" class="article-table">
        <tbody>
          <tr>
            <td class="bold">Image</td>
            <td class="w70p"><img class="icon x36" :src="`/images/genshin/${readable?.Artifact?.Icon}.png`" loading="lazy" decoding="async" /></td>
          </tr>
          <tr>
            <td class="bold">Quality</td>
            <td class="w70p">
              <div class="valign">
                <code class="spacer10-right">{{ readable?.Artifact?.RankLevel }}</code>
                <GenshinStars :quality="readable?.Artifact?.RankLevel" />
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold">Artifact Name</td>
            <td class="w70p">{{ readable?.Artifact?.NameText }}</td>
          </tr>
          <tr>
            <td class="bold">Document Title</td>
            <td class="w70p">{{ readable?.Document?.TitleText }}</td>
          </tr>
          <tr>
            <td class="bold">Type</td>
            <td class="w70p">{{ readable?.Artifact?.EquipName }}</td>
          </tr>
          <tr>
            <td class="bold">Desc.</td>
            <td class="w70p">
              <Wikitext :value="normGenshinText(readable?.Artifact?.DescText)" :seamless="true" />
            </td>
          </tr>
        </tbody>
      </table>
      <table v-if="readable.Weapon" class="article-table">
        <tbody>
          <tr>
            <td class="bold">Image</td>
            <td class="w70p"><img class="icon x36" :src="`/images/genshin/${readable?.Weapon?.Icon}.png`" loading="lazy" decoding="async" /></td>
          </tr>
          <tr>
            <td class="bold">Awaken Image</td>
            <td class="w70p"><img class="icon x36" :src="`/images/genshin/${readable?.Weapon?.AwakenIcon}.png`" loading="lazy" decoding="async" /></td>
          </tr>
          <tr>
            <td class="bold">Quality</td>
            <td class="w70p">
              <div class="valign">
                <code class="spacer10-right">{{ readable?.Weapon?.RankLevel }}</code>
                <GenshinStars :quality="readable?.Weapon?.RankLevel" />
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold">Weapon Name</td>
            <td class="w70p">{{ normGenshinText(readable?.Weapon?.NameText) }}</td>
          </tr>
          <tr>
            <td class="bold">Document Title</td>
            <td class="w70p">{{ readable?.Document?.TitleText }}</td>
          </tr>
          <tr>
            <td class="bold">Type</td>
            <td class="w70p code">{{ readable?.Weapon?.WeaponType }}</td>
          </tr>
          <tr>
            <td class="bold">Desc.</td>
            <td class="w70p">
              <Wikitext :value="normGenshinText(readable?.Weapon?.DescText)" :seamless="true" />
            </td>
          </tr>
          <tr>
            <td class="bold">Weapon</td>
            <td class="w70p">
              <GenshinItem :item="readable?.Weapon" :no-name="true" />
            </td>
          </tr>
        </tbody>
      </table>
    </section>
    <div class="spacer20-bottom">
      <ReadableTexts :readable="readable" />
    </div>
    <section v-if="ol" class="card">
      <h2 class="valign">
        <span>OL</span>
        <span class="grow"></span>
        <button class="secondary small" ui-action="copy: #ol-textarea"
                ui-tippy-hover="Click to copy to clipboard"
                ui-tippy-flash="{content:'Copied!', delay: [0,2000]}"
                style="margin:5px 0">Copy</button>
      </h2>
      <div class="content">
        <Wikitext id="ol-textarea" :for-ol="true" :value="ol.result" />
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
        <JsonText :value="JSON.stringify(readable, null, 2)" />
      </div>
    </section>
  </template>
  <section v-else class="card">
    <h2>Readable not found</h2>
  </section>
</template>

<script setup lang="ts">
import { Readable } from '../../../../shared/types/genshin/readable-types.ts';
import ReadableTexts from './partials/ReadableTexts.vue';
import Wikitext from '../../utility/Wikitext.vue';
import { getTrace } from '../../../middleware/request/tracer.ts';
import GenshinStars from '../links/GenshinStars.vue';
import GenshinItem from '../links/GenshinItem.vue';
import JsonText from '../../utility/JsonText.vue';
import { OLResult } from '../../../../shared/types/ol-types.ts';

const { normGenshinText } = getTrace();

defineProps<{
  title?: string,
  readable?: Readable,
  ol?: OLResult,
}>();
</script>
