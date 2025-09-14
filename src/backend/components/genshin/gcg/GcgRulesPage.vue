<template>
  <section class="card">
    <h2>TCG Rules</h2>
  </section>
  <section v-for="rule of rules" class="card">
    <h2>{{ rule.TitleText }}</h2>
    <div class="content">
      <ul>
        <li v-for="detail of rule.DetailList">
          <strong class="valign" v-html="genshinSpriteTagIconize(detail.TitleText || '(No title)')"></strong>
          <Wikitext :value="normGenshinText(detail.ContentText)" :seamless="true" />
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { GCGRuleTextExcelConfigData } from '../../../../shared/types/genshin/gcg-types.ts';
import Wikitext from '../../utility/Wikitext.vue';
import { getTrace } from '../../../middleware/request/tracer.ts';
import { genshinSpriteTagIconize } from '../../../routing/viewUtilities.ts';

const { normGenshinText } = getTrace();

defineProps<{
  rules: GCGRuleTextExcelConfigData[],
}>();
</script>
