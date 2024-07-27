<template>
  <section class="card">
    <h2>Furnishings</h2>
    <div class="content">
      <fieldset>
        <legend>Quick Jump</legend>
        <div class="content">
          <div v-for="[cat1, subTree] of Object.entries(suiteTree)">
            <div v-for="[cat2, _suites] of Object.entries(subTree)">
              <a role="button" class="spacer5-all secondary dispBlock textAlignLeft clearfix"
                 :href="`#${toParam(cat1)}-${toParam(cat2)}`">
                <span><strong>{{ cat1 }}</strong> / {{ cat2 }}</span>
              </a>
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  </section>

  <template v-for="[cat1, subTree] of Object.entries(suiteTree)" :id="`${toParam(cat1)}`">
    <div class="card" v-for="[cat2, suites] of Object.entries(subTree)" :id="`${toParam(cat1)}-${toParam(cat2)}`">
      <h2><strong>{{ cat1 }}</strong> / {{ cat2 }}</h2>
      <table class="article-table">
        <thead>
          <tr style="font-size: 14px;text-align: left;line-height: 16px;">
            <th>ID</th>
            <th>Name</th>
            <th>Favors</th>
            <th>Image</th>
          </tr>
        </thead>
        <tbody>
          <tr class="furnishing-set-row" v-for="suite of suites" :data-id="suite.SuiteId">
            <td class="code">{{suite.SuiteId}}</td>
            <td><a :href="`/genshin/furnishing-sets/${suite.SuiteId}`">{{suite.SuiteNameText}}</a></td>
            <td style="width:180px">
              <div v-if="!!suite.FavoriteNpcVec?.length" class="dispFlex flexWrap">
                <template v-for="npc of suite.FavoriteNpcVec">
                  <img class="icon framed-icon x32 spacer3-all" :src="`/images/genshin/${npc.Avatar.IconName}.png`" loading="lazy" decoding="async" />
                </template>
              </div>
            </td>
            <td style="width:250px">
              <img v-if="suite.ItemIcon" class="w100p" style="height:120px;width:auto"
                   :src="`/serve-image/genshin/${suite.ItemIcon}.png/Furnishing Set ${encodeURIComponent(suite.SuiteNameText)} Display.png`"
                   loading="lazy" decoding="async" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
</template>

<script setup lang="ts">
import { FurnitureSuiteTree } from '../../../../shared/types/genshin/homeworld-types.ts';
import { toParam } from '../../../../shared/util/stringUtil.ts';

defineProps<{
  suiteTree: FurnitureSuiteTree
}>();
</script>
