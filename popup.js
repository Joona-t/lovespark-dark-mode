// LoveSpark Dark Mode — popup.js
'use strict';

const pills      = document.querySelectorAll('.mode-pill');
const toggle     = document.getElementById('toggle-enabled');
const statusText = document.getElementById('status-text');
const siteBtn    = document.getElementById('site-toggle');

const STATUS = {
  on:   'theming the internet',
  off:  'paused',
  site: 'disabled on this site',
};

// ── State ──────────────────────────────────────────────────────────────────

let currentHostname = '';
let siteIsDisabled  = false;

// ── Counter animation ──────────────────────────────────────────────────────

function animateTo(el, target) {
  if (!el || !target) { if (el) el.textContent = '0'; return; }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = target.toLocaleString();
    return;
  }
  const duration = 400;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ── UI helpers ─────────────────────────────────────────────────────────────

function setActiveMode(mode) {
  pills.forEach(pill => {
    pill.setAttribute('aria-pressed', String(pill.dataset.mode === mode));
  });
}

function setEnabled(enabled) {
  toggle.checked = enabled;
  document.body.classList.toggle('disabled', !enabled);
  statusText.textContent = enabled
    ? (siteIsDisabled ? STATUS.site : STATUS.on)
    : STATUS.off;
}

function setSiteDisabled(disabled) {
  siteIsDisabled = disabled;
  siteBtn.textContent = disabled ? 'Re-enable on this site' : 'Disable on this site';
  siteBtn.classList.toggle('site-disabled', disabled);
  if (toggle.checked) {
    statusText.textContent = disabled ? STATUS.site : STATUS.on;
  }
}

// ── Init: load state ────────────────────────────────────────────────────────

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (tab?.url) {
    try { currentHostname = new URL(tab.url).hostname; } catch (_) {}
  }

  chrome.runtime.sendMessage({ action: 'getState' }, (state) => {
    if (chrome.runtime.lastError || !state) return;

    setActiveMode(state.mode);
    setEnabled(state.isEnabled);

    const disabled = (state.excludedDomains || []).includes(currentHostname);
    setSiteDisabled(disabled);

    // Stats
    animateTo(document.getElementById('val-sitesDarkened'), state.sitesDarkenedToday);
    animateTo(document.getElementById('val-minutesSaved'), state.minutesSavedToday);
  });
});

// ── Mode pill clicks ────────────────────────────────────────────────────────

pills.forEach(pill => {
  pill.addEventListener('click', () => {
    const mode = pill.dataset.mode;
    setActiveMode(mode);

    // Re-enable if currently toggled off
    if (!toggle.checked) {
      toggle.checked = true;
      document.body.classList.remove('disabled');
    }
    statusText.textContent = siteIsDisabled ? STATUS.site : STATUS.on;

    chrome.runtime.sendMessage({ action: 'setMode', mode });
  });
});

// ── Enable/disable toggle ───────────────────────────────────────────────────

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  setEnabled(enabled);
  chrome.runtime.sendMessage({ action: 'setEnabled', enabled });
});

// ── Disable on this site ────────────────────────────────────────────────────

siteBtn.addEventListener('click', () => {
  if (!currentHostname) return;

  chrome.runtime.sendMessage(
    { action: 'toggleSite', hostname: currentHostname },
    (response) => {
      if (chrome.runtime.lastError || !response) return;
      setSiteDisabled(response.disabled);
    }
  );
});

// ── Settings link ──────────────────────────────────────────────────────────

document.getElementById('open-settings').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage
    ? chrome.runtime.openOptionsPage()
    : chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});
