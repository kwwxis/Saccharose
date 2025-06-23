<template>
  <section class="card">
    <h2>Tutorials</h2>
    <div class="tab-list" role="tablist">
      <a href="/genshin/tutorials" role="tab" id="tab-categories" class="tab active">Categories</a>
      <a href="/genshin/tutorials/search" role="tab" id="tab-search" class="tab">Search</a>
    </div>
    <div class="content">
      <fieldset>
        <legend>Categories</legend>
        <div class="content alignStart flexWrap" style="padding-top:0;">
          <div v-for="name of categoryNames" class="w100p">
            <a role="button" class="spacer5-all secondary dispBlock textAlignLeft"
               :href="`/genshin/tutorials/${toParam(name)}`">{{ name }}</a>
          </div>
        </div>
      </fieldset>
    </div>
  </section>
  <template v-if="tutorialsByType">
    <TutorialList :tutorials-by-type="tutorialsByType"
                  :file-format-params="fileFormatParams"
                  :file-format-default_image="fileFormatDefault_image" />
  </template>
  <section v-if="categorySelected && !tutorialsByType" class="card">
    <div class="content">
      <p>Category not found: <b>{{ categorySelected }}</b></p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { TutorialsByType } from '../../../../shared/types/genshin/tutorial-types.ts';
import TutorialList from './TutorialList.vue';
import { toParam } from '../../../../shared/util/stringUtil.ts';

defineProps<{
  categorySelected?: string,
  categoryNames?: string[]
  tutorialsByType?: TutorialsByType,
  fileFormatParams?: string,
  fileFormatDefault_image?: string,
}>();
</script>
