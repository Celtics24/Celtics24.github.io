// Exams page: add / edit / delete an exam with an optional link to one or more summaries.
(() => {
  const API='https://study-coach-push.y0546367987.workers.dev';
  const code=()=>localStorage.getItem('sync.code.v1')||'';
  async function api(path,body){const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw Error(j.error||'server');return j;}
  const e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function pad(n){return String(n).padStart(2,'0');}
  function daysTo(y,m,d){const n=new Date();const t=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime();return Math.round((new Date(y,m-1,d).getTime()-t)/86400000);}
  function formHtml(p,ex,idx,preset){
    const subs=p.subjects||[];
    const cur=ex||{};
    const date=cur.y?`${cur.y}-${pad(cur.m)}-${pad(cur.d)}`:(preset||'');
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

  // Interactive month calendar: pick month/year, tap a day, see its exams or add one on that date.
  const css=document.createElement('style');
  css.textContent=`.cal-bar{display:flex;align-items:center;gap:8px;margin-bottom:10px}.cal-bar select{flex:1;min-width:0;min-height:44px;font:inherit;font-weight:600;padding:8px 10px;border:1px solid var(--pink-200);border-radius:12px;background:var(--ds-white);color:var(--ds-ink)}.cal-nav{flex:none;width:44px;height:44px;border-radius:12px;border:1px solid var(--pink-200);background:var(--ds-white);color:var(--pink-700);font:inherit;font-size:22px;line-height:1;cursor:pointer}.cal-grid .month-day{font:inherit;background:transparent;border-top:0;border-bottom:0;border-inline-end:0;cursor:pointer;color:inherit;min-height:48px;justify-content:center;padding:4px 0;margin:0;appearance:none;-webkit-appearance:none}.cal-grid .month-day.is-empty{cursor:default}.cal-grid .month-day.is-selected{background:var(--pink-200)}.cal-dots{display:flex;gap:3px;min-height:6px}.cal-dots i{width:6px;height:6px;border-radius:50%;background:var(--pink-700);display:block}.cal-detail{margin-top:12px;display:grid;gap:8px}.cal-detail h3{margin:0;font-size:15px;color:var(--ds-ink)}.cal-item{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-radius:12px;background:var(--pink-50);font-size:14px}.cal-item small{color:var(--ds-ink-2)}.cal-empty{margin:0;font-size:13px;color:var(--ds-ink-2)}`;
  document.head.appendChild(css);
  const view={y:0,m:0,sel:''};
  function iso(y,m,d){return `${y}-${pad(m)}-${pad(d)}`;}
  function renderCal(open){
    const host=document.getElementById('exam-cal');if(!host)return;
    const now=new Date(todayKey().replace(/-/g,'/'));
    if(!view.y){view.y=now.getFullYear();view.m=now.getMonth()+1;}
    const tk=iso(now.getFullYear(),now.getMonth()+1,now.getDate());
    const marks={};
    exams.forEach((ex,i)=>{(marks[iso(ex.y,ex.m,ex.d)]=marks[iso(ex.y,ex.m,ex.d)]||[]).push({ex,i});});
    if(view.y===2026&&view.m===11)Object.entries(novExams).forEach(([d,l])=>{(marks[iso(2026,11,+d)]=marks[iso(2026,11,+d)]||[]).push(...l.map(x=>({leg:x})));});
    const years=[];for(let y=now.getFullYear()-1;y<=now.getFullYear()+3;y++)years.push(y);
    const head=hebDays.map(d=>`<div>${d}</div>`).join('');
    const body=monthWeeks(view.y,view.m).map(w=>`<div class="month-week">${w.map(day=>{
      if(!day)return '<div class="month-day is-empty"></div>';
      const k=iso(view.y,view.m,day);const list=marks[k]||[];
      const dots=list.slice(0,3).map(x=>{const c=x.ex?x.ex.color:x.leg.c;return `<i style="${c?`background:${c.accent}`:''}"></i>`;}).join('');
      return `<button type="button" class="month-day${list.length?' has-exam':''}${k===tk?' is-today':''}${k===view.sel?' is-selected':''}" data-day="${k}"><span class="month-num">${day}</span><span class="cal-dots">${dots}</span></button>`;
    }).join('')}</div>`).join('');
    let detail='';
    if(view.sel){
      const [sy,sm,sd]=view.sel.split('-').map(Number);const list=marks[view.sel]||[];
      detail=`<div class="cal-detail"><h3>${sd} ב${hebMonths[sm-1]} ${sy}</h3>${list.length?list.map(x=>x.ex?`<div class="cal-item"><span>${x.ex.name}${x.ex.time?` <small>· ${x.ex.time}</small>`:''}</span><button type="button" class="exam-edit" data-cal-edit="${x.i}">עריכה</button></div>`:`<div class="cal-item"><span>${x.leg.t}</span></div>`).join(''):'<p class="cal-empty">אין מבחנים ביום הזה.</p>'}<button class="file-button" type="button" id="cal-add">הוספת מבחן ביום הזה</button></div>`;
    }
    host.innerHTML=`<div class="cal-bar"><button type="button" class="cal-nav" id="cal-prev" aria-label="חודש קודם">›</button>
      <select id="cal-month" aria-label="חודש">${hebMonths.map((n,i)=>`<option value="${i+1}" ${i+1===view.m?'selected':''}>${n}</option>`).join('')}</select>
      <select id="cal-year" aria-label="שנה">${years.map(y=>`<option ${y===view.y?'selected':''}>${y}</option>`).join('')}</select>
      <button type="button" class="cal-nav" id="cal-next" aria-label="חודש הבא">‹</button></div>
      <div class="month cal-grid" role="table"><div class="month-head" role="row">${head}</div>${body}</div>${detail}`;
    const go=(y,m)=>{if(m<1){m=12;y--;}if(m>12){m=1;y++;}view.y=y;view.m=m;view.sel='';renderCal(open);};
    host.querySelector('#cal-prev').onclick=()=>go(view.y,view.m-1);
    host.querySelector('#cal-next').onclick=()=>go(view.y,view.m+1);
    host.querySelector('#cal-month').onchange=ev=>go(view.y,+ev.target.value);
    host.querySelector('#cal-year').onchange=ev=>go(+ev.target.value,view.m);
    host.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{view.sel=b.dataset.day;renderCal(open);});
    host.querySelectorAll('[data-cal-edit]').forEach(b=>b.onclick=()=>open(+b.dataset.calEdit));
    const add=host.querySelector('#cal-add');if(add)add.onclick=()=>open(-1,view.sel);
  }
  window.bindExams=()=>{
    const p=window.boardProfile&&window.boardProfile();const box=document.getElementById('exam-form-box');const add=document.getElementById('exam-add');
    if(!p||!box||!add)return;
    const open=(idx,preset)=>{if(!(p.subjects||[]).length){box.innerHTML='<p class="form-error">אין מקצועות בפרופיל.</p>';return;}box.innerHTML=formHtml(p,idx>=0?p.exams[idx]:null,idx,preset);bindForm(box,p,idx);box.scrollIntoView({block:'start',behavior:'smooth'});};
    add.addEventListener('click',()=>open(-1));
    document.querySelectorAll('[data-exam-edit]').forEach(b=>b.addEventListener('click',()=>open(+b.dataset.examEdit)));
    renderCal(open);
  };
})();
