<template>
  <section class="card">
    <h2>Excel Usages</h2>
    <div class="content form-box">
      <p class="spacer10-bottom">Enter a numeric or string (no surrounding quotes) scalar to see in which files it's used in ExcelBinOutput.<br>
        Can specify multiple scalars with commas or semicolons.</p>
      <div class="field valign">
        <input class="search-input grow" type="text" placeholder="Enter an ID or list of IDs." />
      </div>
      <div class="field valign spacer10-top">
        <button class="search-submit primary primary--2">Search</button>
        <div class="search-submit-pending hide loading small spacer5-left"></div>
      </div>
    </div>
  </section>
  <div id="search-result"></div>
</template>
