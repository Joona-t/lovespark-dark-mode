// LoveSpark Dark Mode — settings.js
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const modeBtns    = document.querySelectorAll('.mode-btn');
  const toggleEl    = document.getElementById('toggle-enabled');
  const toggleLabel = document.getElementById('toggle-label');

  // ── Theme mode selector ──────────────────────────────────────────────────

  function setActiveBtn(mode) {
    modeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      setActiveBtn(mode);
      chrome.runtime.sendMessage({ action: 'setMode', mode });
      // Re-enable if off
      toggleEl.checked = true;
      toggleLabel.textContent = 'Enabled';
    });
  });

  // ── Enable toggle ────────────────────────────────────────────────────────

  toggleEl.addEventListener('change', () => {
    const enabled = toggleEl.checked;
    toggleLabel.textContent = enabled ? 'Enabled' : 'Disabled';
    chrome.runtime.sendMessage({ action: 'setEnabled', enabled });
  });

  // ── Domain editor: Excluded Sites ────────────────────────────────────────

  const key    = 'excludedDomains';
  const input  = document.getElementById('domain-add-' + key);
  const list   = document.getElementById('list-' + key);
  const addBtn = document.querySelector('[data-key="' + key + '"]');

  function renderDomains(domains) {
    list.replaceChildren();
    domains.forEach(d => {
      const li = document.createElement('li');
      li.className = 'domain-item';
      const name = document.createElement('span');
      name.className = 'domain-name';
      name.textContent = d;
      const rm = document.createElement('button');
      rm.className = 'domain-remove';
      rm.textContent = '\u00d7';
      rm.addEventListener('click', () => {
        const updated = domains.filter(x => x !== d);
        chrome.storage.local.set({ [key]: updated }, () => renderDomains(updated));
      });
      li.appendChild(name);
      li.appendChild(rm);
      list.appendChild(li);
    });
  }

  function addDomain() {
    const domain = input.value.trim().toLowerCase().replace(/^www\./, '');
    if (!domain) return;
    chrome.storage.local.get(key, (data) => {
      const domains = data[key] || [];
      if (!domains.includes(domain)) {
        domains.push(domain);
        chrome.storage.local.set({ [key]: domains }, () => {
          renderDomains(domains);
          input.value = '';
        });
      }
    });
  }

  addBtn.addEventListener('click', addDomain);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addDomain(); });

  // ── Load initial state ───────────────────────────────────────────────────

  chrome.runtime.sendMessage({ action: 'getState' }, (state) => {
    if (chrome.runtime.lastError || !state) return;

    // Mode
    setActiveBtn(state.mode);

    // Toggle
    toggleEl.checked = state.isEnabled;
    toggleLabel.textContent = state.isEnabled ? 'Enabled' : 'Disabled';

    // Domains
    renderDomains(state.excludedDomains || []);

    // Stats
    const grid = document.getElementById('stats-grid');
    const stats = [
      { label: 'Themed Today',      value: state.sitesDarkenedToday },
      { label: 'Themed Total',      value: state.sitesDarkenedTotal },
      { label: 'Eye Strain Today',  value: state.minutesSavedToday },
      { label: 'Eye Strain Total',  value: state.minutesSavedTotal },
    ];
    grid.replaceChildren();
    stats.forEach(s => {
      const cell = document.createElement('div');
      cell.className = 'stat-cell';
      const big = document.createElement('div');
      big.className = 'stat-big';
      big.textContent = (s.value || 0).toLocaleString();
      const lbl = document.createElement('div');
      lbl.className = 'stat-lbl';
      lbl.textContent = s.label;
      cell.appendChild(big);
      cell.appendChild(lbl);
      grid.appendChild(cell);
    });
  });

  // ── Reset ────────────────────────────────────────────────────────────────

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      chrome.storage.local.clear(() => window.location.reload());
    }
  });
});
