<template>
  <template v-if="monster">
    <section class="card">
      <h2>{{ title }}</h2>
      <div class="content alignStart">
        <img class="framed-icon x128" :src="`/images/genshin/${monster.Describe?.Icon}.png`" />
        <div class="spacer10-left">
          <strong class="dispBlock fontWeight600" style="margin-left:8px">Archive Description</strong>
          <template v-if="monster.AnimalCodex">
            <Wikitext :value="normGenshinText(monster.AnimalCodex.DescText)" :seamless="true" />
          </template>
          <p v-else>None</p>
        </div>
      </div>
      <div class="content">
        <template v-if="Array.isArray(monster?.AnimalCodex?.AltDescTextList)">
          <fieldset v-for="(descText, idx) of monster.AnimalCodex.AltDescTextList" class="spacer10-bottom">
            <legend>Alternate Description</legend>
            <div class="content">
              <span v-if="monster.AnimalCodex.AltDescTextQuestConds[idx]" class="secondary-label spacer5-bottom" style="font-size:14px">
                <strong>Unlocked by:</strong>&nbsp;
                <a :href="`/genshin/quests/${monster.AnimalCodex.AltDescTextQuestConds[idx].MainQuestId}`">
                  {{ monster.AnimalCodex.AltDescTextQuestConds[idx].NameText }}
                </a>
              </span>
              <Wikitext :value="normGenshinText(descText)" :seamless="true" />
            </div>
          </fieldset>
        </template>
        <fieldset style="font-size:16px">
          <legend>Info</legend>
          <div class="content">
            <span class="secondary-label"><strong>ID:</strong>&nbsp;<code style="font-size:14px">{{ monster.Id }}</code></span>
            <template v-if="monster.AnimalCodex">
              <span class="secondary-label"><strong>Type:</strong>&nbsp;{{ monster.AnimalCodex.TypeName }}</span>
              <span class="secondary-label"><strong>Sub-type:</strong>&nbsp;{{ monster.AnimalCodex.SubTypeName }}</span>
            </template>
            <span class="secondary-label"><strong>Is Elite:</strong>&nbsp;
              <strong v-if="monster.SecurityLevel === 'ELITE'" style="color:green">Yes</strong>
              <span v-else>No</span>
            </span>
            <span class="secondary-label"><strong>Is Boss:</strong>&nbsp;
              <strong v-if="monster.SecurityLevel === 'BOSS'" style="color:green">Yes</strong>
              <span v-else>No</span>
            </span>
          </div>
          <div v-if="monster?.MonsterDescribe?.Title?.TitleNameText" class="content">
            <span class="secondary-label"><strong>Title:</strong>&nbsp;{{ monster.MonsterDescribe.Title.TitleNameText }}</span>
          </div>
        </fieldset>
        <fieldset v-if="monster?.HomeWorldAnimal" class="spacer10-top">
          <legend>Related Furniture</legend>
          <div class="content">
            <GenshinItem :item="monster.HomeWorldAnimal.Furniture" :no-count="true" />
          </div>
        </fieldset>
        <fieldset v-if="monster?.MonsterDescribe?.SpecialNameLabList" class="spacer10-top">
          <legend>Special Name(s)</legend>
          <div class="content alignStretch flexWrap" style="padding-top:0;font-size:15px">
            <div v-for="specialName of monster.MonsterDescribe?.SpecialNameLabList" class="w33p">
                <span class="spacer5-all secondary-label dispBlock textAlignLeft clearfix">
                  <span>{{ specialName.SpecialNameText }}</span>
                  <span v-if="specialName.IsInRandomList" class="secondary-label small spacer10-left fr">Random</span>
                </span>
            </div>
          </div>
        </fieldset>
        <fieldset v-if="monster?.AnimalCodex?.ModelArtPath" class="spacer10-top">
          <legend>Model Art</legend>
          <div class="content alignStretch flexWrap" style="padding-top:0;font-size:15px">
            <img :src="`/images/genshin/${monster.AnimalCodex.ModelArtPath}.png`" style="max-width: 500px" />
          </div>
        </fieldset>
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
        <JsonText :value="safeStringify(monster, null, 2)" />
      </div>
    </section>
  </template>
  <section v-else class="card">
    <h2>{{ title }}</h2>
  </section>
</template>

<script setup lang="ts">
import { MonsterExcelConfigData } from '../../../../shared/types/genshin/monster-types.ts';
import Wikitext from '../../utility/Wikitext.vue';
import { getTrace } from '../../../middleware/request/tracer.ts';
import JsonText from '../../utility/JsonText.vue';
import { safeStringify } from '../../../../shared/util/genericUtil.ts';
import GenshinItem from '../links/GenshinItem.vue';

const { normGenshinText } = getTrace();

defineProps<{
  title?: string,
  monster?: MonsterExcelConfigData,
}>();
</script>

