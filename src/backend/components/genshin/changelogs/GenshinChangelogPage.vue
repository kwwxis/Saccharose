<template>
  <div id="new-summary-toc-parent"></div>
  <section class="card">
    <h2 class="valign">
      <a href="/changelog" style="text-decoration: none">Changelogs</a>
      <Icon name="chevron-right" />
      <span>{{ genshinVersion.previous }} &ndash; {{ genshinVersion.number }}</span>
    </h2>

    <div id="tablist-changelogAreas" class="tab-list" role="tablist">
      <button id="tab-newSummary" role="tab" class="tab active" ui-action="tab: #tabpanel-newSummary, changelogAreas">
        New Summary
      </button>
      <button id="tab-byExcels" role="tab" class="tab" ui-action="tab: #tabpanel-byExcels, changelogAreas">
        By Excels
      </button>
    </div>

    <div id="tabpanel-newSummary" role="tabpanel" aria-labelledby="tab-newSummary" class="tabpanel active">
      <div class="info-notice open-sans-font valign" style="font-size:13px">
        <span>Summary of new records from {{ genshinVersion.previous }} to {{ genshinVersion.number }}.</span>
        <span class="grow"></span>
        <button id="new-summary-toc-show-button" class="secondary small hide" ui-action="remove-class: #new-summary-toc, out1">Show Table of Contents</button>
        <button id="new-summary-collapse-all-button" class="secondary small spacer5-left" >Collapse All</button>
      </div>
      <h3 id="new-characters-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-characters-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Characters</span>
        <span class="new-summary-section-count">{{ newSummary.avatars.length }}</span>
      </h3>
      <div id="new-characters-content" class="new-summary-section-content content alignStart flexWrap">
        <div class="alignStart spacer25-right" v-for="avatar of newSummary.avatars">
          <img class="framed-icon x64" :src="`/images/genshin/${avatar.IconName}.png`" loading="lazy" decoding="async" />
          <div class="spacer5-left">
            <strong class="dispBlock">{{ avatar.NameText }}</strong>
            <a class="dispBlock" style="font-size:15px" :href="`/character/stories/${toParam(avatar.NameText)}`">Character Story</a>
            <a class="dispBlock" style="font-size:15px" :href="`/character/companion-dialogue/${toParam(avatar.NameText)}`">Serenitea Pot Dialogue</a>
            <a class="dispBlock" style="font-size:15px" :href="`/character/VO/${toParam(avatar.NameText)}`">Character VO</a>
          </div>
        </div>
        <div v-if="!newSummary.avatars.length">
          <p>(None)</p>
        </div>
      </div>

      <h3 id="new-weapons-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-weapons-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Weapons</span>
        <span class="new-summary-section-count">{{ newSummary.weapons.length }}</span>
      </h3>
      <div id="new-weapons-content" class="new-summary-section-content content alignStart flexWrap">
        <template v-for="weapon of newSummary.weapons">
          <GenshinItem :item="weapon" />
        </template>
        <div v-if="!newSummary.weapons.length">
          <p>(None)</p>
        </div>
      </div>

      <h3 id="new-foods-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-foods-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Materials: Foods</span>
        <span class="new-summary-section-count">{{ newSummary.foods.length }}</span>
      </h3>
      <div id="new-foods-content" class="new-summary-section-content content alignStart flexWrap">
        <template v-for="food of newSummary.foods">
          <GenshinItem :item="food" />
        </template>
        <div v-if="!newSummary.foods.length">
          <p>(None)</p>
        </div>
      </div>

      <h3 id="new-tcg-materials-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-tcg-materials-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Materials: TCG</span>
        <span class="new-summary-section-count">{{ newSummary.tcgItems.length }}</span>
      </h3>
      <div id="new-tcg-materials-content" class="new-summary-section-content content alignStart flexWrap">
        <template v-for="item of newSummary.tcgItems">
          <GenshinItem :item="item" />
        </template>
        <div v-if="!newSummary.tcgItems.length">
          <p>(None)</p>
        </div>
      </div>

      <h3 id="new-blueprints-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-blueprints-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Materials: Blueprints</span>
        <span class="new-summary-section-count">{{ newSummary.blueprints.length }}</span>
      </h3>
      <div id="new-blueprints-content" class="new-summary-section-content content alignStart flexWrap">
        <template v-for="item of newSummary.blueprints">
          <GenshinItem :item="item" />
        </template>
        <div v-if="!newSummary.blueprints.length">
          <p>(None)</p>
        </div>
      </div>

      <h3 id="new-avatar-material-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-avatar-material-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Materials: Avatar Items, Constellations, &amp; Namecards</span>
        <span class="new-summary-section-count">{{ newSummary.avatarItems.length }}</span>
      </h3>
      <div id="new-avatar-material-content" class="new-summary-section-content content alignStart flexWrap">
        <template v-for="item of newSummary.avatarItems">
          <GenshinItem :item="item" />
        </template>
        <div v-if="!newSummary.avatarItems.length">
          <p>(None)</p>
        </div>
      </div>

      <h3 id="new-items-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-items-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Materials: Items</span>
        <span class="new-summary-section-count">{{ newSummary.items.length }}</span>
      </h3>
      <div id="new-items-content" class="new-summary-section-content content alignStart flexWrap">
        <template v-for="item of newSummary.items">
          <GenshinItem :item="item" />
        </template>
        <div v-if="!newSummary.items.length">
          <p>(None)</p>
        </div>
      </div>

      <h3 id="new-artifacts-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-artifacts-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Artifacts</span>
        <span class="new-summary-section-count">0</span>
      </h3>
      <div id="new-artifacts-content" class="new-summary-section-content content alignStart flexWrap">
        <p>Artifacts not implemented by Saccharose at this time.</p>
      </div>

      <h3 id="new-furnishings-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-furnishings-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Furnishings</span>
        <span class="new-summary-section-count">{{ newSummary.furnishings.length }}</span>
      </h3>
      <div id="new-furnishings-content" class="new-summary-section-content content alignStart flexWrap">
        <template v-for="item of newSummary.furnishings">
          <GenshinItem :item="item" />
        </template>
        <div v-if="!newSummary.furnishings.length">
          <p>(None)</p>
        </div>
      </div>

      <h3 id="new-furnishing-sets-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-furnishing-sets-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Furnishing Sets</span>
        <span class="new-summary-section-count">{{ newSummary.furnishingSets.length }}</span>
      </h3>
      <div id="new-furnishing-sets-content" class="new-summary-section-content content alignStart">
        <div v-if="newSummary.furnishingSets.length" v-for="setList of [
          newSummary.furnishingSets.slice(0, Math.ceil(newSummary.furnishingSets.length / 2)),
          newSummary.furnishingSets.slice(Math.ceil(newSummary.furnishingSets.length / 2))
        ]" class="w50p">
          <div style="padding:0 5px">
            <table class="article-table">
              <tr style="font-size: 14px;text-align: left;line-height: 16px;">
                <th>ID</th>
                <th>Name</th>
                <th>Favors</th>
                <th>Image</th>
              </tr>
              <tr class="furnishing-set-row" v-for="suite of setList" :data-id="suite.SuiteId">
                <td class="code">{{suite.SuiteId}}</td>
                <td style="font-size:15px"><a :href="`/furnishing-sets/${suite.SuiteId}`">{{suite.SuiteNameText}}</a></td>
                <td style="width:180px">
                  <div v-if="!!suite.FavoriteNpcVec?.length" class="dispFlex flexWrap">
                    <template v-for="npc of suite.FavoriteNpcVec">
                      <img class="icon framed-icon x48 spacer3-all" :src="`/images/genshin/${npc.Avatar.IconName}.png`" loading="lazy" decoding="async" />
                    </template>
                  </div>
                </td>
                <td style="width:250px">
                  <img v-if="suite.ItemIcon" class="w100p" style="height:100px;width:auto"
                       :src="`/serve-image/genshin/${suite.ItemIcon}.png/Furnishing Set ${encodeURIComponent(suite.SuiteNameText)} Display.png`"
                       loading="lazy" decoding="async" />
                </td>
              </tr>
            </table>
          </div>
        </div>
        <div v-if="!newSummary.furnishingSets.length">
          <p>(None)</p>
        </div>
      </div>

      <h3 id="new-monsters-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-monsters-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Living Beings: Monsters</span>
        <span class="new-summary-section-count">{{ newSummary.monsters.length }}</span>
      </h3>
      <div id="new-monsters-content">
        <div class="content">
          <p>May contain special variants of enemies with the same name as an already existing enemy.</p>
        </div>
        <div class="content alignStart flexWrap">
          <GenshinLb v-for="monster of newSummary.monsters" :monster="monster" />
        </div>
        <div v-if="!newSummary.monsters.length">
          <p>(None)</p>
        </div>
      </div>

      <h3 id="new-wildlife-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-wildlife-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Living Beings: Wildlife</span>
        <span class="new-summary-section-count">{{ newSummary.wildlife.length }}</span>
      </h3>
      <div id="new-wildlife-content" class="new-summary-section-content content alignStart flexWrap">
        <GenshinLb v-for="monster of newSummary.wildlife" :monster="monster" />
        <div v-if="!newSummary.wildlife.length">
          <p>(None)</p>
        </div>
      </div>

      <h3 id="new-tcg-character-cards-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-tcg-character-cards-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New TCG Cards: Character Cards</span>
        <span class="new-summary-section-count">{{ newSummary.tcgCharacterCards.length }}</span>
      </h3>
      <div id="new-tcg-character-cards-content" class="new-summary-section-content content alignStart flexWrap">
        <TcgCard v-for="card of newSummary.tcgCharacterCards" :card="card" />
        <div v-if="!newSummary.tcgCharacterCards.length">
          <p>(None)</p>
        </div>
      </div>

      <h3 id="new-tcg-action-cards-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-tcg-action-cards-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New TCG Cards: Action Cards</span>
        <span class="new-summary-section-count">{{ newSummary.tcgActionCards.length }}</span>
      </h3>
      <div id="new-tcg-action-cards-content" class="new-summary-section-content content alignStart flexWrap">
        <TcgCard v-for="card of newSummary.tcgActionCards" :card="card" />
        <div v-if="!newSummary.tcgActionCards.length">
          <p>(None)</p>
        </div>
      </div>

      <h3 id="new-tcg-stages-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-tcg-stages-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New TCG Stages</span>
        <span class="new-summary-section-count">{{ newSummary.tcgStages.length }}</span>
      </h3>
      <div id="new-tcg-stages-content" class="new-summary-section-content content">
        <table class="article-table" v-if="newSummary.tcgStages.length">
          <tr style="font-size: 14px;text-align: left;line-height: 16px;">
            <th>Icon</th>
            <th>ID</th>
            <th>Character</th>
            <th>Stage</th>
            <th>Internal<br/>Type</th>
            <th>Wiki<br/>Group</th>
            <th>Wiki<br/>Type</th>
          </tr>
          <tr v-for="stage of newSummary.tcgStages" style="font-size:15px">
            <td>
              <img v-if="stage?.Reward?.TalkDetailIcon?.IconName"
                   :src="`/images/genshin/${stage.Reward.TalkDetailIcon.IconName}.png`" class="framed-icon x42" />
            </td>
            <td>
              <span class="code" style="font-size:14px">{{ String(stage.Id).padStart(6, '0') }}</span>
            </td>
            <td>
              <span>{{ stage.WikiCharacter }}</span>
            </td>
            <td>
              <a :href="`/TCG/stages/${String(stage.Id).padStart(6, '0')}`" role="button"
                 class="spacer5-all secondary dispBlock textAlignLeft">{{ stage.WikiLevelName }}</a>
            </td>
            <td>
              <span class="code" style="font-size:14px">{{ stage.LevelType }}</span>
            </td>
            <td>
              <span style="display:inline-block;font-size:14px;line-height:18px;">{{ stage.WikiGroup || 'No Group' }}</span>
            </td>
            <td>
              <span style="display:inline-block;font-size:14px;line-height:18px;">{{ stage.WikiType || 'No Type' }}</span>
            </td>
          </tr>
        </table>
        <div v-if="!newSummary.tcgStages.length">
          <p>(None)</p>
        </div>
      </div>

      <h3 id="new-viewpoints-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-viewpoints-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Viewpoints</span>
        <span class="new-summary-section-count">{{ newSummary.viewpoints.length }}</span>
      </h3>
      <div id="new-viewpoints-content" class="new-summary-section-content content">
        <table class="article-table" v-if="newSummary.viewpoints.length">
          <tr>
            <th>Title</th>
            <th>Subarea</th>
            <th>Area</th>
            <th>Region</th>
            <th>Text</th>
            <th>Image</th>
          </tr>
          <tr v-for="viewpoint of newSummary.viewpoints" style="font-size:15px">
            <td><a :href="`/viewpoints/${viewpoint.CityNameText}#viewpoint-${viewpoint.Id}`">{{ viewpoint.NameText }}</a></td>
            <td>{{ viewpoint.WorldArea.AreaNameText || '' }}</td>
            <td>{{ viewpoint.ParentWorldArea ? viewpoint.ParentWorldArea.AreaNameText : '' }}</td>
            <td>{{ viewpoint.CityNameText }}</td>
            <td><Wikitext :value="viewpoint.DescText ? trace.normGenshinText(viewpoint.DescText) : ''" :seamless="true" /></td>
            <td>
              <img :src="`/serve-image/genshin/${viewpoint.Image}.png/${viewpoint.DownloadImage}`"
                   loading="lazy" decoding="async" style="height:100px" />
            </td>
          </tr>
        </table>
        <div v-if="!newSummary.viewpoints.length">
          <p>(None)</p>
        </div>
      </div>

      <h3 id="new-loading-tips-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-loading-tips-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Loading Tips</span>
        <span class="new-summary-section-count">{{ newSummary.loadingTips.length }}</span>
      </h3>
      <div id="new-loading-tips-content" class="new-summary-section-content content">
        <table class="article-table" v-if="newSummary.loadingTips.length" style="font-size:15px">
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Enabled by</th>
            <th>Disabled by</th>
          </tr>
          <tr v-for="tip of newSummary.loadingTips">
            <td>{{ tip.TipsTitleText }}</td>
            <td><Wikitext :value="trace.normGenshinText(tip.TipsDescText)" :seamless="true" /></td>
            <td><a v-if="tip.EnableMainQuestName" :href="`/quests/${tip.EnableMainQuestId}`">{{ tip.EnableMainQuestName }}</a></td>
            <td><a v-if="tip.DisableMainQuestName" :href="`/quests/${tip.DisableMainQuestId}`">{{ tip.DisableMainQuestName }}</a></td>
          </tr>
        </table>
        <div v-if="!newSummary.loadingTips.length">
          <p>(None)</p>
        </div>
      </div>

      <h3 id="new-achievements-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-achievements-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Achievements</span>
        <span class="new-summary-section-count">{{ newSummary.achievements.length }}</span>
      </h3>
      <div id="new-achievements-content" class="new-summary-section-content content">
        <table class="article-table" v-if="newSummary.achievements.length" style="font-size:15px">
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Description</th>
            <th>Category</th>
            <th>Primogems</th>
          </tr>
          <tr v-for="achievement of newSummary.achievements">
            <td class="code"><a :href="`/achievements/${achievement.Id}`">{{ achievement.Id }}</a></td>
            <td><a :href="`/achievements/${achievement.Id}`">{{ achievement.TitleText }}</a></td>
            <td><Wikitext :value="trace.normGenshinText(achievement.DescText)" :seamless="true" /></td>
            <td><a :href="`/achievements/${toParam(achievement.Goal.NameText)}`">{{ achievement.Goal.NameText }}</a></td>
            <td>{{ achievement.FinishReward.RewardSummary.PrimogemCount }}</td>
          </tr>
        </table>
        <div v-if="!newSummary.achievements.length">
          <p>(None)</p>
        </div>
      </div>

      <h3 id="new-tutorials-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-tutorials-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Tutorials</span>
        <span class="new-summary-section-count">{{ newSummary.tutorials.length }}</span>
      </h3>
      <div id="new-tutorials-content" class="new-summary-section-content content">
        <table class="article-table" v-if="newSummary.tutorials.length" style="font-size:15px">
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Subtitle</th>
            <th>Wikitext</th>
            <th>Type</th>
            <th>Transclude</th>
            <th>Images</th>
          </tr>
          <tr v-for="tutorial of newSummary.tutorials">
            <td class="code" style="vertical-align: top">{{ tutorial.Id }}</td>
            <td style="vertical-align: top">{{ tutorial.PushTip?.TitleText || '(No title)' }}</td>
            <td style="vertical-align: top">{{ tutorial.PushTip?.SubtitleText || '' }}</td>
            <td style="vertical-align: top"><Wikitext :value="tutorial.Wikitext" :seamless="true" /></td>
            <td style="vertical-align: top"><a :href="`/tutorials/${toParam(tutorial.CodexTypeName)}`">{{ tutorial.CodexTypeName }}</a></td>
            <td style="vertical-align: top">
              <Wikitext v-if="tutorial.PushTip?.TitleText" :value="`{{Tutorial|${tutorial.PushTip.TitleText}}}`" :seamless="true" />
            </td>
            <td style="vertical-align: top">
              <div v-for="image of tutorial.Images">
                <img class="w100p" style="height:100px;width:auto"
                     :src="`/serve-image/genshin/${image.originalName}.png/${image.downloadName}`"
                     loading="lazy" decoding="async" />
              </div>
            </td>
          </tr>
        </table>
        <div v-if="!newSummary.tutorials.length">
          <p>(None)</p>
        </div>
      </div>

      <h3 id="new-readables-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-readables-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Readables</span>
        <span class="new-summary-section-count">{{ newReadablesCount }}</span>
      </h3>
      <div id="new-readables-content">
        <div v-if="!newReadablesCount">
          <p>(None)</p>
        </div>
        <template v-if="Object.values(newSummary.readables.BookCollections).length">
          <h4 class="content" style="padding-bottom:0">Book Collections</h4>
          <div class="content">
            <div class="w100p spacer-top" v-for="collection of Object.values(newSummary.readables.BookCollections)">
              <a class="secondary spacer3-all valign textAlignLeft" role="button" :href="`/readables/book-collection/${collection.Id}`">
                <img class="icon x32" :src="`/images/genshin/${collection.Books[0]?.Material?.Icon}.png`" loading="lazy" decoding="async" />
                <span class="spacer10-left">{{ collection.SuitNameText }}</span>
              </a>
              <div style="padding-left:20px">
                <div class="w100p" v-for="readable of collection.Books">
                  <GenshinReadableLink :readable-view="readable" />
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-if="newSummary.readables.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_QUEST').length">
          <h4 class="content" style="padding-bottom:0">Quest Items</h4>
          <div class="content dispFlex flexWrap alignStart">
            <div class="w50p" v-for="readable of newSummary.readables.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_QUEST')">
              <GenshinReadableLink :readable-view="readable" />
            </div>
          </div>
        </template>
        <template v-if="newSummary.readables.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_FLYCLOAK').length">
          <h4 class="content" style="padding-bottom:0">Glider Descriptions</h4>
          <div class="content dispFlex flexWrap alignStart">
            <div class="w50p" v-for="readable of newSummary.readables.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_FLYCLOAK')">
              <GenshinReadableLink :readable-view="readable" />
            </div>
          </div>
        </template>
        <template v-if="newSummary.readables.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_COSTUME').length">
          <h4 class="content" style="padding-bottom:0">Costume Descriptions</h4>
          <div class="content dispFlex flexWrap alignStart">
            <div class="w50p" v-for="readable of newSummary.readables.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_COSTUME')">
              <GenshinReadableLink :readable-view="readable" />
            </div>
          </div>
        </template>
        <template v-if="newSummary.readables.Weapons.length">
          <h4 class="content" style="padding-bottom:0">Weapons</h4>
          <div class="content dispFlex flexWrap alignStart">
            <div class="w50p" v-for="readable of newSummary.readables.Weapons">
              <GenshinReadableLink :readable-view="readable" />
            </div>
          </div>
        </template>
        <template v-if="newSummary.readables.Artifacts.length">
          <h4 class="content" style="padding-bottom:0">Artifacts</h4>
          <div class="content dispFlex flexWrap alignStart">
            <div class="w50p" v-for="readable of newSummary.readables.Artifacts">
              <GenshinReadableLink :readable-view="readable" />
            </div>
          </div>
        </template>
      </div>

      <h3 id="new-chapters-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-chapters-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Chapters</span>
        <span class="new-summary-section-count">{{ newChaptersCount }}</span>
      </h3>
      <div id="new-chapters-content">
        <div v-if="!newChaptersCount">
          <p>(None)</p>
        </div>
        <template v-if="Object.keys(newSummary.chapters.AQ).length">
          <h4 class="content" style="padding-bottom:0">New Archon Quest Chapters</h4>
          <div class="content" v-for="entry1 of chapterGroup1('AQ')">
            <div v-for="entry2 of chapterGroup2('AQ', entry1.chapterName)">
              <div class="spacer15-bottom" v-for="chapter of entry2.chapters">
                <a class="secondary spacer3-all valign textAlignLeft" role="button" :href="`/chapters/${chapter.Id}`">
                  <img v-if="chapter.ChapterIcon"
                       :src="`/images/genshin/${chapter.ChapterIcon}.png`" class="spacer10-right" loading="lazy" decoding="async"
                       style="width:48px;height:48px;background:#333;border-radius:50%;border:1px solid #fff;"/>
                  <span>{{ entry1.chapterName }}</span>
                  <span>&nbsp;&mdash;&nbsp;</span>
                  <span>{{ entry2.subChapterName }}</span>
                  <span>&nbsp;&mdash;&nbsp;</span>
                  <template v-if="chapter.Summary.ActNumText">
                    <span>{{ chapter.Summary.ActNumText }}</span>
                    <span>:&nbsp;</span>
                  </template>
                  <strong>{{ chapter.Summary.ActName }}</strong>
                </a>
                <div style="padding-left:72px">
                  <GenshinChapterListItem :quests="chapter.OrderedQuests" />
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-if="Object.keys(newSummary.chapters.SQ).length">
          <h4 class="content" style="padding-bottom:0">New Story Quest Chapters</h4>
          <div class="content" v-for="entry1 of chapterGroup1('SQ')">
            <div v-for="entry2 of chapterGroup2('SQ', entry1.chapterName)">
              <div class="spacer15-bottom" v-for="chapter of entry2.chapters">
                <a class="secondary spacer3-all valign textAlignLeft" role="button" :href="`/chapters/${chapter.Id}`">
                  <img v-if="chapter.ChapterIcon"
                       :src="`/images/genshin/${chapter.ChapterIcon}.png`" class="spacer10-right" loading="lazy" decoding="async"
                       style="width:48px;height:48px;background:#333;border-radius:50%;border:1px solid #fff;"/>
                  <span>{{ entry1.chapterName }}</span>
                  <span>&nbsp;&mdash;&nbsp;</span>
                  <span>{{ entry2.subChapterName }}</span>
                  <span>&nbsp;&mdash;&nbsp;</span>
                  <template v-if="chapter.Summary.ActNumText">
                    <span>{{ chapter.Summary.ActNumText }}</span>
                    <span>:&nbsp;</span>
                  </template>
                  <strong>{{ chapter.Summary.ActName }}</strong>
                </a>
                <div style="padding-left:72px">
                  <GenshinChapterListItem :quests="chapter.OrderedQuests" />
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-if="Object.keys(newSummary.chapters.EQ).length">
          <h4 class="content" style="padding-bottom:0">New Event Quest Chapters</h4>
          <div class="content" v-for="(chapters, chapterName) in newSummary.chapters.EQ">
            <div class="spacer15-bottom" v-for="chapter of chapters">
              <a class="secondary spacer3-all valign textAlignLeft" role="button" :href="`/chapters/${chapter.Id}`">
                <img v-if="chapter.ChapterIcon"
                     :src="`/images/genshin/${chapter.ChapterIcon}.png`" class="spacer10-right" loading="lazy" decoding="async"
                     style="width:48px;height:48px;background:#333;border-radius:50%;border:1px solid #fff;"/>
                <span>{{ chapterName }}</span>
                <span>&nbsp;&mdash;&nbsp;</span>
                <template v-if="chapter.Summary.ActNumText">
                  <span>{{ chapter.Summary.ActNumText }}</span>
                  <span>:&nbsp;</span>
                </template>
                <strong>{{ chapter.Summary.ActName }}</strong>
              </a>
              <div style="padding-left:72px">
                <GenshinChapterListItem :quests="chapter.OrderedQuests" />
              </div>
            </div>
          </div>
        </template>

        <template v-if="Object.keys(newSummary.chapters.WQ).length">
          <h4 class="content" style="padding-bottom:0">New World Quest Chapters</h4>
          <div class="content" v-for="(chapters, chapterName) in newSummary.chapters.WQ">
            <div class="spacer15-bottom" v-for="chapter of chapters">
              <a class="secondary spacer3-all valign textAlignLeft" role="button" :href="`/chapters/${chapter.Id}`">
                <img v-if="chapter.ChapterIcon"
                     :src="`/images/genshin/${chapter.ChapterIcon}.png`" class="spacer10-right" loading="lazy" decoding="async"
                     style="width:48px;height:48px;background:#333;border-radius:50%;border:1px solid #fff;"/>
                <span>{{ chapterName }}</span>
                <span>&nbsp;&mdash;&nbsp;</span>
                <template v-if="chapter.Summary.ActNumText">
                  <span>{{ chapter.Summary.ActNumText }}</span>
                  <span>:&nbsp;</span>
                </template>
                <strong>{{ chapter.Summary.ActName }}</strong>
              </a>
              <div style="padding-left:72px">
                <GenshinChapterListItem :quests="chapter.OrderedQuests" />
              </div>
            </div>
          </div>
        </template>
      </div>

      <h3 id="new-non-chapter-quests-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-non-chapter-quests-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Non-Chapter Quests</span>
        <span class="new-summary-section-count">{{ newSummary.nonChapterQuests.length }}</span>
      </h3>
      <div id="new-non-chapter-quests-content" class="new-summary-section-content content">
        <div v-if="!newSummary.nonChapterQuests.length">
          <p>(None)</p>
        </div>
        <div v-for="mainQuest of newSummary.nonChapterQuests">
          <a class="secondary dispBlock spacer5-bottom textAlignLeft" role="button" :href="`/quests/${mainQuest.Id}`">
            <strong>ID {{ mainQuest.Id }} {{ mainQuest.Type }}:&nbsp;</strong>
            <span>{{ mainQuest.TitleText }}</span>
          </a>
        </div>
      </div>

      <h3 id="new-hidden-quests-header" class="new-summary-section-header secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-hidden-quests-content"><Icon name="chevron-down" :size="17" /></span>
        <span class="new-summary-section-title">New Hidden Quests</span>
        <span class="new-summary-section-count">{{ newSummary.hiddenQuests.length }}</span>
      </h3>
      <div id="new-hidden-quests-content" class="new-summary-section-content content">
        <div v-if="!newSummary.hiddenQuests.length">
          <p>(None)</p>
        </div>
        <div v-for="mainQuest of newSummary.hiddenQuests">
          <a class="secondary dispBlock spacer5-bottom textAlignLeft" role="button" :href="`/quests/${mainQuest.Id}`">
            <strong>ID {{ mainQuest.Id }}:&nbsp;</strong>
            <span>(No title)</span>
          </a>
        </div>
      </div>
    </div>

    <div id="tabpanel-byExcels" role="tabpanel" aria-labelledby="tab-byExcels" class="tabpanel hide">
      <div class="content">
        <p class="info-notice">Only certain Excel files are available in this list, if you'd like one that's not present
        here to be added, let kwwxis know.</p>
      </div>
      <template v-for="excelFileChanges of sort(Object.values(fullChangelog.excelChangelog), 'name')">
        <h3 class="secondary-header valign">{{ excelFileChanges.name }}</h3>
        <div class="content">
          <dl>
            <dt>Added records</dt>
            <dd>{{ Object.values(excelFileChanges.changedRecords).filter(r => r.changeType === 'added').length }}</dd>
            <dt>Updated records</dt>
            <dd>{{ Object.values(excelFileChanges.changedRecords).filter(r => r.changeType === 'updated').length }}</dd>
            <dt>Removed records</dt>
            <dd>{{ Object.values(excelFileChanges.changedRecords).filter(r => r.changeType === 'removed').length }}</dd>
            <dt>
              <a role="button" class="secondary spacer5-top" :href="`/changelog/${genshinVersion.number}/${excelFileChanges.name}`">Browse records</a>
            </dt>
            <dd><!-- intentionally empty --></dd>
          </dl>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { arraySum, sort } from '../../../../shared/util/arrayUtil.ts';
import { GameVersion } from '../../../../shared/types/game-versions.ts';
import { FullChangelog } from '../../../../shared/types/changelog-types.ts';
import Icon from '../../utility/Icon.vue';
import { GenshinChangelogNewRecordSummary } from '../../../domain/genshin/changelog/genshinChangelogHelpers.ts';
import { toParam } from '../../../../shared/util/stringUtil.ts';
import GenshinItem from '../../utility/GenshinItem.vue';
import GenshinLb from '../../utility/GenshinLb.vue';
import TcgCard from '../../utility/TcgCard.vue';
import { getTrace } from '../../../middleware/request/tracer.ts';
import Wikitext from '../../utility/Wikitext.vue';
import GenshinReadableLink from '../../utility/GenshinReadableLink.vue';
import { ChapterExcelConfigData } from '../../../../shared/types/genshin/quest-types.ts';
import GenshinChapterListItem from '../chapters/GenshinChapterListItem.vue';

const {newSummary} = defineProps<{
  genshinVersion: GameVersion,
  fullChangelog: FullChangelog,
  newSummary: GenshinChangelogNewRecordSummary,
}>();

const trace = getTrace();

function chapterGroup1(code: 'AQ' | 'SQ'): { chapterName: string, subChapters: {[subChapterName: string]: ChapterExcelConfigData[]} }[] {
  return Object.entries(newSummary.chapters[code]).map(([chapterName, subChapters]) => ({
    chapterName,
    subChapters
  }));
}

function chapterGroup2(code: 'AQ' | 'SQ', chapterName: string): {subChapterName: string, chapters: ChapterExcelConfigData[]}[] {
  return Object.entries(newSummary.chapters[code][chapterName]).map(([subChapterName, chapters]) => ({
    subChapterName,
    chapters
  }));
}

let newChaptersCount: number = 0;
let newReadablesCount: number = 0;

for (let entry1 of chapterGroup1('AQ')) {
  for (let entry2 of chapterGroup2('AQ', entry1.chapterName)) {
    newChaptersCount += entry2.chapters.length;
  }
}
for (let entry1 of chapterGroup1('SQ')) {
  for (let entry2 of chapterGroup2('SQ', entry1.chapterName)) {
    newChaptersCount += entry2.chapters.length;
  }
}
newChaptersCount += arraySum(Object.values(newSummary.chapters.EQ).map(chapters => chapters.length));
newChaptersCount += arraySum(Object.values(newSummary.chapters.WQ).map(chapters => chapters.length));

for (let collection of Object.values(newSummary.readables.BookCollections)) {
  newReadablesCount += collection.Books.length;
}
newReadablesCount += newSummary.readables.Materials.length;
newReadablesCount += newSummary.readables.Weapons.length;
newReadablesCount += newSummary.readables.Artifacts.length;
</script>
