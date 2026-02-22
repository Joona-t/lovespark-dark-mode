// LoveSpark Dark Mode — content.js
// Injected by background.js via chrome.scripting.executeScript().
// Sole responsibility: manage the lovespark-* class on <html>.
// CSS does all the visual work — this just flips the switch.
'use strict';

(function () {
  if (window.__loveSparkDarkMode) return;
  window.__loveSparkDarkMode = true;

  const HTML    = document.documentElement;
  const CLASSES = ['lovespark-dark', 'lovespark-bubblegum', 'lovespark-hotpink'];

  function applyMode(mode) {
    CLASSES.forEach(c => HTML.classList.remove(c));
    if (mode) HTML.classList.add('lovespark-' + mode);
  }

  function removeAll() {
    CLASSES.forEach(c => HTML.classList.remove(c));
  }

  // Initial state
  chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
    if (chrome.runtime.lastError || !response) return;
    const { isEnabled, mode, excludedDomains } = response;
    const hostname = location.hostname;
    if (isEnabled && !(excludedDomains || []).includes(hostname)) {
      applyMode(mode);
      chrome.runtime.sendMessage({ action: 'siteDarkened', host: hostname });
    }
  });

  // Live message listener
  chrome.runtime.onMessage.addListener((message) => {
    switch (message.action) {
      case 'apply':  applyMode(message.mode); break;
      case 'remove': removeAll(); break;
    }
  });
})();
