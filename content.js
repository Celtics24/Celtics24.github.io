// Per-profile content, first-run timetable and theme preferences.
(() => {
  const API='https://study-coach-push.y0546367987.workers.dev';
  let current=null, busy=false, error='', mode='welcome', loading=false;
  window.userContentReady=false;
  const themes={pink:{label:'ורוד',light:'#ffe3ef',ink:'#c2255c'},blue:{label:'כחול',light:'#e0efff',ink:'#235b96'},purple:{label:'סגול',light:'#eee5ff',ink:'#6841a3'},mint:{label:'ירוק מנטה',light:'#def5eb',ink:'#276b52'},burgundy:{label:'יין',light:'#e9d0d5',ink:'#4a0d1b'},dark:{label:'כהה',light:'#243349',ink:'#e8effb'}};
  function code(){return localStorage.getItem('sync.code.v1')||'';}
  function cacheKey(){return 'content.profile.v2:'+code();}
  window.draftGuard={
    key:k=>'sc-draft:'+k,
    load(k){try{return JSON.parse(localStorage.getItem('sc-draft:'+k)||'null');}catch(e){return null;}},
    save(k,o){try{localStorage.setItem('sc-draft:'+k,JSON.stringify({...o,at:Date.now()}));}catch(e){}},
    clear(k){try{localStorage.removeItem('sc-draft:'+k);}catch(e){}}
  };
  async function api(path,body){let r;try{r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}catch(e){throw Error('אין חיבור לשרת. הטקסט נשמר כטיוטה במכשיר.');}let j={};try{j=await r.json();}catch(e){}if(!r.ok){if(r.status===503||r.status===429||r.status>=500)throw Error('השרת עמוס כרגע. הטקסט נשמר כטיוטה במכשיר, אפשר לנסות שוב מאוחר יותר.');throw Error(j.error||'server');}return j;}
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
    ROOT=c.driveRoot||'';COUNCIL_ID=c.councilFolderId||'';window.userHasDriveRoot=!!ROOT;
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
    catch(e){if(e.message==='blocked'){error='הפרופיל הושבת על ידי מנהלת האפליקציה.';}else if(e.message==='unknown code'){localStorage.removeItem('sync.code.v1');window.clearUserContent();error='הפרופיל לא זמין. התחברו שוב או השתמשו בשחזור.';}else if(!current)error='לא ניתן לטעון כרגע. נסו שוב.';}
    loading=false;render();
  };
  window.onboardingHtml=()=>{
    if(loading&&!current)return '<div class="onboard"><h1>Study Coach</h1><p>טוען…</p></div>';
    if(mode==='timetable')return `<form class="onboard" id="timetable-form"><h1 class="file-title">המקצועות שלך</h1><label>שם פרטי<input name="first" required minlength="2" maxlength="30" autocomplete="off"></label><label>שם משפחה<input name="last" required minlength="2" maxlength="30" autocomplete="off"></label><label class="onboard-check"><input type="checkbox" name="disc"> אפשר לאחרים למצוא אותי לפי שם מלא</label><label>רשימת מקצועות<input name="subjects" required maxlength="1000" placeholder="מתמטיקה, אנגלית, היסטוריה"></label><button class="file-button" ${busy?'disabled':''}>שמירה וכניסה</button><button type="button" class="file-button" data-variant="secondary" id="onboard-back" ${busy?'disabled':''}>חזרה</button><div class="form-error">${esc(error)}</div></form>`;
    return `<div class="onboard"><h1 class="file-title">Study Coach</h1><button class="file-button" id="new-profile" ${busy?'disabled':''}>פרופיל חדש</button><form id="join-profile"><label>יש לך קוד?<input name="code" dir="ltr" maxlength="9" autocomplete="off" placeholder="XXXX-XXXX" required></label><button class="file-button" style="margin-top:12px" ${busy?'disabled':''}>חיבור</button></form><details><summary>שחזור גישה</summary><form id="recover-profile"><label>מפתח השחזור<input name="recoveryKey" type="password" autocomplete="off" required></label><button class="file-button">שחזור</button></form></details><div class="form-error">${esc(error)}</div>${error?'<button class="file-button" id="retry-profile">ניסיון נוסף</button>':''}</div>`;
  };
  window.bindOnboarding=()=>{
    document.getElementById('recover-profile')?.addEventListener('submit',async e=>{e.preventDefault();const recoveryKey=String(new FormData(e.target).get('recoveryKey')||'').trim();try{const j=await api('/auth/recover',{recoveryKey});const r=await enableSyncWithExistingCode(j.code);if(!r.ok)throw Error('bad');error='';}catch{error='השחזור לא הצליח. בדקו את המפתח או נסו מאוחר יותר.';}render();});
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
    document.getElementById('onboard-back')?.addEventListener('click',async()=>{
      busy=true;error='';render();
      try{if(current&&current.onboardingComplete===false&&!(current.subjects||[]).length)await api('/sync/destroy',{code:code()});}catch(e){}
      try{localStorage.removeItem(cacheKey());localStorage.removeItem('sync.code.v1');}catch(e){}
      window.clearUserContent();busy=false;render();
    });
    document.getElementById('timetable-form')?.addEventListener('submit',async e=>{
      e.preventDefault();const d=new FormData(e.target);const timetable=String(current?.timetable||'');const names=[...new Set(String(d.get('subjects')||'').split(/[,\n]/).map(x=>x.trim()).filter(Boolean))];if(!names.length)return;
      try{await api('/friends/set-profile',{code:code(),first:String(d.get('first')||''),last:String(d.get('last')||''),discoverable:d.get('disc')==='on'});}catch(err){e.target.querySelector('.form-error').textContent=err.message==='invalid name'?'השם יכול להכיל אותיות, רווח, גרש ומקף, 2 עד 30 תווים.':'שמירת השם לא הצליחה. נסו שוב.';return;}
      const palette=['sky','mint','lavender','peach','lemon'];
      const c={...current,timetable,onboardingComplete:true,subjects:names.map((name,i)=>({key:'s'+i,name,emoji:'',color:palette[i%palette.length]}))};busy=true;error='';
      try{await api('/content/put',{code:code(),content:c});apply(c);}
      catch(e){error='השמירה לא הצליחה. נסו שוב.';}
      busy=false;render();
    });
  };
  const subjectColorLabels={pink:'ורוד',lavender:'סגול',mint:'מנטה',sky:'תכלת',peach:'אפרסק',lemon:'לימון',sand:'חול',clay:'חרס',teal:'טיל',rose:'ורדרד',orange:'כתום',green:'ירוק',peri:'סגול־כחול'};
  window.bindSubjectColor=key=>{
    const btn=document.getElementById('subj-color-btn'),box=document.getElementById('subj-color-box');
    if(!btn||!box)return;
    btn.addEventListener('click',()=>{
      if(box.innerHTML){box.innerHTML='';return;}
      const cur=(current?.subjects.find(s=>s.key===key)||{}).color||'pink';
      box.innerHTML=`<section class="photo-panel"><div class="theme-options">${Object.keys(C).map(k=>`<button type="button" class="theme-option" data-scolor="${k}" aria-pressed="${cur===k}" style="background:${C[k].bg};color:${C[k].accent}">${subjectColorLabels[k]||k}</button>`).join('')}</div><p class="save-state" id="subj-color-status" role="status"></p></section>`;
      box.querySelectorAll('[data-scolor]').forEach(b=>b.addEventListener('click',async()=>{
        box.querySelectorAll('button').forEach(x=>x.disabled=true);
        try{
          const latest=await api('/content/get',{code:code()});
          const c=latest.content,subj=(c.subjects||[]).find(s=>s.key===key);
          if(!subj)throw Error('missing');
          subj.color=b.dataset.scolor;
          for(const s of c.summaries||[])if(s.subjectKey===key||(!s.subjectKey&&s.subject===subj.name))s.color=b.dataset.scolor;
          for(const e of c.exams||[])if(e.subject===subj.name)e.color=b.dataset.scolor;
          await api('/content/put',{code:code(),content:c});
          apply(c);render();
        }catch(e){box.querySelectorAll('button').forEach(x=>x.disabled=false);const st=document.getElementById('subj-color-status');if(st)st.textContent='לא נשמר. נסי שוב.';}
      }));
    });
  };
  window.boardProfile=()=>current;
  window.notebookMutation=async body=>{const j=await api('/content/notebook',{...body,code:code()});apply(j.content);return j;};
  window.saveBoardText=async body=>{const j=await api('/content/save-text',{...body,code:code()});apply(j.content);return j.id;};
  window.bindAddFile=()=>{
    const button=document.getElementById('add-file');if(!button||!current)return;
    button.addEventListener('click',()=>{
      const box=document.getElementById('add-file-form');
      if(!current.subjects.length){box.innerHTML='<p class="form-error">הוסיפו מקצועות דרך ההצטרפות לפני הוספת קובץ.</p>';return;}
      box.innerHTML=`<form class="add-link-form" id="add-drive-link"><label>שם הקובץ<input name="title" required maxlength="200"></label><label>מקצוע<select name="subjectKey">${current.subjects.map(x=>`<option value="${esc(x.key)}">${esc(x.name)}</option>`).join('')}</select></label><label>קישור לדרייב<input name="url" type="url" dir="ltr" placeholder="https://drive.google.com/…"></label><label>או קובץ PDF עם טקסט<input name="pdf" type="file" accept="application/pdf,.pdf"></label><label>תיאור קצר<input name="note" maxlength="500"></label><p class="save-state">קישור נשאר בדרייב והרשאותיו לא משתנות. PDF נשמר כטקסט בסיכומים.</p><button class="file-button">הוספה</button><button class="file-button" type="button" id="cancel-add">ביטול</button><div class="form-error" id="add-error"></div></form>`;
      box.querySelector('#cancel-add').addEventListener('click',()=>{box.innerHTML='';});
      box.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const d=new FormData(e.target);const submit=e.target.querySelector('button');submit.disabled=true;const pdf=d.get('pdf');if(pdf&&pdf.size){try{document.getElementById('add-error').textContent='קוראת את ה-PDF…';const text=(await window.extractPdfText(pdf)).slice(0,19000);await window.saveBoardText({title:d.get('title'),subjectKey:d.get('subjectKey'),text});render();}catch(err){document.getElementById('add-error').textContent=err.message||'לא נשמר. נסי שוב.';submit.disabled=false;}return;}if(!d.get('url')){document.getElementById('add-error').textContent='הדביקו קישור לדרייב או בחרו קובץ PDF.';submit.disabled=false;return;}try{const j=await api('/content/add-link',{code:code(),title:d.get('title'),subjectKey:d.get('subjectKey'),url:d.get('url'),note:d.get('note')});apply(j.content);render();}catch{document.getElementById('add-error').textContent='לא נשמר. בדקו שהקישור הוא של Google Drive או Google Docs ונסו שוב.';submit.disabled=false;}});
      box.querySelector('input').focus();
    });
  };
  window.renderPreferences=()=>{
    const picker=document.getElementById('theme-picker');if(!picker||!current)return;
    const deletion=document.getElementById('delete-profile');
    deletion?.addEventListener('click',()=>{
      const box=document.getElementById('delete-confirm');
      box.innerHTML='<div class="confirm-panel"><label><input type="checkbox" id="delete-consent"> הבנתי שהמחיקה קבועה ותפסיק את הסנכרון וההתראות של הפרופיל</label><button class="file-button danger" id="confirm-delete" disabled>מחיקה לצמיתות</button><button class="file-button" id="cancel-delete">ביטול</button><p class="form-error" id="delete-error"></p></div>';
      box.querySelector('#delete-consent').addEventListener('change',e=>{box.querySelector('#confirm-delete').disabled=!e.target.checked;});
      box.querySelector('#cancel-delete').addEventListener('click',()=>{box.innerHTML='';});
      box.querySelector('#confirm-delete').addEventListener('click',async e=>{e.target.disabled=true;const oldCode=code();try{await api('/sync/destroy',{code:oldCode});try{if(window.disableReminders)await disableReminders();}catch{}for(const k of Object.keys(localStorage))if(k.startsWith('content.')||k.startsWith('sync.')||['studied.v1','studyDays.v1'].includes(k))localStorage.removeItem(k);store.studied={};store.days={};window.clearUserContent();location.hash='#/';render();}catch{document.getElementById('delete-error').textContent='לא ניתן למחוק כרגע. נסו שוב מאוחר יותר.';e.target.disabled=false;}});
    });

    const security=document.getElementById('security-settings');
    if(security){security.innerHTML='<button class="file-button" id="save-recovery">שמירת מפתח שחזור</button><p class="save-state" id="recovery-status">המפתח מאפשר כניסה אם קוד החיבור אבד. שמרו אותו במקום פרטי.</p>';security.querySelector('button').addEventListener('click',async e=>{e.target.disabled=true;try{const j=await api('/auth/recovery/create',{code:code()});const blob=new Blob(['Study Coach recovery key\n'+j.recoveryKey+'\nKeep private.'],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Study-Coach-recovery.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);document.getElementById('recovery-status').textContent='המפתח החדש נשמר בקובץ. מפתח קודם בוטל.';}catch{document.getElementById('recovery-status').textContent='לא ניתן ליצור מפתח כרגע. נסו שוב.';}e.target.disabled=false;});}
    const selected=current.preferences?.theme||'pink';
    picker.innerHTML=`<div class="theme-options">${Object.entries(themes).map(([name,t])=>`<button class="theme-option" data-theme-choice="${name}" aria-pressed="${selected===name}" style="background:${t.light};color:${t.ink}">${t.label}</button>`).join('')}</div><p class="save-state" id="theme-status"></p>`;
    picker.querySelectorAll('[data-theme-choice]').forEach(b=>b.addEventListener('click',async()=>{
      picker.querySelectorAll('button').forEach(x=>x.disabled=true);
      const name=b.dataset.themeChoice;const old=current.preferences?.theme||'pink';theme(name);
      try{await api('/content/preferences',{code:code(),theme:name});current.preferences={...current.preferences,theme:name};localStorage.setItem(cacheKey(),JSON.stringify(current));window.renderPreferences();document.getElementById('theme-status').textContent='נשמר';}
      catch(e){theme(old);window.renderPreferences();document.getElementById('theme-status').textContent='לא נשמר. נסו שוב.';}
    }));
    const box=document.getElementById('timetable-settings');box.innerHTML=`<form id="edit-timetable"><textarea class="timetable-editor" name="timetable" maxlength="12000" required placeholder="מערכת השעות שלך">${esc(current.timetable||'')}</textarea><button class="file-button">שמירה</button><span class="save-state" id="timetable-status"></span></form>`;
    box.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const timetable=String(new FormData(e.target).get('timetable')).trim();if(!timetable)return;const button=e.target.querySelector('button');button.disabled=true;try{const latest=await api('/content/get',{code:code()});const c={...latest.content,timetable};await api('/content/put',{code:code(),content:c});apply(c);document.getElementById('timetable-status').textContent=' נשמר';}catch(e){document.getElementById('timetable-status').textContent=' לא נשמר. נסו שוב.';}button.disabled=false;});
  };
  window.clearUserContent();
  if(code()){try{const c=JSON.parse(localStorage.getItem(cacheKey())||'null');if(valid(c))apply(c);}catch(e){}}
  loading=!!code();render();window.loadUserContent();
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!window.boardDraftOpen&&!document.activeElement?.matches('input,textarea'))window.loadUserContent();});
})();
