<template>
  <section class="card">
    <h2>Reminder Dialogue Generator</h2>
    <div class="content form-box">
      <p class="spacer10-bottom">Some open-world dialogue are <code>DialogExcelConfigData</code>'s and some are <code>ReminderExcelConfigData</code>'s. We don't have any data
        that can correlate a reminder to a quest, so some open-world dialogue may not show up in the quest dialogue generator. In which case you can try search for it here
        to generate a reminder dialogue branch.</p>
      <div class="field valign">
        <div class="posRel valign grow">
          <input class="reminder-generate-input grow" type="text" placeholder="Enter reminder line or part of a reminder line to start from." style="border-radius:3px 0 0 3px" />
          <button class="reminder-generate-input-paste input-paste-button"><Icon name="clipboard" /></button>
          <button class="reminder-generate-input-clear input-clear-button hide"><Icon name="x-circle" /></button>
        </div>
        <SearchModeInput />
      </div>
      <fieldset class="spacer10">
        <legend>Number of reminder branches to fetch by subsequent ID</legend>
        <div class="content">
          <p class="spacer10-bottom">Some reminders have a <code>NextReminderId</code>, in which those will be fetched for reminder found. A reminder and all of its next reminders
            are a single "Reminder Branch".
            In the input below, you can specify a certain amount of additional reminder branches to fetch after the reminder branch that was found. It does this by simply
            incrementing the ID of the last reminder of the previous branch by 1. There is no guarantee that these subsequent reminders will have any correlation to what you're looking for.</p>
          <div class="valign">
            <input class="reminder-subseq-input grow" type="number" placeholder="0" />
          </div>
        </div>
      </fieldset>
      <div class="field valign spacer10-top">
        <button class="reminder-generate-submit primary primary--2">Generate</button>
        <div class="reminder-generate-submit-pending hide loading small spacer5-left"></div>
      </div>
    </div>
  </section>
  <div id="reminder-generate-result"></div>
</template>

<script setup lang="ts">
import Icon from '../../utility/Icon.vue';
import SearchModeInput from '../../utility/SearchModeInput.vue';
</script>
