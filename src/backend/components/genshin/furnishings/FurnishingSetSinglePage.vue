<template>
  <template v-if="suite">
    <section class="card">
      <h2>
        <span class="dispBlock" style="margin-top:-5px">
          <a role="button" class="secondary fontWeight600" style="font-size:13px;padding:3px 8px" href="/furnishing-sets">
            <Icon name="chevron-left" />
            <span>Back to furnishing sets list</span>
          </a>
        </span>
        <span class="valign">
          <span class="valign spacer10-top">
            {{ suite.SuiteNameText }}
          </span>
          <span class="grow"></span>
          <span class="valign" style="font-size:13px">
            <span class="secondary-label spacer5-right small">ID:&nbsp;<code>{{ suite.SuiteId }}</code></span>
            <span class="secondary-label spacer5-right small">{{ suite.MainFurnType.TypeName2Text }}</span>
            <span class="secondary-label spacer5-right small">{{ suite.MainFurnType.TypeNameText }}</span>
          </span>
        </span>
      </h2>
      <div class="content">
        <div>
          <div class="image-frame spacer3-all">
            <img :src="`/images/genshin/${suite.ItemIcon}.png`" />
            <span class="image-label">Furnishing Set Image</span>
          </div>
        </div>
      </div>
      <div v-if="suite.RelatedMaterial" class="spacer10-top">
        <hr />
        <div class="content">
          <h4>Blueprint item:</h4>
          <GenshinItem :item="suite.RelatedMaterial" :no-count="true" />
        </div>
      </div>
    </section>

    <section class="card">
      <h2>Required Furnishings</h2>
      <div class="content">
        <div class="dispFlex alignStart flexWrap">
          <GenshinItem v-for="unit of suite.Units" :item="unit.Furniture" :item-count="unit.Count" />
        </div>
        <Wikitext :value="recipeWikitext" />
      </div>
    </section>

    <section class="card" v-if="companionFavors && companionFavors.length">
      <h2>Companion Favors</h2>
      <div class="content">
        <Wikitext :value="companionFavorsWikitext" />
        <table class="article-table">
          <thead>
          <tr>
            <th>Character</th>
            <th>Dialogue and Rewards</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="favor of companionFavors">
            <td style="vertical-align: top">
              <div><img class="icon framed-icon x64 spacer3-all" :src="`/images/genshin/${favor.npc.Avatar.IconName}.png`" loading="lazy" decoding="async" /></div>
              <div><a :href="`/character/companion-dialogue/${toParam(favor.npc.CommonName)}`">{{ favor.npc.Avatar.NameText }}</a></div>
            </td>
            <td style="vertical-align: top">
              <DialogueSection :section="favor.dialogue" :no-title="true" :no-top-line="true" />
              <div class="spacer5-bottom">
                <template v-for="item of favor.event.Reward.RewardItemList">
                  <GenshinItem :item="item.Material" :item-count="item.ItemCount" :no-name="true" class="spacer10-right small" />
                </template>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </section>
  </template>
  <template v-else>
    <section class="card">
      <div class="content">
        <p class="spacer10-bottom">Furnishing Set not found.</p>
        <a role="button" class="secondary fontWeight600" style="font-size:13px;padding:3px 8px" href="/furnishing-sets">
          <Icon name="chevron-left" />
          <span>Back to furnishing sets list</span>
        </a>
      </div>
    </section>
  </template>
</template>

<script setup lang="ts">
import {
  FurnitureSuiteExcelConfigData, HomeWorldEventExcelConfigData,
  HomeWorldNPCExcelConfigData,
} from '../../../../shared/types/genshin/homeworld-types.ts';
import DialogueSection from '../dialogue/DialogueSection.vue';
import GenshinItem from '../../utility/GenshinItem.vue';
import Wikitext from '../../utility/Wikitext.vue';
import { DialogueSectionResult } from '../../../domain/genshin/dialogue/dialogue_util.ts';
import Icon from '../../utility/Icon.vue';
import { toParam } from '../../../../shared/util/stringUtil.ts';
const { suite } = defineProps<{
  suite: FurnitureSuiteExcelConfigData,
  companionFavors: {npc: HomeWorldNPCExcelConfigData, event: HomeWorldEventExcelConfigData, dialogue: DialogueSectionResult}[],
  companionFavorsWikitext: string,
  recipeWikitext: string,
}>()
</script>