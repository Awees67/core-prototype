/* =========================
   ACTIVE FILTER CHIPS
========================= */
function renderActiveChips(){
  const box = document.getElementById("activeChips");
  box.innerHTML = "";

  const pushChip = (label, onClick)=>{
    const c = document.createElement("div");
    c.className = "achip";
    c.textContent = label + " ✕";
    c.title = "Klicken zum Entfernen";
    c.addEventListener("click", onClick);
    box.appendChild(c);
  };

  for(const v of filters.origin){
    pushChip(`HQ: ${v}`, ()=>{ filters.origin.delete(v); saveUIState(); renderCurrent(); });
  }
  for(const v of filters.market){
    const m = FILTER_OPTIONS.market.find(x=>x.key===v);
    pushChip(`Markt: ${m ? m.label : v}`, ()=>{ filters.market.delete(v); saveUIState(); renderCurrent(); });
  }
  for(const v of filters.stage){
    pushChip(`Stage: ${v}`, ()=>{ filters.stage.delete(v); saveUIState(); renderCurrent(); });
  }
  for(const v of filters.sector){
    pushChip(`Sektor: ${v}`, ()=>{
      filters.sector.delete(v);
      // Auto-cleanup: remove sub_sectors that no longer belong to any remaining sector
      if(filters.sub_sector.size > 0){
        const availableSubs = new Set();
        for(const sec of filters.sector){ for(const sub of (SECTOR_MAP[sec] || [])){ availableSubs.add(sub); } }
        for(const sub of [...filters.sub_sector]){ if(!availableSubs.has(sub)) filters.sub_sector.delete(sub); }
      }
      saveUIState(); renderCurrent();
    });
  }
  for(const v of filters.sub_sector){
    pushChip(`Sub: ${v}`, ()=>{ filters.sub_sector.delete(v); saveUIState(); renderCurrent(); });
  }

  if(filters.ue !== "All") pushChip(`UE: ${filters.ue}`, ()=>{ filters.ue="All"; saveUIState(); renderCurrent(); });
  if(filters.rq !== "All") pushChip(`RQ: ${filters.rq}`, ()=>{ filters.rq="All"; saveUIState(); renderCurrent(); });
  if(filters.ce !== "All") pushChip(`CE: ${filters.ce}`, ()=>{ filters.ce="All"; saveUIState(); renderCurrent(); });

  if(filters.advEnabled && filters.nrrMin !== null) pushChip(`NRR ≥ ${filters.nrrMin}`, ()=>{ filters.nrrMin=null; saveUIState(); renderCurrent(); });
  if(filters.advEnabled && filters.ltvCacMin !== null) pushChip(`LTV/CAC ≥ ${filters.ltvCacMin}`, ()=>{ filters.ltvCacMin=null; saveUIState(); renderCurrent(); });

  if(filters.mrrMin !== null) pushChip(`MRR ≥ ${filters.mrrMin}`, ()=>{ filters.mrrMin=null; saveUIState(); renderCurrent(); });
  if(filters.mrrMax !== null) pushChip(`MRR ≤ ${filters.mrrMax}`, ()=>{ filters.mrrMax=null; saveUIState(); renderCurrent(); });
  if(filters.growthMin !== null) pushChip(`Wachstum ≥ ${filters.growthMin}%`, ()=>{ filters.growthMin=null; saveUIState(); renderCurrent(); });
  if(filters.runwayMin !== null) pushChip(`Runway ≥ ${filters.runwayMin}`, ()=>{ filters.runwayMin=null; saveUIState(); renderCurrent(); });
  if(filters.burnMax !== null) pushChip(`Burn ≤ ${filters.burnMax}`, ()=>{ filters.burnMax=null; saveUIState(); renderCurrent(); });
  if(filters.ebitdaMin !== null) pushChip(`EBITDA ≥ ${filters.ebitdaMin}%`, ()=>{ filters.ebitdaMin=null; saveUIState(); renderCurrent(); });

  if(filters.ticketMin !== null) pushChip(`Ticket ≥ ${filters.ticketMin}`, ()=>{ filters.ticketMin=null; saveUIState(); renderCurrent(); });
  if(filters.ticketMax !== null) pushChip(`Ticket ≤ ${filters.ticketMax}`, ()=>{ filters.ticketMax=null; saveUIState(); renderCurrent(); });

  if(box.children.length === 0){
    const t = document.createElement("div");
    t.className = "hint";
    t.style.margin = "4px 0 8px";
    t.textContent = "Keine aktiven Filter.";
    box.appendChild(t);
  }
}

/* =========================
   CARDS (HOME) — TEASER ONLY
   ✅ Only: Context chips + UE/RQ/CE + 6 KPI tiles
========================= */
function showControls(){
  const ctrlBar = document.querySelector(".controls");
  const summaryBar = document.querySelector(".summarybar");
  const chipsBar = document.querySelector(".activechips");
  if(ctrlBar) ctrlBar.style.display = "";
  if(summaryBar) summaryBar.style.display = "";
  if(chipsBar) chipsBar.style.display = "";
}

function renderCards(){
  hideAllViews();
  showControls();
  const grid = document.getElementById("cardGrid");
  grid.style.display = "";

  const list = buildFilteredList();
  lastListContext = list;

  document.getElementById("resultCount").textContent = list.length + " Ergebnisse";
  document.getElementById("activeFilterCount").textContent = countActiveFilters() + " Filter aktiv";
  renderActiveChips();
  updateCounts();

  grid.innerHTML = "";
  if(list.length===0){
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.innerHTML = `Keine Treffer.<div class="hint">Filter anpassen oder Suche nutzen.</div>`;
    grid.appendChild(empty);
    return;
  }

  const saved = getSavedSet();
  const pipelineItems = getPipeline();
  const pipelineMap = new Map(pipelineItems.map(x=>[x.anon_id, x.status]));
  const allNotes = getNotes();
  const noteCountMap = {};
  allNotes.forEach(n => { noteCountMap[n.anon_id] = (noteCountMap[n.anon_id] || 0) + 1; });
  const frag = document.createDocumentFragment();

  // Load active ruleset name once before loop
  let activeRulesetName = "Score";
  try{
    const rules = getCustomRulesV6();
    activeRulesetName = rules.name || "Score";
  }catch(_){}

  list.forEach((s, idx)=>{
    const card = document.createElement("div");
    card.className = "startup-card";
    card.tabIndex = 0;

    const g = s.growth?.value_pct ?? null;
    const gCls = g>0 ? "trend-up" : (g<0 ? "trend-down" : "");
    const nc = noteCountMap[s.anon_id] || 0;

    const pipelineStatus = pipelineMap.get(s.anon_id) || null;
    const pipelineBtnText = pipelineStatus === "Synced" ? "✓ Synced" :
                             pipelineStatus ? "✓ In Pipeline" : "Add to Pipeline";
    const pipelineBtnDisabled = pipelineStatus ? "disabled" : "";

    const marketLabel = s.market_served.includes("DACH") ? "DACH (DE•AT•CH)" : (s.market_served[0] || "—");

    // Compute score for this card
    let scoreValue = "—";
    let scoreColorClass = "";
    try{
      const res = computeCustomIndexV6(s.anon_id);
      if(res && res.score !== null && res.score !== undefined){
        scoreValue = String(res.score);
        scoreColorClass = getScoreColorClass(res.score);
      }
    }catch(_){}

    card.innerHTML = `
      <div class="card-head">
        <div>
          <h3>${startupLabel(s)}</h3>

          <!-- Context only -->
          <div class="tagrow">
            <span class="tag" style="opacity:0.7;">ID: ${s.anon_id}</span>
            <span class="tag">HQ: ${s.origin_country}</span>
            <span class="tag">Markt: ${marketLabel}</span>
            <span class="tag">${s.stage}</span>
            <span class="tag">${s.sector}</span>
            ${s.sub_sector ? `<span class="tag">${s.sub_sector}</span>` : ""}
          </div>

          <!-- Score Badge -->
          <div class="score-row">
            <div class="score-badge ${scoreColorClass}">
              <span class="score-value">${escapeHTML(scoreValue)}</span>
              <span class="score-label">/ 100</span>
            </div>
            <button class="infoicon" data-action="scoreinfo" data-id="${escapeHTML(s.anon_id)}" type="button" aria-label="Score Breakdown">ⓘ</button>
            <span class="score-preset-name">${escapeHTML(activeRulesetName)}</span>
            ${nc > 0 ? `<span class="card-notes-indicator">📝 ${nc}</span>` : ""}
          </div>

          ${s.description ? `<p class="card-desc">${escapeHTML(s.description)}</p>` : ""}
        </div>
      </div>

      <!-- 6 KPI TEASERS (hook) -->
      <div class="metrics">
        <div class="metric">
          <strong class="mono">${fmtEUR(s.mrr_eur)}</strong>
          <small>MRR</small>
        </div>
        <div class="metric">
          <strong class="mono"><span class="${gCls}">${g===null ? "—" : fmtPct(g)}</span></strong>
          <small>Wachstum (${s.growth?.type || "—"})</small>
        </div>

        <div class="metric">
          <strong class="mono">${fmtEUR(s.burn_eur_per_month)}</strong>
          <small>Burn / Monat</small>
        </div>
        <div class="metric">
          <strong class="mono">${s.runway_months} Monate</strong>
          <small>Runway</small>
        </div>

        <div class="metric">
          <strong class="mono">${s.nrr_pct}%</strong>
          <small>NRR</small>
        </div>
        <div class="metric">
          <strong class="mono">${s.ltv_cac_ratio.toFixed(1)}</strong>
          <small>LTV/CAC</small>
        </div>
      </div>

      <div class="card-actions">
        <button class="btn" data-action="open" data-id="${s.anon_id}">Details öffnen</button>
        <button class="btn secondary" data-action="addpipeline" data-id="${s.anon_id}" ${pipelineBtnDisabled}>${pipelineBtnText}</button>
        <button class="btn secondary" data-action="compare" data-id="${s.anon_id}">Add to Compare</button>
      </div>
    `;

    const open = ()=> openModalByIndex(idx, list);

    card.addEventListener("click", (e)=>{
      const btn = e.target.closest("button");
      if(btn){
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if(action==="scoreinfo"){ openScoreBreakdown(id, btn); e.stopPropagation(); return; }
        if(action==="open") open();
        if(action==="compare") addToCompare(id);
        if(action==="addpipeline" && !btn.disabled) handleAddToPipeline(id);
        e.stopPropagation();
        return;
      }
      open();
    });
    card.addEventListener("keydown", (e)=>{
      if(e.key==="Enter") open();
      if(e.key===" "){ e.preventDefault(); open(); }
    });

    frag.appendChild(card);
  });

  grid.appendChild(frag);
}

/* =========================
   INBOX VIEW (Leads)
========================= */
function startupLabel(s){
  return s?.company_name || `Startup ${s?.anon_id || "—"}`;
}


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
    exportBtn.onclick = ()=>{
      const leads = getLeads().slice().sort((a,b)=>b.ts-a.ts);
      const payload = {
        exported_at: new Date().toISOString(),
        leads_count: leads.length,
        leads
      };
      const text = JSON.stringify(payload, null, 2);
      const downloaded = downloadTextFile("core_anfragen_export.json", text);
      if(!downloaded) copyText(text);
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

  const header = document.createElement("div");
  header.className = "empty";
  header.style.textAlign = "left";
  header.innerHTML = `
    <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; justify-content:space-between;">
      <div>
        <div style="font-weight:950; font-size:1.05rem;">Anfragen (lokal gespeichert)</div>
        <div class="hint">Offline Demo: Daten bleiben in deinem Browser.</div>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn secondary" id="exportJsonBtn">Export JSON</button>
        <button class="btn" id="clearLeadsBtn">Alle löschen</button>
      </div>
    </div>
  `;
  viewInbox.appendChild(header);

  if(leads.length === 0){
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.innerHTML = `Noch keine Anfragen.<div class="hint">In „Details“ eine Anfrage speichern.</div>`;
    viewInbox.appendChild(empty);
    bindInboxHeaderButtons();
    updateCounts();
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "card-grid";

  leads.forEach((l)=>{
    const card = document.createElement("div");
    card.className = "startup-card";

    const dt = new Date(l.ts);
    const dateStr = Number.isFinite(dt.getTime()) ? dt.toLocaleString("de-DE") : "—";

    card.innerHTML = `
      <div class="card-head">
        <div>
          <h3>Anfrage zu ${escapeHTML(l.display_label || startupLabel({ anon_id: l.anon_id }))}</h3>
          <div class="tagrow">
            <span class="tag">${escapeHTML(dateStr)}</span>
            <span class="tag">${escapeHTML((l.name || "—").slice(0,24))}</span>
          </div>
        </div>
        <div class="badge hot">Lead</div>
      </div>

      <div class="metrics">
        <div class="metric"><strong>${escapeHTML(l.name || "—")}</strong><small>Name</small></div>
        <div class="metric"><strong class="mono">${escapeHTML(l.email || "—")}</strong><small>E-Mail</small></div>
      </div>

      <div class="metric" style="margin-top:0;">
        <strong>${escapeHTML(l.firm || "—")}</strong>
        <small>Firma / Fonds</small>
      </div>

      <div class="metric" style="margin-top:0;">
        <strong style="font-size:1rem; color:inherit; font-weight:900;">${escapeHTML(((l.msg || "—").slice(0,220) + (((l.msg || "").length > 220) ? "…" : "")))}</strong>
        <small>Nachricht</small>
      </div>

      <div class="card-actions">
        <button class="btn secondary" data-action="open" data-id="${escapeHTML(l.anon_id)}">Startup öffnen</button>
        <button class="btn" data-action="delete" data-ts="${String(l.ts)}">Löschen</button>
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
        toast("Gelöscht", "Anfrage entfernt");
        renderInbox();
      }
    });

    wrap.appendChild(card);
  });

  viewInbox.appendChild(wrap);
  bindInboxHeaderButtons();
  updateCounts();
}

/* =========================
   NEW SUBMISSIONS TAB
========================= */
function renderSubmissions(){
  hideAllViews();
  const viewSub = document.getElementById("viewSubmissions");
  if(!viewSub) return;
  viewSub.style.display = "";

  const allSubs = getSubmissions().slice().sort((a,b)=>b.submitted_at-a.submitted_at);
  const statusFilter = renderSubmissions._filter || "Alle";
  const list = statusFilter === "Alle" ? allSubs : allSubs.filter(x=>x.plausibility_status===statusFilter);

  const resultCount = document.getElementById("resultCount");
  const activeFilterCount = document.getElementById("activeFilterCount");
  if(resultCount) resultCount.textContent = allSubs.length + " Bewerbungen";
  if(activeFilterCount) activeFilterCount.textContent = "0 Filter aktiv";

  const plausiBadge = (sub)=>{
    const status = sub.plausibility_status || "passed";
    const summary = sub.plausibility_summary || {};
    const map = {
      passed: { cls:"badge plaus-passed", icon:"✓", label:"Passed" },
      flagged: { cls:"badge plaus-flagged", icon:"⚠", label:"Flagged" },
      failed:  { cls:"badge plaus-failed",  icon:"✗", label:"Failed"  }
    };
    const m = map[status] || map.failed;
    const tot = summary.total || 0;
    const pas = summary.passed || 0;
    const fh  = summary.failed_hard || 0;
    const fs  = summary.failed_soft || 0;
    let summaryText = tot ? `${pas}/${tot} bestanden` : "";
    if(fh > 0) summaryText += ` · ${fh} kritisch`;
    if(fs > 0) summaryText += ` · ${fs} Hinweis${fs > 1 ? "e" : ""}`;
    const summaryHtml = summaryText
      ? `<div class="plaus-summary">${escapeHTML(summaryText)}</div>`
      : "";
    return `<span class="${m.cls}">${m.icon} ${m.label}</span> <button class="infoicon" data-plaus="${escapeHTML(sub.anon_id)}" type="button" aria-label="Plausibility Breakdown" title="Plausibility Breakdown">ⓘ</button>${summaryHtml}`;
  };

  viewSub.innerHTML = `
    <div class="panelhead">
      <h2>New Submissions</h2>
      <div class="note">Neue Bewerbungen via CoreLink. Plausibility Check + Score bereits berechnet.</div>
    </div>
    <div class="controls" style="margin-top:0;">
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <span class="pill">${allSubs.length} neue Bewerbungen</span>
        <select class="select" id="submissionsFilter">
          <option value="Alle" ${statusFilter==="Alle"?"selected":""}>Alle</option>
          <option value="passed" ${statusFilter==="passed"?"selected":""}>Passed</option>
          <option value="flagged" ${statusFilter==="flagged"?"selected":""}>Flagged</option>
          <option value="failed" ${statusFilter==="failed"?"selected":""}>Failed</option>
        </select>
      </div>
      <div class="cell-actions">
        <button class="btn secondary small" id="submissionsExportBtn">Export JSON</button>
        <button class="btn small" id="acceptAllBtn">Alle annehmen</button>
      </div>
    </div>
    <div id="submissionsMount"></div>
  `;

  document.getElementById("submissionsFilter").onchange = e=>{
    renderSubmissions._filter = e.target.value;
    renderSubmissions();
  };
  document.getElementById("submissionsExportBtn").onclick = ()=>{
    downloadJSON("core_submissions_export.json", getSubmissions());
  };
  document.getElementById("acceptAllBtn").onclick = ()=>{
    const all = getSubmissions();
    all.forEach(x=>acceptSubmission(x.anon_id));
    activityLogAppend("SUBMISSION_ACCEPTED", null, { count: all.length, bulk: true });
    toast("OK", all.length + " Bewerbungen angenommen");
    renderSubmissions();
    if(currentView==="home") renderCards();
  };

  const mount = document.getElementById("submissionsMount");
  if(list.length === 0){
    mount.innerHTML = `<div class="empty">Keine neuen Bewerbungen.<div class="hint">Wenn Startups sich über deinen CoreLink bewerben, erscheinen sie hier.</div></div>`;
    return;
  }

  mount.innerHTML = `
    <div class="compareTableWrap">
      <table class="compareTable">
        <thead>
          <tr>
            <th>Startup</th>
            <th>Sektor</th>
            <th>Stage</th>
            <th>Score</th>
            <th>Plausibility</th>
            <th>Eingereicht am</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(sub=>{
            const dt = sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString("de-DE") : "—";
            const sectorStr = sub.sector + (sub.sub_sector ? ` › ${sub.sub_sector}` : "");
            const ss = startups.find(x=>x.anon_id===sub.anon_id);
            return `<tr>
              <td><button class="btn secondary small" data-open="${escapeHTML(sub.anon_id)}">${escapeHTML(ss?.company_name || sub.anon_id)}</button><br><small style="opacity:0.6;">ID: ${escapeHTML(sub.anon_id)}</small></td>
              <td>${escapeHTML(sectorStr)}</td>
              <td>${escapeHTML(sub.stage||"—")}</td>
              <td class="mono" style="white-space:nowrap;">${Math.round(sub.signal_index||0)} <button class="infoicon" data-action="scoreinfo" data-id="${escapeHTML(sub.anon_id)}" type="button" aria-label="Score Breakdown">ⓘ</button></td>
              <td>${plausiBadge(sub)}</td>
              <td class="mono" style="font-size:0.88rem;">${dt}</td>
              <td style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
                <button class="btn small" data-accept="${escapeHTML(sub.anon_id)}">Annehmen</button>
                <button class="btn secondary small" data-decline="${escapeHTML(sub.anon_id)}">Ablehnen</button>
              </td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;

  mount.querySelectorAll("[data-open]").forEach(b=>{
    b.onclick = ()=>openModalByAnonId(b.getAttribute("data-open"), startups);
  });
  mount.querySelectorAll("[data-action='scoreinfo']").forEach(b=>{
    b.onclick = (e)=>{ openScoreBreakdown(b.getAttribute("data-id"), b); e.stopPropagation(); };
  });
  mount.querySelectorAll("[data-plaus]").forEach(b=>{
    b.onclick = (e)=>{ openPlausibilityBreakdown(b.getAttribute("data-plaus"), b); e.stopPropagation(); };
  });
  mount.querySelectorAll("[data-accept]").forEach(b=>{
    b.onclick = ()=>{
      const id = b.getAttribute("data-accept");
      acceptSubmission(id);
      activityLogAppend("SUBMISSION_ACCEPTED", id);
      toast("Angenommen", "Deal erscheint jetzt in der Übersicht");
      renderSubmissions();
    };
  });
  mount.querySelectorAll("[data-decline]").forEach(b=>{
    b.onclick = ()=>{
      const id = b.getAttribute("data-decline");
      declineSubmission(id);
      activityLogAppend("SUBMISSION_DECLINED", id);
      toast("Abgelehnt", "Bewerbung entfernt");
      renderSubmissions();
    };
  });
}

/* =========================
   PIPELINE TAB
========================= */
function stageBadgeClass(stage){
  const map = {
    "In Review": "stage-badge-review",
    "Hot Deal":  "stage-badge-hot",
    "Watching":  "stage-badge-watching",
    "Declined":  "stage-badge-declined",
    "Synced":    "stage-badge-synced"
  };
  return map[stage] || "";
}

function renderPipeline(){
  hideAllViews();
  const viewPipeline = document.getElementById("viewPipeline");
  if(!viewPipeline) return;
  viewPipeline.style.display = "";

  const pipeline = getPipeline();
  const stages = ["In Review","Hot Deal","Watching","Declined","Synced"];
  const stageCounts = {};
  stages.forEach(st=>{ stageCounts[st] = 0; });
  pipeline.forEach(x=>{ if(stageCounts[x.status]!==undefined) stageCounts[x.status]++; });

  const statusFilter = renderPipeline._statusFilter || "Alle";
  const searchFilter = (renderPipeline._search || "").toLowerCase().trim();

  let list = pipeline.slice();
  if(statusFilter !== "Alle") list = list.filter(x=>x.status===statusFilter);
  if(searchFilter) list = list.filter(x=>
    x.anon_id.toLowerCase().includes(searchFilter) ||
    (x.owner||"").toLowerCase().includes(searchFilter)
  );

  const resultCount = document.getElementById("resultCount");
  const activeFilterCount = document.getElementById("activeFilterCount");
  if(resultCount) resultCount.textContent = pipeline.length + " Deals";
  if(activeFilterCount) activeFilterCount.textContent = "0 Filter aktiv";

  viewPipeline.innerHTML = `
    <div class="panelhead">
      <h2>Pipeline</h2>
      <div class="note">Screening-Layer: Qualifiziere Deals bevor sie ins CRM gehen.</div>
    </div>

    <div class="stage-badges">
      ${stages.map(st=>{
        const count = stageCounts[st]||0;
        const cls = stageBadgeClass(st);
        return `<div class="stage-badge ${cls}${statusFilter===st?' active':''}" data-stage-filter="${escapeHTML(st)}">${escapeHTML(st)}: ${count}</div>`;
      }).join("")}
      ${statusFilter!=="Alle" ? `<div class="stage-badge" data-stage-filter="Alle" style="background:var(--soft2);border-color:var(--border);color:var(--muted);">Alle anzeigen</div>` : ""}
    </div>

    <div class="controls" style="margin-top:0;">
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <select class="select" id="pipelineStatusFilter">
          ${["Alle",...stages].map(st=>`<option value="${st}"${statusFilter===st?" selected":""}>${st}</option>`).join("")}
        </select>
        <input class="select" style="max-width:240px;" id="pipelineSearch" placeholder="Suche: ID, Owner" value="${escapeHTML(renderPipeline._search||"")}">
      </div>
      <div class="cell-actions">
        <button class="btn secondary small" id="pipelineExportBtn">Export JSON</button>
      </div>
    </div>

    <div id="pipelineTableMount"></div>
  `;

  viewPipeline.querySelectorAll("[data-stage-filter]").forEach(badge=>{
    badge.style.cursor="pointer";
    badge.onclick=()=>{ renderPipeline._statusFilter = badge.getAttribute("data-stage-filter"); renderPipeline(); };
  });
  document.getElementById("pipelineStatusFilter").onchange = e=>{
    renderPipeline._statusFilter = e.target.value; renderPipeline();
  };
  document.getElementById("pipelineSearch").oninput = e=>{
    renderPipeline._search = e.target.value; renderPipeline();
  };
  document.getElementById("pipelineExportBtn").onclick = ()=>{
    downloadJSON("core_pipeline_export.json", getPipeline());
  };

  const mount = document.getElementById("pipelineTableMount");
  if(list.length === 0){
    mount.innerHTML = `<div class="empty">Noch keine Deals in der Pipeline.<div class="hint">Füge Deals aus der Übersicht hinzu.</div></div>`;
    return;
  }

  const allNotes = getNotes();
  const noteCountMap = {};
  allNotes.forEach(n => { noteCountMap[n.anon_id] = (noteCountMap[n.anon_id] || 0) + 1; });

  mount.innerHTML = `
    <div class="compareTableWrap">
      <table class="compareTable">
        <thead>
          <tr>
            <th>Startup</th>
            <th>Status</th>
            <th>Score</th>
            <th>Owner</th>
            <th>Notes</th>
            <th>Last Updated</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(item=>{
            const dt = item.last_updated ? new Date(item.last_updated).toLocaleDateString("de-DE") : "—";
            const signal = Math.round(item.signal_index||0);
            const ps = startups.find(x=>x.anon_id===item.anon_id);
            const nc = noteCountMap[item.anon_id] || 0;

            const declineReasonLabel = item.status === "Declined" && item.decline_reason
              ? (DECLINE_REASONS.find(r => r.key === item.decline_reason)?.label || item.decline_reason)
              : null;

            const statusCell = item.status === "Synced"
              ? `<span class="synced-label">✓ Synced to CRM</span>`
              : `<select class="statusSel" data-status data-pipe-id="${escapeHTML(item.anon_id)}" style="min-width:130px;">
                   <option value="${escapeHTML(item.status)}" selected>${escapeHTML(item.status)}</option>
                   ${(PIPELINE_TRANSITIONS[item.status]||[]).map(t=>`<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`).join("")}
                 </select>
                 ${declineReasonLabel ? `<div class="decline-reason-text"${item.decline_note ? ` title="${escapeHTML(item.decline_note)}"` : ""}>${escapeHTML(declineReasonLabel)}</div>` : ""}`;

            const actionsCell = item.status === "Synced"
              ? `<button class="btn secondary small" disabled>✓ Im CRM</button>`
              : `<button class="btn crm-push-btn small" data-crm="${escapeHTML(item.anon_id)}">Push to CRM</button>
                 <button class="btn secondary small" data-pipe-remove="${escapeHTML(item.anon_id)}">Remove</button>`;

            const notesCell = nc > 0
              ? `<span class="notes-badge" data-notes-open="${escapeHTML(item.anon_id)}">${nc}</span>`
              : `<span class="notes-badge empty">—</span>`;

            return `<tr>
              <td><button class="btn secondary small" data-open="${escapeHTML(item.anon_id)}">${escapeHTML(ps?.company_name || item.anon_id)}</button><br><small style="opacity:0.6;">ID: ${escapeHTML(item.anon_id)}</small></td>
              <td>${statusCell}</td>
              <td class="mono">${signal}</td>
              <td><input class="owner-input" data-owner-id="${escapeHTML(item.anon_id)}" value="${escapeHTML(item.owner||"")}" placeholder="—" style="background:transparent;border:none;border-bottom:1px solid var(--border);color:inherit;font-weight:900;padding:2px 4px;width:100px;"></td>
              <td>${notesCell}</td>
              <td class="mono" style="font-size:0.88rem;">${dt}</td>
              <td style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">${actionsCell}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;

  mount.querySelectorAll("[data-open]").forEach(b=>{
    b.onclick=()=>openModalByAnonId(b.getAttribute("data-open"), startups);
  });
  mount.querySelectorAll("[data-pipe-id]").forEach(sel=>{
    sel.onchange=()=>{
      const id = sel.getAttribute("data-pipe-id");
      const newStatus = sel.value;
      if(newStatus === "Declined"){
        const prevStatus = getPipeline().find(x=>x.anon_id===id)?.status || "In Review";
        openDeclineDialog(id, prevStatus, sel);
        return;
      }
      const ok = pipelineSetStatus(id, newStatus);
      if(ok === false){ sel.value = getPipeline().find(x=>x.anon_id===id)?.status || sel.value; return; }
      renderPipeline();
    };
  });
  mount.querySelectorAll("[data-crm]").forEach(b=>{
    b.onclick=()=>{ pipelinePushToCRM(b.getAttribute("data-crm")); renderPipeline(); };
  });
  mount.querySelectorAll("[data-pipe-remove]").forEach(b=>{
    b.onclick=()=>{ pipelineRemove(b.getAttribute("data-pipe-remove")); renderPipeline(); };
  });
  mount.querySelectorAll("[data-owner-id]").forEach(inp=>{
    inp.onchange=()=>pipelineSetOwner(inp.getAttribute("data-owner-id"), inp.value);
  });
  mount.querySelectorAll("[data-notes-open]").forEach(b=>{
    b.onclick=()=>openModalByAnonId(b.getAttribute("data-notes-open"), startups);
  });
}

/* =========================
   DETAILS MODAL
========================= */
let _modalStartup = null;

function openModalByIndex(idx, list){
  if(!list || !list.length) return;
  modalIndex = Math.max(0, Math.min(idx, list.length-1));
  const s = list[modalIndex];
  openModalWithStartup(s, list);
}
function openModalById(id){
  const list = buildFilteredList();
  const idx = list.findIndex(x=>x.anon_id===id);
  if(idx>=0) openModalByIndex(idx, list);
  else{
    const s = startups.find(x=>x.anon_id===id);
    if(s) openModalWithStartup(s, [s]);
  }
}

function openModalWithStartup(s, list){
  _modalStartup = s;
  const backdrop = document.getElementById("modalBackdrop");
  backdrop.style.display = "flex";
  backdrop.setAttribute("aria-hidden", "false");

  document.getElementById("modalH2").textContent = startupLabel(s);

  const ue = classifyUE(s);
  const rq = classifyRQ(s);
  const ce = classifyCE(s);

  const kpis = [
    { label:"HQ", value: s.origin_country, sub:"Sitz / Herkunft" },
    { label:"Markt", value: (s.market_served || []).join(", ").replace("DACH","DACH (DE•AT•CH)"), sub:"Served markets" },
    { label:"Team", value: (s.team_size || "—") + " Mitarbeiter", sub:"Aktuelle Teamgröße" },

    { label:"MRR", value: fmtEUR(s.mrr_eur), sub:"aktueller Wert" },
    { label:`Wachstum ${s.growth?.type || ""}`.trim(), value: s.growth ? fmtPct(s.growth.value_pct) : "—", sub:"Veränderung" },
    { label:"Burn / Monat", value: fmtEUR(s.burn_eur_per_month), sub:"Cash-Abfluss" },
    { label:"Runway", value: s.runway_months + " Monate", sub:"bei aktuellem Burn" },

    { label:"NRR", value: s.nrr_pct + "%", sub:"Net Revenue Retention" },
    { label:"LTV/CAC", value: s.ltv_cac_ratio.toFixed(1), sub:"Unit Economics" },

    { label:"Ticket (Rundengröße)", value: fmtEUR(s.ticket_eur), sub:"Raise / Round size" },
    { label:"ARR", value: fmtEUR(s.arr_eur), sub:"MRR × 12" },
    { label:"Net New ARR", value: fmtEUR(s.net_new_arr_eur), sub:"(Demo)" },

    { label:"Gross Margin", value: s.gross_margin_pct + "%", sub:"Profitability signal" },
    { label:"Logo Churn", value: s.logo_churn_pct + "%", sub:"(Demo)" },
    { label:"Revenue Churn", value: s.revenue_churn_pct + "%", sub:"(Demo)" },

    { label:"CAC", value: fmtEUR(s.cac_eur), sub:"Customer Acquisition Cost" },
    { label:"LTV", value: fmtEUR(s.ltv_eur), sub:"Lifetime Value" },
    { label:"CAC Payback", value: s.cac_payback_months + " Monate", sub:"Payback" },

    { label:"Burn Multiple", value: String(s.burn_multiple), sub:"Capital efficiency" },
    { label:"Founder (selbst)", value: (s.founder_pct ?? 0).toFixed(1) + "%", sub:"Ownership" },
    { label:"ESOP (reserviert)", value: (s.esop_pct ?? 0).toFixed(1) + "%", sub:"Employee option pool" },
    { label:"Employees (halten)", value: (s.employees_pct ?? 0).toFixed(1) + "%", sub:"Employee ownership" },

    { label:"Quality", value: `UE ${ue} • RQ ${rq} • CE ${ce}`, sub:"Scores (Demo)" }
  ];

  const grid = document.getElementById("kpiGrid");
  grid.innerHTML = "";
  kpis.forEach(k=>{
    const div = document.createElement("div");
    div.className = "kpi";
    div.innerHTML = `
      <div class="label">${k.label}</div>
      <div class="value mono">${k.value}</div>
      <div class="sub">${k.sub}</div>
    `;
    grid.appendChild(div);
  });

  document.getElementById("kpiHint").textContent = s.notes || "—";
  document.getElementById("modalSub").textContent = `${s.anon_id} • ${s.sector}${s.sub_sector ? " › " + s.sub_sector : ""} • ${s.stage}`;

  // Plausibility badge in modal (always show – lets analyst see why a deal passed/failed)
  const existingPlausBadge = document.getElementById("modalPlausibilityBadge");
  if(existingPlausBadge) existingPlausBadge.remove();
  const subs = getSubmissions();
  const subEntry = subs.find(x => x.anon_id === s.anon_id);
  if(subEntry || (typeof computePlausibility === "function")){
    let plausStatus, plausSummary;
    if(subEntry && subEntry.plausibility_checks && subEntry.plausibility_checks.length > 0){
      plausStatus = subEntry.plausibility_status;
      plausSummary = subEntry.plausibility_summary;
    } else {
      const plaus = computePlausibility(s);
      plausStatus = plaus.status;
      plausSummary = plaus.summary;
    }
    const statusMap = {
      passed: { cls: "badge plaus-passed", icon: "✓", label: "Passed" },
      flagged: { cls: "badge plaus-flagged", icon: "⚠", label: "Flagged" },
      failed:  { cls: "badge plaus-failed",  icon: "✗", label: "Failed" }
    };
    const sm = statusMap[plausStatus] || statusMap.passed;
    const badgeWrap = document.createElement("div");
    badgeWrap.id = "modalPlausibilityBadge";
    badgeWrap.style.cssText = "display:flex; align-items:center; gap:8px; margin-top:6px;";
    badgeWrap.innerHTML = `<span class="${sm.cls}" style="font-size:0.75rem;">${sm.icon} Plausibility: ${sm.label}</span>` +
      `<button class="infoicon" id="modalPlausInfo" type="button" title="Plausibility Breakdown">ⓘ</button>`;
    const tot = plausSummary?.total || 0;
    const pas = plausSummary?.passed || 0;
    if(tot > 0){
      const txt = document.createElement("span");
      txt.className = "plaus-summary";
      txt.textContent = `${pas}/${tot} Checks`;
      badgeWrap.appendChild(txt);
    }
    document.getElementById("modalSub").insertAdjacentElement("afterend", badgeWrap);
    document.getElementById("modalPlausInfo").onclick = (e) => {
      openPlausibilityBreakdown(s.anon_id, e.currentTarget);
      e.stopPropagation();
    };
  }
  bindLeadFormForStartup(s);
  syncModalPipelineButtons(s);
  renderModalNotes(s.anon_id);

  document.getElementById("nextBtn").onclick = ()=>{
    const arr = (list && list.length) ? list : [s];
    const current = arr.findIndex(z=>z.anon_id===s.anon_id);
    const next = (current + 1) % arr.length;
    openModalByIndex(next, arr);
  };
  document.getElementById("prevBtn").onclick = ()=>{
    const arr = (list && list.length) ? list : [s];
    const current = arr.findIndex(z=>z.anon_id===s.anon_id);
    const prev = (current - 1 + arr.length) % arr.length;
    openModalByIndex(prev, arr);
  };
}

function renderModalNotes(anon_id){
  const notesList = document.getElementById("notesList");
  const notesCount = document.getElementById("notesCount");
  const noteInput = document.getElementById("noteInput");
  const addNoteBtn = document.getElementById("addNoteBtn");
  if(!notesList || !notesCount || !noteInput || !addNoteBtn) return;

  const notes = getNotesForDeal(anon_id);

  notesCount.textContent = notes.length ? `(${notes.length})` : "";

  if(notes.length === 0){
    notesList.innerHTML = `<div class="hint" style="margin-bottom:8px;">Keine Notizen – Fang an zu schreiben.</div>`;
  } else {
    notesList.innerHTML = notes.map(note => `
      <div class="note-item">
        <div class="note-header">
          <span class="note-author">${escapeHTML(note.author)}</span>
          <span class="note-time">${timeAgo(note.created_at)}</span>
          <button class="note-delete" data-note-id="${escapeHTML(note.id)}" title="Löschen">✕</button>
        </div>
        <div class="note-text">${escapeHTML(note.text)}</div>
      </div>
    `).join("");

    notesList.querySelectorAll(".note-delete").forEach(btn => {
      btn.onclick = () => {
        deleteNote(btn.getAttribute("data-note-id"));
        renderModalNotes(anon_id);
        toast("Gelöscht", "Notiz gelöscht");
      };
    });
  }

  // Rebind add handler (clone to remove old listeners)
  const newBtn = addNoteBtn.cloneNode(true);
  addNoteBtn.parentNode.replaceChild(newBtn, addNoteBtn);

  const doSave = () => {
    const text = document.getElementById("noteInput").value.trim();
    if(!text) return;
    const pipeline = getPipeline();
    const pipeItem = pipeline.find(x => x.anon_id === anon_id);
    const author = (pipeItem && pipeItem.owner) ? pipeItem.owner : "Analyst";
    addNote(anon_id, text, author);
    document.getElementById("noteInput").value = "";
    renderModalNotes(anon_id);
    toast("Gespeichert", "Notiz gespeichert");
  };

  newBtn.onclick = doSave;

  // Rebind textarea keyboard shortcut (clone to remove old listeners)
  const oldInput = document.getElementById("noteInput");
  const newInput = oldInput.cloneNode(true);
  oldInput.parentNode.replaceChild(newInput, oldInput);
  newInput.addEventListener("keydown", (e) => {
    if((e.ctrlKey || e.metaKey) && e.key === "Enter"){
      e.preventDefault();
      doSave();
    }
  });
}

function closeModal(){
  const backdrop = document.getElementById("modalBackdrop");
  backdrop.style.display = "none";
  backdrop.setAttribute("aria-hidden", "true");
}

/* =========================
   DECLINE DIALOG
========================= */
let _declineAnonId = null;
let _declinePrevStatus = null;
let _declineSelectEl = null;

function openDeclineDialog(anon_id, prevStatus, selectEl){
  _declineAnonId = anon_id;
  _declinePrevStatus = prevStatus;
  _declineSelectEl = selectEl;

  const dlg = document.getElementById("declineDialog");
  const dealNameEl = document.getElementById("declineDealName");
  const reasonSel = document.getElementById("declineReasonSelect");
  const noteInput = document.getElementById("declineNoteInput");
  if(!dlg || !dealNameEl || !reasonSel || !noteInput) return;

  // Set deal name
  const startup = startups.find(x => x.anon_id === anon_id);
  dealNameEl.textContent = startup ? startupLabel(startup) : anon_id;

  // Fill reason dropdown
  reasonSel.innerHTML = `<option value="">— Bitte auswählen —</option>` +
    DECLINE_REASONS.map(r => `<option value="${escapeHTML(r.key)}">${escapeHTML(r.label)}</option>`).join("");
  reasonSel.classList.remove("shake");

  // Clear note
  noteInput.value = "";

  dlg.style.display = "flex";

  const confirmBtn = document.getElementById("declineConfirmBtn");
  const cancelBtn  = document.getElementById("declineCancelBtn");

  // Clone buttons to remove old listeners
  const newConfirm = confirmBtn.cloneNode(true);
  const newCancel  = cancelBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
  cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

  newConfirm.addEventListener("click", ()=>{
    const reason = document.getElementById("declineReasonSelect").value;
    if(!reason){
      const sel = document.getElementById("declineReasonSelect");
      sel.classList.remove("shake");
      void sel.offsetWidth; // reflow to restart animation
      sel.classList.add("shake");
      toast("Pflichtfeld", "Bitte einen Grund auswählen");
      return;
    }
    const note = document.getElementById("declineNoteInput").value.trim();
    const ok = pipelineSetStatus(_declineAnonId, "Declined", reason, note);
    closeDeclineDialog();
    if(ok){ renderPipeline(); }
  });

  newCancel.addEventListener("click", ()=>{
    // Revert dropdown to previous status
    if(_declineSelectEl){
      _declineSelectEl.value = _declinePrevStatus || "";
    }
    closeDeclineDialog();
  });
}

function closeDeclineDialog(){
  const dlg = document.getElementById("declineDialog");
  if(dlg) dlg.style.display = "none";
  _declineAnonId = null;
  _declinePrevStatus = null;
  _declineSelectEl = null;
}

function copyText(text){
  if(!text) return;
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try{ document.execCommand("copy"); }catch(e){}
  document.body.removeChild(ta);
}

/* =========================
   DASHBOARD
========================= */
function renderDashboard(){
  hideAllViews();
  const view = document.getElementById("viewDashboard");
  if(!view) return;
  view.style.display = "";

  // Hide search/sort/chips — dashboard has its own KPIs
  const ctrlBar = document.querySelector(".controls");
  const summaryBar = document.querySelector(".summarybar");
  const chipsBar = document.querySelector(".activechips");
  if(ctrlBar) ctrlBar.style.display = "none";
  if(summaryBar) summaryBar.style.display = "none";
  if(chipsBar) chipsBar.style.display = "none";

  // --- Collect data ---
  const subs = getSubmissions();
  const pipeline = getPipeline();
  const activity = getActivity();

  // Compute scores for all startups
  const scores = startups.map(s=>{
    try{
      const res = computeCustomIndexV6(s.anon_id);
      return (res && res.score !== null && res.score !== undefined) ? Number(res.score) : null;
    }catch(_){ return null; }
  }).filter(n => n !== null && Number.isFinite(n));

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a,b)=>a+b,0) / scores.length)
    : 0;

  // Active ruleset name
  let rulesetName = "Standard Screening";
  try{
    const rules = getCustomRulesV6();
    rulesetName = rules.name || "Standard Screening";
  }catch(_){}

  const syncedCount = pipeline.filter(x=>x.status==="Synced").length;

  // Pipeline stage counts
  const STAGES = ["In Review","Hot Deal","Watching","Declined","Synced"];
  const STAGE_COLORS = {
    "In Review": "var(--brand2)",
    "Hot Deal": "var(--dangerText)",
    "Watching": "var(--warnText)",
    "Declined": "var(--muted)",
    "Synced": "var(--goodText)"
  };
  const STAGE_BG = {
    "In Review": "var(--chip)",
    "Hot Deal": "var(--dangerBg)",
    "Watching": "var(--warnBg)",
    "Declined": "var(--soft2)",
    "Synced": "var(--goodBg)"
  };
  const stageCounts = {};
  STAGES.forEach(st=>{ stageCounts[st] = 0; });
  pipeline.forEach(x=>{ if(stageCounts[x.status]!==undefined) stageCounts[x.status]++; });

  // Score histogram buckets
  const BUCKETS = [
    { range:"0–20",  label:"Sehr schwach", color:"#c62828" },
    { range:"21–40", label:"Schwach",       color:"#e65100" },
    { range:"41–60", label:"Mittel",        color:"#f9a825" },
    { range:"61–80", label:"Stark",         color:"#558b2f" },
    { range:"81–100",label:"Top",           color:"#1b5e20" }
  ];
  const bucketCounts = [0,0,0,0,0];
  scores.forEach(sc=>{
    if(sc <= 20) bucketCounts[0]++;
    else if(sc <= 40) bucketCounts[1]++;
    else if(sc <= 60) bucketCounts[2]++;
    else if(sc <= 80) bucketCounts[3]++;
    else bucketCounts[4]++;
  });
  const maxBucket = Math.max(1, ...bucketCounts);

  // Sector + Stage distributions
  const sectorDist = groupBy(startups, s=>s.sector);
  const stageDist = groupBy(startups, s=>s.stage);
  const maxSector = sectorDist.length > 0 ? sectorDist[0][1] : 1;
  const maxStage = stageDist.length > 0 ? stageDist[0][1] : 1;

  // Funnel numbers
  const funnelTotal = startups.length;
  const funnelAccepted = funnelTotal; // all in dataset are accepted
  const funnelPipeline = pipeline.length;
  const funnelSynced = syncedCount;

  // --- Build HTML ---

  // KPI Header
  const subsPulse = subs.length > 0 ? ' dash-pulse' : '';
  const kpiHtml = `
    <div class="dash-grid dash-grid-4">
      <div class="dash-kpi">
        <div class="dash-kpi-value">${funnelTotal}</div>
        <div class="dash-kpi-label">📊 Gesamt Deals</div>
        <div class="dash-kpi-sub">Im aktuellen Dataset</div>
      </div>
      <div class="dash-kpi${subsPulse}">
        <div class="dash-kpi-value">${subs.length}</div>
        <div class="dash-kpi-label">📥 Neue Submissions</div>
        <div class="dash-kpi-sub">Warten auf Review</div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi-value">${pipeline.length}</div>
        <div class="dash-kpi-label">📋 In Pipeline</div>
        <div class="dash-kpi-sub">Aktive Deals im Screening</div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi-value">${syncedCount}</div>
        <div class="dash-kpi-label">✓ Synced to CRM</div>
        <div class="dash-kpi-sub">Erfolgreich übergeben</div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi-value">${avgScore}</div>
        <div class="dash-kpi-label">⚡ Ø Score</div>
        <div class="dash-kpi-sub">Aktives Ruleset: ${escapeHTML(rulesetName)}</div>
      </div>
    </div>
  `;

  // Funnel bars
  const funnelSteps = [
    { label:"Eingereicht", val:funnelTotal, color:"var(--chip)", border:"var(--chipBorder)" },
    { label:"Angenommen", val:funnelAccepted, color:"var(--brand2)", border:"var(--brand2)" },
    { label:"In Pipeline", val:funnelPipeline, color:"var(--warnBg)", border:"var(--warnBorder)" },
    { label:"An CRM übergeben", val:funnelSynced, color:"var(--goodBg)", border:"var(--goodBorder)" }
  ];
  const funnelHtml = funnelSteps.map(step=>{
    const w = pctOf(step.val, funnelTotal);
    return `
      <div class="funnel-row">
        <div class="funnel-label">${escapeHTML(step.label)}</div>
        <div class="funnel-bar-wrap">
          <div class="funnel-bar" style="width:${w}%; background:${step.color}; border:1px solid ${step.border};"></div>
        </div>
        <div class="funnel-value">${step.val}</div>
      </div>
    `;
  }).join("");

  // Pipeline segment bar
  const pipeTotal = Math.max(1, pipeline.length);
  const pipeSegHtml = pipeline.length === 0
    ? `<div class="dash-panel-sub">Noch keine Deals in der Pipeline.</div>`
    : `
      <div class="pipe-seg-bar">
        ${STAGES.map(st=>{
          const pct = pctOf(stageCounts[st], pipeTotal);
          if(pct === 0) return "";
          return `<div class="pipe-seg" style="width:${pct}%; background:${STAGE_BG[st]};" title="${escapeHTML(st)}: ${stageCounts[st]}"></div>`;
        }).join("")}
      </div>
      <div class="pipe-legend">
        ${STAGES.map(st=>`
          <div class="pipe-legend-item">
            <div class="pipe-legend-dot" style="background:${STAGE_COLORS[st]};"></div>
            <span>${escapeHTML(st)}: ${stageCounts[st]}</span>
          </div>
        `).join("")}
      </div>
    `;

  // Score histogram
  const histoHtml = `
    <div class="histogram">
      ${BUCKETS.map((b,i)=>{
        const cnt = bucketCounts[i];
        const pct = Math.round((cnt/maxBucket)*100);
        return `
          <div class="histo-col">
            <div class="histo-count">${cnt}</div>
            <div class="histo-bar" style="height:${pct}%; background:${b.color};"></div>
            <div class="histo-label">${escapeHTML(b.range)}<br>${escapeHTML(b.label)}</div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  // Sector distribution
  const sectorHtml = sectorDist.slice(0,10).map(([name,cnt])=>{
    const w = pctOf(cnt, maxSector);
    return `
      <div class="hbar-row">
        <div class="hbar-label" title="${escapeHTML(name)}">${escapeHTML(name)}</div>
        <div class="hbar-track"><div class="hbar-fill" style="width:${w}%;"></div></div>
        <div class="hbar-value">${cnt}</div>
      </div>
    `;
  }).join("");

  // Stage distribution
  const stageHtml = stageDist.map(([name,cnt])=>{
    const w = pctOf(cnt, maxStage);
    return `
      <div class="hbar-row">
        <div class="hbar-label" title="${escapeHTML(name)}">${escapeHTML(name)}</div>
        <div class="hbar-track"><div class="hbar-fill" style="width:${w}%;"></div></div>
        <div class="hbar-value">${cnt}</div>
      </div>
    `;
  }).join("");

  // Decline reasons distribution
  const declinedWithReason = pipeline.filter(x => x.status === "Declined" && x.decline_reason);
  const declineReasonDist = groupBy(declinedWithReason, x => x.decline_reason);
  const maxDeclineCount = declineReasonDist.length > 0 ? declineReasonDist[0][1] : 1;
  const declineHtml = declineReasonDist.length === 0
    ? `<div class="hint">Noch keine Deals abgelehnt.</div>`
    : declineReasonDist.map(([key, cnt]) => {
        const label = DECLINE_REASONS.find(r => r.key === key)?.label || key;
        const w = pctOf(cnt, maxDeclineCount);
        return `
          <div class="hbar-row">
            <div class="hbar-label" title="${escapeHTML(label)}">${escapeHTML(label)}</div>
            <div class="hbar-track"><div class="hbar-fill" style="width:${w}%;"></div></div>
            <div class="hbar-value">${cnt}</div>
          </div>
        `;
      }).join("");

  // Recent activity
  const recentEvents = activity.slice(0,10);
  const activityHtml = recentEvents.length === 0
    ? `<div class="hint">Noch keine Aktivitäten.</div>`
    : `
      <ul class="activity-mini">
        ${recentEvents.map(ev=>{
          const label = DASHBOARD_EVENT_LABELS[ev.event] || escapeHTML(ev.event || "Event");
          const ts = ev.ts ? timeAgo(ev.ts) : "—";
          const id = ev.anon_id ? escapeHTML(ev.anon_id) : "";
          return `
            <li>
              <span class="activity-mini-time">${escapeHTML(ts)}</span>
              <span class="activity-mini-event">${label}</span>
              ${id ? `<span class="activity-mini-label">${id}</span>` : ""}
            </li>
          `;
        }).join("")}
      </ul>
    `;

  view.innerHTML = `
    <div style="padding:4px 0 8px;">
      <h2 style="margin:0 0 4px; font-size:1.4rem; font-weight:950;">Dashboard</h2>
      <div class="hint">Gesamtüberblick – live berechnet aus allen Datenquellen.</div>
    </div>

    ${kpiHtml}

    <div class="dash-grid dash-grid-2" style="margin-top:16px;">
      <div class="dash-panel">
        <div class="dash-panel-title">Dealflow Funnel</div>
        ${funnelHtml}
      </div>
      <div class="dash-panel">
        <div class="dash-panel-title">Pipeline Status</div>
        ${pipeSegHtml}
      </div>
    </div>

    <div class="dash-grid dash-grid-2" style="margin-top:16px;">
      <div class="dash-panel">
        <div class="dash-panel-title">Score Verteilung</div>
        ${histoHtml}
      </div>
      <div class="dash-panel">
        <div class="dash-panel-title">Sektor Verteilung</div>
        ${sectorHtml || '<div class="hint">Keine Daten.</div>'}
      </div>
    </div>

    <div class="dash-grid dash-grid-2" style="margin-top:16px;">
      <div class="dash-panel">
        <div class="dash-panel-title">Stage Verteilung</div>
        ${stageHtml || '<div class="hint">Keine Daten.</div>'}
      </div>
      <div class="dash-panel">
        <div class="dash-panel-title">Häufigste Absage-Gründe</div>
        ${declineHtml}
      </div>
    </div>

    <div class="dash-grid dash-grid-2" style="margin-top:16px;">
      <div class="dash-panel">
        <div class="dash-panel-title">Letzte Aktivitäten</div>
        ${activityHtml}
      </div>
    </div>
  `;
}

/* =========================
   ROUTING
========================= */
function setActiveNav(){
  const ids = [
    "navDashboard","navHome","navSubmissions","navPipeline","navCompare","navActivity","navInbox"
  ];
  const btns = ids.map(id=>document.getElementById(id)).filter(Boolean);
  btns.forEach(b=>b.classList.remove("primary"));

  const map = {
    dashboard:"navDashboard",
    home:"navHome",
    submissions:"navSubmissions",
    pipeline:"navPipeline",
    compare:"navCompare",
    activity:"navActivity",
    inbox:"navInbox"
  };
  const activeId = map[currentView] || "navDashboard";
  const b = document.getElementById(activeId);
  if(b) b.classList.add("primary");
}

function renderCurrent(){
  setActiveNav();

  if(currentView==="dashboard") renderDashboard();
  if(currentView==="home") renderCards();
  if(currentView==="submissions") renderSubmissions();
  if(currentView==="pipeline") renderPipeline();
  if(currentView==="compare") renderCompare();
  if(currentView==="activity") renderActivity();
  if(currentView==="inbox") renderInbox();

  saveUIState();
}

function updateCounts(){
  const resultCount = document.getElementById("resultCount");
  const activeFilterCount = document.getElementById("activeFilterCount");
  const savedCount = document.getElementById("savedCount");
  const saved = getSavedSet();

  if(savedCount) savedCount.textContent = saved.size + " gemerkt";

  if(currentView === "inbox"){
    const leads = getLeads();
    if(resultCount) resultCount.textContent = leads.length + " Anfragen";
    if(activeFilterCount) activeFilterCount.textContent = "0 Filter aktiv";
  }
}

/* =========================
   UI STATE SAVE/LOAD
========================= */
function saveUIState(){
  const state = {
    view: currentView,
    search: document.getElementById("searchInput").value,
    sort: document.getElementById("sortSelect").value,
    filters: serializeFilters()
  };
  safeSetJSON(LS_KEYS.ui, state);
}

function loadUIState(){
  const state = safeGetJSON(LS_KEYS.ui, null);
  if(!state) return;

  if(state.view) currentView = (["dashboard","home","submissions","pipeline","compare","activity","inbox"].includes(state.view) ? state.view : "dashboard");
  if(typeof state.search==="string") document.getElementById("searchInput").value = state.search;
  if(typeof state.sort==="string") document.getElementById("sortSelect").value = state.sort;

  applyFilterObject(state.filters || {});
}

/* =========================
   RESET + RANDOMIZE
========================= */

function ensurePipelineIdsExist(){
  // If Pipeline contains anon_ids that are not in the current dataset (e.g. after Dataset neu mischen),
  // replace them with existing ids so Custom/Signal calculations work and Preview can show them.
  try{
    const p = (typeof getPipeline === "function") ? getPipeline() : [];
    if(!Array.isArray(p) || !p.length) return;
    if(!Array.isArray(startups) || !startups.length) return;

    const existing = new Set(startups.map(s=>String(s.anon_id)));
    const used = new Set();
    const available = startups.map(s=>String(s.anon_id));

    let changed = false;
    const next = p.map(item=>{
      const cur = String(item.anon_id||"");
      if(existing.has(cur)){
        used.add(cur);
        return item;
      }
      // pick first not used, else first available
      const repl = available.find(id=>!used.has(id)) || available[0];
      if(repl){
        changed = true;
        used.add(repl);
        return { ...item, anon_id: repl, last_updated: Date.now() };
      }
      return item;
    });

    if(changed && typeof setPipeline === "function") setPipeline(next);
  }catch(_){}
}

function resetDemo(){
  try{
    localStorage.removeItem(LS_KEYS.saved);
    localStorage.removeItem(LS_KEYS.ui);
    localStorage.removeItem(LS_KEYS.pipeline);
    localStorage.removeItem(LS_KEYS.compare);
    localStorage.removeItem(LS_KEYS.leads);
    localStorage.removeItem(LS_KEYS.savedFilters);
    localStorage.removeItem(LS_KEYS.activity);
    localStorage.removeItem(LS_KEYS.submissions);
    localStorage.removeItem(LS_KEYS.notes);
  }catch(e){}
  resetFiltersAll();
  document.getElementById("searchInput").value = "";
  document.getElementById("sortSelect").value = "mrr_desc";
  currentView = "dashboard";
  // Re-seed submissions
  const seed = safeGetJSON(LS_KEYS.seed, 1337);
  const rng = mulberry32(seed + 42);
  const rawSubs = generateSubmissionsFromStartups(startups, rng);
  const seededSubs = rawSubs.map(x=>({ ...x, signal_index: computeSignalIndex(x.anon_id) }));
  setSubmissions(seededSubs);
  renderCurrent();
  toast("Reset", "Demo-Daten wurden zurückgesetzt");
}

function randomizeDataset(){
  const newSeed = Math.floor(Date.now() % 2147483647);
  safeSetJSON(LS_KEYS.seed, newSeed);
  startups = generateDataset(newSeed);
  window.startups = startups;
  try{ _cache = {}; }catch(_){}
  ensurePipelineIdsExist();
  // Re-seed submissions
  localStorage.removeItem(LS_KEYS.submissions);
  const rng = mulberry32(newSeed + 42);
  const rawSubs = generateSubmissionsFromStartups(startups, rng);
  const seededSubs = rawSubs.map(x=>({ ...x, signal_index: computeSignalIndex(x.anon_id) }));
  setSubmissions(seededSubs);
  toast("Gemischt", "30 Startups neu generiert");
  renderCurrent();
  updateCompareTray();
}

/* =========================
   VC WORKSPACE VIEWS
========================= */
function hideAllViews(){
  const grid = document.getElementById("cardGrid");
  const ids = ["viewDashboard","viewSubmissions","viewPipeline","viewCompare","viewActivity","viewInbox"];
  grid.style.display = "none";
  ids.forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.style.display = "none";
  });
}

function renderCompare(){
  hideAllViews();
  const v = document.getElementById("viewCompare");
  v.style.display = "";

  const ids = getCompare().slice(0, 10);
  const deals = ids.map(id => DATA.find(s => s.id === id)).filter(Boolean);

  v.innerHTML = `
    <div class="panelhead">
      <h2>Compare</h2>
    </div>
        <div class="compareTableWrap">
      <table class="compareTable" aria-label="Compare KPI Matrix">
        <thead>
          <tr>
            <th style="min-width:180px;"></th>
            <th>MRR</th>
            <th>Growth</th>
            <th>Runway</th>
            <th>LTV/CAC</th>
          </tr>
        </thead>
        <tbody id="compareBody"></tbody>
      </table>
    </div>
  `;

  const body = document.getElementById("compareBody");

  if(!deals.length){
    body.innerHTML = `<tr><td colspan="5" style="padding:14px 12px; color:var(--muted); font-weight:900;">
      Keine Deals im Compare. Füge Deals über „Add to Compare“ hinzu.
    </td></tr>`;
    return;
  }

  const getMRR = (s)=> Number(s?.mrr_eur || 0);
  const getGrowth = (s)=> Number(s?.growth?.value_pct ?? 0);
  const getRunway = (s)=> Number(s?.runway_months || 0);
  const getLTV = (s)=> {
  let v = (s?.ltv_cac_ratio ?? s?.ltv_cac ?? s?.ltvCac ?? s?.unit?.ltv_cac_ratio ?? s?.unit?.ltv_cac);
  if(typeof v === "string") v = v.replace(",", ".");
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

  const maxMRR = Math.max(1, ...deals.map(getMRR));
  const maxGrowth = Math.max(1, ...deals.map(getGrowth));
  const maxRunway = Math.max(1, ...deals.map(getRunway));
  const maxLTV = Math.max(1, ...deals.map(getLTV));

  const topMRR = deals.reduce((a,b)=> getMRR(b)>getMRR(a)?b:a, deals[0]);
  const topGrowth = deals.reduce((a,b)=> getGrowth(b)>getGrowth(a)?b:a, deals[0]);
  const topRunway = deals.reduce((a,b)=> getRunway(b)>getRunway(a)?b:a, deals[0]);
  const topLTV = deals.reduce((a,b)=> getLTV(b)>getLTV(a)?b:a, deals[0]);

  const cell = (value, max, isTop, fmt)=>{
    const pct = Math.max(0, Math.min(100, Math.round((value/max)*100)));
    return `
      <div class="cmpCell ${isTop?'top':''}">
        <div class="cmpBar"><div class="cmpFill" style="width:${pct}%;"></div></div>
        <div class="cmpVal mono">${fmt(value)}${isTop?'<span class="compareTop">Top</span>':''}</div>
      </div>
    `;
  };

  const fmtEUR = (n)=> "€" + Math.round(n).toLocaleString("de-AT");
  const fmtPct = (n)=> (Math.round(n*10)/10).toLocaleString("de-AT") + "%";
  const fmtM = (n)=> Math.round(n).toLocaleString("de-AT") + "m";
  const fmtRatio = (n)=> (Math.round(n*10)/10).toLocaleString("de-AT");

  body.innerHTML = deals.map(s=>{
    const mrr = getMRR(s), gr = getGrowth(s), rw = getRunway(s), lv = getLTV(s);
    return `
      <tr>
        <td style="font-weight:950;">
          ${escapeHTML(s.id)}
          <div class="tiny" style="margin:4px 0 0 0;">${escapeHTML(s.hq||"")} • ${escapeHTML(s.stage||"")}</div>
        </td>
        <td>${cell(mrr, maxMRR, s.id===topMRR.id, fmtEUR)}</td>
        <td>${cell(gr, maxGrowth, s.id===topGrowth.id, fmtPct)}</td>
        <td>${cell(rw, maxRunway, s.id===topRunway.id, fmtM)}</td>
        <td>${cell(lv, maxLTV, s.id===topLTV.id, fmtRatio)}</td>
      </tr>
    `;
  }).join("");
}

const ACTIVITY_TYPES = [
  "Alle",
  "SAVED","UNSAVED",
  "COMPARE_ADDED","COMPARE_REMOVED","COMPARE_CLEARED","COMPARE_OPENED",
  "SUBMISSION_ACCEPTED","SUBMISSION_DECLINED",
  "PIPELINE_ADDED","CRM_PUSHED",
  "STATUS_CHANGED","OWNER_SET","PIPELINE_REMOVED",
  "FILTER_SAVED","FILTER_APPLIED","FILTER_DELETED","LEAD_SAVED",
  "NOTE_ADDED","NOTE_DELETED"
];

const ACTIVITY_LABELS = {
  "SAVED": "Gemerkt",
  "UNSAVED": "Entgemerkt",
  "COMPARE_ADDED": "Compare hinzugefügt",
  "COMPARE_REMOVED": "Compare entfernt",
  "COMPARE_CLEARED": "Compare geleert",
  "COMPARE_OPENED": "Compare geöffnet",
  "SUBMISSION_ACCEPTED": "📥 Submission angenommen",
  "SUBMISSION_DECLINED": "📥 Submission abgelehnt",
  "PIPELINE_ADDED": "📋 Zur Pipeline hinzugefügt",
  "CRM_PUSHED": "🔗 An CRM übergeben",
  "STATUS_CHANGED": "Status geändert",
  "OWNER_SET": "Owner gesetzt",
  "PIPELINE_REMOVED": "Aus Pipeline entfernt",
  "FILTER_SAVED": "Filter gespeichert",
  "FILTER_APPLIED": "Filter angewendet",
  "FILTER_DELETED": "Filter gelöscht",
  "LEAD_SAVED": "Lead gespeichert",
  "NOTE_ADDED": "📝 Notiz",
  "NOTE_DELETED": "📝 Notiz gelöscht"
};

function renderActivity(){
  hideAllViews();
  const v = document.getElementById("viewActivity");
  if(!v) return;
  v.style.display = "";

  const a = getActivity();
  const type = (renderActivity._type || "Alle");
  const search = (renderActivity._search || "").trim().toLowerCase();

  let list = a.slice();
  if(type !== "Alle") list = list.filter(x=>x.event===type);
  if(search){
    list = list.filter(x=>{
      const id = String(x?.anon_id || "").toLowerCase();
      const evt = String(x?.event || "").toLowerCase();
      const meta = (()=>{ try{ return JSON.stringify(x?.meta || {}).toLowerCase(); }catch(_){ return ""; }})();
      return id.includes(search) || evt.includes(search) || meta.includes(search);
    });
  }

  v.innerHTML = `
    <div class="panelhead">
      <h2>Verlauf</h2>
      <div class="note">Meta + Audit Trail (lokal). Export optional als JSON.</div>
    </div>
    <div class="panel" style="background:linear-gradient(180deg, var(--soft2), var(--card)); margin-bottom:12px;">
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <div class="pill" id="actMetaTotal">0 Events</div>
        <div class="pill" id="actMetaDeals">0 Deals</div>
        <div class="pill" id="actMetaLast">Letztes Event: —</div>
      </div>
      <div class="hint">Verlauf dient als nachvollziehbare Historie (Status, Owner, Merkliste, Compare, Filter, Leads). Lokal gespeichert.</div>
    </div>

    <div class="controls" style="margin-top:0;">
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <select class="select" id="actType">
          ${ACTIVITY_TYPES.map(o=>`<option value="${o}">${o}</option>`).join("")}
        </select>
        <input class="select" style="max-width:280px;" id="actSearch" placeholder="Suche: Startup ID / Event" value="${escapeHTML(renderActivity._search||"")}">
      </div>
      <div class="cell-actions">
        <button class="btn secondary small" id="actExportBtn">Export JSON</button>
        <button class="btn secondary small" id="actClearBtn">Clear</button>
      </div>
    </div>

    <div id="actList"></div>
  `;

  const sel = document.getElementById("actType");
  if(sel){
    sel.value = ACTIVITY_TYPES.includes(type) ? type : "Alle";
    sel.onchange = (e)=>{ renderActivity._type = e.target.value; renderActivity(); };
  }

  const si = document.getElementById("actSearch");
  if(si){
    si.oninput = (e)=>{ renderActivity._search = e.target.value; renderActivity(); };
  }

  const exportBtn = document.getElementById("actExportBtn");
  if(exportBtn) exportBtn.onclick = ()=>downloadJSON("core_activity_export.json", getActivity());
  const clearBtn = document.getElementById("actClearBtn");
  if(clearBtn) clearBtn.onclick = ()=>{ setActivity([]); renderActivity(); };

  try{
    const total = list.length;
    const deals = new Set(list.map(x=>x.anon_id).filter(Boolean)).size;
    const last = list[0]?.ts ? new Date(list[0].ts).toLocaleString("de-AT") : "—";
    const elTotal = document.getElementById("actMetaTotal");
    const elDeals = document.getElementById("actMetaDeals");
    const elLast = document.getElementById("actMetaLast");
    if(elTotal) elTotal.textContent = total + " Events";
    if(elDeals) elDeals.textContent = deals + " Deals";
    if(elLast) elLast.textContent = "Letztes Event: " + last;
  }catch(_){}

  const box = document.getElementById("actList");
  if(!box) return;
  if(list.length===0){
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.innerHTML = `Noch keine Activity.<div class="hint">Nutze Merkliste, Compare, Interested, Status-Wechsel oder Filter speichern.</div>`;
    box.appendChild(empty);
    return;
  }

  list.slice(0,200).forEach(ev=>{
    const card = document.createElement("div");
    card.className = "startup-card";
    card.style.marginBottom = "10px";
    const evLabel = ACTIVITY_LABELS[ev.event] || escapeHTML(ev.event || "EVENT");
    card.innerHTML = `
      <div class="card-head">
        <div>
          <h3>${evLabel}</h3>
          <div class="tagrow">
            <span class="tag">${new Date(ev.ts||Date.now()).toLocaleString("de-DE")}</span>
            <span class="tag">${ev.anon_id ? escapeHTML(ev.anon_id) : "—"}</span>
          </div>
        </div>
        <div class="card-actions">
          ${ev.anon_id ? `<button class="btn secondary small" data-open="${ev.anon_id}">Details</button>` : ``}
          ${ev.meta ? `<button class="btn secondary small" data-meta="${ev.id || ev.ts}">Meta</button>` : ``}
        </div>
      </div>
      <div class="helper">${ev.meta ? `Meta verfügbar.` : ""}</div>
      ${ev.meta ? `<pre class="helper" style="display:none; margin-top:8px;" data-metabox="${ev.id || ev.ts}">${escapeHTML(JSON.stringify(ev.meta, null, 2))}</pre>` : ``}
    `;
    box.appendChild(card);
    if(ev.anon_id){
      const b = card.querySelector(`[data-open="${CSS.escape(ev.anon_id)}"]`);
      if(b) b.onclick = ()=> openModalByAnonId(ev.anon_id, (lastListContext && lastListContext.length) ? lastListContext : startups);
    }
    const mb = card.querySelector(`[data-meta="${ev.id || ev.ts}"]`);
    if(mb){
      mb.onclick = ()=>{
        const metaBox = card.querySelector(`[data-metabox="${ev.id || ev.ts}"]`);
        if(!metaBox) return;
        const isOpen = metaBox.style.display !== "none";
        metaBox.style.display = isOpen ? "none" : "block";
      };
    }
  });
}

/* =========================
   VC WORKSPACE ACTIONS
========================= */
function renderMiniKPI(label, value){
  return `
    <div class="metric-tile">
      <div class="k">${escapeHTML(label)}</div>
      <div class="v">${escapeHTML(String(value))}</div>
      <div class="s">—</div>
    </div>`;
}

function escapeHTML(str){
  return String(str||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

function downloadJSON(filename, data){
  try{
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }catch(e){}
}

function addToCompare(anon_id){
  const ids = getCompare();
  if(ids.includes(anon_id)){
    toast("Compare", "Bereits ausgewählt");
    return;
  }
  if(ids.length >= 10){
    toast("Compare", "Max. 10 Deals");
    return;
  }
  ids.push(anon_id);
  setCompare(ids);
  updateCompareTray();
  toast("Compare", "Hinzugefügt");
}

function removeFromCompare(anon_id){
  const ids = getCompare().filter(x=>x!==anon_id);
  setCompare(ids);
  updateCompareTray();
}

function clearCompare(){
  setCompare([]);
  updateCompareTray();
}

function updateCompareTray(){
  const tray = document.getElementById("compareTray");
  const box = document.getElementById("compareIds");
  const ids = getCompare();

  box.innerHTML = "";
  if(ids.length===0){
    tray.style.display = "none";
    return;
  }
  tray.style.display = "";

  ids.forEach(id=>{
    const t = document.createElement("span");
    t.className = "mini-tag";
    t.innerHTML = `${escapeHTML(id)} <span class="mini-x" data-x="${id}">×</span>`;
    box.appendChild(t);
  });

  box.querySelectorAll("[data-x]").forEach(x=>{
    x.onclick = ()=>{ removeFromCompare(x.getAttribute("data-x")); };
  });
}

function captureCurrentFilterState(){ return serializeFilters(); }

function saveCurrentFilters(){
  const name = (prompt("Name für Filterset:") || "").trim();
  if(!name){
    toast("Saved Filters","Abgebrochen");
    return;
  }
  const list = getSavedFilters();
  const entry = { id: uid(), name, filters: captureCurrentFilterState(), created_at: Date.now(), last_used_at: null };
  list.unshift(entry);
  setSavedFilters(list);
  activityLogAppend("FILTER_SAVED", null, { name });
  toast("Saved Filters","Gespeichert");
}

function applySavedFilter(id){
  const list = getSavedFilters();
  const item = list.find(x=>x.id===id);
  if(!item) return;

  applyFilterObject(item.filters || {});

  syncFilterModalFromState();
  item.last_used_at = Date.now();
  setSavedFilters(list);

  activityLogAppend("FILTER_APPLIED", null, { id, name: item.name });
  toast("Saved Filters","Angewendet");
  currentView = "home";
  renderCurrent();
}

function deleteSavedFilter(id){
  const list = getSavedFilters();
  const item = list.find(x=>x.id===id);
  setSavedFilters(list.filter(x=>x.id!==id));
  activityLogAppend("FILTER_DELETED", null, { id, name: item?item.name:null });
  toast("Saved Filters","Gelöscht");
}

function openModalByAnonId(anon_id, list){
  const arr = (list && list.length) ? list : startups;
  const idx = arr.findIndex(x=>x.anon_id===anon_id);
  if(idx>=0) openModalByIndex(idx, arr);
}

/* Pipeline + CRM actions */
function handleAddToPipeline(anon_id){
  const p = getPipeline();
  const existing = p.find(x=>x.anon_id===anon_id);
  if(existing){
    toast("Pipeline", "Deal ist bereits in der Pipeline");
    return;
  }
  pipelineAdd(anon_id, "In Review");
  toast("Pipeline", "Deal zur Pipeline hinzugefügt");
  if(currentView === "home") renderCards();
  if(currentView === "pipeline") renderPipeline();
}

function syncModalPipelineButtons(s){
  if(!s) return;
  const p = getPipeline();
  const item = p.find(x=>x.anon_id===s.anon_id);

  const addBtn = document.getElementById("addToPipelineBtn");
  const crmBtn = document.getElementById("pushToCrmBtn");
  if(!addBtn || !crmBtn) return;

  if(!item){
    addBtn.textContent = "Add to Pipeline";
    addBtn.disabled = false;
    addBtn.title = "";
    crmBtn.textContent = "Push to CRM";
    crmBtn.disabled = false;
    crmBtn.style.opacity = "";
  } else if(item.status === "Synced"){
    addBtn.textContent = "In Pipeline ✓";
    addBtn.disabled = true;
    addBtn.title = "Status: Synced";
    crmBtn.textContent = "✓ Synced to CRM";
    crmBtn.disabled = true;
    crmBtn.style.opacity = "0.5";
  } else {
    addBtn.textContent = "In Pipeline ✓";
    addBtn.disabled = true;
    addBtn.title = `Status: ${item.status}`;
    crmBtn.textContent = "Push to CRM";
    crmBtn.disabled = false;
    crmBtn.style.opacity = "";
  }
}

function attachWorkspaceHandlers(){
  // card buttons (delegation)
  document.addEventListener("click", (e)=>{
    const t = e.target;
    if(!(t instanceof HTMLElement)) return;

    const cid = t.getAttribute("data-compare");
    if(cid){
      addToCompare(cid);
      return;
    }
  });

  // modal buttons
  const addCompareBtn = document.getElementById("addCompareBtn");
  if(addCompareBtn){
    addCompareBtn.addEventListener("click", ()=>{
      const s = _modalStartup || startups[modalIndex];
      if(!s) return;
      addToCompare(s.anon_id);
    });
  }

  const addToPipelineBtn = document.getElementById("addToPipelineBtn");
  if(addToPipelineBtn){
    addToPipelineBtn.addEventListener("click", ()=>{
      if(!_modalStartup) return;
      const anon_id = _modalStartup.anon_id;
      const existing = getPipeline().find(x=>x.anon_id===anon_id);
      if(existing) return;
      pipelineAdd(anon_id, "In Review");
      toast("Pipeline", "Deal zur Pipeline hinzugefügt");
      syncModalPipelineButtons(_modalStartup);
      if(currentView === "pipeline") renderPipeline();
    });
  }

  const pushToCrmBtn = document.getElementById("pushToCrmBtn");
  if(pushToCrmBtn){
    pushToCrmBtn.addEventListener("click", ()=>{
      if(!_modalStartup) return;
      const anon_id = _modalStartup.anon_id;
      const item = getPipeline().find(x=>x.anon_id===anon_id);
      if(item && item.status === "Declined"){
        if(!confirm("Dieser Deal wurde declined. Trotzdem ins CRM pushen?")) return;
      }
      pipelinePushToCRM(anon_id);
      syncModalPipelineButtons(_modalStartup);
      if(currentView === "pipeline") renderPipeline();
    });
  }

  // tray buttons
  on("compareClearBtn","click", clearCompare);
  on("compareOpenBtn","click", ()=>{
    currentView = "compare";
    renderCurrent();
  });
}