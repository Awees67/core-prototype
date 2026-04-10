/* =========================
   RENDERER — INBOX VIEW (Leads)
========================= */

function bindLeadFormForStartup(s){
  const sendBtn = document.getElementById("sendLeadBtn");
  const nameEl = document.getElementById("leadName");
  const emailEl = document.getElementById("leadEmail");
  const firmEl = document.getElementById("leadFirm");
  const msgEl = document.getElementById("leadMsg");
  if(!sendBtn || !nameEl || !emailEl || !firmEl || !msgEl || !s) return;

  sendBtn.onclick = ()=>{
    const lead = {
      anon_id: String(s.anon_id || ""),
      display_label: startupLabel(s),
      name: nameEl.value.trim(),
      email: emailEl.value.trim(),
      firm: firmEl.value.trim(),
      msg: msgEl.value.trim(),
      ts: Date.now()
    };

    if(!lead.anon_id) return;

    const leads = getLeads();
    leads.push(lead);
    setLeads(leads);
    toast("Gespeichert", "Anfrage lokal abgelegt");

    msgEl.value = "";

    if(currentView === "inbox") renderInbox();
  };
}

/* Outreach-Tracker State (view-level) */
let _otSelected = null;
let _otTab = 'alle';

function bindInboxHeaderButtons(){
  /* Leer — Header-Buttons werden direkt in renderInbox gebunden */
}

function _otStatusBadge(status){
  const map = {
    anfrage_gesendet: '<span class="ot-badge ot-b-sent">Anfrage gesendet</span>',
    keine_antwort:    '<span class="ot-badge ot-b-none">Keine Antwort</span>',
    geantwortet:      '<span class="ot-badge ot-b-replied">Geantwortet</span>',
    call_geplant:     '<span class="ot-badge ot-b-call">Call geplant</span>'
  };
  return map[status] || '';
}

function _otTimeLabel(item){
  const diff = Date.now() - item.sent_at;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if(item.status === 'geantwortet'){
    const rdiff = Date.now() - item.last_activity_at;
    const rdays = Math.floor(rdiff / (1000 * 60 * 60 * 24));
    if(rdays === 0) return 'heute geantwortet';
    if(rdays === 1) return 'vor 1 Tag geantwortet';
    return 'vor ' + rdays + ' Tagen geantwortet';
  }
  if(days === 0) return 'heute gesendet';
  if(days === 1) return 'seit 1 Tag';
  return 'seit ' + days + ' Tagen';
}

function _otRenderDetail(item){
  const detail = document.getElementById('otDetail');
  if(!detail) return;
  const followupRec = computeFollowupRecommended(item);
  const msgs = item.messages || [];
  const daysSince = Math.floor((Date.now() - item.sent_at) / (1000 * 60 * 60 * 24));

  detail.innerHTML = `
    <div class="ot-detail-head">
      <div class="ot-detail-name">${escapeHTML(item.display_label)}</div>
      <div class="ot-detail-meta">${escapeHTML(item.contact_name)} &middot; ${escapeHTML(item.contact_email)} &middot; ${escapeHTML(item.sector||'&mdash;')} &middot; ${escapeHTML(item.stage||'&mdash;')}</div>
      <div class="ot-detail-status-row">
        ${_otStatusBadge(item.status)}
        <span class="ot-detail-ts">Anfrage gesendet am ${new Date(item.sent_at).toLocaleDateString('de-DE')}</span>
      </div>
    </div>
    <div class="ot-detail-body">
      <div class="ot-msgs-label">Gesendete Anfrage</div>
      ${msgs.map(msg=>`
        <div class="ot-bubble ${msg.direction==='outbound'?'outbound':'inbound'}">
          <div class="ot-bubble-sender">${escapeHTML(msg.sender||'')}</div>
          <div class="ot-bubble-text">${escapeHTML(msg.text||'').replace(/\n/g,'<br>')}</div>
          <div class="ot-bubble-ts">${new Date(msg.ts).toLocaleDateString('de-DE')} &middot; ${new Date(msg.ts).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}</div>
        </div>
      `).join('')}
      ${followupRec ? `
        <div class="ot-fw-warning">
          <div class="ot-fw-title">Keine Antwort seit ${daysSince} Tagen</div>
          <div class="ot-fw-text">Ein Follow-up erhöht die Antwortrate deutlich. Empfohlen: kurzer Reminder oder direkte Anfrage für ein Gespräch.</div>
        </div>
      ` : ''}
    </div>
    <div class="ot-detail-actions">
      <button class="btn secondary" id="otFollowupBtn">Follow-up senden</button>
      <button class="btn" id="otCallBtn">Call planen</button>
      <button class="btn secondary" id="otOpenBtn">Startup öffnen</button>
    </div>
  `;

  document.getElementById('otFollowupBtn').onclick = ()=>_otOpenFollowupModal(item);
  document.getElementById('otCallBtn').onclick = ()=>{
    updateOutreachItem(item.id, { status:'call_geplant' });
    activityLogAppend('OUTREACH_CALL_PLANNED', item.anon_id, { display_label: item.display_label });
    toast('Call geplant', item.display_label + ' wurde aus der Liste entfernt');
    _otSelected = null;
    renderInbox();
  };
  document.getElementById('otOpenBtn').onclick = ()=>openModalByAnonId(item.anon_id, startups);
}

function _otRenderList(items){
  const list = document.getElementById('otList');
  if(!list) return;

  if(items.length === 0){
    list.innerHTML = '<div class="ot-empty"><p class="ot-empty-title">Keine Anfragen in diesem Tab</p><p class="ot-empty-sub">Wechsle den Filter oder sende neue Anfragen.</p></div>';
    return;
  }

  list.innerHTML = items.map(item=>{
    const sel = _otSelected === item.id;
    const rec = computeFollowupRecommended(item);
    return `
      <div class="ot-row${sel?' selected':''}" data-ot-id="${escapeHTML(item.id)}">
        <div class="ot-row-top">
          <span class="ot-s-name">${escapeHTML(item.display_label)}</span>
          <span class="ot-time">${escapeHTML(_otTimeLabel(item))}</span>
        </div>
        <div class="ot-row-mid">${escapeHTML(item.contact_name)} &middot; ${escapeHTML(item.contact_email)}</div>
        <div class="ot-row-bot">
          <span class="ot-msg-prev${item.last_message_from==='inbound'?' new':''}">${escapeHTML((item.last_message_preview||'—').slice(0,55))}${(item.last_message_preview||'').length>55?'…':''}</span>
          ${_otStatusBadge(item.status)}
        </div>
        ${rec?'<div class="ot-followup-hint"><span class="ot-f-dot"></span>Follow-up empfohlen</div>':''}
      </div>
    `;
  }).join('');

  list.querySelectorAll('.ot-row').forEach(row=>{
    row.onclick = ()=>{
      const id = row.getAttribute('data-ot-id');
      _otSelected = id;
      const item = getOutreach().find(x=>x.id===id);
      if(!item) return;
      list.querySelectorAll('.ot-row').forEach(r=>r.classList.remove('selected'));
      row.classList.add('selected');
      _otRenderDetail(item);
    };
  });

  /* Auto-select first if nothing selected */
  if(!_otSelected && items.length > 0){
    list.querySelector('.ot-row').click();
  }
}

function _otOpenFollowupModal(item){
  const overlay = document.getElementById('followup-modal-overlay');
  if(!overlay) return;

  const tpls = {
    reminder: 'Hallo ' + (item.contact_name.split(' ')[0]||item.contact_name) + ',\n\nich wollte kurz nachfragen, ob Sie meine Anfrage erhalten haben. Wir sind nach wie vor sehr an einem Austausch interessiert.\n\nHätten Sie in den nächsten Tagen kurz Zeit für ein 15-minütiges Gespräch?\n\nMit freundlichen Grüßen',
    gespraech: 'Hallo ' + (item.contact_name.split(' ')[0]||item.contact_name) + ',\n\nwürden Sie nächste Woche kurz Zeit für ein Intro-Call haben? 15 Minuten würden reichen — ich würde gerne vorstellen, wie CORE euch dabei helfen kann.\n\nBitte schicken Sie mir einfach einen passenden Termin zurück.\n\nMit freundlichen Grüßen'
  };
  let currentTpl = 'reminder';

  const titleEl  = document.getElementById('followup-modal-title');
  const textEl   = document.getElementById('followup-modal-text');
  const tplBtns  = overlay.querySelectorAll('.followup-tpl-btn');
  const cancelBtn = document.getElementById('followup-modal-cancel');
  const sendBtn   = document.getElementById('followup-modal-send');

  if(titleEl) titleEl.textContent = 'Follow-up an ' + item.contact_name;
  if(textEl)  textEl.value = tpls[currentTpl];

  tplBtns.forEach(btn=>{
    btn.classList.toggle('active', btn.getAttribute('data-tpl') === currentTpl);
    btn.onclick = ()=>{
      currentTpl = btn.getAttribute('data-tpl');
      tplBtns.forEach(b=>b.classList.toggle('active', b.getAttribute('data-tpl')===currentTpl));
      if(textEl) textEl.value = tpls[currentTpl] || '';
    };
  });

  overlay.setAttribute('aria-hidden','false');

  if(cancelBtn) cancelBtn.onclick = ()=>overlay.setAttribute('aria-hidden','true');
  if(sendBtn) sendBtn.onclick = ()=>{
    const text = textEl ? textEl.value.trim() : '';
    if(!text) return;
    const arr = getOutreach();
    const idx = arr.findIndex(x=>x.id===item.id);
    if(idx>=0){
      const msg = { id: uid(), direction:'outbound', sender:'Du · aweesfond', text, ts: Date.now() };
      arr[idx].messages = arr[idx].messages || [];
      arr[idx].messages.push(msg);
      arr[idx].last_message_preview = text.slice(0,70);
      arr[idx].last_message_from = 'outbound';
      arr[idx].last_activity_at = Date.now();
      setOutreach(arr);
    }
    overlay.setAttribute('aria-hidden','true');
    activityLogAppend('OUTREACH_FOLLOWUP_SENT', item.anon_id, { display_label: item.display_label });
    toast('Follow-up gesendet (Demo)', 'Nachricht wurde im Thread gespeichert');
    renderInbox();
  };
}

function renderInbox(){
  hideAllViews();
  const viewInbox = document.getElementById('viewInbox');
  if(!viewInbox) return;
  viewInbox.style.display = '';

  const all    = getOutreach().filter(x=>x.status!=='call_geplant');
  const none   = all.filter(x=>x.status==='keine_antwort'||x.status==='anfrage_gesendet');
  const replied = all.filter(x=>x.status==='geantwortet');

  const filtered = _otTab==='keine_antwort' ? none
                 : _otTab==='geantwortet'   ? replied
                 : all;

  const resultCount       = document.getElementById('resultCount');
  const activeFilterCount = document.getElementById('activeFilterCount');
  if(resultCount)       resultCount.textContent       = all.length + ' Anfragen';
  if(activeFilterCount) activeFilterCount.textContent = '0 Filter aktiv';

  viewInbox.innerHTML = `
    <div class="ot-topbar">
      <div>
        <h2 class="ot-title">Anfragen</h2>
        <p class="ot-subtitle">Outreach-Tracker. Zeigt den Stand aller gesendeten Anfragen und wann ein Follow-up nötig ist.</p>
      </div>
      <div class="ot-topbar-right">
        <button class="btn" id="otSendNewBtn">Anfrage senden</button>
      </div>
    </div>

    <div class="ot-tab-bar">
      <button class="ot-tab${_otTab==='alle'?' active':''}" data-tab="alle">Alle <span class="ot-tab-n neutral">${all.length}</span></button>
      <button class="ot-tab${_otTab==='keine_antwort'?' active':''}" data-tab="keine_antwort">Keine Antwort <span class="ot-tab-n amber">${none.length}</span></button>
      <button class="ot-tab${_otTab==='geantwortet'?' active':''}" data-tab="geantwortet">Geantwortet <span class="ot-tab-n green">${replied.length}</span></button>
    </div>

    <div class="ot-master-detail">
      <div class="ot-list" id="otList"></div>
      <div class="ot-detail" id="otDetail">
        <div class="ot-detail-empty">Zeile auswählen um Details zu sehen.</div>
      </div>
    </div>
  `;

  viewInbox.querySelectorAll('.ot-tab').forEach(tab=>{
    tab.onclick = ()=>{
      _otTab = tab.getAttribute('data-tab');
      _otSelected = null;
      renderInbox();
    };
  });

  const sendNewBtn = document.getElementById('otSendNewBtn');
  if(sendNewBtn) sendNewBtn.onclick = ()=>toast('Bald verfügbar', 'E-Mail-Integration folgt in der nächsten Version');

  _otRenderList(filtered);
}
