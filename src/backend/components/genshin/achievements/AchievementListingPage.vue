<template>
  <section v-if="!category" class="card">
    <h2>Achievements</h2>
    <div class="tab-list" role="tablist">
      <a href="/genshin/achievements" role="tab" id="tab-categories" class="tab"
         :class="{active: ctx.hasBodyClass('page--achievements-categories')}">Categories</a>
      <a href="/genshin/achievements/search" role="tab" id="tab-search" class="tab"
         :class="{active: ctx.hasBodyClass('page--achievements-search')}">Search</a>
    </div>
    <div class="content">
      <fieldset>
        <legend>Categories</legend>
        <div class="content alignStretch flexWrap" style="padding-top:0;">
          <div v-for="goal of goals" class="w50p">
            <a role="button" class="spacer5-all secondary valign textAlignLeft"
               :href="`/genshin/achievements/${toParam(goal.NameTextEN)}`">
              <img class="icon x32" :src="`/images/genshin/${goal.IconPath}.png`" loading="lazy" decoding="async" />
              <span class="spacer10-left">{{ goal.NameText }}</span>
            </a>
          </div>
        </div>
      </fieldset>
    </div>
  </section>
  <template v-if="achievements">
    <section v-for="section of valuesOf(achievements)" class="card"
             :id="toParam(section?.Goal?.NameText) || 'no_id'">
      <h2 class="valign">
        <img class="framed-icon x42" :src="`/images/genshin/${section?.Goal?.IconPath}.png`" loading="lazy" decoding="async" />
        <span class="spacer15-left">{{ section?.Goal?.NameText || 'n/a' }}</span>
        <span class="grow"></span>
        <a href="/genshin/achievements" role="button" class="secondary small">Back to categories</a>
      </h2>
      <div class="content">
        <div class="card result-count-card">
          <h2>Total: <span>{{ section.Achievements.length }}</span></h2>
        </div>
        <p class="info-notice">
          The <strong>Trigger</strong> column shows the trigger type and parameters. For certain types, e.g. finishing quests,
          I resolved the parameters for you (e.g. showing the quest name). But there's a lot of different trigger types, which'd
          require code for each one to resolve its parameters, which is too much effort.
          You can use the <a href="/genshin/excel-usages">Excel Usages</a> tool to lookup where certain IDs are used.</p>
      </div>
      <div v-if="section?.Goal?.FinishReward && section?.Goal?.FinishReward?.RewardSummary" class="content">
        <h3>Category Reward</h3>
        <Wikitext :value="section.Goal.FinishReward.RewardSummary.CombinedCards" />
      </div>
      <div class="content">
        <AchievementListingTable :achievements="section.Achievements" :show-category="false" />
      </div>
    </section>
  </template>
  <section v-if="category && !achievements" class="card">
    <h2>Achievements</h2>
    <div class="tab-list" role="tablist">
      <a href="/genshin/achievements" role="tab" id="tab-categories" class="tab"
         :class="{active: ctx.hasBodyClass('page--achievements-categories')}">Categories</a>
      <a href="/genshin/achievements/search" role="tab" id="tab-search" class="tab"
         :class="{active: ctx.hasBodyClass('page--achievements-search')}">Search</a>
    </div>
    <div class="content">
      <p>Category not found: {{ category }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  AchievementGoalExcelConfigData,
  AchievementsByGoals,
} from '../../../../shared/types/genshin/achievement-types.ts';
import { toParam } from '../../../../shared/util/stringUtil.ts';
import { getTrace } from '../../../middleware/request/tracer.ts';
import Wikitext from '../../utility/Wikitext.vue';
import { valuesOf } from '../../../../shared/util/arrayUtil.ts';
import AchievementListingTable from './AchievementListingTable.vue';

const { ctx } = getTrace();

defineProps<{
  category: string,
  goals: AchievementGoalExcelConfigData[],
  achievements: AchievementsByGoals,
}>();
</script>
