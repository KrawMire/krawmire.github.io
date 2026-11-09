'use strict';

fetch('https://ipinfo.io/json', {
  method: 'GET'
})
  .then(res => res.json())
  .then(res => {
    fetch('https://hookbox.internal.krawmire.dev/log/personal_landing_github', {
      body: JSON.stringify(res),
      method: "POST"
    });
  })
  .catch(res => {
    fetch('https://hookbox.internal.krawmire.dev/log/personal_landing_github', {
      body: JSON.stringify({content: "Cound not get IP info"}),
      method: "POST"
    });
  });

// footer year
const yearEl = document.querySelector("[data-year]");
if (yearEl) yearEl.textContent = new Date().getFullYear();
