<template>
  <section class="card">
    <h2>Single Branch Dialogue Generator</h2>
    <div class="content form-box">
      <p class="spacer10-bottom">Generate dialogue after a specific line within a single dialogue section. You can also enter a specific Talk ID, Dialogue ID, or Textmap Hash.
        Only shows up to 100 results. More specific searches will be faster than broad searches.</p>
      <div id="branch-dialogue-inputs" class="field valign">
        <div class="posRel valign grow">
          <input class="dialogue-generate-input grow" type="text" placeholder="Enter dialogue line or part of a dialogue line." />
          <button class="dialogue-generate-input-paste input-paste-button"><Icon name="clipboard" /></button>
          <button class="dialogue-generate-input-clear input-clear-button hide"><Icon name="x-circle" /></button>
        </div>
        <SearchModeInput />
      </div>
      <div class="field valign">
        <div class="npc-filter-input-outer posRel">
          <input class="npc-filter-input" type="text" placeholder="NPC Filter" />
          <span ui-tippy="{allowHTML: true, content: 'Filter by the speaker of the dialogue line to further narrow down the results (e.g. &quot;Paimon&quot;).<br><br>Enter in &quot;Player&quot; or &quot;Traveler&quot; for player lines/options.<br><br>This input is case insensitive and optional.',delay:[200, 100]}"
                class="dispInlineFlex" style="height:16px;width:16px;position:absolute;right:5px;top:0;bottom:0;margin:auto 0;opacity:0.6">
            <Icon name="info" :size="16" />
          </span>
          <button class="npc-filter-input-clear input-clear-button hide"><Icon name="x-circle" /></button>
        </div>
        <div class="posRel spacer5-left">
          <input id="versionFilter" type="text" placeholder="Version filter"
                 style="max-width: 250px;width: 100%;padding-right:25px"/>
          <span ui-tippy="{content: 'Versions separated by comma or semicolon. Supported from 1.4 onwards.',delay:[200, 100]}"
                class="dispInlineFlex" style="height:16px;width:16px;position:absolute;right:5px;top:0;bottom:0;margin:auto 0;opacity:0.6">
            <Icon name="info" :size="16" />
          </span>
          <button class="version-filter-clear input-clear-button hide"><Icon name="x-circle" /></button>
        </div>
        <label class="ui-checkbox dispBlock spacer10-left" style="padding-left:5px;font-size:13px;">
          <input id="voicedOnly" type="checkbox" name="voicedOnly" value="1" />
          <span>Voiced only</span>
        </label>
      </div>
      <div class="field valign spacer10-top">
        <button class="dialogue-generate-submit primary primary--2">Generate</button>
        <div class="dialogue-generate-submit-pending hide loading small spacer5-left"></div>
      </div>
    </div>
  </section>
  <div id="dialogue-generate-result"></div>

</template>

<script setup lang="ts">
import Icon from '../../utility/Icon.vue';
import SearchModeInput from '../../utility/SearchModeInput.vue';
</script>
