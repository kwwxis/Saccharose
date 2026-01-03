<template>
  <template v-if="weapon">
    <section class="card">
      <h2>
        <span class="dispBlock" style="margin-top:-5px">
          <a role="button" class="secondary fontWeight600" style="font-size:14px;padding:3px 8px"
             href="/genshin/weapons">Back to weapons search</a>
        </span>
        <span class="valign spacer10-top">
          <img class="framed-icon x36" :src="`/images/genshin/${weapon.Icon}.png`" loading="lazy" decoding="async" />
          <span class="spacer15-left">{{ weapon.NameText }}</span>
        </span>
      </h2>
      <div class="content">
        <table class="article-table">
          <tr>
            <td style="width:150px;min-width:150px;" class="bold" colspan="2">Name</td>
            <td>{{ normGenshinText(weapon.NameText) }}</td>
          </tr>
          <tr>
            <td class="bold" colspan="2">Description</td>
            <td><Wikitext :value="normGenshinText(weapon.DescText)" :seamless="true" /></td>
          </tr>
          <tr>
            <td class="bold" colspan="2">Quality</td>
            <td>
              <div class="valign">
                <code class="spacer10-right">{{ weapon.RankLevel }}</code>
                <GenshinStars :quality="weapon.RankLevel" />
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold" colspan="2">Icon</td>
            <td class="valign">
              <div class="media-image">
                <div class="image-frame bordered">
                  <div class="image-obj">
                    <img :src="`/images/genshin/${weapon.Icon}.png`" style="max-height:74px" loading="lazy" decoding="async" />
                  </div>
                  <span v-if="iconEntity" class="image-label">
                    <ByteSizeLabel :byte-size="iconEntity.image_size" />
                  </span>
                </div>
              </div>
              <template v-if="iconEntity?.extra_info?.otherNames">
                <template v-for="otherName of iconEntity.extra_info.otherNames">
                  <div class="media-image">
                    <div class="image-frame bordered">
                      <div class="image-obj">
                        <img :src="`/images/genshin/${encodeURIComponent(otherName.name)}.png`" style="max-height:74px" loading="lazy" decoding="async" />
                      </div>
                      <span class="image-label">
                        <ByteSizeLabel :byte-size="otherName.size" />
                      </span>
                    </div>
                  </div>
                </template>
              </template>
            </td>
          </tr>
          <tr v-if="weapon.AwakenIcon">
            <td class="bold" colspan="2">2nd Ascension Icon</td>
            <td class="valign">
              <div class="media-image">
                <div class="image-frame bordered">
                  <div class="image-obj">
                    <img :src="`/images/genshin/${weapon.AwakenIcon}.png`" style="max-height:74px" loading="lazy" decoding="async" />
                  </div>
                  <span v-if="awakenIconEntity" class="image-label">
                    <ByteSizeLabel :byte-size="awakenIconEntity.image_size" />
                  </span>
                </div>
              </div>
              <template v-if="awakenIconEntity?.extra_info?.otherNames">
                <template v-for="otherName of awakenIconEntity.extra_info.otherNames">
                  <div class="media-image">
                    <div class="image-frame bordered">
                      <div class="image-obj">
                        <img :src="`/images/genshin/${encodeURIComponent(otherName.name)}.png`" style="max-height:74px" loading="lazy" decoding="async" />
                      </div>
                      <span class="image-label">
                        <ByteSizeLabel :byte-size="otherName.size" />
                      </span>
                    </div>
                  </div>
                </template>
              </template>
            </td>
          </tr>
          <tr>
            <td class="bold" colspan="2">Item Type</td>
            <td><code>{{ weapon.ItemType }}</code></td>
          </tr>
          <tr>
            <td class="bold" colspan="2">Weapon Type</td>
            <td><code>{{ weapon.WeaponType }}</code></td>
          </tr>
          <template v-if="weapon.EquipAffixList?.length">
            <tr>
              <td class="bold" colspan="2">Passive</td>
              <td>{{ weapon.EquipAffixList[0].NameText }}</td>
            </tr>
            <tr v-for="affix of weapon.EquipAffixList">
              <td></td>
              <td class="bold">Level {{ (affix.Level || 0) + 1 }}</td>
              <td><Wikitext :value="normGenshinText(affix.DescText)" :seamless="true" /></td>
            </tr>
          </template>
        </table>
      </div>
    </section>
    <section v-if="weapon.Relations?.Forge?.length" class="card">
      <h2>Forging</h2>
      <template v-for="relation of weapon.Relations.Forge">
        <div class="content alignStart">
          <template v-for="inputItem of relation.RelationData.MaterialItems">
            <GenshinItem :item="inputItem.Material" :item-count="inputItem.Count" />
          </template>
          <div class="material-sep"><Icon name="chevron-right" :size="28" /></div>
          <template v-if="relation.RelationData.ResultItem">
            <GenshinItem :item="relation.RelationData.ResultItem" :item-count="relation.RelationData.ResultItemCount" />
          </template>
        </div>
        <hr>
      </template>
    </section>
    <template v-if="weapon.Story">
      <section class="card" style="margin:0">
        <h2 class="valign">
          <span>Story</span>
          <span class="grow"></span>
          <a class="valign fontWeight500" :href="`/genshin/readables/item/${weapon.StoryId}`" style="font-size:18px" target="_blank">
            <span class="spacer5-right" style="font-size:15px">Readable</span><Icon name="external-link" :size="16" />
          </a>
        </h2>
      </section>
      <ReadableTexts :readable="weapon.Story" />
    </template>
    <section v-if="ol" class="card">
      <h2 class="valign">
        <span>OL</span>
        <span class="grow"></span>
        <button class="secondary small" ui-action="copy: #ol-textarea"
                ui-tippy-hover="Click to copy to clipboard"
                ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
      </h2>
      <div class="content">
        <Wikitext id="ol-textarea" :for-ol="true" :value="ol.result"  />
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
        <JsonText :value="JSON.stringify(weapon, null, 2)" />
      </div>
    </section>
  </template>
  <section v-else class="card">
    <h2>Weapon not found.</h2>
  </section>
</template>

<script setup lang="ts">
import { WeaponExcelConfigData } from '../../../../shared/types/genshin/weapon-types.ts';
import { ImageIndexEntity } from '../../../../shared/types/image-index-types.ts';
import { useTrace } from '../../../middleware/request/tracer.ts';
import JsonText from '../../utility/JsonText.vue';
import Wikitext from '../../utility/Wikitext.vue';
import Icon from '../../utility/Icon.vue';
import ByteSizeLabel from '../../utility/ByteSizeLabel.vue';
import GenshinItem from '../links/GenshinItem.vue';
import GenshinStars from '../links/GenshinStars.vue';
import ReadableTexts from '../readables/partials/ReadableTexts.vue';
import { OLCombinedResult } from '../../../../shared/types/ol-types.ts';

const { normGenshinText } = useTrace();

defineProps<{
  weapon?: WeaponExcelConfigData,
  iconEntity?: ImageIndexEntity,
  awakenIconEntity?: ImageIndexEntity,
  ol?: OLCombinedResult
}>();
</script>
