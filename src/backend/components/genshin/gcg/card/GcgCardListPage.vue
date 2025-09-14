<template>
  <section class="card">
    <h2>TCG Cards</h2>
    <div class="content">
      <fieldset>
        <legend>Categories</legend>
        <div class="content alignStretch flexWrap" style="padding-top:0;max-width:80%;font-size:15px">
          <div class="w100p">
            <a role="button" class="spacer5-all secondary dispBlock textAlignLeft"
               href="#character_cards">Character Cards</a>
          </div>

          <div class="w100p">
            <a role="button" class="spacer5-all secondary dispBlock textAlignLeft"
               href="#character_cards_unobtainable">Character Cards &mdash; Unobtainable</a>
          </div>

          <template v-for="[sectionName, actionCardsByObtainability] of Object.entries(actionCardsBySection)">
            <template v-if="actionCardsByObtainability.Obtainable.length">
              <div class="w100p">
                <a role="button" class="spacer5-all secondary dispBlock textAlignLeft"
                   :href="`#${toParam(sectionName)}`"><b>Action Cards</b> / {{ sectionName }}</a>
              </div>
            </template>
            <template v-if="actionCardsByObtainability.Unobtainable.length">
                <div class="w100p">
                  <a role="button" class="spacer5-all secondary dispBlock textAlignLeft"
                     :href="`#${toParam(sectionName)}_unobtainable`"><b>Action Cards</b> / {{ sectionName }} &mdash; Unobtainable</a>
                </div>
            </template>
          </template>
        </div>
      </fieldset>
    </div>
  </section>

  <GcgCardTableChar :sectionId="'character_cards'"
                    :sectionNameHtml="'Character Cards'"
                    :cards="charCardsBySection.Obtainable" />
  <GcgCardTableChar :sectionId="'character_cards_unobtainable'"
                    :sectionNameHtml="'Character Cards &mdash; Unobtainable'"
                    :cards="charCardsBySection.Unobtainable" />

  <template v-for="[sectionName, actionCardsByObtainability] of Object.entries(actionCardsBySection)">
    <template v-if="actionCardsByObtainability.Obtainable.length">
      <GcgCardTableAction :sectionId="toParam(sectionName)"
                          :sectionNameHtml="escapeHtml(sectionName)"
                          :cards="actionCardsByObtainability.Obtainable" />
    </template>
    <template v-if="actionCardsByObtainability.Unobtainable.length">
      <GcgCardTableAction :sectionId="toParam(sectionName) + '_unobtainable'"
                          :sectionNameHtml="escapeHtml(sectionName) + ' &mdash; Unobtainable'"
                          :cards="actionCardsByObtainability.Unobtainable" />
    </template>
  </template>
</template>

<script setup lang="ts">
import {
  GCGActionCardsByObtainability,
  GCGCharCardsByObtainability,
} from '../../../../../shared/types/genshin/gcg-types.ts';
import { escapeHtml, toParam } from '../../../../../shared/util/stringUtil.ts';
import GcgCardTableChar from '../partials/GcgCardTableChar.vue';
import GcgCardTableAction from '../partials/GcgCardTableAction.vue';

defineProps<{
  charCardsBySection: GCGCharCardsByObtainability,
  actionCardsBySection: {[sectionName: string]: GCGActionCardsByObtainability},
}>();
</script>

