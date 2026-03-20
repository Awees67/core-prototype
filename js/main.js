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

  on("navHome","click", ()=>{ currentView = "home"; renderCurrent(); });
  on("navSubmissions","click", ()=>{ currentView = "submissions"; renderCurrent(); });
  on("navPipeline","click", ()=>{ currentView = "pipeline"; renderCurrent(); });
  on("navCompare","click", ()=>{ currentView = "compare"; renderCurrent(); });
  on("navActivity","click", ()=>{ currentView = "activity"; renderCurrent(); });
  on("navInbox","click", ()=>{ currentView = "inbox"; renderCurrent(); });

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
    }
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==="k"){
      e.preventDefault();
      document.getElementById("searchInput").focus();
      toast("Suche", "Fokus gesetzt");
    }
    if(document.getElementById("modalBackdrop").style.display === "flex"){
      if(e.key === "ArrowRight") document.getElementById("nextBtn").click();
      if(e.key === "ArrowLeft") document.getElementById("prevBtn").click();
    }
  });
});

(function(){
  if(typeof renderCompare !== "function" || renderCompare._v41) return;

  const _old = renderCompare;
  renderCompare = function(){
    hideAllViews();
    const v = document.getElementById("viewCompare");
    v.style.display = "";

    const ids = getCompare().slice(0, 10); // allow more rows
    v.innerHTML = `
      <div class="panelhead">
        <h2>Compare</h2>
      </div>
      <div class="controls" style="margin-top:0;">
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
          <div class="hint">Wähle 2–10 Deals. Vergleich zeigt Top‑Werte je KPI.</div>
        </div>
        <div class="cell-actions" style="display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap;">
          <button class="btn secondary small" id="clearCompareBtn">Clear</button>
        </div>
      </div>

      <div id="compareTableMount"></div>

      <div class="helper" style="margin-top:14px;">
        Hinweis: Anonymisierte Demo. KPI/Signale sind indikativ und können unvollständig/ungeprüft sein.
      </div>
    `;

    document.getElementById("clearCompareBtn").onclick = ()=>{
      setCompare([]);
      toast("Compare","Liste geleert");
      renderCompare();
    };

    const mount = document.getElementById("compareTableMount");

    if(ids.length < 2){
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "Wähle mindestens 2 Deals (Explore oder Pipeline → Add to Compare).";
      mount.appendChild(empty);
      return;
    }

    const rows = ids.map(id=> startups.find(s=>s.anon_id===id)).filter(Boolean);

    const kpis = [
      { key:"signal", label:"Score", val:(s)=>computeSignalIndex(s.anon_id), best:"max", fmt:(n)=>String(Math.round(n)) },
      { key:"mrr", label:"MRR", val:(s)=>Number(s.mrr_eur||0), best:"max", fmt:(n)=>fmtEUR(n) },
      { key:"growth", label:"Growth", val:(s)=>Number(s.growth?.value_pct ?? 0), best:"max", fmt:(n)=>fmtPct(n) },
      { key:"runway", label:"Runway", val:(s)=>Number(s.runway_months||0), best:"max", fmt:(n)=> (n? (n+" M") : "—") },
      { key:"burn", label:"Burn", val:(s)=>Number(s.burn_eur||0), best:"min", fmt:(n)=>fmtEUR(n) },
      { key:"nrr", label:"NRR", val:(s)=>Number(s.nrr_pct||0), best:"max", fmt:(n)=> (n? (n.toFixed(0)+"%") : "—") },
      { key:"ltv", label:"LTV/CAC", val:(s)=>Number(s.ltv_cac_ratio||0), best:"max", fmt:(n)=> (n? n.toFixed(1) : "—") },
    ];

    const extrema = {};
    kpis.forEach(k=>{
      const vals = rows.map(r=>k.val(r)).filter(v=>Number.isFinite(v));
      if(!vals.length){ extrema[k.key]=null; return; }
      extrema[k.key] = { min: Math.min(...vals), max: Math.max(...vals) };
    });

    const wrap = document.createElement("div");
    wrap.className = "compareTableWrap";
    const table = document.createElement("table");
    table.className = "compareTable";
    table.innerHTML = `
      <thead>
        <tr>
          <th style="min-width:140px;">Startup</th>
          ${kpis.map(k=>`<th>${escapeHTML(k.label)}</th>`).join("")}
          <th style="min-width:120px;">Aktionen</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r=>{
          const cells = kpis.map(k=>{
            const v = k.val(r);
            const ex = extrema[k.key];
            let isTop = false;
            if(ex){
              if(k.best==="max") isTop = (v===ex.max);
              if(k.best==="min") isTop = (v===ex.min);
            }
            const topMark = isTop ? `<span class="tag compareTop">Top</span>` : ``;
            if(k.key==="signal"){
              const cls = sigClassFromScore(v);
              const tone = sigToneFromClass(cls);
              return `<td>
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                  <span class="badge ${tone==="high"?"good":(tone==="mid"?"hot":"watch")}">${cls}</span>
                  <span class="mono">${Math.round(v)}</span>
                  ${topMark}
                  <button class="btn secondary small" data-si="${escapeHTML(r.anon_id)}">(i)</button>
                </div>
              </td>`;
            }
            return `<td><span class="mono">${escapeHTML(k.fmt(v))}</span>${topMark}</td>`;
          }).join("");

          return `<tr class="compareRowCard">
            <td style="font-weight:950;"><button class="btn secondary small" data-open="${escapeHTML(r.anon_id)}">${escapeHTML(r.anon_id)}</button></td>
            ${cells}
            <td style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn secondary small" data-remove="${escapeHTML(r.anon_id)}">Remove</button>
            </td>
          </tr>`;
        }).join("")}
      </tbody>
    `;
    wrap.appendChild(table);
    mount.appendChild(wrap);

    // actions
    mount.querySelectorAll("[data-open]").forEach(b=>{
      b.onclick = (e)=>{ e.stopPropagation(); openModalByAnonId(b.getAttribute("data-open"), startups); };
    });
    mount.querySelectorAll("[data-remove]").forEach(b=>{
      b.onclick = (e)=>{
        e.stopPropagation();
        const id = b.getAttribute("data-remove");
        const next = getCompare().filter(x=>x!==id);
        setCompare(next);
        toast("Compare","Entfernt: "+id);
        renderCompare();
      };
    });
    mount.querySelectorAll("[data-si]").forEach(b=>{
      b.onclick = (e)=>{
        e.stopPropagation();
        const id = b.getAttribute("data-si");
        openScoreBreakdown(id, b);
      };
    });
  };

  renderCompare._v41 = true;
})();

/* =========================
   V5 scope logic (no redesign)
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
    <div class="panelhead"><h2>Compare</h2></div>
    <div class="helper" style="margin-top:0;">
      Matrix: KPIs als Spalten, Startups als Zeilen. Pro KPI ist der Top-Wert markiert.
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

  const body = v.querySelector("#compareBody");
  if(!deals.length){
    body.innerHTML = `<tr><td colspan="5" style="padding:14px 12px; color:var(--muted); font-weight:900;">
      Keine Deals im Compare. Füge Deals über „Compare“ hinzu.
    </td></tr>`;
    return;
  }

  const getMRR = (s)=> Number(s?.mrr_eur ?? (s?.mrr && (s.mrr.value_eur ?? s.mrr.value ?? s.mrr.eur)) ?? 0);
  const getGrowth = (s)=> Number(s?.growth?.value_pct ?? s?.growth_pct ?? (s?.growth && (s.growth.pct ?? s.growth.value)) ?? 0);
  const getRunway = (s)=> Number(s?.runway_months ?? (s?.runway && (s.runway.months ?? s.runway.value)) ?? 0);
  const getLTV = (s)=> {
    let v = (s?.ltv_cac_ratio ?? s?.ltv_cac ?? s?.ltvcac ?? s?.ltvCac ?? s?.unit?.ltv_cac_ratio ?? s?.unit?.ltv_cac ?? s?.unit?.ltvCac);
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
    const vhtml = (value===0 && max===1 && fmt===fmtRatio) ? "—" : fmt(value);
    return `
      <div class="cmpCell ${isTop?'top':''}">
        <div class="cmpBar"><div class="cmpFill" style="width:${pct}%;"></div></div>
        <div class="cmpVal mono">${escapeHTML(String(vhtml))}${isTop?'<span class="compareTop">Top</span>':''}</div>
      </div>
    `;
  };

  const _fmtEUR = (n)=> "€" + Math.round(n).toLocaleString("de-AT");
  const _fmtPct = (n)=> (Math.round(n*10)/10).toLocaleString("de-AT") + "%";
  const _fmtM = (n)=> Math.round(n).toLocaleString("de-AT") + "m";
  const fmtRatio = (n)=> (Math.round(n*10)/10).toLocaleString("de-AT");

  body.innerHTML = deals.map(s=>{
    const mrr = getMRR(s), gr = getGrowth(s), rw = getRunway(s), lv = getLTV(s);
    return `
      <tr>
        <td style="font-weight:950;">
          ${escapeHTML(s.anon_id)}
          <div class="tiny" style="margin:4px 0 0 0;">${escapeHTML(s.hq||"")} • ${escapeHTML(s.stage||"")}</div>
        </td>
        <td>${cell(mrr, maxMRR, s.anon_id===topMRR.anon_id, _fmtEUR)}</td>
        <td>${cell(gr, maxGrowth, s.anon_id===topGrowth.anon_id, _fmtPct)}</td>
        <td>${cell(rw, maxRunway, s.anon_id===topRunway.anon_id, _fmtM)}</td>
        <td>${cell(lv, maxLTV, s.anon_id===topLTV.anon_id, fmtRatio)}</td>
      </tr>
    `;
  }).join("");
};
window.renderCompare._v5 = true;

  /* ---------- Final: ensure colors apply on first pipeline open ---------- */
  // run once after initial paint
  setTimeout(()=>{ 
    try{ applyPipelineStatusColors(document); }catch(_){}
  }, 0);

})();