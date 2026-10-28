// Friends: profile name, search by exact name, requests, title-only friend pages, per-item approvals.
(() => {
  const API='https://study-coach-push.y0546367987.workers.dev';
  const code=()=>localStorage.getItem('sync.code.v1')||'';
  async function api(path,body){const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,code:code()})});const j=await r.json().catch(()=>({}));if(!r.ok){const e=Error(j.error||'server');e.status=r.status;throw e;}return j;}
  const e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const avatar=p=>`<span class="fr-avatar" aria-hidden="true">${e(Array.from(p.first||'?')[0])}</span>`;
  const person=p=>`${avatar(p)}<span class="fr-person-text">${who(p)}</span>`;
  const who=p=>`<bdi data-fr-content class="summary-name">${e(p.first)} ${e(p.last)}</bdi> <span class="fr-tag" dir="ltr">#${e(p.tag)}</span>`;
  let me=null, meLoaded=false, activePane='mine';
  const tr=(he,en)=>en;
  const symbol=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">${name==='plus'?'<path d="M12 5v14M5 12h14"/>':'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>'}</svg>`;
  function friendsStyle(){
    if(document.getElementById('friends-social-style'))return;
    const style=document.createElement('style');style.id='friends-social-style';
    style.textContent=`
    #friends-workspace .fr-social-header{display:flex;justify-content:space-between;align-items:center;margin:5px 0 25px}
    .fr-add-circle{display:grid;place-items:center;width:44px;height:44px;border:0;border-radius:50%;background:var(--pink-100);color:var(--pink-700);cursor:pointer}.fr-add-circle svg{width:23px;height:23px}
    .fr-subtabs{display:flex;gap:8px;border-bottom:1px solid var(--ds-hairline);margin:22px 0 25px}.fr-subtab{position:relative;flex:1;border:0;background:none;min-height:48px;font:inherit;font-size:14px;color:var(--ds-ink-2);cursor:pointer;padding:6px 2px}.fr-subtab[aria-selected="true"]{color:var(--pink-700);font-weight:700}.fr-subtab[aria-selected="true"]::after{content:'';position:absolute;bottom:-1px;inset-inline:0;height:3px;border-radius:3px;background:var(--pink-600)}
    .fr-count{display:inline-grid;place-items:center;min-width:20px;height:20px;border-radius:20px;margin-inline-start:5px;padding:0 5px;font-size:11px;background:var(--pink-100);color:var(--pink-700)}
    .fr-search-wrap{display:flex;align-items:center;gap:10px;background:var(--pink-50);border-radius:16px;padding:0 14px;min-height:49px;color:var(--ds-ink-2)}.fr-search-wrap svg{width:20px;height:20px;flex:none}.fr-search-wrap input{border:0;outline:0;background:transparent;color:var(--ds-ink);font:inherit;font-size:14px;width:100%;min-width:0;height:49px}.fr-search-wrap:focus-within{outline:2px solid var(--pink-300)}
    #friends-workspace .fr-discover .add-link-form{background:none;border:0;padding:0;margin:0}.fr-discover .add-link-form label{font-size:0}.fr-discover .add-link-form input{border:0;border-radius:16px;background:var(--pink-50);padding:0 16px;min-height:49px;font-size:14px}.fr-search-info{margin:12px 0;font-size:12px;color:var(--ds-ink-2)}.fr-search-info summary{cursor:pointer;min-height:44px;display:flex;align-items:center}.fr-search-info p{line-height:1.7;margin-top:0}
    #friends-workspace .fr-social .fr-row{padding:18px 0;min-height:82px;border-color:var(--ds-hairline)}.fr-avatar{width:49px;height:49px;border-radius:50%;background:var(--pink-100);color:var(--pink-700);font-size:21px;display:inline-grid;place-items:center;flex:none}.fr-person-text{display:flex;flex:1;flex-wrap:wrap;gap:5px;align-items:baseline;min-width:0;overflow-wrap:anywhere}.fr-person-text .fr-tag,.fr-person-text .save-state{flex-basis:100%;font-size:11px}.fr-social .fr-person-text .save-state{font-weight:400}.fr-social .fr-list .fr-name{flex:1}.fr-social .fr-list .file-button{flex:none;font-size:12px;max-width:112px}.fr-social .fr-name{display:flex;gap:13px;align-items:center;font-size:16px;min-width:0}.fr-social .fr-friend::after{content:'›';direction:ltr;font-size:25px;color:var(--pink-600)}:root[dir="ltr"] .fr-social .fr-friend::after{content:'›'}.fr-social .fr-friend:hover{background:var(--pink-50)}
    .fr-social .file-button{min-height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:12px;padding:8px 12px}.fr-social .group-label{font-size:14px}.fr-social .fr-actions .file-button,.fr-social .fr-link{min-height:44px}.fr-social .fr-row:has(.fr-actions){flex-wrap:wrap}.fr-social .fr-actions{max-width:100%}.fr-empty{padding:24px 16px;background:var(--pink-50);border-radius:18px;line-height:1.8;font-size:14px;color:var(--ds-ink-2)}.fr-empty p{margin:0 0 14px}.fr-privacy{margin-top:28px;font-size:12px;color:var(--ds-ink-2);line-height:1.7}.fr-social [hidden]{display:none!important}.fr-blocked summary{cursor:pointer;min-height:44px;padding:12px 0;font-size:13px;color:var(--ds-ink-2)}.fr-social .fr-col .fr-name{display:block;line-height:1.7}
    @media(max-width:360px){.fr-subtab{font-size:12px}.fr-social .fr-name{font-size:14px}.fr-avatar{width:42px;height:42px}.fr-social .fr-actions{gap:5px}}`;
    document.head.appendChild(style);
  }
  function englishPage(root){
    root.dir='ltr';root.lang='en';
    if(root._englishObserver)return;
    const custom=new Map([
      ['יותר מדי ניסיונות. נסי שוב בעוד כמה דקות.','Too many attempts. Try again in a few minutes.'],
      ['אין מקום בפרופיל להוסיף את הפריט.','There is not enough room in your profile for this item.'],
      ['חבר משותף','mutual friend'],['חברים משותפים','mutual friends']
    ]);
    function text(value){let out=window.scI18n?.translate(value)||value;for(const [he,en] of custom)out=out.split(he).join(en);return out;}
    function walk(node){
      if(node.nodeType===3){const value=text(node.nodeValue);if(value!==node.nodeValue)node.nodeValue=value;return;}
      if(node.nodeType!==1||node.matches('[data-fr-content],.fr-avatar,.fr-tag,script,style'))return;
      for(const attr of ['placeholder','aria-label','title']){const value=node.getAttribute(attr);if(value){const en=text(value);if(en!==value)node.setAttribute(attr,en);}}
      for(const child of node.childNodes)walk(child);
    }
    root._englishObserver=new MutationObserver(()=>walk(root));root._englishObserver.observe(root,{childList:true,subtree:true,characterData:true});walk(root);
  }
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
      ${m?`<label class="exam-check"><input type="checkbox" id="fr-findable" ${m.findable?'checked':''}> אפשר לאחרים למצוא אותי לפי תחילת השם ולהציע אותי כחברה משותפת</label><p class="save-state">יוצגו רק שם פרטי ואות ראשונה של שם המשפחה. כבוי כברירת מחדל, אפשר לכבות בכל רגע.</p>`:''}
      <p class="save-state">${m?`הקוד הציבורי שלך: <strong dir="ltr">#${e(m.tag)}</strong>. `:''}${NOTE}</p>
      <button class="file-button">${m?'שמירה':'שמירת פרופיל'}</button>
      ${m?'<button class="file-button danger" type="button" id="fr-leave">הסרת הפרופיל החברתי</button>':''}
      <div class="form-error" id="fr-profile-msg"></div></form>`;
    const msg=t=>box.querySelector('#fr-profile-msg').textContent=t;
    box.querySelector('form').addEventListener('submit',async ev=>{ev.preventDefault();const f=ev.target,b=f.querySelector('button');b.disabled=true;
      try{const j=await api('/friends/set-profile',{first:f.first.value,last:f.last.value,discoverable:f.disc.checked});me=j.profile;meLoaded=true;paintProfile(box);box.querySelector('#fr-profile-msg').textContent='נשמר.';paintAdd(document.getElementById('friends-add'));}
      catch(err){msg(err.message==='invalid name'?'השם יכול להכיל אותיות, רווח, גרש ומקף, 2 עד 30 תווים.':errText(err));b.disabled=false;}});
    box.querySelector('#fr-findable')?.addEventListener('change',async ev=>{const c=ev.target;c.disabled=true;try{await api('/friends/set-findable',{findable:c.checked});me.findable=c.checked;msg(c.checked?'פעיל. אפשר לכבות בכל רגע.':'כבוי.');}catch(err){c.checked=!c.checked;msg(errText(err));}c.disabled=false;});
    box.querySelector('#fr-leave')?.addEventListener('click',async ev=>{if(!confirm('להסיר את הפרופיל החברתי? חברים, בקשות ואישורים יימחקו. הסיכומים והמחברות שלך לא ייפגעו.'))return;ev.target.disabled=true;
      try{await api('/friends/leave',{});me=null;paintProfile(box);paintAdd(document.getElementById('friends-add'));}catch(err){msg(errText(err));ev.target.disabled=false;}});
  }
  const rowHtml=(r,extra)=>`<div class="fr-row"><span class="fr-name">${avatar(r)}<span class="fr-person-text">${who(r)}${extra||''}</span></span>${r.status==='sent'?'<span class="save-state">נשלחה בקשה</span>':r.status==='incoming'?'<span class="save-state">שלחו לך בקשה, מופיעה למטה</span>':`<button class="file-button" data-variant="secondary" type="button" data-req="${e(r.fid)}">בקשת חברות</button>`}</div>`;
  function bindReq(out){out.querySelectorAll('[data-req]').forEach(bt=>bt.addEventListener('click',async()=>{bt.disabled=true;try{await api('/friends/request',{fid:bt.dataset.req});bt.outerHTML='<span class="save-state">נשלחה בקשה</span>';}catch(err){bt.disabled=false;out.insertAdjacentHTML('beforeend',`<p class="form-error">${errText(err)}</p>`);}}));}
  function paintAdd(box){
    if(!box)return;
    if(!me){box.innerHTML='<p class="save-state">כדי להוסיף חברים צריך קודם לשמור שם בפרופיל.</p>';return;}
    box.innerHTML=`<form class="add-link-form" onsubmit="return false"><label>חיפוש חברים<input id="fr-q" maxlength="60" autocomplete="off" placeholder="התחילי להקליד שם"></label></form>
      <p class="save-state">חיפוש לפי תחילת שם מציג רק מי שהפעילו זאת בהגדרות. שם מלא מדויק עובד כמו קודם.</p><div id="fr-results"></div>`;
    if(box.closest('.fr-social'))box.querySelector('p.save-state')?.remove();
    const out=box.querySelector('#fr-results'),inp=box.querySelector('#fr-q');let timer=0,seq=0;
    async function run(){
      const q=inp.value.replace(/\s+/g,' ').trim();const my=++seq;
      if(Array.from(q).length<2){out.innerHTML='';return;}
      try{
        let list=[];try{list=(await api('/friends/prefix',{q})).results||[];}catch(err){if(err.message!=='invalid query')throw err;}
        if(!list.length){const words=q.split(' ');if(words.length>=2){for(let i=1;i<words.length&&!list.length;i++){try{list=(await api('/friends/search',{first:words.slice(0,i).join(' '),last:words.slice(i).join(' ')})).results||[];}catch(err){if(err.message==='invalid name')continue;throw err;}}}}
        if(my!==seq)return;
        out.innerHTML=list.length?`<div class="fr-list">${list.map(r=>rowHtml(r)).join('')}</div><span class="save-state">Names are unverified</span>`:'<p class="save-state">לא נמצא.</p>';
        bindReq(out);
      }catch(err){if(my===seq)out.innerHTML=`<p class="form-error">${errText(err)}</p>`;}
    }
    inp.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(run,350);});
  }
  async function paintSuggestions(box){
    if(!box||!me)return;
    if(localStorage.getItem('fr.sugg.off')==='1'){box.innerHTML='<button class="fr-link" type="button" id="fr-sugg-on">הצגת הצעות חברים</button>';box.querySelector('#fr-sugg-on').onclick=()=>{localStorage.removeItem('fr.sugg.off');paintSuggestions(box);};return;}
    let list=[];try{list=(await api('/friends/suggestions',{})).results||[];}catch(_){return;}
    if(!list.length){box.innerHTML=`<p class="fr-empty">${tr('אין כרגע הצעות.','No suggestions yet.')}</p>`;return;}
    box.innerHTML=`<h2 class="group-label">אולי את מכירה</h2><div class="fr-list">${list.map(r=>rowHtml(r,` <span class="save-state">· ${r.mutual} ${r.mutual===1?'mutual friend':'mutual friends'}</span>`)).join('')}</div><button class="fr-link" type="button" id="fr-sugg-off">להסתיר הצעות</button>`;
    bindReq(box);box.querySelector('#fr-sugg-off').onclick=()=>{localStorage.setItem('fr.sugg.off','1');paintSuggestions(box);};
  }

  // ----- Friends page -----
  window.renderFriends=async()=>{
    const root=document.getElementById('friends-workspace');if(!root)return;friendsStyle();englishPage(root);
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
    const incoming=j.incoming.map(p=>`<div class="fr-row"><span class="fr-name">${person(p)}</span><span class="fr-actions"><button class="file-button" type="button" data-act="accept" data-fid="${e(p.fid)}">אישור</button><button class="file-button" data-variant="secondary" type="button" data-act="decline" data-fid="${e(p.fid)}">דחייה</button><button class="fr-link" type="button" data-act="block" data-fid="${e(p.fid)}">חסימה</button></span></div>`).join('');
    const reqIn=j.itemRequests.filter(x=>x.status==='pending').map(g=>`<div class="fr-row fr-col"><span class="fr-name">${who(g.who)} requests ${g.kind==='notebook'?'the notebook':'the summary'} <strong data-fr-content class="summary-name" dir="auto">${e(g.title)}</strong></span>${g.isLink?'<span class="save-state">זה קישור לדרייב. ההרשאות בדרייב לא משתנות.</span>':''}<span class="save-state">האישור תקף 7 ימים, ומתקבל עותק אחד שנשאר אצלה.</span><span class="fr-actions"><button class="file-button" type="button" data-gact="approve" data-gid="${e(g.id)}">אישור</button><button class="file-button" data-variant="secondary" type="button" data-gact="decline" data-gid="${e(g.id)}">דחייה</button></span></div>`).join('');
    const mine=j.myRequests.map(g=>{const st=g.status;let right='';
      if(st==='approved')right=`<select data-sel="${e(g.id)}" aria-label="מקצוע">${subjects.map(s=>`<option value="${e(s.key)}">${e(s.name)}</option>`).join('')}</select><button class="file-button" type="button" data-accept="${e(g.id)}">הוספה אליי</button>`;
      else right=`<span class="save-state">${st==='pending'?'ממתין לאישור':st==='declined'?'נדחה':st==='done'?'נוסף':st==='expired'?'פג תוקף':'בוטל'}</span>`;
      return `<div class="fr-row fr-col"><span class="fr-name"><bdi data-fr-content class="summary-name">${e(g.title)}</bdi> <span class="save-state">From ${who(g.who)}</span></span><span class="fr-actions">${right}</span></div>`;}).join('');
    const friends=j.friends.map(p=>`<a class="fr-row fr-friend" href="#/friends/${e(p.fid)}"><span class="fr-name">${person(p)}</span></a>`).join('');
    const out=j.outgoing.map(p=>`<div class="fr-row"><span class="fr-name">${who(p)}</span><span class="save-state">ממתין לאישור</span></div>`).join('');
    const blocked=j.blocked.map(p=>`<div class="fr-row"><span class="fr-name">${who(p)}</span><button class="fr-link" type="button" data-act="unblock" data-fid="${e(p.fid)}">ביטול חסימה</button></div>`).join('');
    const pending=j.incoming.length+j.itemRequests.filter(x=>x.status==='pending').length+j.myRequests.filter(x=>x.status==='approved').length;
    root.innerHTML=`<div class="fr-social">
      <header class="file-header fr-social-header"><h1 class="file-title">חברים</h1><button class="fr-add-circle" id="fr-add-shortcut" aria-label="${tr('הוספת חברים','Add friends')}">${symbol('plus')}</button></header>
      <label class="fr-search-wrap" id="fr-mine-search">${symbol('search')}<input id="fr-filter" aria-label="${tr('חיפוש בחברים שלי','Search my friends')}" placeholder="${tr('חיפוש בחברים שלי','Search my friends')}" autocomplete="off"></label>
      <div class="fr-subtabs" role="tablist" aria-label="${tr('חברים','Friends')}">
        <button class="fr-subtab" role="tab" id="fr-tab-mine" aria-controls="fr-pane-mine" data-pane="mine">החברים שלי</button>
        <button class="fr-subtab" role="tab" id="fr-tab-discover" aria-controls="fr-pane-discover" data-pane="discover">${tr('גילוי','Discover')}</button>
        <button class="fr-subtab" role="tab" id="fr-tab-requests" aria-controls="fr-pane-requests" data-pane="requests">${tr('בקשות','Requests')}${pending?`<span class="fr-count">${pending}</span>`:''}</button>
      </div>
      <section role="tabpanel" id="fr-pane-mine" aria-labelledby="fr-tab-mine">
        <h2 class="group-label">החברים שלי <span class="fr-count">${j.friends.length}</span></h2>
        <div id="fr-my-list">${friends||`<div class="fr-empty"><p>עוד אין חברים.</p><button class="file-button" id="fr-empty-add">הוספת חברים</button></div>`}</div>
        <p id="fr-filter-empty" class="save-state" hidden>${tr('לא נמצאו חברים בשם הזה.','No friends match this name.')}</p>
      </section>
      <section role="tabpanel" id="fr-pane-discover" class="fr-discover" aria-labelledby="fr-tab-discover" hidden>
        <div id="friends-add-page"></div><section class="group" id="friends-sugg"></section>
      </section>
      <section role="tabpanel" id="fr-pane-requests" aria-labelledby="fr-tab-requests" hidden>
        ${sec('בקשות חברות',incoming)}${sec('בקשות לפריטים שלי',reqIn)}${sec('מה ביקשתי',mine)}${sec('בקשות שנשלחו',out)}
        ${!incoming&&!reqIn&&!mine&&!out?`<p class="fr-empty">${tr('אין בקשות כרגע.','No requests right now.')}</p>`:''}
        ${blocked?`<details class="fr-blocked"><summary>חסומים <span class="fr-count">${j.blocked.length}</span></summary>${blocked}</details>`:''}
      </section>

      <div id="fr-msg" class="form-error" role="status"></div></div>`;
    function showPane(p,focus=false){
      activePane=p;
      root.querySelectorAll('[data-pane]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.pane===p));b.tabIndex=b.dataset.pane===p?0:-1;});
      ['mine','discover','requests'].forEach(x=>root.querySelector('#fr-pane-'+x).hidden=x!==p);
      root.querySelector('#fr-mine-search').hidden=p!=='mine';
      if(focus)root.querySelector(p==='discover'?'#fr-q':'#fr-filter')?.focus();
    }
    root.querySelectorAll('[data-pane]').forEach(b=>{
      b.onclick=()=>showPane(b.dataset.pane);
      b.onkeydown=ev=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(ev.key))return;ev.preventDefault();const list=[...root.querySelectorAll('[data-pane]')],i=list.indexOf(b),rtl=document.documentElement.dir!=='ltr';const next=ev.key==='Home'?0:ev.key==='End'?2:(i+((ev.key==='ArrowRight')!==rtl?1:-1)+3)%3;showPane(list[next].dataset.pane);list[next].focus();};
    });
    root.querySelector('#fr-add-shortcut').onclick=()=>showPane('discover',true);
    root.querySelector('#fr-empty-add')?.addEventListener('click',()=>showPane('discover',true));
    root.querySelector('#fr-filter').oninput=ev=>{const q=ev.target.value.trim().toLocaleLowerCase();let count=0;root.querySelectorAll('#fr-my-list .fr-friend').forEach((row,i)=>{const p=j.friends[i];const match=`${p.first} ${p.last} ${p.tag}`.toLocaleLowerCase().includes(q);row.hidden=!match;if(match)count++;});root.querySelector('#fr-filter-empty').hidden=!q||count>0||!j.friends.length;};
    paintAdd(root.querySelector('#friends-add-page'));paintSuggestions(root.querySelector('#friends-sugg'));showPane(activePane);
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
    const rows=(arr,kind)=>arr.length?arr.map(x=>{const st=stOf(kind,x.title);if(st)return `<div class="fr-row"><span class="fr-name"><bdi data-fr-content class="summary-name">${e(x.title)}</bdi></span>${st==='approved'?'<a class="fr-link" href="#/friends">אושר, להוספה</a>':'<span class="save-state">ממתין לאישור</span>'}</div>`;return `<div class="fr-row"><span class="fr-name"><bdi data-fr-content class="summary-name">${e(x.title)}</bdi></span><button class="file-button" data-variant="secondary" type="button" data-ask="${kind}" data-ref="${e(x.ref)}">בקשת גישה</button></div>`;}).join(''):'<p class="save-state">אין עדיין.</p>';
    root.innerHTML=`<header class="file-header"><a class="fr-back" href="#/friends">חזרה לחברים</a><h1 class="file-title summary-name" data-fr-content dir="auto">${e(f.first)} ${e(f.last)}</h1><div class="file-fact" dir="ltr">#${e(f.tag)}</div></header>
      
      <section class="group"><h2 class="group-label">מחברות</h2>${rows(j.notebooks,'notebook')}</section>
      <section class="group"><h2 class="group-label">סיכומים</h2>${rows(j.summaries,'summary')}</section>
      <div id="fr-msg" class="form-error"></div>
      <section class="group"><button class="file-button danger" type="button" id="fr-remove">הסרת חבר</button> <button class="fr-link" type="button" id="fr-block">חסימה</button></section>`;
    const msg=t=>{root.querySelector('#fr-msg').textContent=t;};
    root.querySelectorAll('[data-ask]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await api('/friends/item-request',{fid,kind:b.dataset.ask,ref:b.dataset.ref});b.outerHTML='<span class="save-state">נשלחה בקשה</span>';}catch(err){msg(errText(err));b.disabled=false;}}));
    root.querySelector('#fr-remove').addEventListener('click',async()=>{if(!confirm('Remove this friend? Open requests will be cancelled. Items already copied are kept.'))return;try{await api('/friends/remove',{fid});location.hash='#/friends';}catch(err){msg(errText(err));}});
    root.querySelector('#fr-block').addEventListener('click',async()=>{if(!confirm('Block this person? They will not be able to send you requests or find you.'))return;try{await api('/friends/respond',{fid,action:'block'});location.hash='#/friends';}catch(err){msg(errText(err));}});
  }
  window.friendsSettingsNote=SETTINGS_NOTE;
  if(code())loadMe();
})();
