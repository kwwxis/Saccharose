
export function enableMiscIntervals() {
  document.querySelectorAll('a.unblankIfSameUrl').forEach((el: HTMLAnchorElement) => {
    el.classList.remove('unblankIfSameUrl');

    if (urlsAreSame(el.href, location.href)) {
      if (el.href.includes('#')) {
        el.href = '#' + el.href.split('#')[1];
      } else {
        el.href = '#';
      }
      el.removeAttribute('target');
    }
  });
}

function normalizeUrl(url: string) {
  const u = new URL(url, window.location.origin); // base for relative URLs

  let path = u.pathname;
  if (path !== "/") {
    path = path.replace(/\/+$/, ""); // strip trailing slash
  }

  return `${u.protocol}//${u.host}${path}`;
}

function urlsAreSame(url1, url2) {
  return normalizeUrl(url1) === normalizeUrl(url2);
}
