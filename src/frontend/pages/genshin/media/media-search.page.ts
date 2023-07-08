import { pageMatch } from '../../../pageMatch';
import axios, { AxiosResponse } from 'axios';
import { escapeHtml } from '../../../../shared/util/stringUtil';

interface Result {
  originalName: string,
  fileName: string,
  mimeType: string,
  size: number,
  search: {
    fileHash: string,
    matches: { name: string, hash: number, distance: number }[]
  }
}

pageMatch('pages/genshin/media/media-search', () => {
  const form: HTMLFormElement = <HTMLFormElement> document.getElementById('media-search-form');
  const fileInput: HTMLInputElement = <HTMLInputElement> document.querySelector('#media-search-form input[type=file]');
  const submitButton: HTMLInputElement = <HTMLInputElement> document.querySelector('#media-search-form input[type=submit]');

  const previewContainer: HTMLImageElement = <HTMLImageElement> document.getElementById('preview-container');
  const previewImg: HTMLImageElement = <HTMLImageElement> document.getElementById('preview-image');

  const errorContainer: HTMLElement = document.getElementById('error-container');
  const errorMessage: HTMLElement = document.getElementById('error-message');

  const resultCard: HTMLElement = document.getElementById('result-card');
  const resultContent: HTMLElement = document.getElementById('result-content');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    console.log(formData);

    errorContainer.classList.add('hide');
    resultCard.classList.add('hide');
    submitButton.disabled = true;

    axios.post("/api/genshin/media-search", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },

    }).then((res: AxiosResponse<Result>) => {
      console.log(res);

      let html = '<div class="media-search-result-list">';

      for (let match of res.data.search.matches) {
        html += `
          <div class="media-search-result-item spacer10-bottom">
            <div style="padding:5px"><strong>${escapeHtml(match.name)}</strong><br /><small>(Image Hash: ${match.hash})</small></div>
            <img class="media-search-result-image" src="/images/genshin/${match.name}" />
          </div>`;
      }

      html += '</div>';
      resultContent.innerHTML = html;
      resultCard.classList.remove('hide');
    }).catch((err) => {
      console.error(err);
      errorContainer.classList.remove('hide');
      errorMessage.innerText = String(err);
    }).finally(() => {
      submitButton.disabled = false;
      fileInput.value = null;
    });
  });

  fileInput.addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = function(e2) {
      previewImg.src = String(e2.target.result);
    }
    if (fileInput.files.length) {
      reader.readAsDataURL(fileInput.files[0]);
      previewContainer.classList.remove('hide');
    } else {
      previewContainer.classList.add('hide');
    }
  });
});