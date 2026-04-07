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
  const exportBtn = document.getElementById("exportJsonBtn");
  const clearBtn = document.getElementById("clearLeadsBtn");

  if(exportBtn){
    exportBtn.onclick = async ()=>{
      const leads = getLeads().slice().sort((a,b)=>b.ts-a.ts);
      const payload = {
        exported_at: new Date().toISOString(),
        leads_count: leads.length,
        leads
      };
      const text = JSON.stringify(payload, null, 2);
      const downloaded = downloadTextFile("core_anfragen_export.json", text);
      if(!downloaded) await copyToClipboard(text);
      toast(downloaded ? "Export bereit" : "Export kopiert", downloaded ? "JSON-Download gestartet" : "JSON liegt in der Zwischenablage");
    };
  }

  if(clearBtn){
    clearBtn.onclick = ()=>{
      setLeads([]);
      toast("Gelöscht", "Alle Anfragen entfernt");
      renderInbox();
    };
  }
}

function renderInbox(){
  hideAllViews();
  const viewInbox = document.getElementById("viewInbox");
  if(!viewInbox) return;
  viewInbox.style.display = "";

  const leads = getLeads().slice().sort((a,b)=>b.ts-a.ts);
  viewInbox.innerHTML = "";

  const resultCount = document.getElementById("resultCount");
  const activeFilterCount = document.getElementById("activeFilterCount");
  if(resultCount) resultCount.textContent = leads.length + " Anfragen";
  if(activeFilterCount) activeFilterCount.textContent = "0 Filter aktiv";

  // ── Header ──
  const header = document.createElement("div");
  header.className = "inbox2-header";
  header.innerHTML = `
    <div class="inbox2-header-left">
      <h2 class="inbox2-header-title">Anfragen <span class="inbox2-header-count">(lokal gespeichert)</span></h2>
      <p class="inbox2-header-sub">Verwalten Sie eingehende Interessensbekundungen und Startup-Anfragen direkt in Ihrer lokalen Instanz.</p>
    </div>
    <div class="inbox2-header-right">
      <div class="inbox2-header-badge">
        <span class="inbox2-badge-dot"></span>
        <span class="inbox2-badge-text">${leads.length} gesendete Anfrage${leads.length !== 1 ? "n" : ""}</span>
      </div>
      <div class="inbox2-header-actions">
        <button class="btn secondary" id="exportJsonBtn">Export JSON</button>
        <button class="btn secondary" id="clearLeadsBtn">Alle löschen</button>
      </div>
    </div>
  `;
  viewInbox.appendChild(header);

  // ── Empty state ──
  if(leads.length === 0){
    const empty = document.createElement("div");
    empty.className = "inbox2-empty-state";
    empty.innerHTML = `
      <div class="inbox2-empty-icon">📭</div>
      <h3 class="inbox2-empty-title">Keine Anfragen gefunden</h3>
      <p class="inbox2-empty-sub">Neue Anfragen werden hier automatisch erscheinen, sobald Investoren Interesse an Startups bekunden.</p>
    `;
    viewInbox.appendChild(empty);
    bindInboxHeaderButtons();
    updateCounts();
    return;
  }

  // ── Card grid ──
  const grid = document.createElement("div");
  grid.className = "inbox2-grid";

  leads.forEach((l)=>{
    const card = document.createElement("div");
    card.className = "inbox2-card";

    const dt = new Date(l.ts);
    const dateStr = Number.isFinite(dt.getTime())
      ? dt.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })
        + " \u2022 "
        + dt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
      : "\u2014";

    const displayName = l.display_label || startupLabel({ anon_id: l.anon_id });
    const msgTruncated = (l.msg || "\u2014").slice(0, 280) + ((l.msg || "").length > 280 ? "\u2026" : "");

    card.innerHTML = `
      <div class="inbox2-card-head">
        <h3 class="inbox2-card-title">Anfrage zu ${escapeHTML(displayName)}</h3>
        <span class="inbox2-card-time">${escapeHTML(dateStr)}</span>
      </div>

      <div class="inbox2-sections">
        <div class="inbox2-section">
          <div class="inbox2-section-label">
            <span class="inbox2-section-icon">&#x1F464;</span>
            <span class="inbox2-section-label-text">Requester</span>
          </div>
          <p class="inbox2-section-value">${escapeHTML(l.name || "\u2014")}</p>
          ${l.email ? `<p class="inbox2-section-sub">${escapeHTML(l.email)}</p>` : ""}
        </div>

        <div class="inbox2-section">
          <div class="inbox2-section-label">
            <span class="inbox2-section-icon">&#x1F3E2;</span>
            <span class="inbox2-section-label-text">Company / Fund</span>
          </div>
          <p class="inbox2-section-value">${escapeHTML(l.firm || "\u2014")}</p>
        </div>

        <div class="inbox2-message">
          <div class="inbox2-section-label">
            <span class="inbox2-section-icon inbox2-message-icon">&#x1F4AC;</span>
            <span class="inbox2-section-label-text inbox2-message-label-text">Message</span>
          </div>
          <p class="inbox2-message-text">&ldquo;${escapeHTML(msgTruncated)}&rdquo;</p>
        </div>
      </div>

      <div class="inbox2-actions">
        <button class="inbox2-btn-open" data-action="open" data-id="${escapeHTML(l.anon_id)}">
          &#x1F441; Startup &ouml;ffnen
        </button>
        <button class="inbox2-btn-delete" data-action="delete" data-ts="${String(l.ts)}" title="Anfrage l&ouml;schen" aria-label="Anfrage l&ouml;schen">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h10M6 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M5 4l.5 9M11 4l-.5 9M8 4v9"/></svg>
        </button>
      </div>
    `;

    card.addEventListener("click", (e)=>{
      const btn = e.target.closest("button");
      if(!btn) return;
      const action = btn.dataset.action;
      if(action === "open"){
        openModalById(btn.dataset.id || "");
        return;
      }
      if(action === "delete"){
        const ts = Number(btn.dataset.ts);
        setLeads(getLeads().filter(x=>Number(x.ts)!==ts));
        toast("Gel\u00f6scht", "Anfrage entfernt");
        renderInbox();
      }
    });

    grid.appendChild(card);
  });

  viewInbox.appendChild(grid);
  bindInboxHeaderButtons();
  updateCounts();
}
