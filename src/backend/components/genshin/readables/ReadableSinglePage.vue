<template>
  <template v-if="readable">
    <section class="card">
      <h2>{{ title }}</h2>
      <table class="article-table" style="border:0">
        <thead>
          <tr>
            <th colspan="2">
              <div class="valign halign">
                <span>DocumentExcelConfigData</span>
                <span class="secondary-label small spacer5-left">Item</span>
                <span class="secondary-label small spacer5-left">Main Data</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="bold">Document ID</td>
            <td class="w70p">{{ readable.Id }}</td>
          </tr>
          <tr>
            <td class="bold">Document Title</td>
            <td class="w70p">{{ normGenshinText(readable.Document.TitleText) }}</td>
          </tr>
          <tr v-if="readable.BookSuit">
            <td class="bold">Document Collection</td>
            <td class="w70p">This readable is part of collection
              <a :href="`/readables/book-collection/${readable.BookSuit.Id}`">
                {{ normGenshinText(readable.BookSuit.SuitNameText) }}
              </a>
            </td>
          </tr>
          <tr v-if="readable.AddedAtVersion">
            <td class="bold">Added In Version</td>
            <td class="w70p">{{ readable.AddedAtVersion.displayLabel }}</td>
          </tr>
          <tr>
            <td class="bold">Variant(s)</td>
            <td class="w70p">
              <span class="secondary-label small spacer5-right" v-for="type of readable.VariantTypes">
                <span v-if="type == 'Material'">Item</span>
                <span v-else-if="type == 'Artifact'">Artifact</span>
                <span v-else-if="type == 'Weapon'">Weapon</span>
                <span v-else-if="type == 'Flycloak'">Wind Glider</span>
                <span v-else-if="type == 'Costume'">Costume</span>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <table v-if="readable.Material" class="article-table" style="border:0">
        <thead>
          <tr>
            <th colspan="2">
              <div class="valign halign">
                <span>MaterialExcelConfigData</span>
                <span class="secondary-label small spacer5-left">Item</span>
                <span class="secondary-label small spacer5-left">Variant Data</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="bold">Item ID</td>
            <td class="w70p">{{ String(readable.Material.Id).padStart(6, '0') }}</td>
          </tr>
          <tr>
            <td class="bold">Item Icon</td>
            <td class="w70p"><img class="icon x36" :src="`/images/genshin/${readable.Material.Icon}.png`" loading="lazy" decoding="async" /></td>
          </tr>
          <tr>
            <td class="bold">Item Quality</td>
            <td class="w70p">
              <div class="valign">
                <code class="spacer10-right">{{ readable.Material.RankLevel }}</code>
                <GenshinStars :quality="readable.Material.RankLevel" />
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold">Item Name</td>
            <td class="w70p">{{ normGenshinText(readable.Material.NameText) }}</td>
          </tr>
          <tr>
            <td class="bold">Item Type Desc.</td>
            <td class="w70p">{{ normGenshinText(readable.Material.WikiTypeDescText) }}</td>
          </tr>
          <tr>
            <td class="bold">Item Desc.</td>
            <td class="w70p">
              <Wikitext :value="normGenshinText(readable.Material.DescText)" :seamless="true" />
            </td>
          </tr>
          <tr>
            <td class="bold">Item Link</td>
            <td class="w70p">
              <GenshinItem :item="readable.Material" :no-name="true" />
            </td>
          </tr>
        </tbody>
      </table>
      <table v-if="readable.Artifact" class="article-table">
        <thead>
          <tr>
            <th colspan="2">
              <div class="valign halign">
                <span>ReliquaryExcelConfigData</span>
                <span class="secondary-label small spacer5-left">Artifact</span>
                <span class="secondary-label small spacer5-left">Variant Data</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="bold">Artifact ID</td>
            <td class="w70p">{{ readable.Artifact.Id }}</td>
          </tr>
          <tr>
            <td class="bold">Artifact Icon</td>
            <td class="w70p"><img class="icon x36" :src="`/images/genshin/${readable.Artifact.Icon}.png`" loading="lazy" decoding="async" /></td>
          </tr>
          <tr>
            <td class="bold">Artifact Quality</td>
            <td class="w70p">
              <div class="valign">
                <code class="spacer10-right">{{ readable.Artifact.RankLevel }}</code>
                <GenshinStars :quality="readable.Artifact.RankLevel" />
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold">Artifact Name</td>
            <td class="w70p">{{ normGenshinText(readable.Artifact.NameText) }}</td>
          </tr>
          <tr>
            <td class="bold">Artifact Set</td>
            <td class="w70p">
              <a class="valign" :href="`/genshin/artifact-sets/${readable.Artifact.SetId}`" target="_blank">
                <span class="spacer3-right">Link</span>
                <Icon name="external-link" :size="15" />
              </a>
            </td>
          </tr>
          <tr>
            <td class="bold">Artifact Type</td>
            <td class="w70p">{{ readable.Artifact.EquipName }}</td>
          </tr>
          <tr>
            <td class="bold">Artifact Desc.</td>
            <td class="w70p">
              <Wikitext :value="normGenshinText(readable.Artifact.DescText)" :seamless="true" />
            </td>
          </tr>
        </tbody>
      </table>
      <table v-if="readable.Costume" class="article-table">
        <thead>
          <tr>
            <th colspan="2">
              <div class="valign halign">
                <span>AvatarCostumeExcelConfigData</span>
                <span class="secondary-label small spacer5-left">Character Outfit</span>
                <span class="secondary-label small spacer5-left">Variant Data</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
        <tr>
          <td class="bold">Costume ID</td>
          <td class="w70p">{{ readable.Costume.SkinId }}</td>
        </tr>
        <tr>
          <td class="bold">Costume Name</td>
          <td class="w70p">{{ normGenshinText(readable.Costume.NameText) }}</td>
        </tr>
        <tr>
          <td class="bold">Costume Desc.</td>
          <td class="w70p">
            <Wikitext :value="normGenshinText(readable.Costume.DescText)" :seamless="true" />
          </td>
        </tr>
        <tr>
          <td class="bold">Costume Quality</td>
          <td class="w70p">
            <div class="valign">
              <code class="spacer10-right">{{ readable.Costume.Quality }}</code>
              <GenshinStars :quality="readable.Costume.Quality" />
            </div>
          </td>
        </tr>
        <tr>
          <td class="bold">Costume Front Icon</td>
          <td class="w70p"><img class="icon x36" :src="`/images/genshin/${readable.Costume.FrontIconName}.png`" loading="lazy" decoding="async" /></td>
        </tr>
        <tr>
          <td class="bold">Costume Side Icon</td>
          <td class="w70p"><img class="icon x36" :src="`/images/genshin/${readable.Costume.SideIconName}.png`" loading="lazy" decoding="async" /></td>
        </tr>
        </tbody>
      </table>
      <table v-if="readable.Flycloak" class="article-table">
        <thead>
          <tr>
            <th colspan="2">
              <div class="valign halign">
                <span>AvatarFlycloakExcelConfigData</span>
                <span class="secondary-label small spacer5-left">Wind Glider</span>
                <span class="secondary-label small spacer5-left">Variant Data</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
        <tr>
          <td class="bold">Flycloak ID</td>
          <td class="w70p">{{ readable.Flycloak.FlycloakId }}</td>
        </tr>
        <tr>
          <td class="bold">Flycloak Name</td>
          <td class="w70p">{{ normGenshinText(readable.Flycloak.NameText) }}</td>
        </tr>
        <tr>
          <td class="bold">Flycloak Desc.</td>
          <td class="w70p">
            <Wikitext :value="normGenshinText(readable.Flycloak.DescText)" :seamless="true" />
          </td>
        </tr>
        <tr>
          <td class="bold">Flycloak Icon</td>
          <td class="w70p"><img class="icon x36" :src="`/images/genshin/${readable.Flycloak.Icon}.png`" loading="lazy" decoding="async" /></td>
        </tr>
        </tbody>
      </table>
      <table v-if="readable.Weapon" class="article-table">
        <thead>
          <tr>
            <th colspan="2">
              <div class="valign halign">
                <span>WeaponExcelConfigData</span>
                <span class="secondary-label small spacer5-left">Weapon</span>
                <span class="secondary-label small spacer5-left">Variant Data</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="bold">Weapon ID</td>
            <td class="w70p">{{ readable.Weapon.Id }}</td>
          </tr>
          <tr>
            <td class="bold">Weapon Icon</td>
            <td class="w70p"><img class="icon x36" :src="`/images/genshin/${readable.Weapon.Icon}.png`" loading="lazy" decoding="async" /></td>
          </tr>
          <tr>
            <td class="bold">Weapon Awaken Image</td>
            <td class="w70p"><img class="icon x36" :src="`/images/genshin/${readable.Weapon.AwakenIcon}.png`" loading="lazy" decoding="async" /></td>
          </tr>
          <tr>
            <td class="bold">Weapon Quality</td>
            <td class="w70p">
              <div class="valign">
                <code class="spacer10-right">{{ readable.Weapon.RankLevel }}</code>
                <GenshinStars :quality="readable.Weapon.RankLevel" />
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold">Weapon Name</td>
            <td class="w70p">{{ normGenshinText(readable.Weapon.NameText) }}</td>
          </tr>
          <tr>
            <td class="bold">Weapon Type</td>
            <td class="w70p code">{{ readable.Weapon.WeaponType }}</td>
          </tr>
          <tr>
            <td class="bold">Weapon Desc.</td>
            <td class="w70p">
              <Wikitext :value="normGenshinText(readable.Weapon.DescText)" :seamless="true" />
            </td>
          </tr>
          <tr>
            <td class="bold">Weapon Link</td>
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
import { useTrace } from '../../../middleware/request/tracer.ts';
import GenshinStars from '../links/GenshinStars.vue';
import GenshinItem from '../links/GenshinItem.vue';
import JsonText from '../../utility/JsonText.vue';
import { OLResult } from '../../../../shared/types/ol-types.ts';
import Icon from '../../utility/Icon.vue';
import { read } from 'fs';

const { normGenshinText } = useTrace();

defineProps<{
  title?: string,
  readable?: Readable,
  ol?: OLResult,
}>();
</script>
