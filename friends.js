// Friends: profile name, search by exact name, requests, title-only friend pages, per-item approvals.
(() => {
  const API='https://study-coach-push.y0546367987.workers.dev';
  const code=()=>localStorage.getItem('sync.code.v1')||'';
  async function api(path,body){const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,code:code()})});const j=await r.json().catch(()=>({}));if(!r.ok){const e=Error(j.error||'server');e.status=r.status;throw e;}return j;}
  const e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const who=p=>`${e(p.first)} ${e(p.last)} <span class="fr-tag" dir="ltr">#${e(p.tag)}</span>`;
  let me=null, meLoaded=false;
  async function loadMe(){try{const j=await api('/friends/me',{});me=j.profile;meLoaded=true;window.friendsPending=j.pending||{incoming:0,itemRequests:0};}catch(err){me=null;meLoaded=false;}badge();return me;}
  function badge(){const t=document.querySelector('#tabs .tab[data-tab="friends"]');if(!t)return;const n=(window.friendsPending&&(window.friendsPending.incoming+window.friendsPending.itemRequests))||0;t.classList.toggle('has-badge',n>0);}
  function errText(err){return err.message==='blocked'?'הפרופיל הושבת על ידי מנהלת האפליקציה.':err.status===429?'יותר מדי ניסיונות. נסי שוב בעוד כמה דקות.':err.status===404||err.message==='Failed to fetch'?'השרת לא זמין כרגע.':'לא הצליח. נסי שוב.';}
  const NOTE='השם נבחר על ידי המשתמשת ואינו מאומת. הקוד אחרי # הוא מזהה ציבורי, אפשר להשוות אותו מחוץ לאפליקציה כדי לוודא שזה האדם הנכון.';
  const SETTINGS_NOTE='רק שם וקוד ציבורי נחשפים בחיפוש. אחרי שחבר מאשר, הוא יכול לראות רק שמות של מחברות וסיכומים, לא תוכן. תוכן עובר רק אחרי אישור על כל פריט, והעותק נשאר אצל מי שקיבלה גם אם מסירים חבר.';

  // ----- Settings -----
  window.renderFriendsSettings=async()=>{
    const prof=document.getElementById('friends-profile'),add=document.getElementById('friends-add');if(!prof||!code())return;
    await loadMe();
    paintProfile(prof);paintAdd(add);
  };
  function paintProfile(box){
    if(!meLoaded){box.innerHTML='<p class="save-state">השרת לא זמין כרגע.</p>';return;}
    const m=me;
    box.innerHTML=`<form class="add-link-form" id="fr-profile-form">
      <label>שם פרטי<input name="first" required minlength="2" maxlength="30" value="${e(m?m.first:'')}" autocomplete="off"></label>
      <label>שם משפחה<input name="last" required minlength="2" maxlength="30" value="${e(m?m.last:'')}" autocomplete="off"></label>
      <label class="exam-check"><input type="checkbox" name="disc" ${m&&m.discoverable?'checked':''}> אפשר לאחרים למצוא אותי לפי שם מלא</label>
      <p class="save-state">${m?`הקוד הציבורי שלך: <strong dir="ltr">#${e(m.tag)}</strong>. `:''}${NOTE}</p>
      <button class="file-button">${m?'שמירה':'שמירת פרופיל'}</button>
      ${m?'<button class="file-button danger" type="button" id="fr-leave">הסרת הפרופיל החברתי</button>':''}
      <div class="form-error" id="fr-profile-msg"></div></form>`;
    const msg=t=>box.querySelector('#fr-profile-msg').textContent=t;
    box.querySelector('form').addEventListener('submit',async ev=>{ev.preventDefault();const f=ev.target,b=f.querySelector('button');b.disabled=true;
      try{const j=await api('/friends/set-profile',{first:f.first.value,last:f.last.value,discoverable:f.disc.checked});me=j.profile;meLoaded=true;paintProfile(box);box.querySelector('#fr-profile-msg').textContent='נשמר.';paintAdd(document.getElementById('friends-add'));}
      catch(err){msg(err.message==='invalid name'?'השם יכול להכיל אותיות, רווח, גרש ומקף, 2 עד 30 תווים.':errText(err));b.disabled=false;}});
    box.querySelector('#fr-leave')?.addEventListener('click',async ev=>{if(!confirm('להסיר את הפרופיל החברתי? חברים, בקשות ואישורים יימחקו. הסיכומים והמחברות שלך לא ייפגעו.'))return;ev.target.disabled=true;
      try{await api('/friends/leave',{});me=null;paintProfile(box);paintAdd(document.getElementById('friends-add'));}catch(err){msg(errText(err));ev.target.disabled=false;}});
  }
  function paintAdd(box){
    if(!box)return;
    if(!me){box.innerHTML='<p class="save-state">\u05db\u05d3\u05d9 \u05dc\u05d4\u05d5\u05e1\u05d9\u05e3 \u05d7\u05d1\u05e8\u05d9\u05dd \u05e6\u05e8\u05d9\u05da \u05e7\u05d5\u05d3\u05dd \u05dc\u05e9\u05de\u05d5\u05e8 \u05e9\u05dd \u05d1\u05e4\u05e8\u05d5\u05e4\u05d9\u05dc.</p>';return;}
    box.innerHTML=`<form class="add-link-form" id="fr-search-form"><label>\u05e9\u05dd \u05de\u05dc\u05d0<input name="full" required minlength="5" maxlength="60" autocomplete="off"></label>
      <p class="save-state">\u05d7\u05d9\u05e4\u05d5\u05e9 \u05dc\u05e4\u05d9 \u05e9\u05dd \u05de\u05dc\u05d0 \u05de\u05d3\u05d5\u05d9\u05e7, \u05e8\u05e7 \u05de\u05d9 \u05e9\u05d1\u05d7\u05e8 \u05dc\u05d4\u05d9\u05d5\u05ea \u05e0\u05d9\u05ea\u05df \u05dc\u05d7\u05d9\u05e4\u05d5\u05e9.</p><button class="file-button">\u05d7\u05d9\u05e4\u05d5\u05e9</button></form><div id="fr-results"></div>`;
    const out=box.querySelector('#fr-results');
    box.querySelector('form').addEventListener('submit',async ev=>{ev.preventDefault();const f=ev.target,b=f.querySelector('button');b.disabled=true;out.innerHTML='';
      const words=String(f.full.value||'').replace(/\s+/g,' ').trim().split(' ');
      const paint=j=>{out.innerHTML=j.results.length?`<div class="fr-list">${j.results.map(r=>`<div class="fr-row"><span class="fr-name">${who(r)}</span>${r.status==='sent'?'<span class="save-state">\u05e0\u05e9\u05dc\u05d7\u05d4 \u05d1\u05e7\u05e9\u05d4</span>':r.status==='incoming'?'<span class="save-state">\u05e9\u05dc\u05d7\u05d5 \u05dc\u05da \u05d1\u05e7\u05e9\u05d4, \u05de\u05d5\u05e4\u05d9\u05e2\u05d4 \u05dc\u05de\u05d8\u05d4</span>':`<button class="file-button" data-variant="secondary" type="button" data-req="${e(r.fid)}">\u05d1\u05e7\u05e9\u05ea \u05d7\u05d1\u05e8\u05d5\u05ea</button>`}</div>`).join('')}</div><p class="save-state">${NOTE}</p>`:'<p class="save-state">\u05dc\u05d0 \u05e0\u05de\u05e6\u05d0. \u05d1\u05d3\u05e7\u05d9 \u05d0\u05d9\u05d5\u05ea, \u05d0\u05d5 \u05e9\u05d4\u05d0\u05d3\u05dd \u05dc\u05d0 \u05d1\u05d7\u05e8 \u05dc\u05d4\u05d9\u05d5\u05ea \u05e0\u05d9\u05ea\u05df \u05dc\u05d7\u05d9\u05e4\u05d5\u05e9.</p>';
        out.querySelectorAll('[data-req]').forEach(bt=>bt.addEventListener('click',async()=>{bt.disabled=true;try{await api('/friends/request',{fid:bt.dataset.req});bt.outerHTML='<span class="save-state">\u05e0\u05e9\u05dc\u05d7\u05d4 \u05d1\u05e7\u05e9\u05d4</span>';}catch(err){bt.disabled=false;out.insertAdjacentHTML('beforeend',`<p class="form-error">${errText(err)}</p>`);}}));};
      if(words.length<2){out.innerHTML='<p class="form-error">\u05d4\u05db\u05e0\u05d9\u05e1\u05d9 \u05e9\u05dd \u05de\u05dc\u05d0 - \u05e9\u05dd \u05e4\u05e8\u05d8\u05d9 \u05d5\u05e9\u05dd \u05de\u05e9\u05e4\u05d7\u05d4.</p>';b.disabled=false;return;}
      // Try every first|last split so any exact full name matches, including multi-word names.
      try{let found=null;
        for(let i=1;i<words.length&&!found;i++){
          try{const j=await api('/friends/search',{first:words.slice(0,i).join(' '),last:words.slice(i).join(' ')});
            if(j.results&&j.results.length)found=j;}catch(err){if(err.message==='invalid name')continue;throw err;}
        }
        paint(found||{results:[]});
      }catch(err){out.innerHTML=`<p class="form-error">${errText(err)}</p>`;}
      b.disabled=false;});
  }

  // ----- Friends page -----
  window.renderFriends=async()=>{
    const root=document.getElementById('friends-workspace');if(!root)return;
    const m=location.hash.match(/^#\/friends\/([A-Z2-9]{12})$/);
    root.innerHTML='<header class="file-header"><h1 class="file-title">חברים</h1></header><p class="save-state">טוען…</p>';
    await loadMe();
    if(!meLoaded){root.innerHTML='<header class="file-header"><h1 class="file-title">חברים</h1></header><p class="save-state">השרת לא זמין כרגע.</p>';return;}
    if(!me){root.innerHTML='<header class="file-header"><h1 class="file-title">חברים</h1></header><div class="group"><p class="save-state">כדי להשתמש בחברים צריך לשמור שם פרטי ושם משפחה. רק את בוחרת אם אחרים יוכלו למצוא אותך.</p><a class="file-button" href="#/settings">להגדרות</a></div>';return;}
    try{ if(m)await friendPage(root,m[1]); else await listPage(root); }catch(err){root.innerHTML=`<header class="file-header"><h1 class="file-title">חברים</h1></header><p class="form-error">${errText(err)}</p>`;}
    window.friendsPending=window.friendsPending||{};badge();
  };
  async function listPage(root){
    const j=await api('/friends/list',{});
    const subjects=(window.boardProfile&&window.boardProfile()?.subjects)||[];
    window.friendsPending={incoming:j.incoming.length,itemRequests:j.itemRequests.filter(x=>x.status==='pending').length};badge();
    const sec=(t,h)=>h?`<section class="group"><h2 class="group-label">${t}</h2>${h}</section>`:'';
    const incoming=j.incoming.map(p=>`<div class="fr-row"><span class="fr-name">${who(p)}</span><span class="fr-actions"><button class="file-button" type="button" data-act="accept" data-fid="${e(p.fid)}">אישור</button><button class="file-button" data-variant="secondary" type="button" data-act="decline" data-fid="${e(p.fid)}">דחייה</button><button class="fr-link" type="button" data-act="block" data-fid="${e(p.fid)}">חסימה</button></span></div>`).join('');
    const reqIn=j.itemRequests.filter(x=>x.status==='pending').map(g=>`<div class="fr-row fr-col"><span class="fr-name">${who(g.who)} מבקשת ${g.kind==='notebook'?'את המחברת':'את הסיכום'} <strong>${e(g.title)}</strong></span>${g.isLink?'<span class="save-state">זה קישור לדרייב. ההרשאות בדרייב לא משתנות.</span>':''}<span class="save-state">האישור תקף 7 ימים, ומתקבל עותק אחד שנשאר אצלה.</span><span class="fr-actions"><button class="file-button" type="button" data-gact="approve" data-gid="${e(g.id)}">אישור</button><button class="file-button" data-variant="secondary" type="button" data-gact="decline" data-gid="${e(g.id)}">דחייה</button></span></div>`).join('');
    const mine=j.myRequests.map(g=>{const st=g.status;let right='';
      if(st==='approved')right=`<select data-sel="${e(g.id)}" aria-label="מקצוע">${subjects.map(s=>`<option value="${e(s.key)}">${e(s.name)}</option>`).join('')}</select><button class="file-button" type="button" data-accept="${e(g.id)}">הוספה אליי</button>`;
      else right=`<span class="save-state">${st==='pending'?'ממתין לאישור':st==='declined'?'נדחה':st==='done'?'נוסף':st==='expired'?'פג תוקף':'בוטל'}</span>`;
      return `<div class="fr-row fr-col"><span class="fr-name">${e(g.title)} <span class="save-state">מאת ${who(g.who)}</span></span><span class="fr-actions">${right}</span></div>`;}).join('');
    const friends=j.friends.map(p=>`<a class="fr-row fr-friend" href="#/friends/${e(p.fid)}"><span class="fr-name">${who(p)}</span></a>`).join('');
    const out=j.outgoing.map(p=>`<div class="fr-row"><span class="fr-name">${who(p)}</span><span class="save-state">ממתין לאישור</span></div>`).join('');
    const blocked=j.blocked.map(p=>`<div class="fr-row"><span class="fr-name">${who(p)}</span><button class="fr-link" type="button" data-act="unblock" data-fid="${e(p.fid)}">ביטול חסימה</button></div>`).join('');
    root.innerHTML=`<header class="file-header"><h1 class="file-title">חברים</h1></header>
      <section class="group"><h2 class="group-label">הוספת חברים</h2><div id="friends-add-page"></div></section>
      ${sec('בקשות חברות',incoming)}${sec('בקשות לפריטים שלי',reqIn)}${sec('מה ביקשתי',mine)}
      <section class="group"><h2 class="group-label">החברים שלי</h2>${friends||'<p class="save-state">עוד אין חברים.</p>'}</section>
      ${sec('בקשות שנשלחו',out)}${sec('חסומים',blocked)}<div id="fr-msg" class="form-error"></div>`;
    paintAdd(root.querySelector('#friends-add-page'));
    const msg=t=>{root.querySelector('#fr-msg').textContent=t;};
    root.querySelectorAll('[data-act]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await api('/friends/respond',{fid:b.dataset.fid,action:b.dataset.act});renderFriends();}catch(err){msg(errText(err));b.disabled=false;}}));
    root.querySelectorAll('[data-gact]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await api('/friends/item-decide',{id:b.dataset.gid,action:b.dataset.gact});renderFriends();}catch(err){msg(errText(err));b.disabled=false;}}));
    root.querySelectorAll('[data-accept]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;const id=b.dataset.accept;try{await api('/friends/item-accept',{id,subjectKey:root.querySelector(`[data-sel="${id}"]`).value});await window.loadUserContent();location.hash='#/friends';renderFriends();}catch(err){msg(err.message==='content too large'?'אין מקום בפרופיל להוסיף את הפריט.':errText(err));b.disabled=false;}}));
  }
  async function friendPage(root,fid){
    const j=await api('/friends/profile',{fid});
    const f=j.friend;
    let lst={myRequests:[]};try{lst=await api('/friends/list',{});}catch(_){}
    const stOf=(kind,title)=>{const g=lst.myRequests.find(g=>g.who&&g.who.fid===fid&&g.kind===kind&&g.title===title&&(g.status==='pending'||g.status==='approved'));return g?g.status:'';};
    const rows=(arr,kind)=>arr.length?arr.map(x=>{const st=stOf(kind,x.title);if(st)return `<div class="fr-row"><span class="fr-name">${e(x.title)}</span>${st==='approved'?'<a class="fr-link" href="#/friends">אושר, להוספה</a>':'<span class="save-state">ממתין לאישור</span>'}</div>`;return `<div class="fr-row"><span class="fr-name">${e(x.title)}</span><button class="file-button" data-variant="secondary" type="button" data-ask="${kind}" data-ref="${e(x.ref)}">בקשת גישה</button></div>`;}).join(''):'<p class="save-state">אין עדיין.</p>';
    root.innerHTML=`<header class="file-header"><a class="fr-back" href="#/friends">חזרה לחברים</a><h1 class="file-title">${e(f.first)} ${e(f.last)}</h1><div class="file-fact" dir="ltr">#${e(f.tag)}</div></header>
      <p class="save-state">רואים כאן רק שמות. כדי לקבל פריט צריך לבקש, והוא צריך לאשר כל פריט בנפרד.</p>
      <section class="group"><h2 class="group-label">מחברות</h2>${rows(j.notebooks,'notebook')}</section>
      <section class="group"><h2 class="group-label">סיכומים</h2>${rows(j.summaries,'summary')}</section>
      <div id="fr-msg" class="form-error"></div>
      <section class="group"><button class="file-button danger" type="button" id="fr-remove">הסרת חבר</button> <button class="fr-link" type="button" id="fr-block">חסימה</button></section>`;
    const msg=t=>{root.querySelector('#fr-msg').textContent=t;};
    root.querySelectorAll('[data-ask]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await api('/friends/item-request',{fid,kind:b.dataset.ask,ref:b.dataset.ref});b.outerHTML='<span class="save-state">נשלחה בקשה</span>';}catch(err){msg(errText(err));b.disabled=false;}}));
    root.querySelector('#fr-remove').addEventListener('click',async()=>{if(!confirm('להסיר את החבר? בקשות פתוחות יבוטלו. פריטים שכבר הועתקו נשארים.'))return;try{await api('/friends/remove',{fid});location.hash='#/friends';}catch(err){msg(errText(err));}});
    root.querySelector('#fr-block').addEventListener('click',async()=>{if(!confirm('לחסום? הוא לא יוכל לשלוח לך בקשות או למצוא אותך.'))return;try{await api('/friends/respond',{fid,action:'block'});location.hash='#/friends';}catch(err){msg(errText(err));}});
  }
  window.friendsSettingsNote=SETTINGS_NOTE;
  if(code())loadMe();
})();
