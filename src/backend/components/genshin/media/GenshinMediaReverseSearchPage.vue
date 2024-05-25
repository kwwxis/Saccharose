<template>
  <section class="card">
    <h2>Media Reverse Search <b>(Experimental)</b></h2>
    <div class="tab-list" role="tablist">
      <a href="/media/list" role="tab" class="tab">List</a>
      <a href="/media/search" role="tab" class="tab">Search</a>
      <a href="/media/reverse-search" role="tab" class="tab active">Reverse Search</a>
    </div>
    <div class="content">
      <p class="spacer10-bottom">The quality of this reverse search is very mediocre.
        The closer your image is to the expected image, the more likely it'll match. If the expected image contains
        transparency, then removing any irrelevant background from your uploaded image may help. The larger the
        max hamming distance (min: 3, max: 20), the less strict it'll be.
      </p>
      <form id="media-search-form" class="form-box" enctype="multipart/form-data" method="POST">
        <div class="field valign">
          <label style="width:160px">Max Hamming Distance</label>
          <div class="values">
            <input type="number" name="maxHammingDistance" value="16" min="3" max="20" />
          </div>
        </div>
        <div class="field valign spacer10-top">
          <label style="width:160px">Image File</label>
          <div class="values">
            <input type="file" required name="uploadFile" accept="image/png" />
          </div>
        </div>
        <div class="field valign spacer15-top">
          <label style="width:160px"></label>
          <div class="values">
            <input role="button" class="primary" type="submit" value="Upload"/>
          </div>
        </div>
      </form>

      <div id="error-container" class="hide spacer10-top">
        <p id="error-message" class="error-notice"></p>
      </div>
      <fieldset id="preview-container" class="hide spacer10-top">
        <legend>Upload Preview</legend>
        <div class="content">
          <img id="preview-image" src="#" style="max-width:200px;max-height:200px" />
        </div>
      </fieldset>
    </div>
  </section>
  <section id="result-card" class="card hide">
    <h2>Results</h2>
    <div id="result-content"></div>
  </section>
</template>
