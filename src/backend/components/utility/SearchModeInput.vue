<template>
  <div :id="`search-mode-input-${searchModeInputUuid}`" class="search-mode-input posRel">
    <button class="search-mode-button input-style valign"
            :ui-action="`dropdown: #search-mode-input-${searchModeInputUuid} .search-mode-dropdown`"
            style="cursor: pointer;border-top-left-radius:0;border-bottom-left-radius:0;border-left:0;">
      <span>mode:&nbsp;</span><strong class="code" style="width:17px;text-align:center">{{ ctx.cookie('search-mode', 'WI') }}</strong>
      <Icon name="chevron-down" :size="18" :props="{style: 'opacity: 0.5; margin: 0 -5px 0 3px;'}" />
    </button>
    <div class="search-mode-dropdown ui-dropdown hide">
      <div data-value="C" :class="`option ${ ctx.cookieTernary('search-mode').equals('C').then('selected') }`" ui-action="dropdown-item">
        <strong class="code">C:&nbsp;</strong> Character match <small><em>(case-sensitive)</em></small>
      </div>
      <div data-value="CI" :class="`option ${ ctx.cookieTernary('search-mode').equals('CI').then('selected') }`" ui-action="dropdown-item">
        <strong class="code">CI:</strong> Character match <small><em>(case-insensitive)</em></small>
      </div>

      <div class="option-sep"></div>

      <div data-value="W" :class="`option ${ ctx.cookieTernary('search-mode').equals('W').then('selected') }`" ui-action="dropdown-item">
        <strong class="code">W:&nbsp;</strong> Word match <small><em>(case-sensitive)</em></small>
      </div>
      <div data-value="WI" :class="`option ${ ctx.cookieTernary('search-mode').equals('WI').or.isEmpty().then('selected') }`" ui-action="dropdown-item">
        <strong class="code">WI:</strong> Word match <small><em>(case-insensitive)</em></small>
      </div>

      <div class="option-sep"></div>

      <div data-value="R" :class="`option ${ ctx.cookieTernary('search-mode').equals('R').then('selected') }`" ui-action="dropdown-item">
        <strong class="code">R:&nbsp;</strong> Regex <small><em>(case-sensitive)</em></small>
      </div>
      <div data-value="RI" :class="`option ${ ctx.cookieTernary('search-mode').equals('RI').then('selected') }`" ui-action="dropdown-item">
        <strong class="code">RI:</strong> Regex <small><em>(case-insensitive)</em></small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { uuidv4 } from '../../../shared/util/uuidv4.ts';
import { getTrace } from '../../middleware/request/tracer.ts';
import Icon from './Icon.vue';

const searchModeInputUuid = uuidv4();
const ctx = getTrace().ctx;
</script>
