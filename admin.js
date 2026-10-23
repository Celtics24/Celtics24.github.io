// Owner-only admin: the server confirms ownership for the current profile, then
// shows the user list and block controls. Ownership is enforced server-side.
(() => {
  const API='https://study-coach-push.y0546367987.workers.dev';
  const code=()=>localStorage.getItem('sync.code.v1')||'';
  async function api(path,body){const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,code:code()})});const j=await r.json().catch(()=>({}));if(!r.ok){const e=Error(j.error||'server');e.status=r.status;throw e;}return j;}
  const e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=iso=>{if(!iso)return '—';try{return new Date(iso).toLocaleDateString('he-IL',{day:'numeric',month:'numeric',year:'2-digit'});}catch(_){return '—';}};
  window.renderOwnerAdmin=async()=>{
    const group=document.getElementById('owner-group'),box=document.getElementById('owner-admin');
    if(!group||!box)return;
    if(!code()){group.hidden=true;return;}
    let st;try{st=await api('/owner/status',{});}catch(_){group.hidden=true;return;}
    if(!st.owner){group.hidden=true;return;}
    group.hidden=false;
    box.innerHTML='<p class="save-state">טוען רשימת משתמשים…</p>';
    let j;try{j=await api('/owner/users',{});}catch(_){box.innerHTML='<p class="form-error">לא ניתן לטעון כרגע. נסי שוב.</p>';return;}
    const users=j.users||[];
    box.innerHTML=`<p class="save-state">${users.length} פרופילים רשומים. הניהול מציג שם, תאריך הצטרפות ומצב חסימה בלבד - התוכן של כל משתמש נשאר פרטי.</p>
      <div class="owner-list">${users.map(u=>`
        <div class="owner-row">
          <div class="owner-meta">
            <strong>${u.name?e(u.name):'ללא שם עדיין'}${u.tag?` <span class="fr-tag" dir="ltr">#${e(u.tag)}</span>`:''}</strong>${u.self?' <span class="fr-tag">את</span>':''}${u.blocked?' <span class="fr-tag">חסומה</span>':''}
            <span class="owner-sub">הצטרפה: ${fmt(u.created)}</span>
          </div>
          ${u.self?'':`<button class="file-button ${u.blocked?'':'danger'}" data-user="${e(u.user)}" data-blocked="${u.blocked?1:0}">${u.blocked?'שחרור חסימה':'חסימה'}</button>`}
        </div>`).join('')}</div>
      <p class="form-error" id="owner-msg"></p>`;
    box.querySelectorAll('button[data-user]').forEach(b=>b.addEventListener('click',async()=>{
      const blocking=b.dataset.blocked!=='1';
      if(blocking&&!confirm('לחסום את הפרופיל? המשתמש לא יוכל להשתמש באפליקציה עד לשחרור. הנתונים לא נמחקים.'))return;
      b.disabled=true;
      try{await api(blocking?'/owner/block':'/owner/unblock',{user:b.dataset.user});window.renderOwnerAdmin();}
      catch(_){document.getElementById('owner-msg').textContent='לא הצליח. נסי שוב.';b.disabled=false;}
    }));
  };
})();
