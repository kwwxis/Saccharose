<template>
  <section class="card" style="border-radius:10px">
    <div v-if="searchText" class="content">
      <strong>Search Summary & Quick Jump</strong>
      <p>Total results: {{ arraySum(valuesOf(tutorialsByType).map(tutorials => tutorials.length)) }}</p>
      <ul>
        <template v-for="[type, tutorials] of entriesOf(tutorialsByType)">
          <li>{{ type }} ({{ tutorials.length }})</li>
          <ul style="columns:2">
            <li v-for="tutorial of tutorials">
              <a :href="`#tutorial-${tutorial.Id}`">{{ tutorial.PushTip?.TitleText || `Unnamed tutorial (#${tutorial.Id})` }}</a>
            </li>
          </ul>
        </template>
      </ul>
    </div>
    <div class="content">
      <strong>File Format parameter options</strong>
      <p>Reload page after changing options to see effect.</p>
      <div class="alignStart spacer15-top flexWrap">
        <FileFormatOptions param-name="image"
                           cookie-name="FileFormat.tutorial.image"
                           :file-format-params="fileFormatParams"
                           :file-format-default="fileFormatDefault_image" />
      </div>
    </div>
  </section>
  <section v-for="[type, tutorials] of entriesOf(tutorialsByType)" class="card" :id="toParam(type)">
    <h2 class="valign">
      <span>{{ type }}</span>
      <span class="grow"></span>
      <span class="secondary-label small">
        Total:&nbsp;<span>{{ tutorials.length }}</span>
      </span>
    </h2>
    <div v-for="tutorial of tutorials" class="tutorial" :id="`tutorial-${tutorial.Id}`">
      <h3 class="valign secondary-header">
        <span>{{ tutorial.PushTip?.TitleText || '(No title)' }}</span>
        <span class="grow"></span>
        <span style="opacity: 0.65; font-size: 12px;">ID {{ tutorial.Id }}</span>
      </h3>
      <div class="content">
        <div class="posRel">
          <Wikitext :id="`tutorial-${tutorial.Id}-wikitext`"
                    :markers="tutorial.WikitextMarkers"
                    :value="tutorial.Wikitext" />
          <button class="secondary small posAbs" :ui-action="`copy: #tutorial-${tutorial.Id}-wikitext`"
                  style="right: 0; top: 0;"
                  ui-tippy-hover="Click to copy to clipboard"
                  ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
        </div>
        <div v-if="tutorial.PushTip?.TitleText" class="posRel">
          <Wikitext :id="`tutorial-${tutorial.Id}-transclude`"
                    :value="`{{Tutorial|${tutorial.PushTip?.TitleText}}}`" />
          <button class="secondary small posAbs" :ui-action="`copy: #tutorial-${tutorial.Id}-transclude`"
                  style="right: 0; top: 0;"
                  ui-tippy-hover="Click to copy to clipboard"
                  ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
        </div>
        <div class="tutorial-images spacer15-bottom">
          <template v-for="image of tutorial.Images">
            <a role="button" class="image-loader" ui-action="lazy-image-click"
               :data-src="`/serve-image/genshin/${image.originalName}.png/${image.downloadName}`"
               :data-name="image.downloadName"></a>
          </template>
        </div>
      </div>
    </div>
  </section>
  <div v-if="!keysOf(tutorialsByType).length && searchText" class="card no-results-found">
    <div class="content">
      <p>No results found for <b>{{ searchText }}</b></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TutorialsByType } from '../../../../shared/types/genshin/tutorial-types.ts';
import { arraySum, entriesOf, keysOf, valuesOf } from '../../../../shared/util/arrayUtil.ts';
import Wikitext from '../../utility/Wikitext.vue';
import FileFormatOptions from '../../utility/FileFormatOptions.vue';
import { toParam } from '../../../../shared/util/stringUtil.ts';

defineProps<{
  searchText?: string,
  tutorialsByType: TutorialsByType,
  fileFormatParams: string,
  fileFormatDefault_image: string,
}>();
</script>
