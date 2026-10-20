// Per-profile content, first-run timetable and theme preferences.
(() => {
  const API='https://study-coach-push.y0546367987.workers.dev';
  let current=null, busy=false, error='', mode='welcome', loading=false;
  window.userContentReady=false;
  const themes={pink:{label:'ורוד',light:'#ffe3ef',ink:'#c2255c'},blue:{label:'כחול',light:'#e0efff',ink:'#235b96'}};
  function code(){return localStorage.getItem('sync.code.v1')||'';}
  function cacheKey(){return 'content.profile.v2:'+code();}
  async function api(path,body){const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw Error(j.error||'server');return j;}
  function theme(name){name=themes[name]?name:'pink';document.documentElement.dataset.theme=name;document.querySelector('meta[name="theme-color"]').content=themes[name].light;}
  function valid(c){return c&&Array.isArray(c.subjects)&&Array.isArray(c.exams)&&Array.isArray(c.summaries);}
  function apply(c){
    current=c;
    const col=k=>C[k]||C.pink;
    const text=o=>{const r={...o};for(const k of ['name','emoji','note','detail'])if(k in r)r[k]=esc(r[k]);if(r.url&&!/^https:\/\//.test(r.url))r.url='#';return r;};
    subjects=c.subjects.map(s=>({...text(s),color:col(s.color)}));
    exams=c.exams.map(e=>({...text(e),color:e.color?col(e.color):undefined}));
    summaries=c.summaries.map(s=>({...text(s),color:col(s.color)}));
    councilItems=(c.councilItems||[]).map(s=>({...text(s),color:col(s.color)}));
    novExams={};for(const [d,list] of Object.entries(c.novExams||{}))novExams[d]=list.map(x=>({t:esc(x.t),c:col(x.c)}));
    window.userHasDriveRoot=!!c.subjects.some(s=>s.id==='1on8BT_etZSULeHtmoFyOKaUyjWDKD3Ny');
    window.userContentReady=c.onboardingComplete!==false;
    if(!window.userContentReady)mode='timetable';
    theme(c.preferences?.theme);
    localStorage.setItem(cacheKey(),JSON.stringify(c));
  }
  window.clearUserContent=()=>{current=null;subjects=[];exams=[];summaries=[];councilItems=[];novExams={};window.userContentReady=false;mode='welcome';theme('pink');};
  window.loadUserContent=async()=>{
    if(!code()){window.clearUserContent();render();return;}
    loading=true;
    try{const j=await api('/content/get',{code:code()});if(valid(j.content)){apply(j.content);error='';}}
    catch(e){if(!current)error='לא ניתן לטעון כרגע. נסו שוב.';}
    loading=false;render();
  };
  window.onboardingHtml=()=>{
    if(loading&&!current)return '<div class="onboard"><h1>Study Coach 🎀</h1><p>טוען…</p></div>';
    if(mode==='timetable')return `<form class="onboard" id="timetable-form"><h1 class="file-title">מערכת השעות 📚</h1><label>המערכת שלך<textarea name="timetable" required maxlength="12000" placeholder="יום א׳: מתמטיקה, אנגלית…">${esc(current?.timetable||'')}</textarea></label><label>המקצועות שלך<input name="subjects" required maxlength="1000" placeholder="מתמטיקה, אנגלית, היסטוריה"></label><button class="file-button" ${busy?'disabled':''}>שמירה וכניסה</button><div class="form-error">${esc(error)}</div></form>`;
    return `<div class="onboard"><h1 class="file-title">Study Coach 🎀</h1><button class="file-button" id="new-profile" ${busy?'disabled':''}>פרופיל חדש</button><form id="join-profile"><label>יש לך קוד?<input name="code" dir="ltr" maxlength="9" autocomplete="off" placeholder="XXXX-XXXX" required></label><button class="file-button" style="margin-top:12px" ${busy?'disabled':''}>חיבור</button></form><div class="form-error">${esc(error)}</div>${error?'<button class="file-button" id="retry-profile">ניסיון נוסף</button>':''}</div>`;
  };
  window.bindOnboarding=()=>{
    document.getElementById('retry-profile')?.addEventListener('click',window.loadUserContent);
    document.getElementById('new-profile')?.addEventListener('click',async()=>{
      busy=true;error='';render();
      try{const j=await api('/sync/create',{});store.studied={};store.days={};saveSyncMeta({});localStorage.setItem('sync.code.v1',j.code);apply({subjects:[],exams:[],summaries:[],councilItems:[],novExams:{},timetable:'',onboardingComplete:false,preferences:{theme:'pink'}});mode='timetable';}
      catch(e){error='לא ניתן ליצור פרופיל כרגע.';}
      busy=false;render();
    });
    document.getElementById('join-profile')?.addEventListener('submit',async e=>{
      e.preventDefault();const value=new FormData(e.target).get('code');busy=true;error='';
      try{const r=await enableSyncWithExistingCode(value);if(!r.ok)throw Error('bad');}
      catch(e){error='הקוד לא נמצא. בדקו שוב.';}
      busy=false;render();
    });
    document.getElementById('timetable-form')?.addEventListener('submit',async e=>{
      e.preventDefault();const d=new FormData(e.target);const timetable=String(d.get('timetable')||'').trim();const names=[...new Set(String(d.get('subjects')||'').split(/[,\n]/).map(x=>x.trim()).filter(Boolean))];if(!timetable||!names.length)return;
      const palette=['sky','mint','lavender','peach','lemon'];
      const c={...current,timetable,onboardingComplete:true,subjects:names.map((name,i)=>({key:'s'+i,name,emoji:'📚',color:palette[i%palette.length]}))};busy=true;error='';
      try{await api('/content/put',{code:code(),content:c});apply(c);}
      catch(e){error='השמירה לא הצליחה. נסו שוב.';}
      busy=false;render();
    });
  };
  window.renderPreferences=()=>{
    const picker=document.getElementById('theme-picker');if(!picker||!current)return;
    const selected=current.preferences?.theme||'pink';
    picker.innerHTML=`<div class="theme-options">${Object.entries(themes).map(([name,t])=>`<button class="theme-option" data-theme-choice="${name}" aria-pressed="${selected===name}" style="background:${t.light};color:${t.ink}">${t.label}</button>`).join('')}</div><p class="save-state" id="theme-status"></p>`;
    picker.querySelectorAll('[data-theme-choice]').forEach(b=>b.addEventListener('click',async()=>{
      picker.querySelectorAll('button').forEach(x=>x.disabled=true);
      const name=b.dataset.themeChoice;const old=current.preferences?.theme||'pink';theme(name);
      try{await api('/content/preferences',{code:code(),theme:name});current.preferences={...current.preferences,theme:name};localStorage.setItem(cacheKey(),JSON.stringify(current));window.renderPreferences();document.getElementById('theme-status').textContent='נשמר ✓';}
      catch(e){theme(old);window.renderPreferences();document.getElementById('theme-status').textContent='לא נשמר. נסו שוב.';}
    }));
    const box=document.getElementById('timetable-settings');box.innerHTML=`<form id="edit-timetable"><textarea class="timetable-editor" name="timetable" maxlength="12000" required placeholder="מערכת השעות שלך">${esc(current.timetable||'')}</textarea><button class="file-button">שמירה</button><span class="save-state" id="timetable-status"></span></form>`;
    box.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const timetable=String(new FormData(e.target).get('timetable')).trim();if(!timetable)return;const button=e.target.querySelector('button');button.disabled=true;try{const latest=await api('/content/get',{code:code()});const c={...latest.content,timetable};await api('/content/put',{code:code(),content:c});apply(c);document.getElementById('timetable-status').textContent=' נשמר ✓';}catch(e){document.getElementById('timetable-status').textContent=' לא נשמר. נסו שוב.';}button.disabled=false;});
  };
  window.clearUserContent();
  if(code()){try{const c=JSON.parse(localStorage.getItem(cacheKey())||'null');if(valid(c))apply(c);}catch(e){}}
  loading=!!code();render();window.loadUserContent();
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!document.activeElement?.matches('input,textarea'))window.loadUserContent();});
})();
