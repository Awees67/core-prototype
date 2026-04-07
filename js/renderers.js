/* =========================
   RENDERERS — ROUTING & APP ACTIONS
   View-specific renderers have been split into:
     renderers-helpers.js    — hideAllViews, updateCounts, renderMiniKPI
     renderers-dashboard.js  — renderDashboard
     renderers-cards.js      — renderCards, _buildScoreRing, renderActiveChips
     renderers-submissions.js— renderSubmissions
     renderers-pipeline.js   — renderPipeline, stageBadgeClass
     renderers-compare.js    — renderCompare, addToCompare, updateCompareTray
     renderers-activity.js   — renderActivity
     renderers-inbox.js      — renderInbox
     renderers-modals.js     — openModal*, closeModal, openDeclineDialog, syncModalPipelineButtons
========================= */

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
  bulkSelection.clear(); // Clear bulk selection on every view change to prevent leaking across tabs

  if(currentView==="dashboard") renderDashboard();
  if(currentView==="home") renderCards();
  if(currentView==="submissions") renderSubmissions();
  if(currentView==="pipeline") renderPipeline();
  if(currentView==="compare") renderCompare();
  if(currentView==="activity") renderActivity();
  if(currentView==="inbox") renderInbox();

  saveUIState();
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
   FILTER ACTIONS
========================= */
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

/* =========================
   PIPELINE ACTIONS
========================= */
function handleAddToPipeline(anon_id){
  const p = getPipeline();
  const existing = p.find(x=>x.anon_id===anon_id);
  if(existing){
    toast("Pipeline", "Deal ist bereits in der Pipeline");
    return;
  }
  pipelineAdd(anon_id, "In Review");
  toast("Pipeline", "Deal zur Pipeline hinzugefügt");
  if(currentView === "home") {
    // Patch button in-place — do NOT call renderCards() to avoid scroll reset
    const btn = document.querySelector(`[data-action="addpipeline"][data-id="${CSS.escape(anon_id)}"]`);
    if(btn) {
      btn.textContent = "✓ In Pipeline";
      btn.disabled = true;
    }
  }
  if(currentView === "pipeline") renderPipeline();
}

/* =========================
   WORKSPACE EVENT HANDLERS
========================= */
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
