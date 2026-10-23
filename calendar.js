// Optional: import exams from Google Calendar (read-only, per tap, nothing stored).
(() => {
  const GOOGLE_CLIENT_ID=''; // set when the Google OAuth web client exists; empty keeps the card in its "not enabled" state
  const SCOPE='https://www.googleapis.com/auth/calendar.events.readonly';
  const API='https://study-coach-push.y0546367987.workers.dev';
  const code=()=>localStorage.getItem('sync.code.v1')||'';
  async function api(path,body){const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw Error(j.error||'server');return j;}
  const e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const EXAM_RE=/מבחן|בוחן|בגרות|מועד|בחינה|exam|test|quiz/i;
  let token='',busy=false;
  function loadGsi(){return new Promise((res,rej)=>{if(window.google&&google.accounts&&google.accounts.oauth2)return res();const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.onload=res;s.onerror=()=>rej(Error('gsi'));document.head.appendChild(s);});}
  function parse(ev){
    const st=ev.start||{};let y,m,d,time='';
    if(st.date){[y,m,d]=st.date.split('-').map(Number);}
    else if(st.dateTime){const dt=new Date(st.dateTime);y=dt.getFullYear();m=dt.getMonth()+1;d=dt.getDate();time=String(dt.getHours()).padStart(2,'0')+':'+String(dt.getMinutes()).padStart(2,'0');}
    else return null;
    return {y,m,d,time,title:String(ev.summary||'').trim()};
  }
  async function fetchEvents(){
    const from=new Date();const to=new Date();to.setMonth(to.getMonth()+14);
    const u='https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&maxResults=250&timeMin='+encodeURIComponent(from.toISOString())+'&timeMax='+encodeURIComponent(to.toISOString());
    const r=await fetch(u,{headers:{Authorization:'Bearer '+token}});
    if(!r.ok)throw Error('calendar '+r.status);
    const j=await r.json();
    return (j.items||[]).map(parse).filter(x=>x&&x.title&&EXAM_RE.test(x.title));
  }
  function guessSubject(title,subjects){const s=subjects.find(x=>title.includes(x.name));return s?s.name:subjects[0].name;}
  function paint(box,msg){box.innerHTML=msg;}
  window.renderCalendarCard=()=>{
    const box=document.getElementById('calendar-card');if(!box)return;
    if(!GOOGLE_CLIENT_ID){
      box.innerHTML='<p class="save-state">ייבוא מבחנים מיומן גוגל עדיין לא מופעל. כשהחיבור יהיה מוכן הוא יופיע כאן. הוספת מבחן ידנית זמינה תמיד בדף המבחנים.</p><button class="file-button" type="button" disabled>חיבור ליומן גוגל</button>';
      return;
    }
    box.innerHTML='<p class="save-state">קריאה בלבד מהיומן, בלחיצה אחת בכל פעם. שום דבר מהיומן לא נשמר, חוץ ממבחנים שתאשרי לייבא.</p><button class="file-button" type="button" id="cal-connect">חיבור ליומן גוגל</button><div id="cal-result"></div>';
    box.querySelector('#cal-connect').addEventListener('click',async ev=>{
      const p=window.boardProfile&&window.boardProfile();const out=box.querySelector('#cal-result');
      if(!p||!(p.subjects||[]).length){paint(out,'<p class="form-error">אין מקצועות בפרופיל.</p>');return;}
      if(busy)return;busy=true;ev.target.disabled=true;paint(out,'<p class="save-state">פותחת את חיבור גוגל…</p>');
      try{
        await loadGsi();
        token=await new Promise((res,rej)=>{google.accounts.oauth2.initTokenClient({client_id:GOOGLE_CLIENT_ID,scope:SCOPE,callback:r=>r&&r.access_token?res(r.access_token):rej(Error('denied')),error_callback:()=>rej(Error('denied'))}).requestAccessToken();});
        paint(out,'<p class="save-state">קוראת מבחנים מהיומן…</p>');
        const events=await fetchEvents();
        const have=new Set((p.exams||[]).map(x=>`${x.y}-${x.m}-${x.d}`+'|'+x.name));
        const items=events.filter(x=>!have.has(`${x.y}-${x.m}-${x.d}|${x.title}`));
        try{google.accounts.oauth2.revoke(token,()=>{});}catch{}token='';
        if(!items.length){paint(out,'<p class="save-state">לא נמצאו מבחנים חדשים ביומן ב־14 החודשים הקרובים. מחפשים אירועים עם מבחן, בוחן, בגרות או מועד בשם.</p>');return;}
        paint(out,`<form class="add-link-form" id="cal-form"><p class="save-state">נמצאו ${items.length} אירועים. סמני מה לייבא ובדקי את המקצוע.</p>${items.map((x,i)=>`<label class="exam-check cal-row"><input type="checkbox" data-i="${i}" checked><span>${e(x.title)}<small> · ${x.d}.${x.m}.${x.y}${x.time?' · '+e(x.time):''}</small></span><select data-s="${i}">${p.subjects.map(s=>`<option value="${e(s.name)}" ${s.name===guessSubject(x.title,p.subjects)?'selected':''}>${e(s.name)}</option>`).join('')}</select></label>`).join('')}<button class="file-button">ייבוא המסומנים</button><button class="file-button" type="button" id="cal-cancel">ביטול</button><div class="form-error" id="cal-error"></div></form>`);
        out.querySelector('#cal-cancel').addEventListener('click',()=>{out.innerHTML='';});
        out.querySelector('#cal-form').addEventListener('submit',async fe=>{
          fe.preventDefault();const b=fe.target.querySelector('button');b.disabled=true;
          const picked=[...fe.target.querySelectorAll('input[data-i]:checked')].map(c=>+c.dataset.i);
          if(!picked.length){out.querySelector('#cal-error').textContent='לא סומן כלום.';b.disabled=false;return;}
          try{
            const latest=await api('/content/get',{code:code()});const c={...latest.content};c.exams=[...(c.exams||[])];
            const today=new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()).getTime();
            for(const i of picked){const x=items[i];const sn=fe.target.querySelector(`select[data-s="${i}"]`).value;const subj=p.subjects.find(s=>s.name===sn);
              if(c.exams.some(z=>z.y===x.y&&z.m===x.m&&z.d===x.d&&z.name===x.title))continue;
              const far=Math.round((new Date(x.y,x.m-1,x.d).getTime()-today)/86400000)>45;
              const ex={y:x.y,m:x.m,d:x.d,name:x.title.slice(0,80),subject:sn,color:subj?subj.color:'pink',far};if(x.time)ex.time=x.time;c.exams.push(ex);}
            await api('/content/put',{code:code(),content:c});await window.loadUserContent();
          }catch{out.querySelector('#cal-error').textContent='הייבוא לא הצליח. נסי שוב.';b.disabled=false;}
        });
      }catch(err){paint(out,'<p class="form-error">החיבור ליומן לא הושלם. אפשר לנסות שוב, או להוסיף מבחן ידנית.</p>');}
      finally{busy=false;ev.target.disabled=false;}
    });
  };
})();
