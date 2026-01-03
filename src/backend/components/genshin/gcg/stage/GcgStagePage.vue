<template>
  <template v-if="stage">
    <section class="card">
      <h2>
        <span class="dispBlock" style="margin-top:-5px"><a role="button" class="secondary fontWeight600" style="font-size:14px;padding:3px 8px" href="/genshin/TCG/stages">Back to stages</a></span>
        <span class="dispBlock spacer10-top">{{ stage.WikiCombinedTitle }}</span>
      </h2>
      <div class="tab-list" role="tablist">
        <button role="tab" id="tab-display" :class="`tab ${tab === 'display' ? 'active' : ''}`"
                ui-action="tab: #tabpanel-display, stageTabs; delete-query-param: tab">Display</button>

        <button role="tab" id="tab-wikitext" :class="`tab ${tab === 'wikitext' ? 'active' : ''}`"
                ui-action="tab: #tabpanel-wikitext, stageTabs; set-query-param: tab=wikitext">Wikitext</button>

        <button role="tab" id="tab-json" :class="`tab ${tab === 'json' ? 'active' : ''}`"
                ui-action="tab: #tabpanel-json, stageTabs; set-query-param: tab=json">JSON</button>
      </div>
      <div role="tabpanel" aria-labelledby="tab-display" :class="`tabpanel ${tab === 'display' ? 'active' : 'hide'}`" id="tabpanel-display">
        <div class="content">
          <table class="article-table">
            <thead>
            <tr>
              <th colspan="3">Stage Properties</th>
            </tr>
            </thead>
            <tr>
              <td class="bold" colspan="2">Stage ID</td>
              <td class="w70p"><code>{{ String(stage.Id).padStart(6, '0') }}</code></td>
            </tr>
            <tr>
              <td class="no-border">&nbsp;</td>
              <td class="bold">Enemy Name</td>
              <td class="w70p">
                <div class="valign">
                  <template v-if="stage?.Reward?.TalkDetailIcon">
                    <img :src="`/images/genshin/${stage.Reward.TalkDetailIcon.IconName}.png`" class="framed-icon x42" />
                  </template>
                  <span class="spacer10-left">{{ stage.OppoPlayerNameText || 'n/a' }}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td class="no-border">&nbsp;</td>
              <td class="bold">Level Name</td>
              <td class="w70p">{{ stage?.WikiLevelName || 'n/a' }}</td>
            </tr>
            <tr>
              <td class="no-border">&nbsp;</td>
              <td class="bold">Level Type</td>
              <td class="w70p"><code>{{ stage.LevelType || 'n/a' }}</code></td>
            </tr>
            <tr>
              <td class="no-border">&nbsp;</td>
              <td class="bold" style="padding-left:20px">Wiki Group</td>
              <td class="w70p">{{ stage.WikiGroup || 'No Group' }}</td>
            </tr>
            <tr>
              <td class="no-border">&nbsp;</td>
              <td class="bold" style="padding-left:20px">Wiki Type</td>
              <td class="w70p">{{ stage.WikiType || 'No Type' }}</td>
            </tr>
            <template v-if="stage.LevelDifficulty">
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold" style="padding-left:20px">Level Difficulty</td>
                <td class="w70p">{{ stage.LevelDifficulty === 'NORMAL' ? 'Friendly Fracas' : 'Serious Showdown' }}</td>
              </tr>
            </template>
            <tr>
              <td class="no-border">&nbsp;</td>
              <td class="bold">Min. Player Level</td>
              <td class="w70p">{{ stage.MinPlayerLevel || 'n/a' }}</td>
            </tr>
            <template v-if="stage.Reward">
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold">Intro Text</td>
                <td class="w70p"><Wikitext :value="normGenshinText(stage.Reward.LevelDecText)" :seamless="true" /></td>
              </tr>
            </template>
            <template v-if="stage?.WorldLevel?.MapDescText">
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold">Map Description<br><small class="fontWeight600 opacity70p"><em>Not included in wikitext</em></small></td>
                <td class="w70p"><Wikitext :value="'{{Description|' + normGenshinText(stage.WorldLevel.MapDescText) + '|[[Map]] description}}'" :seamless="true" /></td>
              </tr>
            </template>
          </table>
          <template v-if="stage.LevelLock">
            <table class="article-table">
              <tr>
                <th colspan="3">Ascension Challenge</th>
              </tr>
              <template v-if="stage.LevelLock.UnlockLevel">
                <tr>
                  <td class="no-border">&nbsp;</td>
                  <td class="bold">Player Level</td>
                  <td class="w70p">{{ stage.LevelLock.UnlockLevel }}</td>
                </tr>
              </template>
              <template v-if="stage.LevelLock.UnlockDescText">
                <tr>
                  <td class="no-border">&nbsp;</td>
                  <td class="bold">Description</td>
                  <td class="w70p"><Wikitext :value="normGenshinText(stage.LevelLock.UnlockDescText)" :seamless="true" /></td>
                </tr>
              </template>
              <template v-if="stage.LevelLock.UnlockMainQuestId">
                <tr>
                  <td class="no-border">&nbsp;</td>
                  <td class="bold">Quest Dialogue</td>
                  <td class="w70p">
                    <a class="valign" :href="`/genshin/quests/${stage.LevelLock.UnlockMainQuestId}`" target="_blank">
                      <span class="spacer5-right">{{ stage.LevelLock.QuestTitleText }}</span>
                      <Icon name="external-link" :size="14" />
                    </a>
                  </td>
                </tr>
              </template>
            </table>
          </template>
          <template v-if="stage.Reward">
            <template v-if="stage.Reward.ObjectiveTextList && stage.Reward.ObjectiveTextList.length">
              <table class="article-table">
                <tr>
                  <th colspan="3">Objectives</th>
                </tr>
                <template v-for="[index, objectiveText] of Object.entries(stage.Reward.ObjectiveTextList)">
                  <tr>
                    <td class="no-border">&nbsp;</td>
                    <td class="bold">{{ objectiveText }}</td>
                    <td class="w70p">
                      <div class="spacer10-all">
                        <template v-for="reward of (stage.Reward.ChallengeRewardList?.[index]?.Reward?.RewardItemList || [])">
                          <GenshinItem :item="reward.Material" :item-count="reward.ItemCount" />
                        </template>
                      </div>
                    </td>
                  </tr>
                </template>
              </table>
            </template>
            <template v-if="stage.Reward.MappedFailTips && stage.Reward.MappedFailTips.length">
              <table class="article-table">
                <tr>
                  <th colspan="3" style="line-height:1em">Fail Tips<br><small class="fontWeight600 opacity70p"><em>Not included in wikitext</em></small></th>
                </tr>
                <template v-for="[index, failTipText] of Object.entries(stage.Reward.MappedFailTips)">
                  <tr>
                    <td class="no-border">&nbsp;</td>
                    <td class="bold">Fail Tip {{ (toInt(index) + 1) }}</td>
                    <td class="w70p">{{ failTipText }}</td>
                  </tr>
                </template>
              </table>
            </template>
          </template>
          <template v-if="stage.Rule && false">
            <table class="article-table">
              <tr>
                <th colspan="3">Rule</th>
              </tr>
                <tr>
                  <td class="no-border">&nbsp;</td>
                  <td class="bold">Rule ID</td>
                  <td class="w70p">{{ stage.RuleId }}</td>
                </tr>
                <tr>
                  <td class="no-border">&nbsp;</td>
                  <td class="bold">FirstDrawNum</td>
                  <td class="w70p">{{ stage.Rule.FirstDrawNum }}</td>
                </tr>
                <tr>
                  <td class="no-border">&nbsp;</td>
                  <td class="bold">SecondDrawNum</td>
                  <td class="w70p">{{ stage.Rule.SecondDrawNum }}</td>
                </tr>
                <tr>
                  <td class="no-border">&nbsp;</td>
                  <td class="bold">DrawCardNum</td>
                  <td class="w70p">{{ stage.Rule.DrawCardNum }}</td>
                </tr>
                <tr>
                  <td class="no-border">&nbsp;</td>
                  <td class="bold">HandCardLimit</td>
                  <td class="w70p">{{ stage.Rule.HandCardLimit }}</td>
                </tr>
            </table>
          </template>
          <template v-if="stage.CardGroup">
            <table class="article-table">
              <tr>
                <th colspan="3">Player Deck</th>
              </tr>
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold">Player Card Group ID</td>
                <td class="w70p"><code>{{ stage.CardGroupId }}</code></td>
              </tr>
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold">Deck Name</td>
                <td class="w70p"><code>{{ stage.CardGroup.DeckNameText || 'n/a' }}</code></td>
              </tr>
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold">Active</td>
                <td class="w70p">
                  <template v-for="characterCard of stage.CardGroup.MappedCharacterList">
                    <TcgCard :card="characterCard" />
                  </template>
                </td>
              </tr>
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold">Action</td>
                <td class="w70p">
                  <template v-for="actionCard of stage.CardGroup.MappedCardList">
                    <TcgCard :card="actionCard" />
                  </template>
                </td>
              </tr>
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold">Reserve</td>
                <td class="w70p">
                  <template v-for="characterCard of stage.CardGroup.MappedWaitingCharacterList">
                    <TcgCard :card="characterCard" />
                  </template>
                </td>
              </tr>
            </table>
          </template>
          <template v-if="stage.EnemyCardGroup">
            <table class="article-table">
              <tr>
                <th colspan="3">Enemy Deck</th>
              </tr>
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold">Enemy Card Group ID</td>
                <td class="w70p"><code>{{ stage.EnemyCardGroupId }}</code></td>
              </tr>
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold">Deck Name</td>
                <td class="w70p"><code>{{ stage.EnemyCardGroup.DeckNameText || 'n/a' }}</code></td>
              </tr>
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold">Active</td>
                <td class="w70p">
                  <template v-if="!stage.EnemyCardGroup.MappedCharacterList.length">
                    <code>n/a</code>
                  </template>
                  <template v-else>
                    <Wikitext :value="stage.EnemyCardGroup.WikiActiveText" :seamless="true" />
                    <template v-for="characterCard of stage.EnemyCardGroup.MappedCharacterList">
                      <TcgCard :card="characterCard" />
                    </template>
                  </template>
                </td>
              </tr>
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold">Action</td>
                <td class="w70p">
                  <template v-if="!stage.EnemyCardGroup.MappedCardList.length">
                    <code>n/a</code>
                  </template>
                  <template v-else>
                    <Wikitext :value="stage.EnemyCardGroup.WikiActionText" :seamless="true" />
                    <template v-for="actionCard of stage.EnemyCardGroup.MappedCardList">
                      <TcgCard :card="actionCard" />
                    </template>
                  </template>
                </td>
              </tr>
              <tr>
                <td class="no-border">&nbsp;</td>
                <td class="bold">Reserve</td>
                <td class="w70p">
                  <template v-if="!stage.EnemyCardGroup.MappedWaitingCharacterList.length">
                    <code>n/a</code>
                  </template>
                  <template v-else>
                    <Wikitext :value="stage.EnemyCardGroup.WikiReserveText" :seamless="true" />
                    <template v-for="characterCard of stage.EnemyCardGroup.MappedWaitingCharacterList">
                      <TcgCard :card="characterCard" />
                    </template>
                  </template>
                </td>
              </tr>
            </table>
          </template>
        </div>

        <template v-if="stage.IdleTalk && stage.IdleTalk.children && stage.IdleTalk.children.length">
          <h3 class="secondary-header spacer10-top">Idle Quotes</h3>
          <div class="content">
            <p class="spacer10-bottom">Idle quotes are the same for every stage of the same character (not unique to only this stage).</p>
              <template v-for="sect of stage.IdleTalk.children">
                <DialogueSection :section="sect" />
              </template>
          </div>
        </template>

        <template v-if="stage.StageTalk && stage.StageTalk.children && stage.StageTalk.children.length">
          <h3 class="secondary-header valign spacer10-top">
            <span>Stage Dialogue</span>
            <span class="grow"></span>
            <button class="secondary small" ui-action="copy: #wikitext-stage-dialogue"
                    ui-tippy-hover="Click to copy to clipboard"
                    ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy All</button>
          </h3>
          <div class="content">
            <template v-for="sect of stage.StageTalk.children">
              <DialogueSection :section="sect" />
            </template>
          </div>
        </template>
      </div>
      <div role="tabpanel" aria-labelledby="tab-wikitext" :class="`tabpanel ${tab === 'wikitext' ? 'active' : 'hide'}`" id="tabpanel-wikitext">
        <h3 class="secondary-header valign">
          <span>Stage Template</span>
        </h3>
        <div class="content">
          <Wikitext :id="`wikitext-stage-template`" :value="wikitext" />
        </div>

        <template v-if="stage.IdleTalk && stage.IdleTalk.children && stage.IdleTalk.children.length">
          <h3 class="secondary-header valign spacer10-top">
            <span>Idle Quotes</span>
          </h3>
          <div class="content">
            <Wikitext :id="`wikitext-stage-idles`" :value="wikitext" />
          </div>
        </template>

        <template v-if="stage.StageTalk && stage.StageTalk.children && stage.StageTalk.children.length">
          <h3 class="secondary-header valign spacer10-top">
            <span>Stage Dialogue</span>
          </h3>
          <div class="content">
            <Wikitext :id="`wikitext-stage-dialogue`" :value="wikitext" />
          </div>
        </template>
      </div>
      <div role="tabpanel" aria-labelledby="tab-json" :class="`tabpanel ${tab === 'json' ? 'active' : 'hide'} content`" id="tabpanel-json">
        <JsonText :value="JSON.stringify(stageForJsonUnmapped, null, 2)" />
      </div>
    </section>
  </template>
  <section v-else class="card">
    <h2>TCG Stage not found</h2>
  </section>
</template>

<script setup lang="ts">
import { GCGGameExcelConfigData } from '../../../../../shared/types/genshin/gcg-types.ts';
import Wikitext from '../../../utility/Wikitext.vue';
import DialogueSection from '../../../utility/DialogueSection.vue';
import JsonText from '../../../utility/JsonText.vue';
import Icon from '../../../utility/Icon.vue';
import { useTrace } from '../../../../middleware/request/tracer.ts';
import GenshinItem from '../../links/GenshinItem.vue';
import { toInt } from '../../../../../shared/util/numberUtil.ts';
import TcgCard from '../../links/TcgCard.vue';

const { normGenshinText } = useTrace();

defineProps<{
  stage: GCGGameExcelConfigData,
  stageForJsonUnmapped: GCGGameExcelConfigData,
  wikitext: string,
  dialogueWikitext: string,
  idleWikitext: string,
  tab: 'display' | 'wikitext' | 'json',
}>();
</script>

<style scoped lang="scss">
td:first-of-type.no-border {
  width: 20px;
}

@media (max-width: 950px) {
  td:first-of-type.no-border {
    width: 0 !important;
    padding: 0 !important;
    font-size: 0 !important;
  }
}
</style>
