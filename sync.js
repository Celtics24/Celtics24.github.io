// Study Coach - cross-device sync client (loads after the main script, before push.js)
// Syncs "למדתי" marks and streak days between her devices through the existing
// Cloudflare Worker + KV. No account and no sign-in: a one-time 8-character code
// pairs the devices. The code is stored only on her devices; the server keeps a
// hash of it plus the marks/dates - no name, no content.
const SYNC_WORKER_URL = 'https://study-coach-push.y0546367987.workers.dev';
const SYNC_CODE_KEY = 'sync.code.v1';  // pairing code, stored on her devices only
const SYNC_META_KEY = 'sync.meta.v1';  // per-summary {on, ts} shadow of studied.v1 (keeps unmarks)
const SYNC_PUSH_DEBOUNCE_MS = 2000;
const SYNC_PULL_INTERVAL_MS = 4 * 60 * 60 * 1000;

function syncCode() { return localStorage.getItem(SYNC_CODE_KEY) || ''; }
function loadSyncMeta() { try { return JSON.parse(localStorage.getItem(SYNC_META_KEY) || '{}'); } catch (e) { return {}; } }
function saveSyncMeta(m) { localStorage.setItem(SYNC_META_KEY, JSON.stringify(m)); }

let syncCardState = null;      // re-render the card only when its state actually changes
let lastStudiedSnapshot = null;
let pushTimer = null;
let lastPullAt = 0;

async function syncApi(path, body) {
  const res = await fetch(`${SYNC_WORKER_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, ...json };
}

// First sync on a device: convert the existing studied.v1 marks ({id: true}) into
// timestamped entries so they merge properly with the other device.
function migrateLocalMarksToMeta() {
  const meta = loadSyncMeta();
  const now = new Date().toISOString();
  for (const id of Object.keys(store.studied)) {
    if (!meta[id]) meta[id] = { on: true, ts: now };
  }
  saveSyncMeta(meta);
  lastStudiedSnapshot = JSON.stringify(store.studied);
}

// Called from index.html after every local write to studied/days.
// Diffs the studied map against the last snapshot to learn which summaries were
// marked or unmarked, stamps them, and schedules a push.
function syncLocalChanged() {
  if (!syncCode()) { lastStudiedSnapshot = JSON.stringify(store.studied); return; }
  const meta = loadSyncMeta();
  const now = new Date().toISOString();
  const prev = lastStudiedSnapshot ? JSON.parse(lastStudiedSnapshot) : {};
  const curr = store.studied;
  for (const id of new Set([...Object.keys(prev), ...Object.keys(curr)])) {
    if (!!prev[id] !== !!curr[id]) meta[id] = { on: !!curr[id], ts: now };
  }
  lastStudiedSnapshot = JSON.stringify(curr);
  saveSyncMeta(meta);
  clearTimeout(pushTimer);
  pushTimer = setTimeout(syncPush, SYNC_PUSH_DEBOUNCE_MS);
}

// Apply a merged server record locally. Returns true when anything changed.
// Conflict rules (same as the server): study days are a union (the streak is
// computed from the days, so the union keeps the longest streak); for each
// summary the latest timestamp wins, so unmarking on one device beats an older
// mark on the other.
function applyRemoteRecord(record) {
  if (!record) return false;
  let changed = false;
  const meta = loadSyncMeta();
  const studied = store.studied;
  for (const [id, entry] of Object.entries(record.studied || {})) {
    if (!entry || typeof entry !== 'object') continue;
    const local = meta[id];
    if (!local || entry.ts > local.ts) {
      meta[id] = entry;
      if (entry.on && !studied[id]) { studied[id] = true; changed = true; }
      if (!entry.on && studied[id]) { delete studied[id]; changed = true; }
    }
  }
  const days = store.days;
  for (const day of Object.keys(record.days || {})) {
    if (!days[day]) { days[day] = true; changed = true; }
  }
  if (changed) { store.studied = studied; store.days = days; }
  saveSyncMeta(meta);
  lastStudiedSnapshot = JSON.stringify(store.studied);
  return changed;
}

async function syncPull(force) {
  const code = syncCode();
  if (!code) return;
  if (!force && Date.now() - lastPullAt < SYNC_PULL_INTERVAL_MS) return;
  lastPullAt = Date.now();
  try {
    const res = await syncApi('/sync/pull', { code });
    if (res.ok && res.record) { if (applyRemoteRecord(res.record)) render(); }
    else if (res.status === 404) { localStorage.removeItem(SYNC_CODE_KEY); renderSyncCard(true); }
  } catch (e) { /* offline - try again later */ }
}

async function syncPush() {
  const code = syncCode();
  if (!code) return;
  try {
    const res = await syncApi('/sync/push', { code, studied: loadSyncMeta(), days: store.days });
    if (res.ok && res.record) { if (applyRemoteRecord(res.record)) render(); }
    else if (res.status === 404) { localStorage.removeItem(SYNC_CODE_KEY); renderSyncCard(true); }
  } catch (e) { /* offline - next change or focus will retry */ }
}

async function enableSyncWithNewCode() {
  const res = await syncApi('/sync/create', {});
  if (!res.ok || !res.code) return { ok: false };
  migrateLocalMarksToMeta();
  localStorage.setItem(SYNC_CODE_KEY, res.code);
  await syncPush();
  if(window.loadUserContent) await window.loadUserContent();
  return { ok: true, code: res.code };
}

async function enableSyncWithExistingCode(rawCode) {
  const code = String(rawCode || '').toUpperCase().replace(/[^A-Z2-9]/g, '');
  if (code.length !== 8) return { ok: false, reason: 'bad-code' };
  const res = await syncApi('/sync/pull', { code });
  if (res.status === 404) return { ok: false, reason: 'unknown-code' };
  if (!res.ok) return { ok: false, reason: 'server' };
  if (syncCode() !== code) {
    store.studied = {}; store.days = {}; saveSyncMeta({});
    localStorage.removeItem('content.cache.v1');
    if(window.clearUserContent)window.clearUserContent();
  }
  localStorage.setItem(SYNC_CODE_KEY, code);
  if (res.record) applyRemoteRecord(res.record);
  if (window.loadUserContent) await window.loadUserContent();
  return { ok: true, code };
}

async function unlinkSync(deleteRemote) {
  const code = syncCode();
  localStorage.removeItem(SYNC_CODE_KEY);
  if(window.clearUserContent) window.clearUserContent();
  if (deleteRemote && code) { try { await syncApi('/sync/destroy', { code }); } catch (e) {} }
}

function prettyCode(code) { return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code; }

function renderSyncCard(force) {
  const el = document.getElementById('sync-card');
  if (!el) return;
  const code = syncCode();
  const state = code ? `linked:${code}` : (renderSyncCard.joinMode ? `join:${renderSyncCard.error || ''}` : 'idle');
  if (!force && state === syncCardState && el.childElementCount > 0) return; // render() rebuilds the DOM - an empty card must be refilled
  syncCardState = state;

  if (code) {
    el.innerHTML = `<div class="reminders-card sync-card">
      <span class="reminders-emoji" aria-hidden="true">🔄</span>
      <span class="reminders-text"><span class="reminders-title">הסנכרון פעיל ✓</span>
      <span class="reminders-sub">הרצף והסימונים מתעדכנים בין המכשירים שלך</span>
      <span class="sync-code" title="הקוד לחיבור מכשיר נוסף">${prettyCode(code)}</span></span>
      <button type="button" class="reminders-btn" id="sync-unlink">ניתוק</button></div>`;
    document.getElementById('sync-unlink').addEventListener('click', async ev => {
      ev.target.disabled = true;
      await unlinkSync(false); // this device only; the other device keeps syncing
      renderSyncCard(true);
    });
    return;
  }

  if (renderSyncCard.joinMode) {
    el.innerHTML = `<div class="reminders-card sync-card">
      <span class="reminders-emoji" aria-hidden="true">🔄</span>
      <span class="reminders-text"><span class="reminders-title">הזיני את הקוד מהמכשיר השני</span>
      <span class="sync-row"><input id="sync-code-input" class="sync-input" type="text" inputmode="latin" maxlength="9" autocomplete="off" autocapitalize="characters" placeholder="XXXX-XXXX" aria-label="קוד סנכרון">
      <button type="button" class="reminders-btn is-on" id="sync-join">חיבור</button></span>
      ${renderSyncCard.error ? `<span class="sync-error">${renderSyncCard.error}</span>` : ''}</span></div>`;
    const input = document.getElementById('sync-code-input');
    input.focus();
    document.getElementById('sync-join').addEventListener('click', async ev => {
      ev.target.disabled = true;
      const result = await enableSyncWithExistingCode(input.value);
      if (result.ok) { renderSyncCard.joinMode = false; renderSyncCard(true); render(); return; }
      renderSyncCard.error = result.reason === 'unknown-code' ? 'הקוד לא נמצא - בדקי שוב במכשיר השני' : 'הקוד לא תקין - 8 אותיות וספרות';
      renderSyncCard(true);
    });
    return;
  }

  el.innerHTML = `<div class="reminders-card sync-card">
    <span class="reminders-emoji" aria-hidden="true">🔄</span>
    <span class="reminders-text"><span class="reminders-title">סנכרון בין מכשירים</span>
    <span class="reminders-sub">אותו רצף ואותם סימוני ״למדתי״ באייפון ובאייפד</span></span>
    <span class="sync-row"><button type="button" class="reminders-btn is-on" id="sync-start">הפעילי</button>
    <button type="button" class="reminders-btn" id="sync-have-code">יש לי קוד</button></span></div>`;
  document.getElementById('sync-start').addEventListener('click', async ev => {
    ev.target.disabled = true;
    const result = await enableSyncWithNewCode();
    if (result.ok) { renderSyncCard(true); render(); return; }
    ev.target.disabled = false;
  });
  document.getElementById('sync-have-code').addEventListener('click', () => {
    renderSyncCard.joinMode = true;
    renderSyncCard.error = '';
    renderSyncCard(true);
  });
}

// First paint: pull the latest state, then re-render if the other device had newer marks.
lastStudiedSnapshot = JSON.stringify(store.studied);
syncPull(true).then(() => renderSyncCard(true));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncPull(false); });
setInterval(() => syncPull(false), SYNC_PULL_INTERVAL_MS);
