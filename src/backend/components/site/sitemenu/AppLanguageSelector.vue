<template>
  <div v-if="!hideInputLanguageSelector" class="input-language-selector header-language-selector">
    <div class="header-language-selector-title valign"
         ui-tippy="{allowHTML: true, content: 'The language for text fields (e.g. searching for quests/dialogue)',delay:[200, 100]}">
      <strong>Input Language</strong>
      <span class="dispInlineBlock spacer5-left" style="height:14px;width:14px;font-size:0;opacity:0.5">
        <Icon name="info" :size="14" />
      </span>
    </div>
    <select class="header-language-selector-input" name="inputLangCode" title="Input Language">
      <option v-for="langCode of ctx.languageCodes"
              :value="langCode"
              :selected="ctx.inputLangCode === langCode">{{ ctx.languages[langCode] }}</option>
    </select>
  </div>
  <div v-if="!hideOutputLanguageSelector" class="output-language-selector header-language-selector">
    <div class="header-language-selector-title valign"
         ui-tippy="{allowHTML: true, content: 'The language for output results (e.g. quest dialogue generation / single branch dialogue results).<br>OL results are unaffected by this.',delay:[200, 100]}">
      <strong>Output Language</strong>
      <span class="dispInlineBlock spacer5-left" style="height:14px;width:14px;font-size:0;opacity:0.5">
        <Icon name="info" :size="14" />
      </span>
    </div>
    <select class="header-language-selector-input" name="outputLangCode" title="Output Language">
      <option v-for="langCode of ctx.languageCodes"
              :value="langCode"
              :selected="ctx.outputLangCode === langCode">{{ ctx.languages[langCode] }}</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import Icon from '../../utility/Icon.vue';
import { useTrace } from '../../../middleware/request/tracer.ts';

const { ctx } = useTrace();

ctx.languages

defineProps<{
  hideInputLanguageSelector?: boolean;
  hideOutputLanguageSelector?: boolean;
}>();
</script>
