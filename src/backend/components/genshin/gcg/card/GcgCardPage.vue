<template>
  <template v-if="card">
    <section class="card">
      <h2>
        <span class="dispBlock" style="margin-top:-5px"><a role="button" class="secondary fontWeight600" style="font-size:14px;padding:3px 8px" href="/genshin/TCG/cards">Back to cards</a></span>
        <span class="valign spacer10-top">
          <template v-if="cardAsCharCard?.CharIcon">
            <img class="framed-icon spacer10-right" :src="`/images/genshin/${cardAsCharCard.CharIcon}.png`" style="width:50px;border-radius:50%" />
          </template>
          <span class="dispBlock">{{ card.WikiName }}</span>
        </span>
      </h2>
      <div class="tab-list" role="tablist">
        <button role="tab" id="tab-display" :class="`tab ${tab === 'display' ? 'active' : ''}`"
                ui-action="tab: #tabpanel-display, cardTabs; delete-query-param: tab">Display</button>

        <button role="tab" id="tab-wikitext" :class="`tab ${tab === 'wikitext' ? 'active' : ''}`"
                ui-action="tab: #tabpanel-wikitext, cardTabs; set-query-param: tab=wikitext">Wikitext</button>

        <button role="tab" id="tab-json" :class="`tab ${tab === 'json' ? 'active' : ''}`"
                ui-action="tab: #tabpanel-json, cardTabs; set-query-param: tab=json">JSON</button>
      </div>
    </section>

    <section id="tabpanel-display" :class="`tabpanel ${tab === 'display' ? 'active' : 'hide'}`">
      <section class="card">
        <h2>Display</h2>
        <table class="article-table">
          <tr>
            <th colspan="2">Property Table</th>
          </tr>
          <tr>
            <td class="bold">Name</td>
            <td>{{ card.WikiName }}</td>
          </tr>
          <tr>
            <td class="bold">Type</td>
            <td>{{ card.WikiType }}</td>
          </tr>
          <tr v-if="card.WikiImage">
            <td class="bold" style="width:150px">Image(s)</td>
            <td class="valign">
              <div class="media-image">
                <div class="image-frame bordered">
                  <div class="image-obj">
                    <img :src="`/images/genshin/${card.WikiImage}.png`" style="max-height:200px" loading="lazy" decoding="async" />
                  </div>
                  <span v-if="WikiImageEntity" class="image-label">
                    <ByteSizeLabel :byte-size="WikiImageEntity.image_size" />
                  </span>
                </div>
              </div>
              <template v-if="WikiImageEntity && WikiImageEntity.extra_info && WikiImageEntity.extra_info.otherNames">
                <div class="media-image" v-for="otherName of WikiImageEntity.extra_info.otherNames">
                  <div class="image-frame bordered">
                    <div class="image-obj">
                      <img :src="`/images/genshin/${encodeURIComponent(otherName.image_name)}.png`" style="max-height:200px" loading="lazy"
                           decoding="async" />
                    </div>
                    <span class="image-label">
                      <ByteSizeLabel :byte-size="otherName.image_size" />
                    </span>
                  </div>
                </div>
              </template>
            </td>
          </tr>
          <tr v-if="card.WikiGoldenImage">
            <td class="bold" style="width:150px">Golden Image(s)</td>
            <td class="valign">
              <div class="media-image">
                <div class="image-frame bordered">
                  <div class="image-obj">
                    <img :src="`/images/genshin/${card.WikiGoldenImage}.png`" style="max-height:200px" loading="lazy" decoding="async" />
                  </div>
                  <span v-if="WikiGoldenImageEntity" class="image-label">
                  </span>
                </div>
              </div>
              <template v-if="WikiGoldenImageEntity && WikiGoldenImageEntity.extra_info && WikiGoldenImageEntity.extra_info.otherNames">
                <div class="media-image"  v-for="otherName of WikiGoldenImageEntity.extra_info.otherNames">
                  <div class="image-frame bordered">
                    <div class="image-obj">
                      <img :src="`/images/genshin/${encodeURIComponent(otherName.image_name)}.png`" style="max-height:200px" loading="lazy" decoding="async" />
                    </div>
                    <span class="image-label">
                      <ByteSizeLabel :byte-size="otherName.image_size" />
                    </span>
                  </div>
                </div>
              </template>
            </td>
          </tr>
          <tr v-if="cardAsCharCard?.CharIcon">
            <td class="bold" style="width:150px">Character Icon</td>
            <td>
              <img :src="`/images/genshin/${cardAsCharCard.CharIcon}.png`" loading="lazy" decoding="async" style="max-height: 150px" />
            </td>
          </tr>
          <tr v-if="cardAsCharCard?.Hp">
            <td class="bold" style="width:150px">Health</td>
            <td>
              <div class="valign">
                <div class="tcg-icon tcg-card-icon GCG_CHAR_HP spacer5-right">{{ cardAsCharCard.Hp }}</div>
                <span>({{ cardAsCharCard.Hp }})</span>
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold">Tags</td>
            <td>
              <template v-for="tag of card.MappedTagList.filter(x => !!x.Type)">
                <GcgTag :tag="tag" />
              </template>
            </td>
          </tr>
          <tr v-if="cardAsActionCard?.CostList">
            <td class="bold">Costs</td>
            <td>
              <template v-if="Array.isArray(cardAsActionCard?.CostList) && cardAsActionCard.CostList.filter(x => !!x.CostType).length">
                <template v-for="costItem of cardAsActionCard.CostList.filter(x => !!x.CostType)">
                  <div :class="`tcg-icon ${costItem.CostType}`">{{ costItem.Count }}</div>
                </template>
              </template>
              <span v-else>(None)</span>
            </td>
          </tr>
          <tr>
            <td class="bold">Is Obtainable</td>
            <td>
              <span v-if="card.IsCanObtain" style="color:green">Yes</span>
              <span v-else style="color:red">No</span>
            </td>
          </tr>
          <tr v-if="cardAsActionCard">
            <td class="bold">Is Hidden</td>
            <td>
              <span v-if="cardAsActionCard.IsHidden" style="color:red">Yes</span>
              <span v-else style="color:green">No</span>
            </td>
          </tr>
          <tr>
            <td class="bold">Description/Effect</td>
            <td>
              <Wikitext :value="card.WikiDesc" :seamless="true" />
            </td>
          </tr>
          <tr v-if="voiceItemsWikitext">
            <td class="bold">Voice Items</td>
            <td>
              <Wikitext :value="voiceItemsWikitext" :seamless="true" />
            </td>
          </tr>
        </table>
        <table class="article-table">
          <tr>
            <th colspan="2">Skill Table</th>
          </tr>
          <tr v-for="{skill} of skills">
            <td class="bold" style="width:150px;line-height:1em">
              <div class="spacer5-top">{{ skill.WikiName }}</div>
              <small class="fontWeight500">{{ skill.WikiType }}</small>
              <div class="valign spacer5-top spacer10-bottom">
                <template v-if="skill.CostList && Array.isArray(skill.CostList)">
                  <template v-for="costItem of skill.CostList.filter(x => !!x.CostType)">
                    <div :class="`tcg-icon inline ${costItem.CostType}`">{{ costItem.Count }}</div>
                  </template>
                </template>
              </div>
            </td>
            <td style="vertical-align: top;">
              <div class="alignStretch">
                <Wikitext :value="skill.WikiDesc" :seamless="true" />
              </div>
            </td>
          </tr>
        </table>
      </section>
    </section>
    <section id="tabpanel-wikitext" :class="`tabpanel ${tab === 'wikitext' ? 'active' : 'hide'}`">
      <section class="card">
        <h2>Wikitext</h2>
        <div class="content">
          <p class="info-notice spacer5-bottom">Review the wikitext carefully to make sure it's correct before saving anywhere to the actual wiki.</p>
          <p class="info-notice spacer10-bottom">Remember to add the version to the <code><WikiTemplateLink name="Change History" /></code> template.</p>
          <fieldset>
            <legend>Quick Jump</legend>
            <div class="content alignStretch flexWrap" style="padding-top:0;max-width:80%;font-size:15px">
              <div class="w100p">
                <a role="button" class="spacer5-all secondary dispBlock textAlignLeft clearfix"
                   href="#wikitext-character">
                  <span>Card Page</span>
                  <span class="secondary-label small spacer10-left fr">{{ card.WikiType }}</span>
                </a>
              </div>
              <div v-for="{skill, index} of skills" class="w100p">
                <a role="button" class="spacer5-all secondary dispBlock textAlignLeft clearfix"
                   :href="`#wikitext-skill-${index}`">
                  <span><b>Skill</b> / {{ skill.WikiName }}</span>
                  <span class="secondary-label small spacer10-left fr">{{ skill.WikiType }}</span>
                </a>
              </div>
            </div>
          </fieldset>
        </div>
      </section>

      <section class="card" id="wikitext-character">
        <h2>Card Page</h2>
        <Wikitext :value="wikitext" :gutters="true" />
      </section>
      <section v-for="{skill, wikitext, index} of skills" class="card" :id="`wikitext-skill-${index}`">
        <h2>Skill Page: <strong>{{ skill.WikiName }}</strong> <span class="secondary-label small spacer10-left">{{ skill.WikiType }}</span></h2>
        <Wikitext :value="wikitext" :gutters="true" />
      </section>
    </section>
    <section id="tabpanel-json" :class="`tabpanel ${tab === 'json' ? 'active' : 'hide'}`">
      <section class="card">
        <h2>JSON</h2>
        <JsonText :value="safeStringify(card, null, 2)" />
      </section>
    </section>
  </template>
  <section v-else class="card">
    <div class="content">
      <p>Card not found for ID <code>{{ reqCardId }}</code></p>
      <div class="spacer10-top">
        <a role="button" class="secondary fontWeight600" style="font-size:14px;padding:3px 8px" href="/genshin/TCG/cards">Return back to cards list</a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  GCGCardExcelConfigData, GCGCharExcelConfigData,
  GCGCommonCard,
  GCGSkillExcelConfigData, isActionCard, isCharacterCard,
} from '../../../../../shared/types/genshin/gcg-types.ts';
import { ImageIndexEntity } from '../../../../../shared/types/image-index-types.ts';
import WikiTemplateLink from '../../../utility/WikiTemplateLink.vue';
import JsonText from '../../../utility/JsonText.vue';
import { safeStringify } from '../../../../../shared/util/genericUtil.ts';
import Wikitext from '../../../utility/Wikitext.vue';
import ByteSizeLabel from '../../../utility/ByteSizeLabel.vue';
import GcgTag from '../partials/GcgTag.vue';

const {card} = defineProps<{
  reqCardId: string,
  card: GCGCommonCard,
  wikitext: string,
  skills: {skill: GCGSkillExcelConfigData, wikitext: string, index: number}[],
  tab: 'display' | 'wikitext' | 'json',
  voiceItemsWikitext: string,
  WikiImageEntity: ImageIndexEntity,
  WikiGoldenImageEntity: ImageIndexEntity,
}>();

const cardAsCharCard: GCGCharExcelConfigData = isCharacterCard(card) ? card : null;
const cardAsActionCard: GCGCardExcelConfigData = isActionCard(card) ? card : null;
</script>
