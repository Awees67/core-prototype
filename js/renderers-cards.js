/* =========================
   RENDERER — CARDS (HOME) VIEW
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

function showControls(){
  const ctrlBar = document.querySelector(".controls");
  const summaryBar = document.querySelector(".summarybar");
  const chipsBar = document.querySelector(".activechips");
  if(ctrlBar) ctrlBar.style.display = "";
  if(summaryBar) summaryBar.style.display = "";
  if(chipsBar) chipsBar.style.display = "";
}

function _makeSkeletonCard(){
  const c = document.createElement("div");
  c.className = "skeleton-card";
  c.innerHTML = `
    <div class="skeleton-line skeleton-line--title"></div>
    <div class="skeleton-line skeleton-line--tag"></div>
    <div class="skeleton-line skeleton-line--score"></div>
    <div class="skeleton-metrics">
      <div class="skeleton-metric"></div>
      <div class="skeleton-metric"></div>
      <div class="skeleton-metric"></div>
      <div class="skeleton-metric"></div>
    </div>`;
  return c;
}

// CARD RING DESIGN: approved 2026-03-24
function _buildScoreRing(score, rulesetName, anonId) {
  const n = Number(score ?? 0);
  const R = 24;
  const circ = (2 * Math.PI * R).toFixed(2);
  let ringVar;
  if (n >= 70)      { ringVar = 'var(--score-ring-high)'; }
  else if (n >= 40) { ringVar = 'var(--score-ring-medium)'; }
  else              { ringVar = 'var(--score-ring-low)'; }
  const offset = (circ * (1 - n / 100)).toFixed(2);
  const displayScore = (score !== null && score !== undefined) ? escapeHTML(String(n)) : '—';
  return `
    <div class="score-wrap">
      <div class="score-ring">
        <svg viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="${R}" fill="none" stroke="var(--score-ring-bg)" stroke-width="4"/>
          <circle cx="28" cy="28" r="${R}" fill="none" stroke="${ringVar}" stroke-width="4"
            stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
        </svg>
        <span class="score-num" style="color:${ringVar}">${displayScore}</span>
      </div>
      <button class="infoicon" data-action="scoreinfo" data-id="${escapeHTML(String(anonId))}" type="button" aria-label="Score Breakdown">ⓘ</button>
      <span class="score-lbl">${escapeHTML(rulesetName)}</span>
    </div>`;
}

function renderCards(){
  hideAllViews();
  showControls();
  const grid = document.getElementById("cardGrid");
  grid.style.display = "";

  // Show skeleton while computing filtered list
  grid.innerHTML = "";
  for(let i=0; i<6; i++) grid.appendChild(_makeSkeletonCard());

  requestAnimationFrame(()=>{ _renderCardsContent(grid); });
}

function _renderCardsContent(grid){
  const list = buildFilteredList();
  lastListContext = list;

  document.getElementById("resultCount").textContent = list.length + " Ergebnisse";
  document.getElementById("activeFilterCount").textContent = countActiveFilters() + " Filter aktiv";
  renderActiveChips();
  updateCounts();

  grid.innerHTML = "";
  if(list.length===0){
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-state__icon">🔍</div>
      <p class="empty-state__title">Keine Treffer</p>
      <p class="empty-state__sub">Keine Startups entsprechen den aktiven Filtern. Filter anpassen oder zurücksetzen.</p>
      <button class="empty-state__cta" id="emptyStateResetBtn">Filter zurücksetzen</button>`;
    grid.appendChild(empty);
    const resetBtn = document.getElementById("emptyStateResetBtn");
    if(resetBtn) resetBtn.addEventListener("click", ()=>{
      if(typeof resetFiltersAll === "function") resetFiltersAll();
      else { renderCards(); }
    });
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
    // Stagger entrance animation
    card.style.animationDelay = (idx * 30) + "ms";

    const g = s.growth?.value_pct ?? null;
    const gCls = g>0 ? "trend-up" : (g<0 ? "trend-down" : "");
    const nc = noteCountMap[s.anon_id] || 0;

    const pipelineStatus = pipelineMap.get(s.anon_id) || null;
    const pipelineBtnText = pipelineStatus === "Synced" ? "✓ Synced" :
                             pipelineStatus ? "✓ In Pipeline" : "Add to Pipeline";
    const pipelineBtnDisabled = pipelineStatus ? "disabled" : "";

    const marketLabel = s.market_served.includes("DACH") ? "DACH (DE•AT•CH)" : (s.market_served[0] || "—");

    let _scoreRaw = null;
    try {
      const _res = computeCustomIndexV6(s.anon_id);
      if (_res && _res.score !== null && _res.score !== undefined) _scoreRaw = _res.score;
    } catch(_) {}

    card.innerHTML = `
  <div class="card-head">
    <div class="card-head-left">
      <div class="card-name">
        ${escapeHTML(startupLabel(s))}
        <span class="cid">${escapeHTML(s.anon_id)}</span>
      </div>
      <div class="tags">
        <span class="tag">${escapeHTML(s.origin_country)}</span>
        ${s.market_served && s.market_served.length ? `<span class="tag">${escapeHTML(s.market_served.includes('DACH') ? 'DACH' : s.market_served[0])}</span>` : ''}
        <span class="tag stage">${escapeHTML(s.stage)}</span>
        <span class="tag">${escapeHTML(s.sector)}</span>
        ${s.sub_sector ? `<span class="tag">${escapeHTML(s.sub_sector)}</span>` : ''}
      </div>
      ${s.description ? `<p class="desc">${escapeHTML(s.description)}</p>` : ''}
      ${nc > 0 ? `<span class="card-notes-indicator" style="margin-top:6px;display:inline-flex;">📝 ${nc}</span>` : ''}
    </div>
    ${_buildScoreRing(_scoreRaw, activeRulesetName, s.anon_id)}
  </div>

  <div class="kpi-grid">
    <div class="kpi-tile">
      <span class="kpi-val">${escapeHTML(fmtEUR(s.mrr_eur))}</span>
      <span class="kpi-lbl">MRR</span>
    </div>
    <div class="kpi-tile">
      <span class="kpi-val${g > 0 ? ' pos' : g < 0 ? ' neg' : ''}">${g === null ? '—' : escapeHTML(fmtPct(g))}</span>
      <span class="kpi-lbl">Wachstum (${escapeHTML(s.growth?.type || '—')})</span>
    </div>
    <div class="kpi-tile">
      <span class="kpi-val neg">${escapeHTML(fmtEUR(s.burn_eur_per_month))}</span>
      <span class="kpi-lbl">Burn / Monat</span>
    </div>
    <div class="kpi-tile">
      <span class="kpi-val">${escapeHTML(String(s.runway_months))} M</span>
      <span class="kpi-lbl">Runway</span>
    </div>
    <div class="kpi-tile">
      <span class="kpi-val">${escapeHTML(String(s.nrr_pct))}%</span>
      <span class="kpi-lbl">NRR</span>
    </div>
    <div class="kpi-tile">
      <span class="kpi-val">${escapeHTML(s.ltv_cac_ratio.toFixed(1))}</span>
      <span class="kpi-lbl">LTV/CAC</span>
    </div>
  </div>

  <div class="actions">
    <button class="btn-primary" data-action="open" data-id="${escapeHTML(s.anon_id)}">Details öffnen</button>
    <div class="btn-row">
      <button class="btn-secondary" data-action="addpipeline" data-id="${escapeHTML(s.anon_id)}" ${pipelineBtnDisabled}>${escapeHTML(pipelineBtnText)}</button>
      <button class="btn-secondary" data-action="compare" data-id="${escapeHTML(s.anon_id)}">⇄ Compare</button>
    </div>
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
