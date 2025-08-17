<template>
  <section class="card">
    <h2>{{ title }}</h2>
    <div class="content">
      <p v-if="introText" class="spacer10-bottom">{{ introText }}</p>
      <fieldset>
        <legend>Quick Jump</legend>
        <div class="content alignStretch flexWrap" style="padding-top:0;max-width:80%;font-size:15px">
          <div v-for="group of Object.values(lbTable)" class="w100p">
            <a role="button" class="spacer5-all secondary dispBlock textAlignLeft"
               :href="`#${group.SubType}`">
              {{ group.NameText }}
            </a>
          </div>
        </div>
      </fieldset>
    </div>
  </section>
  <section v-for="group of Object.values(lbTable)" class="card" :id="group.SubType">
    <h2>{{ group.NameText }}</h2>
    <table v-if="group.CodexList && group.CodexList.length" class="article-table">
      <thead>
        <tr style="font-size: 14px;text-align: left;line-height: 16px;">
          <th>Codex ID</th>
          <th>Name</th>
          <th>Variants</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="codex of group.CodexList">
          <td><code style="font-size:13px">{{ codex.Id }}</code></td>
          <td>{{ codex.NameText }}</td>
          <td>
            <template v-for="monster of codex.Monsters">
              <GenshinLbLink :monster="monster" />
            </template>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="group.MonsterList && group.MonsterList.length" class="content alignStretch flexWrap">
      <template v-for="monster of group.MonsterList">
        <GenshinLbLink :monster="monster" />
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { LivingBeingTable } from '../../../../shared/types/genshin/monster-types.ts';
import GenshinLbLink from '../links/GenshinLbLink.vue';

defineProps<{
  title: string,
  introText?: string,
  lbTable: LivingBeingTable,
}>();
</script>
