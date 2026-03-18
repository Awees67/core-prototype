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
    pushChip(`Sektor: ${v}`, ()=>{ filters.sector.delete(v); saveUIState(); renderCurrent(); });
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
function renderCards(){
  hideAllViews();
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
  const frag = document.createDocumentFragment();

  list.forEach((s, idx)=>{
    const card = document.createElement("div");
    card.className = "startup-card";
    card.tabIndex = 0;

    const g = s.growth?.value_pct ?? null;
    const gCls = g>0 ? "trend-up" : (g<0 ? "trend-down" : "");

    const ue = classifyUE(s);
    const rq = classifyRQ(s);
    const ce = classifyCE(s);

    const marketLabel = s.market_served.includes("DACH") ? "DACH (DE•AT•CH)" : (s.market_served[0] || "—");

    card.innerHTML = `
      <div class="card-head">
        <div>
          <h3>${startupLabel(s)}</h3>

          <!-- Context only -->
          <div class="tagrow">
            <span class="tag">HQ: ${s.origin_country}</span>
            <span class="tag">Markt: ${marketLabel}</span>
            <span class="tag">${s.stage}</span>
            <span class="tag">${s.sector}</span>
          </div>

          <!-- Signals only -->
          <div class="tagrow" style="margin-top:8px;">
            <span class="tag ${kpiChipClass("UE", ue)}">UE: ${ue}</span>
            <span class="tag ${kpiChipClass("RQ", rq)}">RQ: ${rq}</span>
            <span class="tag ${kpiChipClass("CE", ce)}">CE: ${ce}</span>
          </div>
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
        <button class="btn secondary" data-action="save" data-id="${s.anon_id}">${saved.has(s.anon_id) ? "Aus Merkliste" : "Merken"}</button>
        <button class="btn secondary" data-action="interested" data-id="${s.anon_id}">Interested</button>
        <button class="btn secondary" data-action="compare" data-id="${s.anon_id}">Add to Compare</button>
      </div>
    `;

    const open = ()=> openModalByIndex(idx, list);

    card.addEventListener("click", (e)=>{
      const btn = e.target.closest("button");
      if(btn){
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if(action==="open") open();
        if(action==="save") toggleSaved(id, btn);
        if(action==="interested") handleInterested(id);
        if(action==="compare") addToCompare(id);
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
  return `Startup ${s?.anon_id || "—"}`;
}

function bindSaveButtonForStartup(s){
  const saveBtn = document.getElementById("saveToggleBtn");
  if(!saveBtn || !s) return;

  const sync = ()=>{
    const isSaved = getSavedSet().has(s.anon_id);
    saveBtn.dataset.anonId = String(s.anon_id || "");
    saveBtn.textContent = isSaved ? "Aus Merkliste" : "Zur Merkliste";
  };

  sync();
  saveBtn.onclick = ()=>{
    toggleSaved(s.anon_id);
    sync();
  };
}

function renderSaved(){
  hideAllViews();
  const viewSaved = document.getElementById("viewSaved");
  if(!viewSaved) return;
  viewSaved.style.display = "";

  const saved = getSavedSet();
  const savedList = startups.filter(s => saved.has(s.anon_id));

  viewSaved.innerHTML = "";
  document.getElementById("resultCount").textContent = savedList.length + " gemerkt";
  document.getElementById("activeFilterCount").textContent = countActiveFilters() + " Filter aktiv";
  renderActiveChips();
  updateCounts();

  if(savedList.length === 0){
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.innerHTML = `Merkliste ist leer.<div class="hint">In der Übersicht auf „Merken“ klicken.</div>`;
    viewSaved.appendChild(empty);
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "card-grid";

  savedList
    .slice()
    .sort((a,b)=> (b.mrr_eur || 0) - (a.mrr_eur || 0))
    .forEach((s)=>{
      const ue = classifyUE(s), rq = classifyRQ(s), ce = classifyCE(s);
      const card = document.createElement("div");
      card.className = "startup-card";
      const marketLabel = s.market_served.includes("DACH")
        ? "DACH (DE•AT•CH)"
        : (s.market_served[0] || "—");

      card.innerHTML = `
        <div class="card-head">
          <div>
            <h3>${startupLabel(s)}</h3>
            <div class="tagrow">
              <span class="tag">HQ: ${s.origin_country}</span>
              <span class="tag">Markt: ${marketLabel}</span>
              <span class="tag">${s.stage}</span>
              <span class="tag">${s.sector}</span>
            </div>
            <div class="tagrow" style="margin-top:8px;">
              <span class="tag ${kpiChipClass("UE", ue)}">UE: ${ue}</span>
              <span class="tag ${kpiChipClass("RQ", rq)}">RQ: ${rq}</span>
              <span class="tag ${kpiChipClass("CE", ce)}">CE: ${ce}</span>
            </div>
          </div>
          <div class="badge good">Gemerkt</div>
        </div>

        <div class="metrics">
          <div class="metric"><strong class="mono">${fmtEUR(s.mrr_eur)}</strong><small>MRR</small></div>
          <div class="metric"><strong class="mono">${s.runway_months} Monate</strong><small>Runway</small></div>
        </div>

        <div class="card-actions">
          <button class="btn" data-action="open" data-id="${s.anon_id}">Details öffnen</button>
          <button class="btn secondary" data-action="remove" data-id="${s.anon_id}">Entfernen</button>
        </div>
      `;

      card.addEventListener("click",(e)=>{
        const b = e.target.closest("button");
        if(!b) return;

        const action = b.dataset.action;
        const id = b.dataset.id;

        if(action === "remove"){
          toggleSaved(id);
          return;
        }

        if(action === "open"){
          openModalById(id);
        }
      });

      wrap.appendChild(card);
    });

  viewSaved.appendChild(wrap);
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
   DETAILS MODAL
========================= */
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
  document.getElementById("modalSub").textContent = `${s.sector} • ${s.stage}`;
  bindSaveButtonForStartup(s);
  bindLeadFormForStartup(s);

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

function closeModal(){
  const backdrop = document.getElementById("modalBackdrop");
  backdrop.style.display = "none";
  backdrop.setAttribute("aria-hidden", "true");
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
   ROUTING
========================= */
function setActiveNav(){
  const ids = [
    "navHome","navSaved",
    "navPipeline","navCompare","navPortfolio","navSavedFilters","navActivity","navInbox"
  ];
  const btns = ids.map(id=>document.getElementById(id)).filter(Boolean);
  btns.forEach(b=>b.classList.remove("primary"));

  const map = {
    home:"navHome",
    saved:"navSaved",
    pipeline:"navPipeline",
    compare:"navCompare",
    portfolio:"navPortfolio",
    savedFilters:"navSavedFilters",
    activity:"navActivity",
    inbox:"navInbox"
  };
  const activeId = map[currentView] || "navHome";
  const b = document.getElementById(activeId);
  if(b) b.classList.add("primary");
}

function renderCurrent(){
  setActiveNav();

  if(currentView==="home") renderCards();
  if(currentView==="saved") renderSaved();
  if(currentView==="pipeline") renderPipeline();
  if(currentView==="compare") renderCompare();
  if(currentView==="portfolio") renderPortfolio();
  if(currentView==="savedFilters") renderSavedFilters();
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

  if(currentView === "saved"){
    if(resultCount) resultCount.textContent = saved.size + " gemerkt";
    if(activeFilterCount) activeFilterCount.textContent = countActiveFilters() + " Filter aktiv";
    return;
  }

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

  if(state.view) currentView = (["home","saved","pipeline","compare","portfolio","savedFilters","activity","inbox"].includes(state.view) ? state.view : "home");
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
  }catch(e){}
  resetFiltersAll();
  document.getElementById("searchInput").value = "";
  document.getElementById("sortSelect").value = "mrr_desc";
  currentView = "home";
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
  toast("Gemischt", "30 Startups neu generiert");
  renderCurrent();
  updateCompareTray();
}

/* =========================
   VC WORKSPACE VIEWS
========================= */
function hideAllViews(){
  const grid = document.getElementById("cardGrid");
  const ids = ["viewSaved","viewPipeline","viewCompare","viewPortfolio","viewSavedFilters","viewActivity","viewInbox"];
  grid.style.display = "none";
  ids.forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.style.display = "none";
  });
}

function renderPipeline(){
  hideAllViews();
  const v = document.getElementById("viewPipeline");
  v.style.display = "";

  const p = getPipeline();

  const statusFilter = (renderPipeline._statusFilter || "Alle");
  const search = (renderPipeline._search || "").trim().toLowerCase();

  let list = p.slice();
  if(statusFilter !== "Alle"){
    list = list.filter(x=>(x.status||"Screening")===statusFilter);
  }
  if(search){
    list = list.filter(x=>(x.anon_id||"").toLowerCase().includes(search) || (x.owner||"").toLowerCase().includes(search));
  }

  v.innerHTML = `
    <div class="panelhead">
      <h2>My Pipeline</h2>
    </div>

    <div class="controls" style="margin-top:0;">
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <select class="select" id="pipeStatusFilter" aria-label="Status Filter">
          ${["Alle","Screening","Contacted","Diligence","IC","Term Sheet","Invested","Passed"].map(o=>`<option value="${o}">${o}</option>`).join("")}
        </select>
        <input class="select" style="max-width:280px;" id="pipeSearch" placeholder="Suche: Startup ID oder Owner" value="${escapeHTML(renderPipeline._search || "")}">
      </div>
      <div class="pipeTopRight">
        <div class="pipeTopRow1">
                    <button class="btn secondary small" id="pipeExportBtn">Export JSON</button>
        </div>
              </div>
    </div>

    <div class="tablewrap">
      <table>
        <thead>
          <tr>
            <th>Startup ID</th>
            <th>Status</th>
            <th>Owner</th>
            <th>Signal Index <button class="infoicon" id="siLegendBtn" type="button" aria-label="Signal Index Erklärung">ⓘ</button></th>
            <th>Last Updated</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody id="pipeBody"></tbody>
      </table>
    </div>
    <div class="helper" style="margin-top:10px;">Signal Index ist ein Demo-Score zur Orientierung und ersetzt keine Due Diligence.</div>
    <div class="note" style="margin-top:10px;">Hinweis: Anonymisierte Demo. KPI/Signale sind indikativ und können unvollständig/ungeprüft sein.</div>
  `;

  const sf = document.getElementById("pipeStatusFilter");
  sf.value = statusFilter;
  sf.onchange = (e)=>{ renderPipeline._statusFilter = e.target.value; renderPipeline(); };

  const si = document.getElementById("pipeSearch");
  si.oninput = (e)=>{ renderPipeline._search = e.target.value; renderPipeline(); };

  document.getElementById("pipeExportBtn").onclick = ()=>downloadJSON("core_pipeline_export.json", getPipeline());

  const leg = document.getElementById("siLegendBtn");
  if(leg) leg.onclick = (e)=>{ e.stopPropagation(); openSignalPopover(leg, buildSignalLegendHTML(), null); };

  const body = document.getElementById("pipeBody");
  if(list.length===0){
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.innerHTML = `<div class="empty">Noch keine Deals in My Pipeline.<div class="hint">Nutze Interested in Explore.</div></div>`;
    tr.appendChild(td);
    body.appendChild(tr);
    return;
  }

  list.forEach(item=>{
    const tr = document.createElement("tr");

    const s = startups.find(x=>x.anon_id===item.anon_id);

    const tdId = document.createElement("td");
    tdId.innerHTML = `<button class="btn secondary small" data-open="${item.anon_id}">${item.anon_id}</button>`;
    tr.appendChild(tdId);

    const tdStatus = document.createElement("td");
    tdStatus.innerHTML = `
      <select class="select" data-status="${item.anon_id}">
        ${["Screening","Contacted","Diligence","IC","Term Sheet","Invested","Passed"].map(o=>`<option value="${o}">${o}</option>`).join("")}
      </select>`;
    tr.appendChild(tdStatus);

    const tdOwner = document.createElement("td");
    tdOwner.innerHTML = `<input class="select" data-owner="${item.anon_id}" placeholder="(optional)" value="${escapeHTML(item.owner||"")}" />`;
    tr.appendChild(tdOwner);

    const tdSignal = document.createElement("td");
    const siVal = String(item.signal_index ?? computeSignalIndex(item.anon_id));
    tdSignal.innerHTML = `${escapeHTML(siVal)} <button class="infoicon" type="button" data-si="${item.anon_id}" aria-label="Signal Index Breakdown">ⓘ</button>`;
    tr.appendChild(tdSignal);

    const tdLU = document.createElement("td");
    tdLU.textContent = new Date(item.last_updated||Date.now()).toLocaleString("de-DE");
    tr.appendChild(tdLU);

    const tdAct = document.createElement("td");
    tdAct.innerHTML = `
      <div class="cell-actions">
        <button class="btn secondary small" data-pass="${item.anon_id}">Passed</button>
        <button class="btn secondary small" data-remove="${item.anon_id}">Remove</button>
      </div>`;
    tr.appendChild(tdAct);

    body.appendChild(tr);

    // set current values
    const sel = tr.querySelector(`[data-status="${CSS.escape(item.anon_id)}"]`);
    sel.value = item.status || "Screening";
    sel.onchange = (e)=> pipelineSetStatus(item.anon_id, e.target.value);

    const own = tr.querySelector(`[data-owner="${CSS.escape(item.anon_id)}"]`);
    own.onchange = (e)=> pipelineSetOwner(item.anon_id, e.target.value);
    own.onblur = (e)=> pipelineSetOwner(item.anon_id, e.target.value);

    const sib = tr.querySelector(`[data-si="${CSS.escape(item.anon_id)}"]`);
    if(sib) sib.onclick = (e)=>{ e.stopPropagation(); openSignalPopover(sib, buildSignalBreakdownHTML(item.anon_id), item.anon_id); };

    tr.querySelector(`[data-open="${CSS.escape(item.anon_id)}"]`).onclick = ()=> openModalByAnonId(item.anon_id, lastListContext && lastListContext.length ? lastListContext : startups);
    tr.querySelector(`[data-remove="${CSS.escape(item.anon_id)}"]`).onclick = ()=>{ pipelineRemove(item.anon_id); toast("Pipeline","Deal entfernt"); renderPipeline(); };
    tr.querySelector(`[data-pass="${CSS.escape(item.anon_id)}"]`).onclick = ()=>{ pipelineMarkPassed(item.anon_id); toast("Pipeline","Status: Passed"); renderPipeline(); };
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

function renderPortfolio(){
  hideAllViews();
  const v = document.getElementById("viewPortfolio");
  v.style.display = "";

  const invested = getPipeline().filter(x=>(x.status||"") === "Invested");

  v.innerHTML = `
    <div class="panelhead">
      <h2>Portfolio (light)</h2>
      <div class="note">Hinweis: Anonymisierte Demo. KPI/Signale sind indikativ und können unvollständig/ungeprüft sein.</div>
    </div>
    <div class="helper" style="margin-bottom:10px;">Quelle: Pipeline Deals mit Status „Invested“. (Kein Fund-Accounting, keine Performance-Claims.)</div>
    <div class="tablewrap">
      <table>
        <thead>
          <tr>
            <th>Startup ID</th>
            <th>Owner</th>
            <th>Signal Index <button class="infoicon" id="siLegendBtnPort" type="button" aria-label="Signal Index Erklärung">ⓘ</button></th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody id="portBody"></tbody>
      </table>
    </div>
  `;

  const legp = document.getElementById("siLegendBtnPort");
  if(legp) legp.onclick = (e)=>{ e.stopPropagation(); openSignalPopover(legp, buildSignalLegendHTML(), null); };

  const body = document.getElementById("portBody");
  if(invested.length===0){
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.innerHTML = `<div class="empty">Noch kein Deal mit Status „Invested“.<div class="hint">Ändere Status in My Pipeline.</div></div>`;
    tr.appendChild(td);
    body.appendChild(tr);
    return;
  }

  invested.forEach(item=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><button class="btn secondary small" data-open="${item.anon_id}">${item.anon_id}</button></td>
      <td>${escapeHTML(item.owner||"") || "—"}</td>
      <td>${escapeHTML(String(item.signal_index ?? computeSignalIndex(item.anon_id)))} <button class="infoicon" type="button" data-siport="${item.anon_id}" aria-label="Signal Index Breakdown">ⓘ</button></td>
      <td>${new Date(item.last_updated||Date.now()).toLocaleString("de-DE")}</td>
    `;
    body.appendChild(tr);
    tr.querySelector(`[data-open="${CSS.escape(item.anon_id)}"]`).onclick = ()=> openModalByAnonId(item.anon_id, lastListContext && lastListContext.length ? lastListContext : startups);
    const sibp = tr.querySelector(`[data-siport="${CSS.escape(item.anon_id)}"]`);
    if(sibp) sibp.onclick = (e)=>{ e.stopPropagation(); openSignalPopover(sibp, buildSignalBreakdownHTML(item.anon_id), item.anon_id); };
  });
}

function renderSavedFilters(){
  hideAllViews();
  const v = document.getElementById("viewSavedFilters");
  v.style.display = "";

  const list = getSavedFilters();

  v.innerHTML = `
    <div class="panelhead">
      <h2>Saved Filters</h2>
      <div class="note">Hinweis: Anonymisierte Demo. KPI/Signale sind indikativ und können unvollständig/ungeprüft sein.</div>
    </div>
    <div class="helper" style="margin-bottom:10px;">Speichere Filtersets aus dem Filter-Modal (Button „Filter speichern“).</div>

    <div class="tablewrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Erstellt</th>
            <th>Zuletzt genutzt</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody id="sfBody"></tbody>
      </table>
    </div>
  `;

  const body = document.getElementById("sfBody");
  if(list.length===0){
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.innerHTML = `<div class="empty">Noch keine gespeicherten Filter.<div class="hint">Öffne „Filter“ und klicke „Filter speichern“.</div></div>`;
    tr.appendChild(td);
    body.appendChild(tr);
    return;
  }

  list.forEach(item=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight:900;">${escapeHTML(item.name||"(ohne Name)")}</td>
      <td>${new Date(item.created_at||Date.now()).toLocaleString("de-DE")}</td>
      <td>${item.last_used_at ? new Date(item.last_used_at).toLocaleString("de-DE") : "—"}</td>
      <td>
        <div class="cell-actions">
          <button class="btn secondary small" data-apply="${item.id}">Apply</button>
          <button class="btn secondary small" data-del="${item.id}">Delete</button>
        </div>
      </td>
    `;
    body.appendChild(tr);

    tr.querySelector(`[data-apply="${CSS.escape(item.id)}"]`).onclick = ()=>{
      applySavedFilter(item.id);
    };
    tr.querySelector(`[data-del="${CSS.escape(item.id)}"]`).onclick = ()=>{
      deleteSavedFilter(item.id);
      renderSavedFilters();
    };
  });
}

const ACTIVITY_TYPES = [
  "Alle",
  "SAVED","UNSAVED",
  "COMPARE_ADDED","COMPARE_REMOVED","COMPARE_CLEARED","COMPARE_OPENED",
  "INTERESTED","INTERESTED_AGAIN","STATUS_CHANGED","OWNER_SET","PIPELINE_REMOVED","PASSED",
  "FILTER_SAVED","FILTER_APPLIED","FILTER_DELETED","LEAD_SAVED"
];

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
    card.innerHTML = `
      <div class="card-head">
        <div>
          <h3>${escapeHTML(ev.event || "EVENT")}</h3>
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
  if(currentView==="savedFilters") renderSavedFilters();
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

/* Wire 'Interested' + Compare actions */
function handleInterested(anon_id){
  const res = pipelineUpsertInterested(anon_id);
  toast("Pipeline", res.created ? "Deal hinzugefügt: Screening" : "Deal bereits in Pipeline");
  updateCompareTray();
}

function attachWorkspaceHandlers(){
  // card buttons (delegation)
  document.addEventListener("click", (e)=>{
    const t = e.target;
    if(!(t instanceof HTMLElement)) return;

    const iid = t.getAttribute("data-interested");
    if(iid){
      handleInterested(iid);
      return;
    }

    const cid = t.getAttribute("data-compare");
    if(cid){
      addToCompare(cid);
      return;
    }
  });

  // modal buttons
  const interestedBtn = document.getElementById("interestedBtn");
  if(interestedBtn){
    interestedBtn.addEventListener("click", ()=>{
      const s = startups[modalIndex];
      if(!s) return;
      handleInterested(s.anon_id);
      if(currentView==="pipeline") renderPipeline();
    });
  }
  const addCompareBtn = document.getElementById("addCompareBtn");
  if(addCompareBtn){
    addCompareBtn.addEventListener("click", ()=>{
      const s = startups[modalIndex];
      if(!s) return;
      addToCompare(s.anon_id);
    });
  }

  // tray buttons
  on("compareClearBtn","click", clearCompare);
  on("compareOpenBtn","click", ()=>{
    currentView = "compare";
    renderCurrent();
  });
}
