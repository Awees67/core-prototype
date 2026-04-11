/* =========================
   RENDERER — INBOX / ANFRAGEN v2
   Tabs: Alle | Keine Antwort | Geantwortet | Geplante Calls
   Features: Multi-Select, Bulk-Aktionen, Send-Modal, Follow-up-Alert
========================= */

/* ── Templates (VC → Bewerber) ── */
const OT_TEMPLATES = {
  interesse: {
    subject: (s) => `Ihre Bewerbung bei Paretix Ventures — ${s.display_label}`,
    body: (s, bearbeiter) => `Hallo ${_otVorname(s)},\n\nvielen Dank für Ihre Bewerbung bei Paretix Ventures. Wir haben das Profil von ${s.display_label} gesichtet und sind sehr interessiert an einem persönlichen Kennenlernen.\n\nHätten Sie in den nächsten Tagen kurz Zeit für einen 15-minütigen Intro-Call? Ich würde mich freuen, mehr über euren aktuellen Stand, eure Traction und eure Pläne zu erfahren.\n\nMit freundlichen Grüßen\n${bearbeiter || 'Paretix Ventures'}`
  },
  screening: {
    subject: (s) => `Screening-Gespräch — ${s.display_label}`,
    body: (s, bearbeiter) => `Hallo ${_otVorname(s)},\n\nvielen Dank für eure Einreichung. Nach einer ersten Sichtung eures Profils würden wir euch gern besser kennenlernen und mehr über euren aktuellen Stand erfahren.\n\nWäre ein 20-minütiges Screening-Gespräch in den nächsten Tagen möglich? Dabei würde ich gern auf folgende Punkte eingehen: aktuelle Traction, Unit Economics und euren Kapitalbedarf.\n\nBitte schickt mir einfach einen passenden Termin.\n\nMit freundlichen Grüßen\n${bearbeiter || 'Paretix Ventures'}`
  },
  blank: {
    subject: () => '',
    body: () => ''
  }
};

function _generateStartupEmail(s) {
  const raw = (s.company_name || s.anon_id || 'startup')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return 'team@' + raw + '.io';
}

function _otGetBearbeiterLabel() {
  const el = document.getElementById('otSendBearbeiter');
  const name = el && el.value.trim();
  return name ? name + ' · Paretix Ventures' : 'Paretix Ventures';
}

function _otVorname(item) {
  return (item.contact_name || '').split(' ')[0] || item.contact_name || '';
}

function _otAccentClass(status) {
  if (status === 'geantwortet') return 'teal';
  if (status === 'keine_antwort') return 'amber';
  if (status === 'anfrage_gesendet') return 'blue';
  return 'gray';
}

function _otBadgeClass(status) {
  if (status === 'geantwortet') return 'ot-b-replied';
  if (status === 'keine_antwort') return 'ot-b-none';
  if (status === 'call_geplant') return 'ot-b-call';
  return 'ot-b-sent';
}

function _otBadgeLabel(status) {
  const map = { geantwortet: 'Geantwortet', keine_antwort: 'Keine Antwort', call_geplant: 'Call geplant', anfrage_gesendet: 'Gesendet' };
  return map[status] || 'Gesendet';
}

function _otTimeLabel(item) {
  const diff = Date.now() - (item.sent_at || Date.now());
  const days = Math.floor(diff / 86400000);
  if (item.status === 'geantwortet') {
    const rd = Math.floor((Date.now() - item.last_activity_at) / 86400000);
    return rd === 0 ? 'Heute' : 'Vor ' + rd + ' T.';
  }
  if (days === 0) return 'Heute';
  if (days === 1) return '1 Tag';
  return days + ' Tage';
}

/* ── State ── */
let _otSelected = null;
let _otTab = 'alle';
let _otChecked = new Set();

/* ── Haupt-Render ── */
function renderInbox() {
  hideAllViews();
  const view = document.getElementById('viewInbox');
  if (!view) return;
  view.style.display = '';

  const all = getOutreach();
  const active = all.filter(x => x.status !== 'call_geplant');
  const none   = active.filter(x => x.status === 'keine_antwort' || x.status === 'anfrage_gesendet');
  const replied = active.filter(x => x.status === 'geantwortet');
  const calls  = all.filter(x => x.status === 'call_geplant');

  const listItems = _otTab === 'keine_antwort' ? none
    : _otTab === 'geantwortet' ? replied
    : _otTab === 'geplante_calls' ? calls
    : active;

  const rc = document.getElementById('resultCount');
  const af = document.getElementById('activeFilterCount');
  if (rc) rc.textContent = active.length + ' Anfragen';
  if (af) af.textContent = '0 Filter aktiv';

  view.innerHTML = `
    <div class="ot-shell">
      <div class="ot-topbar">
        <div>
          <h2 class="ot-title">Anfragen</h2>
          <p class="ot-subtitle">Outreach → Follow-up → Call. Alle Bewerberkontakte im Überblick.</p>
        </div>
        <div class="ot-topbar-right">
          <div class="ot-stats-row">
            <div class="ot-stat-chip"><span class="ot-sdot" style="background:#378ADD"></span><span class="ot-sn">${active.length}</span><span>aktiv</span></div>
            <div class="ot-stat-chip"><span class="ot-sdot" style="background:#EF9F27"></span><span class="ot-sn">${none.length}</span><span>keine Antwort</span></div>
            <div class="ot-stat-chip"><span class="ot-sdot" style="background:#1D9E75"></span><span class="ot-sn">${replied.length}</span><span>geantwortet</span></div>
            <div class="ot-stat-chip"><span class="ot-sdot" style="background:#1D9E75"></span><span class="ot-sn">${calls.length}</span><span>Calls geplant</span></div>
          </div>
          <button class="btn" id="otSendNewBtn">+ Anfrage senden</button>
        </div>
      </div>

      <div class="ot-tab-bar">
        <button class="ot-tab${_otTab === 'alle' ? ' active' : ''}" data-tab="alle">Alle <span class="ot-tab-n neutral">${active.length}</span></button>
        <button class="ot-tab${_otTab === 'keine_antwort' ? ' active' : ''}" data-tab="keine_antwort">Keine Antwort <span class="ot-tab-n amber">${none.length}</span></button>
        <button class="ot-tab${_otTab === 'geantwortet' ? ' active' : ''}" data-tab="geantwortet">Geantwortet <span class="ot-tab-n teal">${replied.length}</span></button>
        <button class="ot-tab${_otTab === 'geplante_calls' ? ' active' : ''}" data-tab="geplante_calls">Geplante Calls <span class="ot-tab-n blue">${calls.length}</span></button>
      </div>

      ${_otTab === 'geplante_calls'
        ? `<div style="padding:16px;">${_otBuildCallsView(calls)}</div>`
        : `<div class="ot-master-detail">
            <div class="ot-list-col">
              <div class="ot-bulk-bar" id="otBulkBar">
                <span class="ot-bulk-count" id="otBulkCount">0 ausgewählt</span>
                <button class="ot-bulk-btn" id="otBulkFollowup">Follow-up senden</button>
                <button class="ot-bulk-btn" id="otBulkCall">Call planen</button>
                <button class="ot-bulk-deselect" id="otBulkDeselect">Auswahl aufheben</button>
              </div>
              <div class="ot-list-header">
                <input type="checkbox" id="otSelectAll" style="accent-color:var(--accent);width:15px;height:15px;cursor:pointer;">
                <span class="ot-list-header-label">${listItems.length} Einträge</span>
              </div>
              <div class="ot-list" id="otList"></div>
            </div>
            <div class="ot-detail" id="otDetail">
              <div class="ot-detail-empty">Zeile auswählen um Details zu sehen.</div>
            </div>
          </div>`
      }
    </div>
  `;

  view.querySelectorAll('.ot-tab').forEach(tab => {
    tab.onclick = () => { _otTab = tab.getAttribute('data-tab'); _otSelected = null; _otChecked.clear(); renderInbox(); };
  });

  const sendBtn = document.getElementById('otSendNewBtn');
  if (sendBtn) sendBtn.onclick = () => _otOpenSendModal(null);

  if (_otTab !== 'geplante_calls') {
    _otRenderList(listItems);
    _otBindBulkBar(listItems);
    const saBtn = document.getElementById('otSelectAll');
    if (saBtn) {
      saBtn.checked = listItems.length > 0 && listItems.every(x => _otChecked.has(x.id));
      saBtn.onchange = () => {
        if (saBtn.checked) listItems.forEach(x => _otChecked.add(x.id));
        else _otChecked.clear();
        _otRenderList(listItems);
        _otUpdateBulkBar();
      };
    }
  } else {
    _otBindCallsActions();
  }
}

/* ── Bulk Bar ── */
function _otUpdateBulkBar() {
  const bar = document.getElementById('otBulkBar');
  const cnt = document.getElementById('otBulkCount');
  if (!bar) return;
  const n = _otChecked.size;
  bar.classList.toggle('visible', n > 0);
  if (cnt) cnt.textContent = n + ' ausgewählt';
}

function _otBindBulkBar(listItems) {
  _otUpdateBulkBar();
  const fuBtn = document.getElementById('otBulkFollowup');
  const callBtn = document.getElementById('otBulkCall');
  const desBtn = document.getElementById('otBulkDeselect');

  if (fuBtn) fuBtn.onclick = () => {
    const first = getOutreach().find(x => _otChecked.has(x.id));
    if (first) _otOpenFollowupModal(first);
  };

  if (callBtn) callBtn.onclick = () => {
    const arr = getOutreach();
    _otChecked.forEach(id => {
      const idx = arr.findIndex(x => x.id === id);
      if (idx >= 0) { arr[idx].status = 'call_geplant'; arr[idx].last_activity_at = Date.now(); }
    });
    setOutreach(arr);
    const n = _otChecked.size;
    _otChecked.clear();
    _otSelected = null;
    toast('Call geplant', n + ' Anfrage' + (n !== 1 ? 'n' : '') + ' verschoben');
    renderInbox();
  };

  if (desBtn) desBtn.onclick = () => { _otChecked.clear(); _otRenderList(listItems); _otUpdateBulkBar(); };
}

/* ── List Panel ── */
function _otRenderList(items) {
  const list = document.getElementById('otList');
  if (!list) return;

  if (items.length === 0) {
    list.innerHTML = `<div class="ot-empty"><p class="ot-empty-title">Keine Einträge</p><p class="ot-empty-sub">Wechsle den Tab oder sende neue Anfragen.</p></div>`;
    return;
  }

  list.innerHTML = items.map(item => {
    const sel = _otSelected === item.id;
    const chk = _otChecked.has(item.id);
    const rec = computeFollowupRecommended(item);
    const isNew = item.last_message_from === 'inbound';
    return `
      <div class="ot-row${sel ? ' selected' : ''}${chk ? ' checked' : ''}" data-ot-id="${escapeHTML(item.id)}">
        <div class="ot-row-accent ${_otAccentClass(item.status)}"></div>
        <div class="ot-row-check">
          <input type="checkbox" class="ot-cb" data-id="${escapeHTML(item.id)}" ${chk ? 'checked' : ''} onclick="event.stopPropagation()">
        </div>
        <div class="ot-row-inner">
          <div class="ot-row-top">
            <span class="ot-s-name">${escapeHTML(item.display_label)}</span>
            <span class="ot-time">${escapeHTML(_otTimeLabel(item))}</span>
          </div>
          <div class="ot-row-mid">${escapeHTML(item.contact_name)} · ${escapeHTML(item.contact_email)}</div>
          <div class="ot-row-bot">
            <span class="ot-msg-prev${isNew ? ' new' : ''}">${escapeHTML((item.last_message_preview || '—').slice(0, 55))}${(item.last_message_preview || '').length > 55 ? '…' : ''}</span>
            <span class="ot-badge ${_otBadgeClass(item.status)}">${_otBadgeLabel(item.status)}</span>
          </div>
          ${rec ? `<div class="ot-followup-tag"><span class="ot-fdot"></span>Follow-up fällig</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.ot-cb').forEach(cb => {
    cb.onchange = (e) => {
      const id = cb.getAttribute('data-id');
      if (cb.checked) _otChecked.add(id); else _otChecked.delete(id);
      const row = cb.closest('.ot-row');
      if (row) row.classList.toggle('checked', cb.checked);
      _otUpdateBulkBar();
      const saBtn = document.getElementById('otSelectAll');
      if (saBtn) saBtn.checked = items.every(x => _otChecked.has(x.id));
    };
  });

  list.querySelectorAll('.ot-row').forEach(row => {
    row.onclick = (e) => {
      if (e.target.type === 'checkbox') return;
      const id = row.getAttribute('data-ot-id');
      _otSelected = id;
      const item = getOutreach().find(x => x.id === id);
      if (!item) return;
      list.querySelectorAll('.ot-row').forEach(r => r.classList.remove('selected'));
      row.classList.add('selected');
      _otRenderDetail(item);
    };
  });

  if (!_otSelected && items.length > 0 && _otChecked.size === 0) {
    list.querySelector('.ot-row').click();
  }
}

/* ── Detail Panel ── */
function _otRenderDetail(item) {
  const detail = document.getElementById('otDetail');
  if (!detail) return;

  const rec = computeFollowupRecommended(item);
  const daysSince = Math.floor((Date.now() - item.sent_at) / 86400000);
  const msgs = item.messages || [];

  detail.innerHTML = `
    <div class="ot-detail-head">
      <div class="ot-detail-name-row">
        <span class="ot-detail-name">${escapeHTML(item.display_label)}</span>
        <span class="ot-badge ${_otBadgeClass(item.status)}">${_otBadgeLabel(item.status)}</span>
      </div>
      <div class="ot-detail-meta">${escapeHTML(item.contact_name)} · ${escapeHTML(item.contact_email)} · ${escapeHTML(item.sector || '—')} · ${escapeHTML(item.stage || '—')}</div>
      <div class="ot-detail-ts">Gesendet am ${new Date(item.sent_at).toLocaleDateString('de-DE')} · ${daysSince === 0 ? 'Heute' : 'Vor ' + daysSince + ' Tag' + (daysSince !== 1 ? 'en' : '')}</div>
    </div>
    <div class="ot-detail-body">
      ${rec ? `<div class="ot-fw-alert"><div class="ot-fw-alert-title">Follow-up empfohlen — ${daysSince} Tage ohne Antwort</div><div class="ot-fw-alert-text">Der Großteil der Conversions entsteht über Follow-ups. Sende jetzt einen Reminder oder eine direkte Anfrage für ein Gespräch.</div></div>` : ''}
      <div class="ot-thread-label">Verlauf</div>
      ${msgs.map(m => {
      const fullText = m.text || '';
      const PREVIEW_LEN = 300;
      const isLong = fullText.length > PREVIEW_LEN;
      const bubbleId = 'bubble_' + m.id;
      return `
        <div class="ot-bubble ${m.direction === 'outbound' ? 'outbound' : 'inbound'}">
          <div class="ot-bubble-sender">${escapeHTML(m.sender || '')} · ${new Date(m.ts).toLocaleDateString('de-DE')} ${new Date(m.ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div>
          <div class="ot-bubble-text" id="${bubbleId}" data-expanded="false" data-full="${encodeURIComponent(fullText)}">${isLong ? escapeHTML(fullText.slice(0, PREVIEW_LEN)).replace(/\n/g, '<br>') + '…' : escapeHTML(fullText).replace(/\n/g, '<br>')}</div>
          ${isLong ? `<button class="ot-bubble-toggle" data-bubble="${bubbleId}">Mehr anzeigen</button>` : ''}
        </div>`;
      }).join('')}
    </div>
    <div class="ot-detail-actions">
      ${item.status === 'geantwortet'
        ? `<button class="ot-btn-primary" id="odCallBtn">Call planen</button><button class="ot-btn-ghost" id="odFuBtn">Follow-up senden</button>`
        : `<button class="ot-btn-primary" id="odFuBtn">Follow-up senden</button><button class="ot-btn-ghost" id="odCallBtn">Call planen</button>`}
      <div class="ot-dropdown-wrap">
        <button class="ot-btn-menu" id="odMenuBtn">···</button>
        <div class="ot-dropdown" id="odDropdown" style="display:none;">
          <div class="ot-dropdown-item" id="odOpenBtn">Startup öffnen</div>
          <div class="ot-dropdown-item danger" id="odArchiveBtn">Anfrage archivieren</div>
        </div>
      </div>
    </div>
  `;

  // Expand/collapse long message bubbles
  detail.querySelectorAll('.ot-bubble-toggle').forEach(btn => {
    btn.onclick = () => {
      const bubbleId = btn.getAttribute('data-bubble');
      const textEl = document.getElementById(bubbleId);
      if (!textEl) return;
      const expanded = textEl.getAttribute('data-expanded') === 'true';
      const fullText = decodeURIComponent(textEl.getAttribute('data-full') || '');
      const PREVIEW_LEN = 300;
      if (expanded) {
        textEl.innerHTML = escapeHTML(fullText.slice(0, PREVIEW_LEN)).replace(/\n/g, '<br>') + '…';
        textEl.setAttribute('data-expanded', 'false');
        btn.textContent = 'Mehr anzeigen';
      } else {
        textEl.innerHTML = escapeHTML(fullText).replace(/\n/g, '<br>');
        textEl.setAttribute('data-expanded', 'true');
        btn.textContent = 'Weniger anzeigen';
      }
    };
  });

  const fuBtn = document.getElementById('odFuBtn');
  if (fuBtn) fuBtn.onclick = () => _otOpenFollowupModal(item);

  const callBtn = document.getElementById('odCallBtn');
  if (callBtn) callBtn.onclick = () => {
    updateOutreachItem(item.id, { status: 'call_geplant' });
    activityLogAppend('OUTREACH_CALL_PLANNED', item.anon_id, { display_label: item.display_label });
    toast('Call geplant', item.display_label + ' ist jetzt in „Geplante Calls"');
    _otSelected = null;
    renderInbox();
  };

  const menuBtn = document.getElementById('odMenuBtn');
  const drop = document.getElementById('odDropdown');
  if (menuBtn && drop) {
    menuBtn.onclick = (e) => { e.stopPropagation(); drop.style.display = drop.style.display === 'none' ? 'block' : 'none'; };
    document.addEventListener('click', () => { if (drop) drop.style.display = 'none'; }, { once: true });
  }

  const openBtn = document.getElementById('odOpenBtn');
  if (openBtn && item.anon_id) openBtn.onclick = () => openModalByAnonId(item.anon_id, startups);

  const archBtn = document.getElementById('odArchiveBtn');
  if (archBtn) archBtn.onclick = () => {
    if (!confirm('Anfrage archivieren?')) return;
    setOutreach(getOutreach().filter(x => x.id !== item.id));
    _otSelected = null;
    toast('Archiviert', item.display_label);
    renderInbox();
  };
}

/* ── Geplante Calls View ── */
function _otBuildCallsView(calls) {
  if (!calls.length) return `<div class="ot-empty"><p class="ot-empty-title">Keine geplanten Calls</p><p class="ot-empty-sub">Wenn du auf „Call planen" klickst, erscheint der Eintrag hier.</p></div>`;
  return `<div class="ot-calls-list">${calls.map(item => `
    <div class="ot-call-card" data-call-id="${escapeHTML(item.id)}">
      <span class="ot-call-dot"></span>
      <div>
        <div class="ot-call-name">${escapeHTML(item.display_label)}</div>
        <div class="ot-call-meta">${escapeHTML(item.contact_name)} · ${escapeHTML(item.contact_email)} · ${escapeHTML(item.sector || '—')}</div>
        <div class="ot-call-planned-ts">Call geplant am ${new Date(item.last_activity_at).toLocaleDateString('de-DE')}</div>
      </div>
      <div class="ot-call-actions">
        <button class="btn secondary small" data-call-open="${escapeHTML(item.id)}">Startup öffnen</button>
        <button class="btn small" data-call-done="${escapeHTML(item.id)}">Call abgeschlossen</button>
      </div>
    </div>`).join('')}</div>`;
}

function _otBindCallsActions() {
  document.querySelectorAll('[data-call-open]').forEach(b => {
    const item = getOutreach().find(x => x.id === b.getAttribute('data-call-open'));
    if (item && item.anon_id) b.onclick = () => openModalByAnonId(item.anon_id, startups);
  });
  document.querySelectorAll('[data-call-done]').forEach(b => {
    b.onclick = () => {
      const id = b.getAttribute('data-call-done');
      setOutreach(getOutreach().filter(x => x.id !== id));
      toast('Abgeschlossen', 'Eintrag entfernt');
      renderInbox();
    };
  });
}

/* ── Send Modal ── */
function _otOpenSendModal(prefilledStartup) {
  const backdrop = document.getElementById('otSendBackdrop');
  if (!backdrop) { toast('Bald verfügbar', 'E-Mail-Integration folgt'); return; }

  let currentTpl = 'interesse';

  // Normalize: accept both outreach-style objects and raw startup objects from window.startups
  let currentStartup = null;
  if (prefilledStartup) {
    const isRawStartup = !prefilledStartup.display_label && (prefilledStartup.company_name || prefilledStartup.anon_id);
    if (isRawStartup) {
      // Check if an outreach entry already exists for this startup (prefer real email)
      const existingOutreach = getOutreach().find(x => x.anon_id === prefilledStartup.anon_id);
      currentStartup = {
        display_label: prefilledStartup.company_name || prefilledStartup.anon_id,
        contact_name: existingOutreach ? existingOutreach.contact_name : (prefilledStartup.contact_name || 'Gründerteam'),
        contact_email: existingOutreach ? existingOutreach.contact_email : (prefilledStartup.contact_email || _generateStartupEmail(prefilledStartup)),
        sector: prefilledStartup.sector || '—',
        stage: prefilledStartup.stage || '—',
        anon_id: prefilledStartup.anon_id || null
      };
    } else {
      currentStartup = prefilledStartup;
    }
  }

  const avatarEl  = document.getElementById('otSendAvatar');
  const nameEl    = document.getElementById('otSendChipName');
  const metaEl    = document.getElementById('otSendChipMeta');
  const toEl      = document.getElementById('otSendToAddr');
  const subjectEl = document.getElementById('otSendSubject');
  const bodyEl    = document.getElementById('otSendBody');
  const charEl    = document.getElementById('otSendCharCount');

  function _initials(name) { return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }

  function _applyTemplate(tpl) {
    currentTpl = tpl;
    backdrop.querySelectorAll('.ot-tpl-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-tpl') === tpl));
    const t = OT_TEMPLATES[tpl];
    if (!t) return;
    const fake = currentStartup || { display_label: 'Startup', contact_name: 'Gründerteam', contact_email: '—', sector: '—', stage: '—' };
    const bearbeiterEl = document.getElementById('otSendBearbeiter');
    const bearbeiter = (bearbeiterEl && bearbeiterEl.value.trim()) || '';
    if (subjectEl) subjectEl.value = t.subject(fake);
    if (bodyEl) { bodyEl.value = t.body(fake, bearbeiter); if (charEl) charEl.textContent = bodyEl.value.length; }
  }

  if (currentStartup) {
    if (avatarEl) avatarEl.textContent = _initials(currentStartup.display_label);
    if (nameEl)   nameEl.textContent   = currentStartup.display_label;
    if (metaEl)   metaEl.textContent   = [currentStartup.sector, currentStartup.stage, currentStartup.contact_email].filter(Boolean).join(' · ');
    if (toEl)     toEl.textContent     = currentStartup.contact_email || '—';
  } else {
    if (avatarEl) avatarEl.textContent = '?';
    if (nameEl)   nameEl.textContent   = 'Kein Startup vorausgewählt';
    if (metaEl)   metaEl.textContent   = 'Öffne Anfrage senden aus einem Startup-Profil heraus';
    if (toEl)     toEl.textContent     = '—';
  }

  _applyTemplate('interesse');

  backdrop.querySelectorAll('.ot-tpl-btn').forEach(btn => { btn.onclick = () => _applyTemplate(btn.getAttribute('data-tpl')); });
  if (bodyEl) bodyEl.oninput = () => { if (charEl) charEl.textContent = bodyEl.value.length; };
  const bearbeiterInputEl = document.getElementById('otSendBearbeiter');
  if (bearbeiterInputEl) bearbeiterInputEl.addEventListener('input', () => _applyTemplate(currentTpl));

  backdrop.style.display = 'flex';
  backdrop.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');

  function _close() { backdrop.style.display = 'none'; backdrop.setAttribute('aria-hidden', 'true'); document.body.classList.remove('no-scroll'); }

  const closeBtn  = document.getElementById('otSendCloseBtn');
  const cancelBtn = document.getElementById('otSendCancelBtn');
  const confirmBtn = document.getElementById('otSendConfirmBtn');

  if (closeBtn)  closeBtn.onclick  = _close;
  if (cancelBtn) cancelBtn.onclick = _close;
  backdrop.onclick = (e) => { if (e.target === backdrop) _close(); };

  if (confirmBtn) confirmBtn.onclick = () => {
    const body    = bodyEl    ? bodyEl.value.trim()    : '';
    const subject = subjectEl ? subjectEl.value.trim() : '';
    if (!body)    { toast('Pflichtfeld', 'Nachricht darf nicht leer sein'); return; }
    if (!subject) { toast('Pflichtfeld', 'Betreff darf nicht leer sein'); return; }

    const now = Date.now();
    const fake = currentStartup || { anon_id: null, display_label: 'Unbekannt', contact_name: '—', contact_email: '—', sector: '—', stage: '—' };

    const newEntry = {
      id: uid(),
      anon_id: fake.anon_id,
      display_label: fake.display_label,
      contact_name: fake.contact_name,
      contact_email: fake.contact_email,
      sector: fake.sector || '—',
      stage: fake.stage || '—',
      status: 'anfrage_gesendet',
      sent_at: now,
      last_activity_at: now,
      last_message_preview: body.slice(0, 70),
      last_message_from: 'outbound',
      thread_id: 'thrd_' + Math.random().toString(16).slice(2, 10),
      conversation_id: 'conv_' + Math.random().toString(16).slice(2, 10),
      messages: [{ id: uid(), direction: 'outbound', sender: _otGetBearbeiterLabel(), text: body, ts: now }]
    };

    const arr = getOutreach();
    arr.unshift(newEntry);
    setOutreach(arr);
    activityLogAppend('OUTREACH_SENT', newEntry.anon_id, { display_label: newEntry.display_label, template: currentTpl });
    _close();
    toast('Anfrage gesendet', newEntry.display_label + ' erscheint in den Anfragen');
    _otTab = 'alle';
    _otSelected = newEntry.id;
    renderInbox();
  };
}

/* ── Follow-up Modal ── */
function _otOpenFollowupModal(item) {
  const overlay = document.getElementById('followup-modal-overlay');
  if (!overlay) return;

  const tpls = {
    reminder: `Hallo ${_otVorname(item)},\n\nkurze Nachfrage zu meiner Anfrage von vor einigen Tagen — haben Sie die Gelegenheit gehabt, sie zu lesen?\n\nIch freue mich auf einen kurzen Austausch, falls ein Intro-Call interessant wäre.\n\nMit freundlichen Grüßen\nParetix Ventures`,
    gespraech: `Hallo ${_otVorname(item)},\n\nwürden Sie nächste Woche kurz Zeit für einen 15-minütigen Call haben? Ich würde gern mehr über euren aktuellen Stand erfahren.\n\nBitte schicken Sie mir einfach einen passenden Termin zurück.\n\nMit freundlichen Grüßen\nParetix Ventures`
  };

  let currentTpl = 'reminder';
  const titleEl  = document.getElementById('followup-modal-title');
  const textEl   = document.getElementById('followup-modal-text');
  const tplBtns  = overlay.querySelectorAll('.followup-tpl-btn');
  const cancelBtn = document.getElementById('followup-modal-cancel');
  const sendBtn   = document.getElementById('followup-modal-send');

  if (titleEl) titleEl.textContent = 'Follow-up an ' + item.contact_name;
  if (textEl)  textEl.value = tpls[currentTpl];
  tplBtns.forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-tpl') === currentTpl);
    b.onclick = () => {
      currentTpl = b.getAttribute('data-tpl');
      tplBtns.forEach(x => x.classList.toggle('active', x.getAttribute('data-tpl') === currentTpl));
      if (textEl) textEl.value = tpls[currentTpl] || '';
    };
  });

  overlay.setAttribute('aria-hidden', 'false');
  if (cancelBtn) cancelBtn.onclick = () => overlay.setAttribute('aria-hidden', 'true');

  if (sendBtn) sendBtn.onclick = () => {
    const text = textEl ? textEl.value.trim() : '';
    if (!text) return;
    const arr = getOutreach();
    const idx = arr.findIndex(x => x.id === item.id);
    if (idx >= 0) {
      const msg = { id: uid(), direction: 'outbound', sender: 'Paretix Ventures', text, ts: Date.now() };
      arr[idx].messages = arr[idx].messages || [];
      arr[idx].messages.push(msg);
      arr[idx].last_message_preview = text.slice(0, 70);
      arr[idx].last_message_from = 'outbound';
      arr[idx].last_activity_at = Date.now();
      setOutreach(arr);
    }
    overlay.setAttribute('aria-hidden', 'true');
    activityLogAppend('OUTREACH_FOLLOWUP_SENT', item.anon_id, { display_label: item.display_label });
    toast('Follow-up gespeichert', 'Nachricht im Thread');
    const updated = getOutreach().find(x => x.id === item.id);
    if (updated) _otRenderDetail(updated);
  };
}

/* Legacy stub kept for backward compatibility */
function bindLeadFormForStartup(s) {}
function bindInboxHeaderButtons() {}
