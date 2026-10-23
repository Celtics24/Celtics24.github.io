// Subject notebooks: ordered reviewed text pages. No photographs are persisted.
(()=>{
 const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const covers={pink:'#f9d8e5',blue:'#d4e5fc',purple:'#e6dcf7',mint:'#d5ece1',orange:'#fae2c9'};
 const profile=()=>window.boardProfile(),books=()=>profile()?.notebooks||[];
 let working=false;
 function status(text){const el=document.querySelector('#nb-editor #nb-status,#nb-create #nb-status')||document.getElementById('nb-status');if(el)el.textContent=text;}
 async function mutate(body){if(working)throw Error('busy');working=true;try{return await window.notebookMutation(body);}catch(e){if(e.message==='conflict'){await window.loadUserContent();throw Error('המחברת השתנתה במכשיר אחר. פתחי אותה שוב לפני שמירה.');}throw Error(e.message==='content too large'?'האחסון בפרופיל מלא. קצרי טקסט או מחקי דפים שאינם נחוצים.':'לא נשמר. נסי שוב.');}finally{working=false;}}
 function checked(n,action,extra={}){return mutate({action,notebookId:n.id,expectedUpdatedAt:n.updatedAt,...extra});}
 function pageForm(box,n,page){
  window.boardDraftOpen=true;
  box.innerHTML=`<form class="photo-panel nb-form" id="nb-page-form"><h2>${page?'עריכת דף':'דף חדש'}</h2><label>שם הדף<input name="title" maxlength="200" required value="${E(page?.title||'דף '+(n.pages.length+1))}"></label><label>תוכן הדף<textarea name="text" maxlength="20000" dir="auto" required>${E(page?.text||'')}</textarea></label><div class="photo-actions"><button class="file-button">שמירה במחברת</button><button type="button" class="file-button" id="nb-cancel">ביטול</button></div><p id="nb-status" role="status"></p></form>`;
  const dk='nb:'+n.id+':'+(page?.id||'new'),form=box.querySelector('form'),G=window.draftGuard;
  const saved=G&&G.load(dk);
  if(saved&&(saved.title!==form.title.value||saved.text!==form.text.value)){form.title.value=saved.title||'';form.text.value=saved.text||'';status('שוחזרה טיוטה שלא נשמרה');}
  form.addEventListener('input',()=>{G&&G.save(dk,{title:form.title.value,text:form.text.value});});
  box.querySelector('#nb-cancel').onclick=()=>{G&&G.clear(dk);window.boardDraftOpen=false;render();};
  form.onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;try{const data=new FormData(e.target);G&&G.save(dk,{title:data.get('title'),text:data.get('text')});await checked(n,'save-page',{pageId:page?.id,title:data.get('title'),text:data.get('text')});G&&G.clear(dk);window.boardDraftOpen=false;render();}catch(err){status(err.message);b.disabled=false;}};
 }
 function confirmDelete(box,n,page){window.boardDraftOpen=true;box.innerHTML=`<section class="photo-panel"><h2>${page?'מחיקת דף':'מחיקת מחברת'}</h2><p>${page?'למחוק את הדף הזה?':'כל דפי המחברת יימחקו.'} לא ניתן לשחזר.</p><div class="photo-actions"><button class="file-button danger" id="nb-confirm">מחיקה לצמיתות</button><button class="file-button" id="nb-cancel">ביטול</button></div><p id="nb-status" role="status"></p></section>`;box.querySelector('#nb-cancel').onclick=()=>{window.boardDraftOpen=false;render();};box.querySelector('#nb-confirm').onclick=async e=>{e.target.disabled=true;try{await checked(n,page?'delete-page':'delete',{pageId:page?.id});window.boardDraftOpen=false;if(page)render();else location.hash='#/notebooks';}catch(err){status(err.message);e.target.disabled=false;}};}

 const PDFJS='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/';
 function loadPdfJs(){return window.pdfjsLib?Promise.resolve(window.pdfjsLib):new Promise((res,rej)=>{const sc=document.createElement('script');sc.src=PDFJS+'pdf.min.js';sc.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS+'pdf.worker.min.js';res(window.pdfjsLib);};sc.onerror=()=>rej(Error('load'));document.head.appendChild(sc);});}
 window.extractPdfText=async file=>{
  if(file.size>25000000)throw Error('הקובץ גדול מדי. עד 25 MB.');
  const lib=await loadPdfJs().catch(()=>{throw Error('לא ניתן לטעון את קורא ה-PDF. בדקי חיבור ונסי שוב.');});
  const pdf=await lib.getDocument({data:await file.arrayBuffer()}).promise;
  const out=[];
  for(let i=1;i<=Math.min(pdf.numPages,60);i++){const c=await (await pdf.getPage(i)).getTextContent();const rows=[];for(const it of c.items){if(!it.str||!it.str.trim())continue;const y=Math.round(it.transform[5]/3);let r=rows.find(r=>r.y===y);if(!r){r={y,items:[]};rows.push(r);}r.items.push({x:it.transform[4],t:it.str.trim()});}rows.sort((p,q)=>q.y-p.y);const lines=rows.map(r=>{const he=(r.items.map(i=>i.t).join('').match(/[\u0590-\u05FF]/g)||[]).length>r.items.map(i=>i.t).join('').length/3;r.items.sort((p,q)=>he?q.x-p.x:p.x-q.x);let t=r.items.map(i=>i.t).join(' ').replace(/\s+/g,' ').trim();t=t.replace(/\s+([.,:;!?])/g,'$1');{const m=t.match(/^([.,:;!?]+)\s*(.*)$/);if(m)t=m[2]+m[1];}return t;}).filter(Boolean);out.push(lines.join('\n'));}
  const text=out.join('\n\n').trim();
  if(text.length<20)throw Error('ב-PDF הזה אין טקסט שאפשר לקרוא (כנראה סרוק). צלמי את הדפים דרך "צילום דף".');
  return text;
 };
 function chunks(text,max=18000){const parts=[];let rest=text;while(rest.length>max){let cut=rest.lastIndexOf('\n',max);if(cut<max/2)cut=max;parts.push(rest.slice(0,cut).trim());rest=rest.slice(cut).trim();}if(rest)parts.push(rest);return parts;}
 async function addPages(n,title,text){const parts=chunks(text).slice(0,8);for(let i=0;i<parts.length;i++){const cur=books().find(b=>b.id===n.id);await checked(cur,'save-page',{title:(parts.length>1?title+' ('+(i+1)+')':title).slice(0,200),text:parts[i]});}return parts.length;}
 async function importPdf(box,n,file){
  window.boardDraftOpen=true;
  box.innerHTML='<section class="photo-panel"><p id="nb-status" role="status">קוראת את ה-PDF…</p></section>';
  try{const text=await window.extractPdfText(file);const k=await addPages(n,file.name.replace(/\.pdf$/i,'')||'PDF',text);window.boardDraftOpen=false;render();status(k+' דפים נוספו מה-PDF');}
  catch(err){status(err.message||'לא נשמר. נסי שוב.');window.boardDraftOpen=false;}
 }
 function summaryPicker(box,n){
  window.boardDraftOpen=true;
  const subj=profile().subjects.find(x=>x.key===n.subjectKey);
  const all=(profile().summaries||[]).slice().sort((a,b)=>((b.subjectKey===n.subjectKey||b.subject===subj?.name)?1:0)-((a.subjectKey===n.subjectKey||a.subject===subj?.name)?1:0));
  if(!all.length){box.innerHTML='<section class="photo-panel"><p>אין עדיין סיכומים להוספה.</p><button class="file-button" id="nb-cancel">סגירה</button></section>';box.querySelector('#nb-cancel').onclick=()=>{window.boardDraftOpen=false;render();};return;}
  box.innerHTML=`<form class="photo-panel nb-form"><h2>הוספת סיכום למחברת</h2><label>סיכום<select name="sid">${all.map(s=>`<option value="${E(s.id)}">${E(s.name)}${(s.subject||'')?' · '+E(s.subject):''}</option>`).join('')}</select></label><div class="photo-actions"><button class="file-button">הוספה למחברת</button><button type="button" class="file-button" id="nb-cancel">ביטול</button></div><p id="nb-status" role="status"></p></form>`;
  box.querySelector('#nb-cancel').onclick=()=>{window.boardDraftOpen=false;render();};
  box.querySelector('form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;try{const s=all.find(x=>String(x.id)===new FormData(e.target).get('sid'));const body=s.type==='text'?String(s.text||''):[s.note,s.url].filter(Boolean).join('\n');if(!body.trim())throw Error('בסיכום הזה אין תוכן להוספה.');await addPages(n,s.name||'סיכום',body);window.boardDraftOpen=false;render();}catch(err){status(err.message);b.disabled=false;}};
 }
 window.saveNotebookPhoto=async(target,v)=>{const n=books().find(n=>n.id===target.id);if(!n)throw Error('המחברת לא נמצאה.');const j=await checked({...n,updatedAt:target.updatedAt},'save-page',{pageId:v.id,title:v.title,text:v.text});target.updatedAt=books().find(n=>n.id===target.id).updatedAt;return j.id;};
 window.renderNotebooks=()=>{
  const box=document.getElementById('notebook-workspace');if(!box)return;
  const id=location.hash.split('/')[2],n=books().find(n=>n.id===id);
  if(!id){
   const all=books();
   box.innerHTML=`<div class="notebook-heading"><div><h1>המחברות שלי</h1><p class="notebook-meta">${all.length} מחברות</p></div><button class="file-button" id="nb-new">＋ מחברת</button></div><div id="nb-create"></div>${all.length?`<div class="nb-hero-wrap"><button class="notebook-hero" id="nb-hero" aria-expanded="false"><span class="nb-cover-mark" aria-hidden="true">✦</span><strong>כל המחברות</strong><span class="nb-hero-arrow" aria-hidden="true">⌄</span></button></div>`:''}<div class="notebook-shelf"${all.length?' hidden':''}>${all.map(n=>{const s=profile().subjects.find(s=>s.key===n.subjectKey);return `<a class="notebook-cover" href="#/notebooks/${E(n.id)}" style="--cover:${covers[n.color]||covers.pink}"><span class="nb-cover-mark" aria-hidden="true">✦</span><strong>${E(n.title)}</strong><small>${E(s?.name||'')} · ${n.pages.length} דפים</small></a>`;}).join('')}</div>${books().length?'':'<div class="notebook-empty"><p>המחברת הראשונה שלך מתחילה כאן</p><button class="file-button" id="nb-setup">יצירת מחברות לפי המקצועות</button></div>'}`;
   box.querySelector('#nb-hero')?.addEventListener('click',()=>{const shelf=box.querySelector('.notebook-shelf'),hero=box.querySelector('#nb-hero');shelf.hidden=!shelf.hidden;hero.setAttribute('aria-expanded',String(!shelf.hidden));});
   box.querySelector('#nb-setup')?.addEventListener('click',async e=>{e.target.disabled=true;try{await mutate({action:'setup'});render();}catch(err){e.target.textContent=err.message;e.target.disabled=false;}});
   box.querySelector('#nb-new').onclick=()=>{window.boardDraftOpen=true;const area=box.querySelector('#nb-create');area.innerHTML=`<form class="photo-panel nb-form"><label>מקצוע<select name="subjectKey">${profile().subjects.map(s=>`<option value="${E(s.key)}">${E(s.name)}</option>`).join('')}</select></label><label>שם המחברת<input name="title" required maxlength="100" value="${E(profile().subjects[0]?.name||'מחברת חדשה')}"></label><label>צבע הכריכה<select name="color"><option value="pink">ורוד</option><option value="blue">כחול</option><option value="purple">סגול</option><option value="mint">מנטה</option><option value="orange">כתום</option></select></label><div class="photo-actions"><button class="file-button">יצירת מחברת</button><button class="file-button" type="button" id="nb-cancel">ביטול</button></div><p id="nb-status" role="status"></p></form>`;area.querySelector('select').onchange=e=>{area.querySelector('input').value=profile().subjects.find(s=>s.key===e.target.value)?.name||'';};area.querySelector('#nb-cancel').onclick=()=>{window.boardDraftOpen=false;render();};area.querySelector('form').onsubmit=async e=>{e.preventDefault();e.target.querySelector('button').disabled=true;try{const d=Object.fromEntries(new FormData(e.target));const j=await mutate({action:'create',...d});window.boardDraftOpen=false;location.hash='#/notebooks/'+j.id;}catch(err){status(err.message);e.target.querySelector('button').disabled=false;}};};return;
  }
  if(!n){box.innerHTML='<p>המחברת לא נמצאה.</p><a href="#/notebooks">לכל המחברות</a>';return;}
  try{localStorage.setItem('sc-last-notebook',n.id);}catch(e){}
  const subject=profile().subjects.find(s=>s.key===n.subjectKey);
  box.innerHTML=`<a class="back-link" href="#/notebooks">‹ המחברות שלי</a><div class="notebook-heading"><div><h1>${E(n.title)}</h1><p class="notebook-meta">${E(subject?.name)} · ${n.pages.length} דפים</p></div><span class="nb-cover-mark" aria-hidden="true">✦</span></div><div class="photo-actions nb-actions"><button class="file-button" id="nb-photo">📷 צילום דף</button><button class="file-button" id="nb-write">＋ דף טקסט</button><span class="nb-menu"><button class="file-button nb-menu-btn" id="nb-menu-btn" aria-haspopup="true" aria-expanded="false" aria-label="אפשרויות">⋯</button><span class="nb-menu-panel" id="nb-menu-panel" hidden><button class="nb-menu-item" id="nb-add-summary">הוספת סיכום</button><button class="nb-menu-item" id="nb-add-pdf">הוספת PDF</button><button class="nb-menu-item" id="nb-pdf" ${n.pages.length?'':'disabled'}>PDF למחברת</button><button class="nb-menu-item" id="nb-rename">שינוי שם</button><button class="nb-menu-item danger" id="nb-delete">מחיקת המחברת</button></span></span></div><input type="file" id="nb-pdf-input" accept="application/pdf,.pdf" hidden><div id="nb-editor"></div><p id="nb-status" role="status"></p><div class="nb-book" id="nb-pages">${n.pages.map((p,i)=>`<section class="nb-leaf" data-leaf="${E(p.id)}"><div class="nb-leaf-head"><h3>${E(p.title)}</h3><span class="nb-leaf-num">דף ${i+1}</span></div><div class="notebook-paper" dir="auto">${E(p.text)}</div><div class="nb-leaf-tools" hidden><button class="file-button" data-edit="${E(p.id)}">עריכה</button><button class="file-button" data-up="${E(p.id)}" ${i===0?'disabled':''} aria-label="הזזת דף ${i+1} למעלה">↑</button><button class="file-button" data-down="${E(p.id)}" ${i===n.pages.length-1?'disabled':''} aria-label="הזזת דף ${i+1} למטה">↓</button><button class="file-button" data-delete="${E(p.id)}">מחיקה</button></div></section>`).join('')||'<div class="notebook-empty">המחברת פתוחה. הוסיפי את הדף הראשון.</div>'}</div>`;
  const editor=box.querySelector('#nb-editor');
  const menuBtn=box.querySelector('#nb-menu-btn'),menuPanel=box.querySelector('#nb-menu-panel');
  const closeMenu=()=>{if(!menuPanel.hidden){menuPanel.hidden=true;menuBtn.setAttribute('aria-expanded','false');}};
  menuBtn.onclick=e=>{e.stopPropagation();const willOpen=menuPanel.hidden;menuPanel.hidden=!willOpen;menuBtn.setAttribute('aria-expanded',String(willOpen));if(willOpen)setTimeout(()=>document.addEventListener('click',closeMenu,{once:true}),0);};
  box.querySelectorAll('.nb-leaf').forEach(leaf=>{leaf.addEventListener('click',e=>{if(e.target.closest('.nb-leaf-tools'))return;const tools=leaf.querySelector('.nb-leaf-tools'),willOpen=tools.hidden;box.querySelectorAll('.nb-leaf-tools').forEach(t=>t.hidden=true);box.querySelectorAll('.nb-leaf').forEach(l=>l.classList.remove('nb-open'));if(willOpen){tools.hidden=false;leaf.classList.add('nb-open');}});});

  box.querySelector('#nb-photo').onclick=()=>{window.openNotebookPhoto(editor,{id:n.id,subjectKey:n.subjectKey,updatedAt:n.updatedAt});editor.scrollIntoView({behavior:'smooth'});};
  box.querySelector('#nb-write').onclick=()=>{pageForm(editor,n);editor.scrollIntoView({behavior:'smooth'});};
  box.querySelector('#nb-add-summary').onclick=()=>{closeMenu();summaryPicker(editor,n);editor.scrollIntoView({behavior:'smooth'});};
  const pin=box.querySelector('#nb-pdf-input');box.querySelector('#nb-add-pdf').onclick=()=>{closeMenu();pin.click();};pin.onchange=async()=>{const f=pin.files[0];pin.value='';if(f)await importPdf(editor,n,f);};
  box.querySelector('#nb-delete').onclick=()=>{closeMenu();confirmDelete(editor,n);};
  box.querySelector('#nb-rename').onclick=()=>{closeMenu();window.boardDraftOpen=true;editor.innerHTML=`<form class="photo-panel"><label>שם המחברת<input name="title" required maxlength="100" value="${E(n.title)}"></label><button class="file-button">שמירה</button><button class="file-button" type="button" id="nb-cancel">ביטול</button><p id="nb-status"></p></form>`;editor.querySelector('#nb-cancel').onclick=()=>{window.boardDraftOpen=false;render();};editor.querySelector('form').onsubmit=async e=>{e.preventDefault();try{await checked(n,'rename',{title:new FormData(e.target).get('title')});window.boardDraftOpen=false;render();}catch(err){status(err.message);}};};
  box.querySelector('#nb-pdf').onclick=async e=>{closeMenu();e.target.disabled=true;try{await window.exportNotebookPdf(n.title,n.pages.map((p,i)=>'דף '+(i+1)+' · '+p.title+'\n\n'+p.text).join('\n\f\n'));status('ה-PDF נוצר במכשיר ✓');}catch(err){status(err.message);}finally{e.target.disabled=false;}};
  box.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{pageForm(editor,n,n.pages.find(p=>p.id===b.dataset.edit));editor.scrollIntoView({behavior:'smooth'});});
  box.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>confirmDelete(editor,n,n.pages.find(p=>p.id===b.dataset.delete)));
  for(const key of ['up','down'])box.querySelectorAll('[data-'+key+']').forEach(b=>b.onclick=async()=>{b.disabled=true;const order=n.pages.map(p=>p.id),i=order.indexOf(b.dataset[key]),to=i+(key==='up'?-1:1);[order[i],order[to]]=[order[to],order[i]];try{await checked(n,'reorder',{pageIds:order});render();}catch(err){status(err.message);b.disabled=false;}});
 };
 window.addEventListener('hashchange',()=>{window.boardDraftOpen=false;});
 if(location.hash.startsWith('#/notebooks'))render();
})();
