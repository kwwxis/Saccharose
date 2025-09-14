<template>
  <section class="card" :data-document-title="ctx.getFormattedPageTitle(questTitle || '(No title)')">
    <h2 class="valign">
      <strong>{{ questId }}:</strong>&nbsp;
      <span class="quest-title">{{ questTitle || '(No title)' }}</span>
      <span class="secondary-label small spacer5-left">{{ mainQuest.Type }}</span>
      <template v-if="versionAdded">
        <span class="secondary-label small spacer5-left">{{ versionAdded.displayLabel }}</span>
      </template>
      <span class="grow"></span>
      <a class="help-info fr fontWeight600" style="font-size:15px;cursor:pointer;">Help</a>
    </h2>
    <div id="quest-desc-section" class="content">
      <h4 class="valign">
        <span class="expando spacer5-right" ui-action="expando: #quest-desc-content"><Icon name="chevron-down" :size="17" /></span>
        <span>Quest Description{{ questDescriptions.length > 1 ? 's' : '' }}</span>
      </h4>
      <div id="quest-desc-content">
        <template v-if="!questDescriptions.length">
          <p>(None)</p>
        </template>
        <div v-for="(questDescription, idx) of questDescriptions" class="posRel">
          <Wikitext :id="`quest-desc-${idx}`" :value="questDescription" :extra-style="'padding-right:46px;min-height:40px'" />
          <button class="secondary small posAbs" :ui-action="`copy: #quest-desc-${idx}`"
                  ui-tippy-hover="Click to copy to clipboard"
                  ui-tippy-flash="{content:'Copied!', delay: [0,2000]}"
                  style="right: 0; top: 0;">Copy</button>
        </div>
      </div>
    </div>
    <template v-if="rewardInfoboxList?.length">
      <div id="quest-rewards-section" class="content">
        <h4 class="valign">
          <span class="expando spacer5-right" ui-action="expando: #quest-rewards-content"><Icon name="chevron-down" :size="17" /></span>
          <span>Quest Rewards</span>
        </h4>
        <div id="quest-rewards-content">
          <div v-for="(rewardInfoboxText, idx) of rewardInfoboxList">
            <template v-if="rewardInfoboxList.length > 1">
              <h5>Reward Index {{ idx }}</h5>
              <template v-if="idx === 0">
                <p class="spacer5-bottom">Default reward if no section triggers a specific reward.</p>
              </template>

              <template v-if="!rewardTriggers[idx] || !rewardTriggers[idx].length">
                <template v-if="idx !== 0">
                  <p class="spacer5-bottom">Not triggered by any specific section. May be triggered by some internal game code or script.</p>
                </template>
              </template>
              <template v-else-if="rewardTriggers[idx].length === 1">
                <p class="spacer5-bottom">Triggered by section <a :href="`#Section_${rewardTriggers[idx][0]}`">{{ rewardTriggers[idx][0] }}</a></p>
              </template>
              <template v-else>
                <p class="spacer5-bottom">
                  Triggered by any one of these sections:
                  <template v-for="sectionId of rewardTriggers[idx]">
                    <a :href="`#Section_${sectionId}`">{{ sectionId }}</a>
                  </template>
                </p>
              </template>
            </template>
            <div class="posRel">
              <Wikitext :id="`quest-reward-${idx}`" :value="rewardInfoboxText"
                        :extra-style="'padding-right:46px;min-height:40px'"
                        :is-wiki-template-fragment="true" />
              <button class="secondary small posAbs" :ui-action="`copy: #quest-reward-${idx}`"
                      ui-tippy-hover="Click to copy to clipboard"
                      ui-tippy-flash="{content:'Copied!', delay: [0,2000]}"
                      style="right: 0; top: 0;">Copy</button>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-if="reputationInfobox">
      <div id="quest-reputation-section" class="content">
        <h4 class="valign">
          <span class="expando spacer5-right" ui-action="expando: #quest-reputation-content"><Icon name="chevron-down" :size="17" /></span>
          <span>Quest Reputation</span>
        </h4>
        <div id="quest-reputation-content" class="posRel">
          <Wikitext :id="`quest-reputation-text`" :value="reputationInfobox"
                    :extra-style="'padding-right:46px;min-height:40px'"
                    :is-wiki-template-fragment="true" />
          <button class="secondary small posAbs" ui-action="copy: #quest-reputation-text"
                  ui-tippy-hover="Click to copy to clipboard"
                  ui-tippy-flash="{content:'Copied!', delay: [0,2000]}"
                  style="right: 0; top: 0;">Copy</button>
        </div>
      </div>
    </template>
    <template v-if="npcStrList">
      <div id="quest-characters-section" class="content">
        <h4 class="valign">
          <span class="expando spacer5-right" ui-action="expando: #quest-characters-content"><Icon name="chevron-down" :size="17" /></span>
          <span>Quest Characters</span>
        </h4>
        <div id="quest-characters-content" class="posRel">
          <Wikitext :id="`quest-characters`" :value="npcStrList"
                    :extra-style="'padding-right:46px;min-height:40px'" />
          <button class="secondary small posAbs" ui-action="copy: #quest-characters"
                  ui-tippy-hover="Click to copy to clipboard"
                  ui-tippy-flash="{content:'Copied!', delay: [0,2000]}"
                  style="right: 0; top: 0;">Copy</button>
        </div>
      </div>
    </template>
    <div id="quest-steps-section" class="content">
      <div class="valign">
        <h4 class="valign">
          <span class="expando spacer5-right" ui-action="expando: #quest-steps-content"><Icon name="chevron-down" :size="17" /></span>
          <span>Steps</span>
        </h4>
        <div class="grow"></div>
        <template v-if="stepsWikitext">
          <button class="secondary small" ui-action="copy: #quest-steps"
                  ui-tippy-hover="Click to copy to clipboard"
                  ui-tippy-flash="{content:'Copied!', delay: [0,2000]}"
                  style="margin:5px 0">Copy</button>
        </template>
      </div>
      <div id="quest-steps-content">
        <template v-if="stepsWikitext">
          <Wikitext :id="`quest-steps`" :value="stepsWikitext"
                    :extra-style="'min-height:40px'" />
        </template>
        <template v-else>
          <p>(None)</p>
        </template>
      </div>
    </div>
    <div id="ol-section" class="content">
      <div class="valign">
        <h4 class="valign">
          <span class="expando spacer5-right" ui-action="expando: #ol-content"><Icon name="chevron-down" :size="17" /></span>
          <span>Other Languages</span>
        </h4>
        <div class="grow"></div>
        <template v-if="otherLanguagesWikitext">
          <button class="secondary small" ui-action="copy: #quest-name-ol"
                  ui-tippy-hover="Click to copy to clipboard"
                  ui-tippy-flash="{content:'Copied!', delay: [0,2000]}"
                  style="margin:5px 0">Copy</button>
        </template>
      </div>
      <div id="ol-content">
        <template v-if="otherLanguagesWikitext">
          <Wikitext :id="'quest-name-ol'" :value="otherLanguagesWikitext"
                    :extra-style="'min-height:200px'" />
        </template>
        <template v-else>
          <p>(Not applicable)</p>
        </template>
      </div>
    </div>
    <template v-if="cutscenes.length">
      <div id="cutscene-section" class="content">
        <h4 class="valign">
          <span class="expando spacer5-right" ui-action="expando: #cutscene-content"><Icon name="chevron-down" :size="17" /></span>
          <span>Cutscenes</span>
        </h4>
        <div id="cutscene-content">
          <p>No speaker info is associated with cutscene subtitles. So you'll need to manually figure that out.</p>
          <div v-for="(item, idx) of cutscenes" class="cutscene-info">
            <p><strong>{{ item.file }}</strong></p>
            <div class="posRel">
              <Wikitext :id="`cutscene-${idx}`" :value="item.text"
                        :extra-style="'padding-right:46px;min-height:40px'" />
              <button class="secondary small posAbs" :ui-action="`copy: #cutscene-${idx}`"
                      ui-tippy-hover="Click to copy to clipboard"
                      ui-tippy-flash="{content:'Copied!', delay: [0,2000]}"
                      style="right: 0; top: 0;">Copy</button>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-if="questStills && questStills.length">
      <div id="quest-stills-section">
        <h2 class="primary-header valign">
          <span class="expando spacer5-right" ui-action="expando: #quest-stills-content"><Icon name="chevron-down" :size="17" /></span>
          <span>Quest Stills</span>
        </h2>
        <div id="quest-stills-content" class="content">
          <div class="alignStart flexWrap">
            <template v-for="questStill of questStills">
              <div class="w50p">
                <div class="image-frame spacer3-all">
                  <img :src="`/serve-image/genshin/${questStill.imageName}.png/${questStill.wikiName}.png`" class="w100p" />
                  <span class="image-label">{{ questStill.wikiName }}.png</span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>
    <template v-if="questItemPictureCandidates && questItemPictureCandidates.length">
      <div id="quest-item-pictures-section">
        <h2 class="primary-header valign">
          <span class="expando spacer5-right" ui-action="expando: #quest-item-pictures-content"><Icon name="chevron-down" :size="17" /></span>
          <span>Quest Item Picture Candidates</span>
        </h2>
        <div id="quest-item-pictures-content" class="content">
          <p>This quest contains one or more Quest Item Pictures. The datamined data doesn't have any info as to which picture it is,
            but here is a list of quest item pictures added in the same version as this quest for your convenience.</p>
          <div class="alignStart flexWrap">
            <template v-for="pic of questItemPictureCandidates">
              <div class="w20p">
                <div class="image-frame bordered spacer3-all">
                  <img :src="`/images/genshin/${pic.image_name}.png`" class="w100p" />
                  <span class="image-label" style="word-break: break-all;line-height: 1.2em;">{{ pic.image_name }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>
    <template v-if="inDialogueReadables && inDialogueReadables.length">
      <div id="in-dialogue-readables-section">
        <h2 class="primary-header valign">
          <span class="expando spacer5-right" ui-action="expando: #in-dialogue-readables-content"><Icon name="chevron-down" :size="17" /></span>
          <span>In-Dialogue Readables</span>
        </h2>
        <div id="in-dialogue-readables-content" class="content">
          <template v-for="readable of inDialogueReadables">
            <GenshinReadableLink :readable="readable" />
          </template>
          <div class="alignStart flexWrap">
            <template v-for="readable of inDialogueReadables">
              <template v-for="item of readable.Items">
                <template v-if="item.ReadableText.Images && item.ReadableText.Images.length">
                  <template v-for="image of item.ReadableText.Images">
                    <div class="w25p">
                      <div class="image-frame spacer3-all bordered">
                        <img :src="`/images/genshin/${image}.png`" class="w100p" />
                        <span class="image-label">{{ image }}</span>
                      </div>
                    </div>
                  </template>
                </template>
              </template>
            </template>
          </div>
        </div>
      </div>
    </template>
    <template v-if="similarityGroups && Object.keys(similarityGroups).length">
      <h2>Similar Dialogue Groups</h2>
      <div class="content">
        <p class="spacer5-bottom">There are some dialogue sections in this quest that are similar to other sections. These may potentially for conditional branching. Use the table below to jump to specific sections.</p>
        <p class="spacer5-bottom">Lines that are <b>different</b> from other sections are highlighted in a blue-ish tint.</p>
        <table class="article-table">
          <tr>
            <th>Group No.</th>
            <th>Section Jump Links</th>
            <th class="textAlignRight"><button class="secondary small" style="font-size:13px" data-filter-similarity-group="RESET">Restore all sections</button></th>
          </tr>
          <template v-for="[groupId, sectionInfoList] of Object.entries(similarityGroups)">
            <tr>
              <td class="bold"><span style="white-space: nowrap;padding:0 10px">Group #{{ groupId }}</span></td>
              <td>
                <div style="padding:5px">
                  <template v-for="sectionInfo of sectionInfoList">
                    <a role="button" class="secondary small" :href="`#${sectionInfo.sectionId}`" style="font-size:15px">{{ sectionInfo.sectionId.replaceAll(/_/g, ' ') }}</a>
                  </template>
                </div>
              </td>
              <td class="textAlignRight">
                <button class="secondary small" style="font-size:13px" :data-filter-similarity-group="groupId">Show only this group</button>
              </td>
            </tr>
          </template>
        </table>
      </div>
    </template>
    <h2>Dialogue</h2>
    <div class="dialogue-container">
      <template v-for="section of dialogue">
        <DialogueSection :section="section" />
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { QuestGenerateResult } from '../../../../domain/genshin/dialogue/quest_generator.ts';
import DialogueSection from '../../../utility/DialogueSection.vue';
import Icon from '../../../utility/Icon.vue';
import { getTrace } from '../../../../middleware/request/tracer.ts';
import GenshinReadableLink from '../../links/GenshinReadableLink.vue';
import Wikitext from '../../../utility/Wikitext.vue';

const { ctx } = getTrace();

const { result } = defineProps<{
  result: QuestGenerateResult,
}>();

const {
  mainQuest,
  versionAdded,
  questTitle,
  questId,
  npc,
  stepsWikitext,
  questDescriptions,
  otherLanguagesWikitext,
  dialogue,
  cutscenes,
  rewards,
  reputation,
  rewardInfoboxList,
  reputationInfobox,
  rewardTriggers,
  similarityGroups,
  questStills,
  inDialogueReadables,
  questItemPictureCandidates,
} = result;

const npcStrList: string = result.npc ? result.npc.names.join('; ') : '';
</script>
