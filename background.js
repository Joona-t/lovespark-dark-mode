// LoveSpark Dark Mode — background.js (Service Worker)
'use strict';

// ── Constants ──────────────────────────────────────────────────────────────

const MODES      = ['dark', 'bubblegum', 'hotpink'];
const BADGE_ICON = { dark: '🌑', bubblegum: '🌸', hotpink: '💖' };
const BASE_CSS   = ['filters/base-filter.css', 'filters/overrides.css'];

// ── Storage helpers ────────────────────────────────────────────────────────

const DEFAULT_STATE = {
  isEnabled:          true,
  mode:               'dark',
  excludedDomains:    [],
  sitesDarkenedToday: 0,
  sitesDarkenedTotal: 0,
  minutesSavedToday:  0,
  minutesSavedTotal:  0,
  lastResetDate:      new Date().toISOString().slice(0, 10),
};

async function getState() {
  const data = await chrome.storage.local.get(Object.keys(DEFAULT_STATE));
  return { ...DEFAULT_STATE, ...data };
}

async function setState(patch) {
  await chrome.storage.local.set(patch);
}

// ── URL guards ─────────────────────────────────────────────────────────────

function isInjectable(url) {
  if (!url) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

// ── Badge ──────────────────────────────────────────────────────────────────

async function updateBadge(state) {
  const s = state || await getState();
  if (!s.isEnabled) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#666666' });
  } else {
    chrome.action.setBadgeText({ text: BADGE_ICON[s.mode] || '' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF69B4' });
  }
}

// ── Injection ──────────────────────────────────────────────────────────────

async function injectIntoTab(tabId, tabUrl) {
  if (!isInjectable(tabUrl)) return;

  // 1. Inject CSS (all modes live in base-filter; class on <html> picks one)
  try {
    await chrome.scripting.insertCSS({ target: { tabId }, files: BASE_CSS });
  } catch (_) {
    return; // Tab not ready or restricted page
  }

  // 2. Inject content.js (sets class on <html>, listens for messages)
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
  } catch (_) {}
}

// ── Broadcast to all open tabs ─────────────────────────────────────────────

async function broadcastToTabs(message) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (isInjectable(tab.url)) {
      chrome.tabs.sendMessage(tab.id, message).catch(() => {});
    }
  }
}

// ── Daily reset ────────────────────────────────────────────────────────────

async function checkDailyReset() {
  const state = await getState();
  const today = new Date().toISOString().slice(0, 10);
  if (state.lastResetDate !== today) {
    await setState({
      sitesDarkenedToday: 0,
      minutesSavedToday: 0,
      lastResetDate: today,
    });
  }
}

// ── Eye strain timer (chrome.alarms for MV3) ──────────────────────────────

// Guard: only create alarm if it doesn't already exist (MV3 SW restarts)
chrome.alarms.get('eyeStrainTick', (existing) => {
  if (!existing) chrome.alarms.create('eyeStrainTick', { periodInMinutes: 5 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'eyeStrainTick') return;
  const state = await getState();
  if (!state.isEnabled) return;

  await setState({
    minutesSavedToday: state.minutesSavedToday + 1,
    minutesSavedTotal: state.minutesSavedTotal + 1,
  });
});

// ── Track themed hosts (avoid double-counting per session) ─────────────────

const themedHosts = new Set();

// ── Message handler ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    const state = await getState();

    switch (message.action) {

      case 'getStats':
      case 'getState': {
        sendResponse(state);
        break;
      }

      case 'setMode': {
        if (!MODES.includes(message.mode)) { sendResponse({ ok: false }); break; }
        await setState({ mode: message.mode, isEnabled: true });
        const newState = await getState();
        await updateBadge(newState);
        await broadcastToTabs({ action: 'apply', mode: message.mode });
        sendResponse({ ok: true });
        break;
      }

      case 'setEnabled': {
        await setState({ isEnabled: message.enabled });
        const newState = await getState();
        await updateBadge(newState);
        if (message.enabled) {
          await broadcastToTabs({ action: 'apply', mode: newState.mode });
        } else {
          await broadcastToTabs({ action: 'remove' });
        }
        sendResponse({ ok: true });
        break;
      }

      case 'toggleSite': {
        const sites = new Set(state.excludedDomains || []);
        const host  = message.hostname;
        if (sites.has(host)) { sites.delete(host); } else { sites.add(host); }
        await setState({ excludedDomains: [...sites] });
        if (sender.tab?.id) {
          if (sites.has(host)) {
            chrome.tabs.sendMessage(sender.tab.id, { action: 'remove' }).catch(() => {});
          } else if (state.isEnabled) {
            chrome.tabs.sendMessage(sender.tab.id, { action: 'apply', mode: state.mode }).catch(() => {});
          }
        }
        sendResponse({ disabled: sites.has(host) });
        break;
      }

      case 'siteDarkened': {
        const host = (message.host || '').replace(/^www\./, '');
        if (!host || themedHosts.has(host)) { sendResponse({ ok: true }); break; }
        themedHosts.add(host);
        await setState({
          sitesDarkenedToday: state.sitesDarkenedToday + 1,
          sitesDarkenedTotal: state.sitesDarkenedTotal + 1,
        });
        await updateBadge();
        sendResponse({ ok: true });
        break;
      }

      default:
        sendResponse({ ok: false, error: 'Unknown action' });
    }
  })();
  return true;
});

// ── Tab navigation: inject on page load ───────────────────────────────────

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!isInjectable(tab.url)) return;
  injectIntoTab(tabId, tab.url);
});

// ── Startup ────────────────────────────────────────────────────────────────

async function initStorage() {
  const data = await chrome.storage.local.get(Object.keys(DEFAULT_STATE));
  const defaults = {};
  for (const [key, val] of Object.entries(DEFAULT_STATE)) {
    if (data[key] === undefined) defaults[key] = val;
  }
  if (Object.keys(defaults).length) await chrome.storage.local.set(defaults);
  await checkDailyReset();
  await updateBadge();
}

chrome.runtime.onInstalled.addListener(initStorage);
chrome.runtime.onStartup.addListener(initStorage);
initStorage();
