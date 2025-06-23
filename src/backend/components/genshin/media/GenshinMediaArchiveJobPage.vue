<template>
  <section class="card">
    <h2>Media List</h2>
    <div class="tab-list" role="tablist">
      <a href="/genshin/media/list" role="tab" class="tab">List</a>
      <a href="/genshin/media/search" role="tab" class="tab">Search</a>
      <button role="tab" class="tab active">Image Archive Job</button>
    </div>
  </section>

  <section id="job-id-card" class="card">
    <h2>Job ID: <span id="job-id">{{ jobId }}</span></h2>
    <div id="job-info-content" class="content"></div>
  </section>

  <section id="job-download" class="card">
    <h2>Download archive file</h2>
    <div id="job-download-content" class="content">
      <p>Your download will appear here once the job is complete.</p>
      <p>You may leave this tab and come back later, the job will keep running in the background.</p>
    </div>
  </section>

  <section id="job-log" class="card">
    <h2>Job Log</h2>
    <div class="content">
      <div id="job-log-content" class="code" style="font-size: 12px; line-height: 1.8em; padding: 15px 1px 0"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  jobId?: string
}>();
</script>
