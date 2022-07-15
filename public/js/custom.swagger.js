function waitForElement(query, callback, interval = 50) {
  let el;

  if ((el = document.querySelector(query))) {
    callback(el);
    return;
  }

  setTimeout(() => {
    waitForElement(query, callback, interval);
  }, interval);
}

/**
 * Escape HTML.
 * @param {string} unsafe
 * @returns {string}
 */
function esc(unsafe) {
  return unsafe.replace(/[&<>"']/g, function(m) {
    switch (m) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#039;';
    }
  });
}

var script = document.createElement('script');
script.onload = function () {
  axios.get('/auth/info').then(response => {
    if (!response.data || !response.data.user || !response.data.user.id || !response.data.user.username) {
      throw response;
      return;
    }

    waitForElement('.swagger-ui .topbar-wrapper', wrapper => {
      let existing = document.getElementById('session-user');
      if (existing) existing.remove();

      wrapper.insertAdjacentHTML('beforeend', `
      <div style="display:flex;flex-grow:1;justify-content:flex-end">
      <div id="session-user" style="color:rgba(255,255,255,0.85)">
        <img class="session-userAvatar"
          src="https://cdn.discordapp.com/avatars/${esc(response.data.user.id)}/${esc(response.data.user.avatar)}.png" />
        <section class="session-userInfo">
          <p class="session-userName">@${esc(response.data.user.username)}#${esc(response.data.user.discriminator)}</p>
          <small class="session-userId">${esc(response.data.user.id)}</small>
        </section>
        <a class="session-user-prefs-link" href="/prefs">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-settings icon"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </a>
        <a class="session-user-auth-button" href="/auth/logout?cont=/api/v1/docs">Logout</a>
      </div>
      </div>
      `);
    });
  }).catch(() => {
    waitForElement('.swagger-ui .topbar-wrapper', wrapper => {
      let existing = document.getElementById('session-user');
      if (existing) existing.remove();

      wrapper.insertAdjacentHTML('beforeend', `
      <div style="display:flex;flex-grow:1;justify-content:flex-end">
      <div id="session-user">
        <a class="session-user-auth-button" href="/auth/discord?cont=/api/v1/docs">Login</a>
      </div>
      </div>
      `);
    });
  });
};

script.integrity = 'sha384-6woDBwQr+eqsszpfCWmyJ2UTm+OSym/GuB2NAD8H3d+6xuEZzOMJ/6GEPDTPPCmi';
script.crossOrigin = 'anonymous';
script.src = 'https://unpkg.com/axios@0.19.0/dist/axios.min.js';

document.head.appendChild(script);