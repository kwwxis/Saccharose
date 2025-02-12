<template>
  <section class="card">
    <h2 class="valign">
      <span>VO File to Dialogue</span>
      <span class="grow"></span>
      <button id="vo-to-dialogue-info-button" class="secondary">Info</button>
    </h2>
    <div class="content form-box">
      <p class="spacer10-bottom">Enter the VO file name and get the corresponding text line, not including subsequent dialog lines. One file name per line.</p>
      <div class="field valign">
        <textarea class="search-input grow" placeholder="Enter VO file name(s), one per line." style="min-height:200px;resize:vertical;"></textarea>
      </div>
      <div class="field valign spacer10-top">
        <button class="search-submit primary primary--2">Search</button>
        <div class="search-submit-pending hide loading small spacer5-left"></div>
      </div>
    </div>
  </section>
  <div id="search-result"></div>
</template>
