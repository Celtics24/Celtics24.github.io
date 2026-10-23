// Exams page: add / edit / delete an exam with an optional link to one or more summaries.
(() => {
  const API='https://study-coach-push.y0546367987.workers.dev';
  const code=()=>localStorage.getItem('sync.code.v1')||'';
  async function api(path,body){const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw Error(j.error||'server');return j;}
  const e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function pad(n){return String(n).padStart(2,'0');}
  function daysTo(y,m,d){const n=new Date();const t=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime();return Math.round((new Date(y,m-1,d).getTime()-t)/86400000);}
  function formHtml(p,ex,idx){
    const subs=p.subjects||[];
    const cur=ex||{};
    const date=cur.y?`${cur.y}-${pad(cur.m)}-${pad(cur.d)}`:'';
    const chosen=new Set(cur.summaryIds||[]);
    return `<form class="add-link-form exam-form" id="exam-form">
      <label>מקצוע<select name="subject" required>${subs.map(s=>`<option value="${e(s.name)}" ${s.name===cur.subject?'selected':''}>${e(s.name)}</option>`).join('')}</select></label>
      <label>תאריך<input name="date" type="date" required value="${e(date)}"></label>
      <label>שעה (לא חובה)<input name="time" type="time" value="${e(cur.time||'')}"></label>
      <label>שם המבחן (לא חובה)<input name="name" maxlength="80" value="${e(cur.name||'')}" placeholder="למשל: בגרות בפיזיולוגיה"></label>
      <fieldset class="exam-links"><legend>קישור לסיכומים (לא חובה)</legend><div id="exam-sum-list"></div>
        <label class="exam-check"><input type="checkbox" id="exam-all"> הצגת סיכומים מכל המקצועות</label></fieldset>
      <button class="file-button">${ex?'שמירה':'הוספת מבחן'}</button><button class="file-button" type="button" id="exam-cancel">ביטול</button>
      ${ex?'<button class="file-button danger" type="button" id="exam-delete">מחיקת המבחן</button>':''}
      <div class="form-error" id="exam-error"></div></form>`;
  }
  function bindForm(box,p,idx){
    const form=box.querySelector('form');const list=form.querySelector('#exam-sum-list');const all=form.querySelector('#exam-all');
    const chosen=new Set(idx>=0?(p.exams[idx].summaryIds||[]):[]);
    function paint(){
      const subj=form.subject.value;
      const items=(p.summaries||[]).filter(s=>all.checked||s.subject===subj||chosen.has(s.id));
      list.innerHTML=items.length?items.map(s=>`<label class="exam-check"><input type="checkbox" value="${e(s.id)}" ${chosen.has(s.id)?'checked':''}> ${e(s.name)}${all.checked&&s.subject?` <small>· ${e(s.subject)}</small>`:''}</label>`).join(''):'<p class="save-state">אין עדיין סיכומים במקצוע הזה.</p>';
      list.querySelectorAll('input').forEach(i=>i.addEventListener('change',()=>{i.checked?chosen.add(i.value):chosen.delete(i.value);}));
    }
    form.subject.addEventListener('change',paint);all.addEventListener('change',paint);paint();
    box.querySelector('#exam-cancel').addEventListener('click',()=>{box.innerHTML='';});
    const err=m=>{box.querySelector('#exam-error').textContent=m;};
    async function save(mutator){
      const latest=await api('/content/get',{code:code()});const c={...latest.content};c.exams=[...(c.exams||[])];mutator(c);
      await api('/content/put',{code:code(),content:c});await window.loadUserContent();
    }
    box.querySelector('#exam-delete')?.addEventListener('click',async ev=>{
      if(!confirm('למחוק את המבחן?'))return;ev.target.disabled=true;
      const target=p.exams[idx];
      try{await save(c=>{c.exams=c.exams.filter(x=>!(x.y===target.y&&x.m===target.m&&x.d===target.d&&x.name===target.name&&x.subject===target.subject));});}
      catch{err('המחיקה לא הצליחה. נסי שוב.');ev.target.disabled=false;}
    });
    form.addEventListener('submit',async ev=>{
      ev.preventDefault();const b=form.querySelector('button');b.disabled=true;
      const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(form.date.value);if(!m){err('בחרי תאריך.');b.disabled=false;return;}
      const y=+m[1],mo=+m[2],d=+m[3];const subj=(p.subjects||[]).find(s=>s.name===form.subject.value);
      const ex={y,m:mo,d,name:form.name.value.trim()||('מבחן ב'+form.subject.value),subject:form.subject.value,color:subj?subj.color:'pink',far:daysTo(y,mo,d)>45};
      if(form.time.value)ex.time=form.time.value;
      const ids=[...chosen].filter(id=>(p.summaries||[]).some(s=>s.id===id));if(ids.length)ex.summaryIds=ids;
      try{
        if(idx>=0){const old=p.exams[idx];await save(c=>{const i=c.exams.findIndex(x=>x.y===old.y&&x.m===old.m&&x.d===old.d&&x.name===old.name&&x.subject===old.subject);const keep={...(i>=0?c.exams[i]:{})};delete keep.time;delete keep.summaryIds;const n={...keep,...ex};if(i>=0)c.exams[i]=n;else c.exams.push(n);});}
        else await save(c=>{c.exams.push(ex);});
      }catch{err('השמירה לא הצליחה. נסי שוב.');b.disabled=false;}
    });
    form.querySelector('select,input').focus();
  }
  window.bindExams=()=>{
    const p=window.boardProfile&&window.boardProfile();const box=document.getElementById('exam-form-box');const add=document.getElementById('exam-add');
    if(!p||!box||!add)return;
    const open=idx=>{if(!(p.subjects||[]).length){box.innerHTML='<p class="form-error">אין מקצועות בפרופיל.</p>';return;}box.innerHTML=formHtml(p,idx>=0?p.exams[idx]:null,idx);bindForm(box,p,idx);box.scrollIntoView({block:'start',behavior:'smooth'});};
    add.addEventListener('click',()=>open(-1));
    document.querySelectorAll('[data-exam-edit]').forEach(b=>b.addEventListener('click',()=>open(+b.dataset.examEdit)));
  };
})();
