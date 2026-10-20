// Study Coach - per-user content loader.
// The bundled lists in index.html are the fallback. When this device is paired
// (sync code), the content (subjects, exams, summaries, council items) is read
// from the Worker API, cached on the device, and the page re-renders if it differs.
// Colors travel as names ("lavender") and are mapped back to the palette C here.
(function () {
  const CACHE_KEY = 'content.cache.v1';
  let applied = null; // serialized content currently shown (null = bundled)

  function col(k) { return k ? C[k] : undefined; }
  function valid(c) {
    return c && Array.isArray(c.subjects) && c.subjects.length && Array.isArray(c.exams) && Array.isArray(c.summaries);
  }
  function apply(c) {
    subjects = c.subjects.map(s => ({ ...s, color: col(s.color) }));
    exams = c.exams.map(e => { const o = { ...e, color: col(e.color) }; if (!o.color) delete o.color; return o; });
    summaries = c.summaries.map(s => ({ ...s, color: col(s.color) }));
    councilItems = (c.councilItems || []).map(s => ({ ...s, color: col(s.color) }));
    if (c.novExams) {
      const nv = {};
      for (const [d, list] of Object.entries(c.novExams)) nv[d] = list.map(x => ({ t: x.t, c: col(x.c) }));
      novExams = nv;
    }
    applied = JSON.stringify(c);
  }
  function typing() {
    const a = document.activeElement;
    return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA');
  }

  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) {}
  if (valid(cached)) { try { apply(cached); render(); } catch (e) { applied = null; } }

  async function load() {
    const code = typeof syncCode === 'function' ? syncCode() : '';
    if (!code) return;
    try {
      const res = await fetch(`${SYNC_WORKER_URL}/content/get`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }),
      });
      if (!res.ok) return; // no content for this code yet: keep what is shown
      const json = await res.json();
      if (!valid(json.content)) return;
      const ser = JSON.stringify(json.content);
      if (ser === applied) return;
      localStorage.setItem(CACHE_KEY, ser);
      apply(json.content);
      if (!typing()) render();
    } catch (e) { /* offline - the bundled/cached content stays */ }
  }
  load();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') load(); });
})();
