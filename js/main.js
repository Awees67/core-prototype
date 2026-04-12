document.addEventListener("DOMContentLoaded", ()=>{
  loadTheme();

  const seed = safeGetJSON(LS_KEYS.seed, 1337);
  startups = generateDataset(seed);
  window.startups = startups;
  try{ _cache = {}; }catch(_){}
  ensurePipelineIdsExist();

  // Seed submissions queue if empty
  if(!getSubmissions().length){
    const rng = mulberry32(seed + 42);
    const rawSubs = generateSubmissionsFromStartups(startups, rng);
    const seededSubs = rawSubs.map(x=>({ ...x, signal_index: computeSignalIndex(x.anon_id) }));
    setSubmissions(seededSubs);
  }

  // Seed Outreach-Demo-Daten
  seedDemoOutreach(startups);

  // Repair: recompute plausibility for submissions with empty checks
  (function repairPlausibility(){
    const subs = getSubmissions();
    let dirty = false;
    const repaired = subs.map(sub => {
      if(sub.plausibility_checks && sub.plausibility_checks.length) return sub;
      const s = startups.find(x => x.anon_id === sub.anon_id);
      if(!s) return sub;
      const plaus = computePlausibility(s);
      dirty = true;
      return { ...sub, plausibility_status: plaus.status, plausibility_checks: plaus.checks, plausibility_summary: plaus.summary };
    });
    if(dirty) setSubmissions(repaired);
  })();

  on("openFilterBtn","click", openFilterModal);
  on("filterCloseBtn","click", closeFilterModal);
  on("filterBackdrop","click", (e)=>{
    if(e.target.id==="filterBackdrop") closeFilterModal();
  });

  on("advToggle","change", (e)=>{
    document.getElementById("advFields").style.display = e.target.checked ? "" : "none";
  });

  on("applyFiltersBtn","click", applyFilterModal);
  on("resetFiltersBtn","click", ()=>{
    resetFiltersAll();
    syncFilterModalFromState();
  });

  // ✅ privacy events
  on("openPrivacyBtn","click", openPrivacy);
  on("privacyCloseBtn","click", closePrivacy);
  on("privacyBackdrop","click", (e)=>{
    if(e.target.id === "privacyBackdrop") closePrivacy();
  });

  attachWorkspaceHandlers();
  updateCompareTray();

  loadUIState();
  renderCurrent();
  updateCounts();

  on("searchInput","input", ()=>{
    saveUIState();
    if(currentView==="home") renderCards();
  });

  on("sortSelect","change", ()=>{
    saveUIState();
    if(currentView==="home") renderCards();
  });

  on("navDashboard","click", ()=>{ currentView = "dashboard"; renderCurrent(); });
  on("navHome","click", ()=>{ currentView = "home"; renderCurrent(); });
  on("navSubmissions","click", ()=>{ currentView = "submissions"; renderCurrent(); });
  on("navPipeline","click", ()=>{ currentView = "pipeline"; renderCurrent(); });
  on("navCompare","click", ()=>{ currentView = "compare"; renderCurrent(); });
  on("navActivity","click", ()=>{ currentView = "activity"; renderCurrent(); });
  on("navInbox","click", ()=>{ currentView = "inbox"; renderCurrent(); });

  on("topTabDashboard",  "click", ()=>{ currentView = "dashboard";   renderCurrent(); });
  on("topTabHome",       "click", ()=>{ currentView = "home";        renderCurrent(); });
  on("topTabSubmissions","click", ()=>{ currentView = "submissions"; renderCurrent(); });
  on("topTabPipeline",   "click", ()=>{ currentView = "pipeline";    renderCurrent(); });
  on("topTabCompare",    "click", ()=>{ currentView = "compare";     renderCurrent(); });
  on("topTabActivity",   "click", ()=>{ currentView = "activity";    renderCurrent(); });
  on("topTabInbox",      "click", ()=>{ currentView = "inbox";       renderCurrent(); });

  on("navScore","click", ()=>{ if(typeof openCustomIndex === "function") openCustomIndex(); });
  on("navReset","click", resetDemo);
  on("toggleThemeBtn","click", toggleTheme);


  on("clearAllFiltersBtn","click", ()=>{
    resetFiltersAll();
    toast("OK","Filter gelöscht");
  });

  on("randomizeBtn","click", randomizeDataset);

  on("modalClose","click", closeModal);
  on("modalBackdrop","click", (e)=>{
    if(e.target.id==="modalBackdrop") closeModal();
  });

  // global click -> close dropdowns
  document.addEventListener("click",(e)=>{
    const dd = e.target.closest(".dd");
    if(!dd) closeAllDropdowns();
  });

  document.addEventListener("keydown",(e)=>{
    if(e.key==="Escape"){
      closeModal();
      closeFilterModal();
      closePrivacy();
      closeSignalPopover();
      if(typeof closeDeclineDialog === "function") closeDeclineDialog();
      const _otBd = document.getElementById('otSendBackdrop'); if(_otBd && _otBd.style.display==='flex'){ _otBd.style.display='none'; _otBd.setAttribute('aria-hidden','true'); document.body.classList.remove('no-scroll'); }
    }
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==="k"){
      e.preventDefault();
      document.getElementById("searchInput").focus();
      toast("Suche", "Fokus gesetzt");
    }
    if(document.getElementById("modalBackdrop").style.display === "flex"){
      if(e.key === "ArrowRight") document.getElementById("dvNextBtn")?.click();
      if(e.key === "ArrowLeft") document.getElementById("dvPrevBtn")?.click();
    }
  });
});


/* =========================
   RUNTIME OVERRIDES & ENHANCEMENTS
========================= */
(function(){
  if(window.__CORE_DEMO_V5__) return;
  window.__CORE_DEMO_V5__ = true;

  /* ---------- Popover scroll lock (overlay scrolls, background doesn't) ---------- */
  try{
    const _open = window.openSignalPopover;
    const _close = window.closeSignalPopover;
    window.openSignalPopover = function(anchorEl, html, anon_id=null){
      try{
        const b = document.body;
        if(b && b.style.overflow !== "hidden"){
          b.dataset._prevOverflow = b.style.overflow || "";
          b.style.overflow = "hidden";
        }
      }catch(_){}
      return _open(anchorEl, html, anon_id);
    };
    window.closeSignalPopover = function(){
      const res = _close();
      try{
        const b = document.body;
        if(b){
          b.style.overflow = (b.dataset._prevOverflow || "");
          delete b.dataset._prevOverflow;
        }
      }catch(_){}
      return res;
    };
    // Close on ESC should also restore (already calls closeSignalPopover)
  }catch(_){}

  /* ---------- Status dropdown colors: blue except Invested (green) / Passed (red) ---------- */
  function applyStatusColorToSelect(sel){
    if(!sel) return;
    const v = String(sel.value || "Screening");
    sel.classList.add("statusSel");
    sel.classList.remove("status-blue","status-green","status-red");
    if(v === "Invested") sel.classList.add("status-green");
    else if(v === "Passed") sel.classList.add("status-red");
    else sel.classList.add("status-blue");
  }
  function applyPipelineStatusColors(root){
    (root || document).querySelectorAll('select[data-status]').forEach(sel=>{
      applyStatusColorToSelect(sel);
      if(!sel._v5Colored){
        sel.addEventListener("change", ()=>applyStatusColorToSelect(sel));
        sel._v5Colored = true;
      }
    });
  }

  /* ---------- Compare: new structure (KPI blocks with top mark) ---------- */
  const KPI_BLOCKS = [
    { key:"mrr", label:"MRR", fmt:(v)=>fmtEUR(Math.round(v||0)) },
    { key:"growth", label:"Growth", fmt:(v)=>fmtPct(v) },
    { key:"runway", label:"Runway", fmt:(v)=> (v==null?"—": (String(Math.round(v))+" Monate")) },
    { key:"burn_multiple", label:"Burn Multiple", fmt:(v)=> (v==null?"—": (String((+v).toFixed(2)))) },
    { key:"nrr", label:"NRR", fmt:(v)=> (v==null?"—": (String(Math.round(v))+"%")) },
    { key:"ltv_cac", label:"LTV/CAC", fmt:(v)=> (v==null?"—": (String((+v).toFixed(2)))) }
  ];

  window.renderCompare = function(){
  hideAllViews();
  const v = document.getElementById("viewCompare");
  v.style.display = "";

  const ids = getCompare();
  const deals = ids.map(id=>startups.find(s=>s.anon_id===id)).filter(Boolean);

  v.innerHTML = `
    <div class="compare-header-bar">
      <div class="compare-header-left">
        <h2>Compare</h2>
        <p>Matrix: KPIs als Spalten, Startups als Zeilen. Pro KPI ist der Top-Wert markiert.</p>
      </div>
      <div class="compare-header-actions">
        <button class="btn secondary small" id="compareExportBtn">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:5px;"><path d="M8 1v9M4 7l4 4 4-4M2 12v2a1 1 0 001 1h10a1 1 0 001-1v-2"/></svg>
          Export
        </button>
      </div>
    </div>
    <div class="compareTableWrap">
      <table class="compareTable" aria-label="Compare KPI Matrix">
        <thead>
          <tr>
            <th style="min-width:200px;"></th>
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

  document.getElementById("compareExportBtn").onclick = ()=>{
    downloadJSON("core_compare_export.json", deals.map(s=>({
      anon_id: s.anon_id,
      company_name: s.company_name || s.anon_id,
      stage: s.stage,
      mrr_eur: s.mrr_eur,
      growth_pct: s.growth?.value_pct,
      runway_months: s.runway_months,
      ltv_cac_ratio: s.ltv_cac_ratio
    })));
  };

  const body = v.querySelector("#compareBody");
  if(!deals.length){
    body.innerHTML = `<tr><td colspan="5" style="padding:24px; color:var(--text-secondary); font-weight:700;">
      Keine Deals im Compare. Füge Deals über „Add to Compare" hinzu.
    </td></tr>`;
    return;
  }

  const getMRR = (s)=> Number(s?.mrr_eur ?? (s?.mrr && (s.mrr.value_eur ?? s.mrr.value ?? s.mrr.eur)) ?? 0);
  const getGrowth = (s)=> Number(s?.growth?.value_pct ?? s?.growth_pct ?? (s?.growth && (s.growth.pct ?? s.growth.value)) ?? 0);
  const getRunway = (s)=> Number(s?.runway_months ?? (s?.runway && (s.runway.months ?? s.runway.value)) ?? 0);
  const getLTV = (s)=> {
    let lv = (s?.ltv_cac_ratio ?? s?.ltv_cac ?? s?.ltvcac ?? s?.ltvCac ?? s?.unit?.ltv_cac_ratio ?? s?.unit?.ltv_cac ?? s?.unit?.ltvCac);
    if(typeof lv === "string") lv = lv.replace(",", ".");
    const n = Number(lv);
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

  const fmtRatio = (n)=> (Math.round(n*10)/10).toLocaleString("de-DE");

  const cell = (value, max, isTop, fmt)=>{
    const pct = Math.max(0, Math.min(100, Math.round((value/max)*100)));
    const vhtml = (value===0 && max===1 && fmt===fmtRatio) ? "—" : fmt(value);
    return `
      <div class="cmpCell">
        <div class="cmpBar"><div class="cmpFill" style="width:${pct}%;"></div></div>
        <span class="cmpVal">${escapeHTML(String(vhtml))}</span>
        ${isTop ? '<span class="compare-top-pill">TOP</span>' : ''}
      </div>
    `;
  };

  const _fmtEUR = (n)=> fmtEUR(Math.round(n));
  const _fmtPct = (n)=> (Math.round(n*10)/10).toLocaleString("de-DE") + "%";
  const _fmtM = (n)=> Math.round(n).toLocaleString("de-DE") + "m";

  body.innerHTML = deals.map(s=>{
    const mrr = getMRR(s), gr = getGrowth(s), rw = getRunway(s), lv = getLTV(s);
    const displayName = escapeHTML(s.company_name || s.anon_id);
    const stageTxt = escapeHTML(s.stage || "");
    return `
      <tr>
        <td>
          <button class="cmp-startup-name" data-open="${escapeHTML(s.anon_id)}">${displayName}</button>
          ${stageTxt ? `<div class="cmp-startup-stage">• ${stageTxt}</div>` : ""}
        </td>
        <td>${cell(mrr, maxMRR, s.anon_id===topMRR.anon_id, _fmtEUR)}</td>
        <td>${cell(gr, maxGrowth, s.anon_id===topGrowth.anon_id, _fmtPct)}</td>
        <td>${cell(rw, maxRunway, s.anon_id===topRunway.anon_id, _fmtM)}</td>
        <td>${cell(lv, maxLTV, s.anon_id===topLTV.anon_id, fmtRatio)}</td>
      </tr>
    `;
  }).join("");

  body.querySelectorAll("[data-open]").forEach(b=>{
    b.onclick = ()=> openModalByAnonId(b.getAttribute("data-open"), startups);
  });
};
window.renderCompare._v5 = true;

  /* ---------- Final: ensure colors apply on first pipeline open ---------- */
  // run once after initial paint
  setTimeout(()=>{ 
    try{ applyPipelineStatusColors(document); }catch(_){}
  }, 0);

})();