<template>
  <template v-if="material">
    <section class="card">
      <h2>
        <span class="dispBlock" style="margin-top:-5px"><a role="button" class="secondary fontWeight600" style="font-size:14px;padding:3px 8px" href="/genshin/items">Back to items search</a></span>
        <span class="valign spacer10-top">
          <img class="framed-icon x36" :src="material.IconUrl" loading="lazy" decoding="async" />
          <span class="spacer15-left">{{ material.NameText }}</span>
          <span class="grow"></span>
          <a :href="material.DownloadIconUrl" role="button" class="primary primary--2 small valign">
            <Icon name="download" :size="17" :props="{class: 'spacer5-right'}" /> Download icon for wiki</a>
        </span>
      </h2>
      <div class="content">
        <table class="article-table">
          <tr>
            <td style="width:150px" class="bold">ID</td>
            <td>{{ String(material.Id).padStart(6, '0') }}</td>
            <td rowspan="2" style="width:100px">
              <div class="fr">
                <GenshinItem :item="material" :no-name="true" :no-count="true" :no-link="true" />
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold">Name</td>
            <td>{{ normGenshinText(material.NameText) }}</td>
          </tr>
          <tr>
            <td class="bold">Description</td>
            <td colspan="2">
              <div class="posRel spacer5-top">
                <div style="padding-right:50px;">
                  <Wikitext id="item-desc" :value="normGenshinText(material.DescText)" :seamless="true" />
                </div>
                <button class="secondary small posAbs" ui-action="copy: #item-desc"
                        style="right: 0; top: 0;"
                        ui-tippy-hover="Click to copy to clipboard"
                        ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
              </div>
            </td>
          </tr>
          <tr v-if="material.EffectDescText">
            <td class="bold">Effect Desc.</td>
            <td colspan="2">
              <div class="posRel spacer5-top">
                <div style="padding-right:50px;">
                  <Wikitext id="item-effect-desc" :value="normGenshinText(material.EffectDescText)" :seamless="true" />
                </div>
                <button class="secondary small posAbs" ui-action="copy: #item-effect-desc"
                        style="right: 0; top: 0;"
                        ui-tippy-hover="Click to copy to clipboard"
                        ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
              </div>
            </td>
          </tr>
          <tr v-if="material.SpecialDescText">
            <td class="bold">Special Desc.</td>
            <td colspan="2">
              <div class="posRel spacer5-top">
                <div style="padding-right:50px;">
                  <Wikitext id="item-special-desc" :value="normGenshinText(material.SpecialDescText)" :seamless="true" />
                </div>
                <button class="secondary small posAbs" ui-action="copy: #item-special-desc"
                        style="right: 0; top: 0;"
                        ui-tippy-hover="Click to copy to clipboard"
                        ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
              </div>
            </td>
          </tr>
          <tr v-if="material.InteractionTitleText">
            <td class="bold">Interaction Desc.</td>
            <td colspan="2">
              <div class="posRel spacer5-top">
                <div style="padding-right:50px;">
                  <Wikitext id="item-interaction-desc" :value="normGenshinText(material.InteractionTitleText)" :seamless="true" />
                </div>
                <button class="secondary small posAbs" ui-action="copy: #item-interaction-desc"
                        style="right: 0; top: 0;"
                        ui-tippy-hover="Click to copy to clipboard"
                        ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold">Quality</td>
            <td colspan="2">
              <div class="valign">
                <code style="font-size:14px" class="spacer10-right">{{ material.RankLevel || 0 }}</code>
                <GenshinStars :quality="material.RankLevel || 0" />
              </div>
            </td>
          </tr>
          <tr v-if="material.PicPath && material.PicPath.length">
            <td class="bold">Other Images</td>
            <td colspan="2">
              <div v-for="pic of material.PicPath">
                <img :src="`/images/genshin/${pic}.png`" style="max-height:74px" loading="lazy"
                     decoding="async" />
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold">Item Type Enum</td>
            <td colspan="2"><code style="font-size:14px">{{ material.MaterialType }}</code></td>
          </tr>
          <tr>
            <td class="bold">Item Type Desc.</td>
            <td colspan="2"><code style="font-size:14px">{{ material.WikiTypeDescText }}</code></td>
          </tr>
          <tr v-if="material.FoodQuality && material.FoodQuality !== 'FOOD_QUALITY_NONE'">
            <td class="bold">Food Type</td>
            <td colspan="2">
              <span v-if="material.FoodQuality === 'FOOD_QUALITY_STRANGE'">Strange</span>
              <span v-if="material.FoodQuality === 'FOOD_QUALITY_ORDINARY'">Ordinary</span>
              <span v-if="material.FoodQuality === 'FOOD_QUALITY_DELICIOUS'">Delicious</span>
            </td>
          </tr>
          <tr v-if="material.SatiationParams && material.SatiationParams.length">
            <td class="bold">Food Fullness</td>
            <td colspan="2">
              <p class="spacer5-bottom">Fullness increase is calculated by <code style="font-size:14px">ParameterA + (ParameterB / CharacterMaxHP)</code>.</p>
              <p class="spacer10-bottom">For more info see <a href="https://genshin-impact.fandom.com/wiki/Food#Fullness">Food#Fullness</a> on the Genshin wiki.</p>
              <dl>
                <dt>Parameter A</dt>
                <dd>{{ material.SatiationParams[0] }}</dd>
                <dt>Parameter B</dt>
                <dd>{{ material.SatiationParams[1] }}</dd>
              </dl>
            </td>
          </tr>
          <tr>
            <td class="bold">Is Destroyable?</td>
            <td colspan="2">{{ material.DestroyRule === 'DESTROY_RETURN_MATERIAL' ? 'Yes' : 'No' }}</td>
          </tr>
          <tr>
            <td class="bold">Global Item Limit</td>
            <td colspan="2">{{ material.GlobalItemLimit }}</td>
          </tr>
          <tr>
            <td class="bold">Quick Jump</td>
            <td colspan="2">
              <ul class="dispFlex flexWrap">
                <li v-if="readable" class="w33p"><a href="#readable-text">Readable Text</a></li>
                <li v-if="material.Codex && material.Codex.DescText" class="w33p"><a href="#archive-text">Archive Text</a></li>
                <li v-if="material.Relations.Combine?.length" class="w33p"><a href="#crafting">Crafting</a></li>
                <li v-if="material.Relations.Compound?.length" class="w33p"><a href="#processing">Processing</a></li>
                <li v-if="material.Relations.CookRecipe?.length" class="w33p"><a href="#cooking">Cooking</a></li>
                <li v-if="material.Relations.CookBonus?.length" class="w33p"><a href="#special-food-recipe">Special Food Recipe</a></li>
                <li v-if="material.Relations.Forge?.length" class="w33p"><a href="#forging">Forging</a></li>
                <li v-if="ol" class="w33p"><a href="#ol">Other Languages</a></li>
                <li class="w33p"><a href="#raw-json">Raw JSON</a></li>
              </ul>
            </td>
          </tr>
        </table>
      </div>
    </section>
    <section class="card" v-if="material.ItemUse.length">
      <h2>Item Use</h2>
      <div class="content">
        <p class="spacer10-bottom">This item has {{ material.ItemUse.length }} operations that occur upon use.</p>
        <h4>Meta Info</h4>
        <table class="article-table spacer10-bottom" style="font-size:15px">
          <tr>
            <td class="bold" style="width:200px">UseOnGain</td>
            <td style="width:80px">{{ material.UseOnGain }}</td>
            <td><small>(If the item should automatically be used when the player obtains the item.)</small></td>
          </tr>
          <tr>
            <td class="bold">CloseBagAfterUsed</td>
            <td>{{ material.CloseBagAfterUsed }}</td>
            <td><small>(If the inventory should be automatically closed after item use.)</small></td>
          </tr>
          <tr>
            <td class="bold">MaxUseCount</td>
            <td>{{ material.MaxUseCount }}</td>
            <td><small>(Maximum amount that can be used in a single use-instance.)</small></td>
          </tr>
        </table>
        <template v-for="(itemUse, index) of material.ItemUse">
          <h4>Operation {{ index + 1 }}</h4>
          <div class="card">
            <table class="article-table" style="border:0;font-size:15px">
              <tr>
                <td class="bold" style="width:200px">
                  <div style="line-height:1em;padding:4px 0">
                    Use Op
                  </div>
                </td>
                <td>{{ itemUse.UseOp }}</td>
              </tr>
              <tr>
                <td class="bold">
                  <div style="line-height:1em;padding:4px 0">
                    Use Params
                  </div>
                </td>
                <td><JsonText :value="reformatPrimitiveArrays(JSON.stringify(itemUse.UseParam, null, 2))" :seamless="true" /></td>
              </tr>
              <tr>
                <td class="bold">
                  <div style="line-height:1em;padding:4px 0">
                    <span>More Context</span><br />
                    <small>(If implemented by site)</small>
                  </div>
                </td>
                <td>
                  <div v-if="itemUse.UseOp === 'ITEM_USE_UNLOCK_FURNITURE_FORMULA' && material.LoadedItemUse.Furniture">
                    <GenshinItem :item="material.LoadedItemUse.Furniture" />
                  </div>
                  <div v-if="itemUse.UseOp === 'ITEM_USE_UNLOCK_FURNITURE_SUITE' && material.LoadedItemUse.FurnitureSet">
                    <p class="spacer10-bottom">Unlocks furnishing set:</p>
                    <a :href="`/genshin/furnishing-sets/${material.LoadedItemUse.FurnitureSet.SuiteId}`">{{ material.LoadedItemUse.FurnitureSet.SuiteNameText }}</a>
                  </div>
                  <div v-if="itemUse.UseOp === 'ITEM_USE_ADD_ITEM' && material.LoadedItemUse.AddItem">
                    <p class="spacer10-bottom">Gives item:</p>
                    <GenshinItem :item="material.LoadedItemUse.AddItem.Material" :item-count="material.LoadedItemUse.AddItem.Count" />
                  </div>
                  <div v-if="itemUse.UseOp === 'ITEM_USE_GAIN_GCG_CARD' && material.LoadedItemUse.GcgCard">
                    <p class="spacer10-bottom">Gives TCG card:</p>
                    <TcgCard :card="material.LoadedItemUse.GcgCard" />
                  </div>
                  <div v-if="itemUse.UseOp === 'ITEM_USE_UNLOCK_COMBINE'">
                    <p>See the <a href="#crafting">Crafting</a> section on this page for the crafting unlocked.</p>
                  </div>
                  <div v-if="itemUse.UseOp === 'ITEM_USE_UNLOCK_COOK_RECIPE'">
                    <p>See the <a href="#cooking">Cooking</a> section on this page for the recipe unlocked.</p>
                  </div>
                  <div v-if="itemUse.UseOp === 'ITEM_USE_UNLOCK_FORGE'">
                    <p>See the <a href="#forging">Forging</a> section on this page for the forge unlocked.</p>
                  </div>
                  <div v-if="itemUse.UseOp === 'ITEM_USE_UNLOCK_CODEX' && material.LoadedItemUse.BookCodexMaterial">
                    <p class="spacer10-bottom">Unlock book in archive.</p>
                    <GenshinItem :item="material.LoadedItemUse.BookCodexMaterial" />
                  </div>
                  <div v-if="itemUse.UseOp === 'ITEM_USE_COMBINE_ITEM' && material.LoadedItemUse.ItemCombine">
                    <p class="spacer10-bottom"><code>{{ material.LoadedItemUse.ItemCombine.Needed }}</code> of these
                      can be combined to give this item:</p>
                    <GenshinItem :item="material.LoadedItemUse.ItemCombine.Result" />
                  </div>
                  <div v-if="itemUse.UseOp === 'ITEM_USE_ADD_SERVER_BUFF' && material.LoadedItemUse.ServerBuff">
                    <p class="spacer10-bottom">Applies the following server buff with parameter <code>{{ itemUse.UseParam[1] }}</code>.</p>
                    <JsonText :value="JSON.stringify(material.LoadedItemUse.ServerBuff, null, 2)" />
                  </div>
                  <div v-if="itemUse.UseOp === 'ITEM_USE_GRANT_SELECT_REWARD' && material.LoadedItemUse.GrantSelectRewards?.length">
                    <p>Able to select one of the following rewards:</p>
                    <div v-for="(reward, idx) of material.LoadedItemUse.GrantSelectRewards">
                      <strong>Reward option {{ idx + 1 }}</strong>
                      <div class="valign">
                        <template v-for="item of reward.RewardItemList">
                          <GenshinItem :item="item.Material" :item-count="item.ItemCount" :small="true" />
                        </template>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </template>
      </div>
    </section>
    <section v-if="readable" id="readable-text" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right" ui-action="expando: #readable-text-content"><Icon name="chevron-down" :size="17" /></span>
        <span>Readable Text</span>
        <span class="grow"></span>
        <a class="valign fontWeight500" :href="`/genshin/readables/item/${material.Id}`" style="font-size:18px" target="_blank">
          <span class="spacer5-right" style="font-size:15px">Readable</span><Icon name="external-link" :size="16" />
        </a>
      </h2>
      <div id="readable-text-content" class="content">
        <ReadableTexts :readable="readable" />
      </div>
    </section>
    <section v-if="material.Codex && material.Codex.DescText" id="archive-text" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right" ui-action="expando: #archive-text-content"><Icon name="chevron-down" :size="17" /></span>
        <span>Archive Text{{ material.Codex.NameText ? ': ' + normGenshinText(material.Codex.NameText) : '' }}</span>
      </h2>
      <div id="archive-text-content" class="content">
        <Wikitext :value="normGenshinText(material.Codex.DescText)" />
      </div>
    </section>
    <section v-if="material.Relations.Combine?.length" id="crafting" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right" ui-action="expando: #crafting-content"><Icon name="chevron-down" :size="17" /></span>
        Crafting
      </h2>
      <div id="crafting-content">
        <template v-for="(relation, idx) of material.Relations.Combine">
          <h3 class="secondary-header valign">
            <span>Recipe #{{ relation.RelationId }}</span>
            <span class="grow"></span>
            <small v-if="relation.RoleId">Role ID: <strong class="empty-dash">{{ relation.RoleId }}</strong></small>
            <small v-if="relation.RoleType" class="spacer15-left">Role Type: <strong class="empty-dash">{{ relation.RoleType }}</strong></small>
          </h3>
          <div class="content alignStart">
            <template v-for="inputItem of relation.RelationData.MaterialItems">
              <GenshinItem :item="inputItem.Material" :item-count="inputItem.Count" />
            </template>
            <div class="material-sep"><Icon name="chevron-right" :size="28" /></div>
            <template v-if="relation.RelationData.ResultItem">
              <GenshinItem :item="relation.RelationData.ResultItem" :item-count="relation.RelationData.ResultItemCount" />
            </template>
          </div>
          <template v-if="Array.isArray(relation.RecipeWikitext)">
            <template v-for="(recipeWikitext, recipeIdx) of relation.RecipeWikitext">
              <div class="content">
                <div class="posRel">
                  <Wikitext :id="'crafting-recipe-' + idx + '-' + recipeIdx" :value="recipeWikitext" />
                  <button class="secondary small posAbs" :ui-action="`copy: #crafting-recipe-${idx}-${recipeIdx}`"
                          style="right: 0; top: 0;"
                          ui-tippy-hover="Click to copy to clipboard"
                          ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
                </div>
              </div>
            </template>
          </template>
          <hr>
        </template>
      </div>
    </section>
    <section v-if="material.Relations.Compound?.length" id="processing" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right" ui-action="expando: #processing-content"><Icon name="chevron-down" :size="17" /></span>
        Processing
      </h2>
      <div id="processing-content">
        <template v-for="(relation, idx) of material.Relations.Compound">
          <h3 class="secondary-header valign">
            <span>Recipe #{{ relation.RelationId }}</span>
            <span class="grow"></span>
            <small v-if="relation.RoleId">Role ID: <strong class="empty-dash">{{ relation.RoleId }}</strong></small>
            <small v-if="relation.RoleType" class="spacer15-left">Role Type: <strong class="empty-dash">{{ relation.RoleType }}</strong></small>
          </h3>
          <div class="content alignStart">
            <template v-for="inputItem of relation.RelationData.InputVec">
              <GenshinItem :item="inputItem.Material" :item-count="inputItem.Count" />
            </template>
            <div class="material-sep"><Icon name="chevron-right" :size="28" /></div>
            <template v-for="inputItem of relation.RelationData.OutputVec">
              <GenshinItem :item="inputItem.Material" :item-count="inputItem.Count" />
            </template>
          </div>
          <template v-if="Array.isArray(relation.RecipeWikitext)">
            <template v-for="(recipeWikitext, recipeIdx) of relation.RecipeWikitext">
              <div class="content">
                <div class="posRel">
                  <Wikitext :id="'compound-recipe-' + idx + '-' + recipeIdx" :value="recipeWikitext" />
                  <button class="secondary small posAbs" :ui-action="`copy: #compound-recipe-${idx}-${recipeIdx}`"
                          style="right: 0; top: 0;"
                          ui-tippy-hover="Click to copy to clipboard"
                          ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
                </div>
              </div>
            </template>
          </template>
          <hr>
        </template>
      </div>
    </section>
    <section v-if="material.Relations.CookRecipe?.length" id="cooking" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right" ui-action="expando: #cooking-content"><Icon name="chevron-down" :size="17" /></span>
        Cooking
      </h2>
      <div id="cooking-content">
        <template v-for="(relation, idx) of material.Relations.CookRecipe">
          <h3 class="secondary-header valign">
            <span>Recipe #{{ relation.RelationId }}</span>
            <span class="grow"></span>
            <small v-if="relation.RoleId">Role ID: <strong class="empty-dash">{{ relation.RoleId }}</strong></small>
            <small v-if="relation.RoleType" class="spacer15-left">Role Type: <strong class="empty-dash">{{ relation.RoleType }}</strong></small>
          </h3>
          <div class="content alignStart">
            <template v-for="inputItem of relation.RelationData.InputVec">
              <GenshinItem :item="inputItem.Material" :item-count="inputItem.Count" />
            </template>
            <div class="material-sep"><Icon name="chevron-right" :size="28" /></div>
            <template v-for="inputItem of relation.RelationData.QualityOutputVec">
              <GenshinItem :item="inputItem.Material" :item-count="inputItem.Count" />
            </template>
          </div>
          <template v-if="Array.isArray(relation.RecipeWikitext)">
            <template v-for="(recipeWikitext, recipeIdx) of relation.RecipeWikitext">
              <div class="content">
                <div class="posRel">
                  <Wikitext :id="'cook-recipe-' + idx + '-' + recipeIdx" :value="recipeWikitext" />
                  <button class="secondary small posAbs" :ui-action="`copy: #cook-recipe-${idx}-${recipeIdx}`"
                          style="right: 0; top: 0;"
                          ui-tippy-hover="Click to copy to clipboard"
                          ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
                </div>
              </div>
            </template>
          </template>
          <hr>
        </template>
      </div>
    </section>
    <section v-if="material.Relations.CookBonus?.length" id="special-food-recipe" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right" ui-action="expando: #special-food-recipe-content"><Icon name="chevron-down" :size="17" /></span>
        Special Food Recipe
      </h2>
      <div id="special-food-recipe-content">
        <template v-for="(relation, idx) of material.Relations.CookBonus">
          <h3 class="secondary-header valign">
            <span>Recipe #{{ relation.RelationId }}</span>
            <span class="grow"></span>
            <small v-if="relation.RoleId">Role ID: <strong class="empty-dash">{{ relation.RoleId }}</strong></small>
            <small v-if="relation.RoleType" class="spacer15-left">Role Type: <strong class="empty-dash">{{ relation.RoleType }}</strong></small>
          </h3>
          <div class="content">
            <p>Instead of receiving <strong>{{ relation.RelationData.RecipeOrdinaryResult?.Material?.NameText || '(SACCHAROSE MAPPING ERROR)' }}</strong>,
              when cooked with <strong>{{ relation.RelationData.Avatar?.NameText || '(SACCHAROSE MAPPING ERROR)' }}</strong>, there is a chance
              of receiving <strong>{{ relation.RelationData.ResultItem?.NameText || '(SACCHAROSE MAPPING ERROR)' }}</strong> instead.</p>
          </div>
          <div class="content alignStart">
            <template v-for="inputItem of relation.RelationData.Recipe.InputVec">
              <GenshinItem :item="inputItem.Material" :item-count="inputItem.Count" />
            </template>
            <div class="material-sep"><Icon name="user-check" :size="22" /></div>
            <GenshinItem :item="relation.RelationData.Avatar" :no-link="true" />
            <div class="material-sep"><Icon name="chevron-right" :size="28" /></div>
            <template v-if="relation.RelationData.RecipeOrdinaryResult">
              <GenshinItem :item="relation.RelationData.RecipeOrdinaryResult.Material" :item-count="relation.RelationData.RecipeOrdinaryResult.Count" />
            </template>
            <div class="material-sep"><Icon name="repeat" :size="22" /></div>
            <template v-if="relation.RelationData.ResultItem">
              <GenshinItem :item="relation.RelationData.ResultItem" :item-count="1" />
            </template>
          </div>
          <hr>
        </template>
      </div>
    </section>
    <section v-if="material.Relations.Forge?.length" id="forging" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right" ui-action="expando: #forging-content"><Icon name="chevron-down" :size="17" /></span>
        Forging
      </h2>
      <div id="forging-content">
        <template v-for="(relation, idx) of material.Relations.Forge">
          <h3 class="secondary-header valign">
            <span>Recipe #{{ relation.RelationId }}</span>
            <span class="grow"></span>
            <small v-if="relation.RoleId">Role ID: <strong class="empty-dash">{{ relation.RoleId }}</strong></small>
            <small v-if="relation.RoleType" class="spacer15-left">Role Type: <strong class="empty-dash">{{ relation.RoleType }}</strong></small>
          </h3>
          <div class="content alignStart">
            <template v-for="inputItem of relation.RelationData.MaterialItems">
              <GenshinItem :item="inputItem.Material" :item-count="inputItem.Count" />
            </template>
            <div class="material-sep"><Icon name="chevron-right" :size="28" /></div>
            <template v-if="relation.RelationData.ResultItem">
              <GenshinItem :item="relation.RelationData.ResultItem" :item-count="relation.RelationData.ResultItemCount" />
            </template>
          </div>
          <template v-if="Array.isArray(relation.RecipeWikitext)">
            <template v-for="(recipeWikitext, recipeIdx) of relation.RecipeWikitext">
              <div class="content">
                <div class="posRel">
                  <Wikitext :id="'forge-recipe-' + idx + '-' + recipeIdx" :value="recipeWikitext" />
                  <button class="secondary small posAbs" :ui-action="`copy: #forge-recipe-${idx}-${recipeIdx}`"
                          style="right: 0; top: 0;"
                          ui-tippy-hover="Click to copy to clipboard"
                          ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
                </div>
              </div>
            </template>
          </template>
          <hr>
        </template>
      </div>
    </section>
    <section v-if="ol" id="ol" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right" ui-action="expando: #ol-content"><Icon name="chevron-down" :size="17" /></span>
        <span>OL</span>
        <span class="grow"></span>
        <button class="secondary small" ui-action="copy: #ol-textarea"
                ui-tippy-hover="Click to copy to clipboard"
                ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
      </h2>
      <div id="ol-content" class="content">
        <textarea id="ol-textarea" readonly class="ol-result-textarea w100p wikitext autosize" spellcheck="false" translate="no">{{ ol.result }}</textarea>
      </div>
    </section>
    <section id="raw-json" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right expand-action collapsed-state" ui-action="expando: #json-outer"><Icon name="chevron-down" :size="17" /></span>
        Raw JSON
      </h2>
      <div id="json-outer" class="content collapsed hide">
        <textarea class="code json w100p autosize" spellcheck="false" style="max-width:792px"
                  translate="no">{{ JSON.stringify(material, null, 2) }}</textarea>
      </div>
    </section>
  </template>
  <section v-else class="card">
    <h2>Item not found.</h2>
  </section>
</template>

<script setup lang="ts">
import { MaterialExcelConfigData } from '../../../../shared/types/genshin/material-types.ts';
import { Readable } from '../../../../shared/types/genshin/readable-types.ts';
import Icon from '../../utility/Icon.vue';
import GenshinItem from '../links/GenshinItem.vue';
import { getTrace } from '../../../middleware/request/tracer.ts';
import GenshinStars from '../links/GenshinStars.vue';
import Wikitext from '../../utility/Wikitext.vue';
import ReadableTexts from '../readables/partials/ReadableTexts.vue';
import { OLResult } from '../../../../shared/types/ol-types.ts';
import JsonText from '../../utility/JsonText.vue';

import { reformatPrimitiveArrays } from '../../../../shared/util/stringUtil.ts';
import TcgCard from '../links/TcgCard.vue';

const { normGenshinText } = getTrace();

defineProps<{
  title?: string,
  material?: MaterialExcelConfigData,
  readable?: Readable,
  ol?: OLResult
}>();
</script>

