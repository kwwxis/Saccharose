<template>
  <section class="card">
    <template v-if="avatars && avatars.length">
      <h2>Character Stories</h2>
      <div class="content dispFlex flexWrap alignStart">
        <template v-for="avatar of avatars">
          <div class="w50p">
            <a class="secondary spacer3-all valign textAlignLeft" role="button"
               :href="`/genshin/character/stories/${toParam(avatar.NameText)}`">
              <img class="icon x32" :src="`/images/genshin/${avatar.IconName}.png`" loading="lazy" decoding="async" />
              <span class="spacer10-left">{{ avatar.NameText }}</span>
            </a>
          </div>
        </template>
      </div>
    </template>
    <template v-if="story">
      <h2 class="valign">
        <img class="framed-icon x42" :src="`/images/genshin/${avatar.IconName}.png`" loading="lazy" decoding="async" />
        <span class="spacer15-left">Character Story &mdash; {{ avatar.NameText }}</span>
      </h2>
      <div class="tab-list" role="tablist">
        <button role="tab" id="tab-display" class="tab" :class="{active: tab === 'display'}"
          ui-action="tab: #tabpanel-display, storyTabs; delete-query-param: tab">Display</button>

        <template v-if="story.hasAlteredStories">
          <button role="tab" id="tab-altered-display" class="tab" :class="{active: tab === 'altered-display'}"
                  ui-action="tab: #tabpanel-altered-display, storyTabs; set-query-param: tab=altered-display">Altered Display</button>
        </template>

        <button role="tab" id="tab-wikitext" class="tab" :class="{active: tab === 'wikitext'}"
                ui-action="tab: #tabpanel-wikitext, storyTabs; set-query-param: tab=wikitext">Wikitext</button>

        <template v-if="story.hasAlteredStories">
          <button role="tab" id="tab-altered-wikitext" class="tab" :class="{active: tab === 'altered-wikitext'}"
                  ui-action="tab: #tabpanel-altered-wikitext, storyTabs; set-query-param: tab=altered-wikitext">Altered Wikitext</button>
        </template>
      </div>
      <div role="tabpanel" id="tabpanel-display" aria-labelledby="tab-display"
           class="tabpanel" :class="{active: tab === 'display', hide: tab !== 'display'}">
        <template v-for="fetter of story.fetters">
          <hr>
          <div class="content">
            <h3 class="title-text">{{ fetter.StoryTitleText }}</h3>
            <div class="valign meta-props">
              <div v-if="fetter.OpenCondsSummary.Friendship" class="prop">
                <span class="prop-label">Friendship Lv.</span>
                <span class="prop-values">
                  <span class="prop-value">{{ fetter.OpenCondsSummary.Friendship }}</span>
                </span>
              </div>
              <div v-if="fetter.OpenCondsSummary.QuestTitleTextMap" class="prop">
                <span class="prop-label">Quest</span>
                <span class="prop-values">
                  <span class="prop-value">{{ fetter.OpenCondsSummary.QuestTitleTextMap[ctx.outputLangCode] }}</span>
                </span>
              </div>
            </div>
            <div class="context-text" v-html="fetter.StoryContextHtml"></div>
          </div>
        </template>
      </div>
      <template v-if="story.hasAlteredStories">
        <div role="tabpanel" id="tabpanel-altered-display" aria-labelledby="tab-altered-display"
             class="tabpanel" :class="{active: tab === 'altered-display', hide: tab !== 'altered-display'}">
          <template v-for="fetter of story.fetters.filter(f => !!f.StoryContext2Html)">
            <hr>
            <div class="content">
              <template v-if="fetter.StoryTitleText === fetter.StoryTitle2Text">
                <h3 class="title-text">{{ fetter.StoryTitle2Text }}</h3>
              </template>
              <template v-else>
                <h3 class="title-text">{{ fetter.StoryTitleText }} <Icon name="arrow-right" :size="14" /> {{ fetter.StoryTitle2Text }}</h3>
              </template>
              <div class="valign meta-props">
                <div v-if="fetter.FinishCondsSummary.Friendship" class="prop">
                  <span class="prop-label">Friendship Lv.</span>
                  <span class="prop-values">
                    <span class="prop-value">{{ fetter.FinishCondsSummary.Friendship }}</span>
                  </span>
                </div>
                <div v-if="fetter.FinishCondsSummary.QuestTitleTextMap" class="prop">
                  <span class="prop-label">Altered after Quest</span>
                  <span class="prop-values">
                    <span class="prop-value">{{ fetter.FinishCondsSummary.QuestTitleTextMap[ctx.outputLangCode] }}</span>
                  </span>
                </div>
              </div>
              <div class="context-text" v-html="fetter.StoryContext2Html"></div>
            </div>
          </template>
        </div>
      </template>
      <div role="tabpanel" id="tabpanel-wikitext" aria-labelledby="tab-wikitext"
           class="tabpanel" :class="{active: tab === 'wikitext', hide: tab !== 'wikitext'}">
        <div class="content">
          <div class="posRel">
            <Wikitext id="story-wikitext" :value="story.wikitext" />
            <button class="secondary posAbs" ui-action="copy: #story-wikitext"
              ui-tippy-hover="Click to copy to clipboard"
              ui-tippy-flash="{content:'Copied!', delay: [0,2000]}"
              style="right: 0; top: 0;">Copy</button>
          </div>
        </div>
      </div>
      <div v-if="story.hasAlteredStories"
           role="tabpanel" id="tabpanel-altered-wikitext" aria-labelledby="tab-altered-wikitext"
           class="tabpanel" :class="{active: tab === 'altered-wikitext', hide: tab !== 'altered-wikitext'}">
        <div class="content">
          <div class="posRel">
            <Wikitext id="story-altered-wikitext" :value="story.alteredWikitext" />
            <button class="secondary posAbs" ui-action="copy: #story-altered-wikitext"
                    ui-tippy-hover="Click to copy to clipboard"
                    ui-tippy-flash="{content:'Copied!', delay: [0,2000]}"
                    style="right: 0; top: 0;">Copy</button>
          </div>
        </div>
      </div>
    </template>
    <template v-if="!avatars && !story">
      <h2>Character Stories</h2>
      <div class="content">
        <p>Character not found for "<code>{{ avatarId }}</code>"</p>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { AvatarExcelConfigData } from '../../../../shared/types/genshin/avatar-types.ts';
import { StoryFetters } from '../../../../shared/types/genshin/fetter-types.ts';
import Wikitext from '../../utility/Wikitext.vue';
import { useTrace } from '../../../middleware/request/tracer.ts';
import Icon from '../../utility/Icon.vue';
import { toParam } from '../../../../shared/util/stringUtil.ts';
import MetaProps from '../../shared/MetaProps.vue';

const { ctx } = useTrace();

defineProps<{
  avatars?: AvatarExcelConfigData[],

  avatar?: AvatarExcelConfigData,
  avatarId?: string|number,
  story?: StoryFetters,
  tab?: string,
}>()
</script>

