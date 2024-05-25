<template>
  <section class="card">
    <h2>Media List</h2>
    <div class="tab-list" role="tablist">
      <a href="/media/list" role="tab" class="tab active">List</a>
      <a href="/media/search" role="tab" class="tab">Search</a>
    </div>
    <div id="media-list-loading">
      <div class="content valign">
        <span class="loading x24"></span>
        <span class="loading-label spacer15-left">Loading...</span>
      </div>
    </div>
    <div id="media-list-app" class="hide"></div>
  </section>
</template>
