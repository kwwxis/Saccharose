import { hashFlash } from '../../util/domutil.ts';

export default function() {
  checkHashFlash();
  checkReplaceInUrl();
}

function checkHashFlash() {
  hashFlash();
  window.addEventListener('hashchange', () => hashFlash());
}

function checkReplaceInUrl() {
  const replaceInUrl: HTMLMetaElement = document.querySelector('meta[name="X-ReplaceInUrl"]');
  if (replaceInUrl) {
    let [oldName, newName] = replaceInUrl.content.split(';');
    window.history.replaceState({}, null, window.location.href
      .replace(oldName, newName)
      .replace(encodeURIComponent(oldName), newName));
  }
}
