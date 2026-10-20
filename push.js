// Study Coach - push reminder client (loads after the main script)
// The worker URL is filled in when the Cloudflare Worker is deployed.
const PUSH_WORKER_URL = 'https://study-coach-push.y0546367987.workers.dev';
const VAPID_PUBLIC_KEY = 'BCIqAG5Og0mk5aKHL5lfLBgv13vt-3MWOc4K3sVq4_0JsUj9DrYdtxFbtGWTq4cl_l9CnxFi5igDcuMulfbcEj4';

function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(rawData, c => c.charCodeAt(0));
}
async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

async function enableReminders() {
  // Must be called from a real tap/click (iOS requires a user gesture).
  const reg = await navigator.serviceWorker.register('sw.js');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  const res = await fetch(`${PUSH_WORKER_URL}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
  if (!res.ok) return { ok: false, reason: 'server' };
  return { ok: true };
}

async function disableReminders() {
  const sub = await currentSubscription();
  if (sub) {
    try {
      await fetch(`${PUSH_WORKER_URL}/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
    } catch (e) {}
    await sub.unsubscribe();
  }
  return { ok: true };
}

// Called when she taps "למדתי" - tells the worker she studied today.
async function reportStudyDay(dayKey, streakDays) {
  try {
    const sub = await currentSubscription();
    if (!sub) return;
    await fetch(`${PUSH_WORKER_URL}/studied`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint, day: dayKey, streakDays }),
    });
  } catch (e) {}
}

async function renderRemindersCard() {
  const el = document.getElementById('reminders-card');
  if (!el) return;
  if (!pushSupported()) return; // older browser - hide the card entirely
  const sub = await currentSubscription();
  if (sub) {
    el.innerHTML = `<div class="reminders-card">
      <span class="reminders-emoji" aria-hidden="true">🔔</span>
      <span class="reminders-text"><span class="reminders-title">תזכורות פועלות</span>
      <span class="reminders-sub">אשלח לך תזכורת לפני מבחנים ונשמור על הרצף 🔥</span></span>
      <button type="button" class="reminders-btn" id="reminders-toggle">כיבוי</button></div>`;
    document.getElementById('reminders-toggle').addEventListener('click', async ev => {
      ev.target.disabled = true;
      await disableReminders();
      renderRemindersCard();
    });
  } else {
    el.innerHTML = `<div class="reminders-card">
      <span class="reminders-emoji" aria-hidden="true">🔔</span>
      <span class="reminders-text"><span class="reminders-title">רוצה תזכורות?</span>
      <span class="reminders-sub">תזכורת ערב לפני מבחן, בהצלחה בבוקר, ודחיפה עדינה לרצף</span></span>
      <button type="button" class="reminders-btn is-on" id="reminders-toggle">הפעילי</button></div>`;
    document.getElementById('reminders-toggle').addEventListener('click', async ev => {
      ev.target.disabled = true;
      const result = await enableReminders();
      if (!result.ok && result.reason === 'denied') {
        el.innerHTML = `<div class="reminders-card"><span class="reminders-emoji" aria-hidden="true">🔕</span>
          <span class="reminders-text"><span class="reminders-title">ההתראות חסומות</span>
          <span class="reminders-sub">אפשר לאפשר אותן בהגדרות האייפון ← Study Coach</span></span></div>`;
        return;
      }
      renderRemindersCard();
    });
  }
}

// Initial paint: the main script's first render() runs before this file loads,
// so fill the card once here; later renders re-fill it via the render() hook.
renderRemindersCard();
