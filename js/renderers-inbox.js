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

function bindInboxHeaderButtons(){
  const exportBtn = document.getElementById('exportJsonBtn');
  const clearBtn  = document.getElementById('clearLeadsBtn');

  if(exportBtn){
    exportBtn.onclick = async ()=>{
      const leads   = getLeads().slice().sort((a,b)=>b.ts-a.ts);
      const payload = { exported_at: new Date().toISOString(), leads_count: leads.length, leads };
      const text    = JSON.stringify(payload, null, 2);
      const ok      = downloadTextFile('core_anfragen_export.json', text);
      if(!ok) await copyToClipboard(text);
      toast(ok ? 'Export bereit' : 'Export kopiert', ok ? 'JSON-Download gestartet' : 'JSON in Zwischenablage');
    };
  }

  if(clearBtn){
    clearBtn.onclick = ()=>{
      setLeads([]);
      toast('Gelöscht', 'Alle Anfragen entfernt');
      renderInbox();
    };
  }
}

function renderInbox(){
  hideAllViews();
  const viewInbox = document.getElementById('viewInbox');
  if(!viewInbox) return;
  viewInbox.style.display = '';

  const leads = getLeads().slice().sort((a,b)=>b.ts-a.ts);
  viewInbox.innerHTML = '';

  const resultCount      = document.getElementById('resultCount');
  const activeFilterCount = document.getElementById('activeFilterCount');
  if(resultCount)       resultCount.textContent       = leads.length + ' Anfragen';
  if(activeFilterCount) activeFilterCount.textContent = '0 Filter aktiv';

  /* ---- Header ---- */
  const header = document.createElement('div');
  header.className = 'anf-header';
  header.innerHTML = `
    <div class="anf-header-left">
      <h2 class="anf-title">Anfragen</h2>
      <p class="anf-subtitle">Eingehende Interessensbekundungen und Startup-Anfragen. Lokal gespeichert, keine Uebertragung an Dritte.</p>
    </div>
    <div class="anf-header-right">
      <div class="anf-count-pill">
        <span class="anf-dot"></span>
        <span>${leads.length} Anfrage${leads.length !== 1 ? 'n' : ''}</span>
      </div>
      <button class="btn secondary" id="exportJsonBtn">Export JSON</button>
      <button class="btn secondary" id="clearLeadsBtn">Alle loeschen</button>
    </div>
  `;
  viewInbox.appendChild(header);

  /* ---- Empty state ---- */
  if(leads.length === 0){
    const empty = document.createElement('div');
    empty.className = 'anf-empty';
    empty.innerHTML = `
      <p class="anf-empty-title">Keine Anfragen vorhanden</p>
      <p class="anf-empty-sub">Neue Anfragen erscheinen hier, sobald Investoren Interesse an Startups bekunden.</p>
    `;
    viewInbox.appendChild(empty);
    bindInboxHeaderButtons();
    updateCounts();
    return;
  }

  /* ---- Table ---- */
  const tableWrap = document.createElement('div');
  tableWrap.className = 'anf-table-wrap';

  const tableScroll = document.createElement('div');
  tableScroll.className = 'anf-table-scroll';

  const table = document.createElement('table');
  table.className = 'anf-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th class="anf-th-chev"></th>
        <th>Startup</th>
        <th>Anfragender</th>
        <th>Firma / Fonds</th>
        <th>Nachricht</th>
        <th>Eingegangen</th>
        <th style="text-align:right">Aktionen</th>
      </tr>
    </thead>
    <tbody id="anfTableBody"></tbody>
  `;

  tableScroll.appendChild(table);
  tableWrap.appendChild(tableScroll);
  viewInbox.appendChild(tableWrap);

  const tbody   = document.getElementById('anfTableBody');
  const openSet = new Set();

  function fmtDate(ts){
    const dt = new Date(ts);
    if(!Number.isFinite(dt.getTime())) return '\u2014';
    return dt.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' })
      + ' \u00B7 '
      + dt.toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' });
  }

  function renderRows(){
    tbody.innerHTML = '';

    leads.forEach((l, i)=>{
      const isOpen      = openSet.has(i);
      const dateStr     = fmtDate(l.ts);
      const displayName = l.display_label || startupLabel({ anon_id: l.anon_id });
      const msgPreview  = (l.msg || '\u2014').slice(0, 55) + ((l.msg||'').length > 55 ? '\u2026' : '');
      const msgFull     = escapeHTML(l.msg || '\u2014');

      /* -- Main row -- */
      const mainRow = document.createElement('tr');
      mainRow.className = 'anf-row-main' + (isOpen ? ' open' : '');
      mainRow.innerHTML = `
        <td class="anf-td-chev"><span class="anf-chev${isOpen ? ' open' : ''}">&#x203A;</span></td>
        <td>
          <span class="anf-startup-name">${escapeHTML(displayName)}</span>
          <span class="anf-startup-id">${escapeHTML(l.anon_id)}</span>
        </td>
        <td>
          <div class="anf-person-name">${escapeHTML(l.name || '\u2014')}</div>
          <div class="anf-person-sub">${escapeHTML(l.email || '\u2014')}</div>
        </td>
        <td><span class="anf-fonds">${escapeHTML(l.firm || '\u2014')}</span></td>
        <td><span class="anf-msg-preview">${escapeHTML(msgPreview)}</span></td>
        <td class="anf-datum">${escapeHTML(dateStr)}</td>
        <td>
          <div class="anf-actions">
            ${!isOpen ? `<button class="btn small" data-open-startup="${escapeHTML(l.anon_id)}">Startup oeffnen</button>` : ''}
            <button class="btn secondary small" data-del-ts="${String(l.ts)}">Loeschen</button>
          </div>
        </td>
      `;

      mainRow.addEventListener('click', (e)=>{
        if(e.target.closest('button')) return;
        if(isOpen) openSet.delete(i);
        else       openSet.add(i);
        renderRows();
      });

      tbody.appendChild(mainRow);

      /* -- Detail row (only when open) -- */
      if(isOpen){
        const detailRow = document.createElement('tr');
        detailRow.className = 'anf-row-detail';
        detailRow.innerHTML = `
          <td colspan="7">
            <div class="anf-detail-panel">
              <div class="anf-detail-meta">
                <div class="anf-meta-item">
                  <div class="anf-meta-label">Anfragender</div>
                  <div class="anf-meta-value">${escapeHTML(l.name || '\u2014')}</div>
                </div>
                <div class="anf-meta-item">
                  <div class="anf-meta-label">E-Mail</div>
                  <div class="anf-meta-value">${escapeHTML(l.email || '\u2014')}</div>
                </div>
                <div class="anf-meta-item">
                  <div class="anf-meta-label">Firma / Fonds</div>
                  <div class="anf-meta-value">${escapeHTML(l.firm || '\u2014')}</div>
                </div>
                <div class="anf-meta-item">
                  <div class="anf-meta-label">Eingegangen</div>
                  <div class="anf-meta-value anf-meta-muted">${escapeHTML(dateStr)}</div>
                </div>
              </div>
              <div class="anf-msg-block">
                <div class="anf-msg-block-label">Nachricht</div>
                <div class="anf-msg-block-text">${msgFull}</div>
              </div>
              <div class="anf-detail-actions">
                <button class="btn" data-open-startup="${escapeHTML(l.anon_id)}">Startup oeffnen</button>
                <button class="btn secondary" data-del-ts="${String(l.ts)}">Anfrage loeschen</button>
              </div>
            </div>
          </td>
        `;
        tbody.appendChild(detailRow);
      }
    });

    /* Bind buttons after render */
    tbody.querySelectorAll('[data-open-startup]').forEach(btn=>{
      btn.onclick = (e)=>{ e.stopPropagation(); openModalById(btn.getAttribute('data-open-startup')); };
    });
    tbody.querySelectorAll('[data-del-ts]').forEach(btn=>{
      btn.onclick = (e)=>{
        e.stopPropagation();
        const ts = Number(btn.getAttribute('data-del-ts'));
        setLeads(getLeads().filter(x=>Number(x.ts) !== ts));
        toast('Geloescht', 'Anfrage entfernt');
        renderInbox();
      };
    });
  }

  renderRows();
  bindInboxHeaderButtons();
  updateCounts();
}
