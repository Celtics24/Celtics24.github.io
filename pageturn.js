(function(){
/* ---- אנימציית דפדוף: חילוץ שסופק מאפליקציית אבא (2026-11-07) ----
   מנוע הסיבוב המקורי (snapshotPage / bendSheet / playTurn) נשמר כמות שהוא.
   ההתאמות לדף הניסיון בלבד:
   1. המנוע פועל בתוך ה-shadow root של רכיב המחברת במקום ב-document.
   2. אלמנט העמוד הוא .sheet; העותק המונפש מקבל את המחלקה .paper לצורך כללי ה-CSS של האפקט.
   3. אלמנטי canvas (אם יופיעו) מומרים לתמונה בעת הכנת העותק, כי cloneNode לא משכפל פיקסלים.
   4. חיווי ההפעלה: צילום העמוד בהורדת האצבע/לחיצה, והשמעה כשמונה העמודים משתנה (כולל כיוון). */
const PT_CSS = `
.turning .paper{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:var(--paper,#fffdfb)}
.turning{position:fixed;z-index:9999;overflow:hidden;pointer-events:none;border-radius:14px;transform-origin:100% 50%}
.turning .paper{position:absolute;margin:0;min-height:0}
.turning.strip{overflow:visible;border-radius:0;transform-style:preserve-3d}
.strip .strip{position:absolute;right:100%;top:0;width:100%;height:100%;transform-style:preserve-3d;transform-origin:100% 50%}
.face,.rear{position:absolute;inset:0 0 0 -1px;overflow:hidden}
.rear{opacity:.94;background:color-mix(in srgb,var(--paper) 90%,#6b5a45);backface-visibility:hidden;transform:rotateY(180deg) translateZ(.5px)}
.turning.strip>.face{border-radius:0 14px 14px 0}
.strip:not(:has(>.strip))>.face,.strip:not(:has(>.strip))>.rear{border-radius:14px 0 0 14px}
.face .shade{position:absolute;inset:0;opacity:0;background:linear-gradient(to left,rgba(30,20,10,.72),rgb(30,20,10))}
.turning.strip>.face .shade{background:linear-gradient(to left,rgb(30,20,10),rgba(30,20,10,.55))}
.turning.cast{opacity:0;background:linear-gradient(to left,rgba(30,20,10,.56),rgba(30,20,10,.18) 8%,rgba(30,20,10,.05) 28%,transparent 62%)}
@media (min-width:820px) and (min-height:560px){.turning{transform-origin:calc(100% + 25px) 50%}}
.flipwrap.ff .sheet,.flipwrap.fb .sheet{animation:none!important}
`;
window.wirePageTurn = function(ui) {
  const sr = ui && ui.shadowRoot;
  if (!sr || sr.querySelector(".pt-engine")) return;
  const st = document.createElement("style");
  st.className = "pt-engine";
  st.textContent = PT_CSS;
  sr.appendChild(st);
  const $ = (s) => sr.querySelector(s);
  const $$ = (s) => [...sr.querySelectorAll(s)];
  function snapshotPage() {
    const old = $(".sheet");
    if (!old) return null;
    $$(".turning").forEach((x) => x.remove());
    const rect = old.getBoundingClientRect(), page = old.cloneNode(true), top = Math.max(rect.top, 0);
    page.classList.add("paper");
    const srcC = [...old.querySelectorAll("canvas")], dstC = [...page.querySelectorAll("canvas")];
    srcC.forEach((c, i) => {
      const d = dstC[i]; if (!d) return;
      try {
        const img = document.createElement("img");
        img.className = d.className;
        img.setAttribute("style", d.getAttribute("style") || "");
        const r = c.getBoundingClientRect();
        img.style.width = r.width + "px"; img.style.height = r.height + "px";
        img.src = c.toDataURL("image/png");
        d.replaceWith(img);
      } catch (e) {}
    });
    [...page.children].filter((_, i) => old.children[i] && old.children[i].getBoundingClientRect().top > innerHeight).forEach((x) => x.remove());
    page.querySelectorAll("[id]").forEach((x) => x.removeAttribute("id"));
    page.querySelectorAll("iframe").forEach((x) => x.remove());
    Object.assign(page.style, { top: `${rect.top - top}px`, width: `${rect.width}px`, minHeight: `${rect.height}px` });
    const sheet = Object.assign(document.createElement("div"), { className: "turning", inert: true });
    Object.assign(sheet.style, { top: `${top}px`, left: `${rect.left}px`, width: `${rect.width}px`, height: `${Math.min(rect.height, innerHeight - top)}px` });
    sheet.append(page);
    return sheet;
  }
  const BEND = 55;
  function bendSheet(flat) {
    const W = parseFloat(flat.style.width), count = W < 600 ? 6 : 10, w = W / count, strips = [];
    const part = (tag, cls, parent) => parent.appendChild(Object.assign(document.createElement(tag), { className: cls }));
    const root = Object.assign(document.createElement("div"), { className: "turning strip", inert: true });
    Object.assign(root.style, { top: flat.style.top, left: `${parseFloat(flat.style.left) + W - w}px`, width: `${w}px`, height: flat.style.height });
    for (let k = 0, strip = root; k < count; k++, strip = k < count ? part("div", "strip", strip) : strip) {
      const face = part("div", "face", strip), copy = face.appendChild(flat.firstChild.cloneNode(true));
      copy.style.left = `${(k + 1) * w - W + 1}px`;
      strips.push({ strip, shade: part("i", "shade", face) });
      part("div", "rear", strip);
    }
    return { root, strips };
  }
  function playTurn(old, forward) {
    if (!$(".sheet")) return;
    const clear = (a, parts) => { const t = setTimeout(() => a.finish(), window.__PT_CLEAR || 1000); a.finished.catch(() => {}).finally(() => { clearTimeout(t); parts.forEach((x) => x.remove()); }); };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sr.append(old);
      clear(old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease-out", fill: "both" }), [old]);
      return;
    }
    const flat = forward ? old : snapshotPage(), { root, strips } = bendSheet(flat), W = parseFloat(flat.style.width);
    const cast = Object.assign(document.createElement("i"), { className: "turning cast" });
    cast.style.cssText = flat.style.cssText;
    sr.append(...(forward ? [cast, root] : [old, cast, root]));
    const wide = innerWidth - parseFloat(flat.style.left) - W > 40, end = wide ? 270 : 110;
    const opts = { duration: window.__PT_DURATION || (wide ? 520 : 340), easing: "cubic-bezier(.4,.05,.6,.95)", fill: "both", direction: forward ? "normal" : "reverse" };
    const step = (t) => BEND * Math.sin(Math.PI * t) / strips.length, track = (f) => Array.from({ length: 13 }, (_, i) => f(i / 12));
    strips.forEach(({ strip, shade }, k) => {
      if (k) strip.animate(track((t) => ({ transform: `rotateY(${step(t)}deg)` })), opts);
      shade.animate(track((t) => ({ opacity: .3 * (1 - Math.abs(Math.cos((t * end + k * step(t)) * Math.PI / 180))) })), opts);
    });
    cast.animate([{ opacity: 0 }, { offset: .35, opacity: .7 }, { opacity: 0 }], opts);
    clear(root.animate(track((t) => ({ transform: `perspective(${3 * W}px) rotateY(${t * end}deg)` })), opts), [old, cast, root]);
  }
  const pageIndex = () => { const el = sr.querySelector(".pgind"); const m = el && el.textContent.match(/(\d+)\s*\//); return m ? +m[1] : null; };
  const setPaperVar = () => { const s = sr.querySelector(".sheet"); if (s) ui.style.setProperty("--paper", getComputedStyle(s).backgroundColor); };
  let pending = null, pendingIdx = null, pendingAt = 0;
  const snap = () => {
    if (sr.querySelector(".turning")) return;
    if (!sr.querySelector(".sheet")) return;
    setPaperVar();
    pending = snapshotPage();
    pendingIdx = pageIndex();
    pendingAt = Date.now();
  };
  setPaperVar();
  sr.addEventListener("pointerdown", (e) => { if (e.target.closest && e.target.closest(".flipwrap")) snap(); }, true);
  sr.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest(".nbnav,.ptab"); if (b) snap(); }, true);
  window.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") snap(); }, true);
  new MutationObserver(() => {
    if (pending === null || pendingIdx === null) return;
    if (Date.now() - pendingAt > 3000) { pending = null; pendingIdx = null; return; }
    const idx = pageIndex();
    if (idx === null || idx === pendingIdx) return;
    const dir = idx > pendingIdx;
    const old = pending; pending = null; pendingIdx = null;
    requestAnimationFrame(() => playTurn(old, dir));
  }).observe(sr, { childList: true, characterData: true, subtree: true });
}
})();
