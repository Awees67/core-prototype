/* =========================
   APP STATE (localStorage)
========================= */
let startups = [];
let currentView = "home"; // home | saved | pipeline | compare | portfolio | savedFilters | activity | inbox
let modalIndex = -1;
let lastListContext = [];

const FILTER_DEFAULTS = {
  ue: "All", rq: "All", ce: "All",
  advEnabled: false,
  nrrMin: null, ltvCacMin: null,
  mrrMin: null, mrrMax: null,
  growthMin: null, runwayMin: null, burnMax: null, ebitdaMin: null,
  ticketMin: null, ticketMax: null
};
function makeFilters(){
  return { origin: new Set(), market: new Set(), stage: new Set(), sector: new Set(), ...FILTER_DEFAULTS };
}
function serializeFilters(){
  return {
    origin: Array.from(filters.origin), market: Array.from(filters.market),
    stage: Array.from(filters.stage), sector: Array.from(filters.sector),
    ...FILTER_DEFAULTS,
    ue: filters.ue, rq: filters.rq, ce: filters.ce,
    advEnabled: filters.advEnabled,
    nrrMin: filters.nrrMin, ltvCacMin: filters.ltvCacMin,
    mrrMin: filters.mrrMin, mrrMax: filters.mrrMax,
    growthMin: filters.growthMin, runwayMin: filters.runwayMin,
    burnMax: filters.burnMax, ebitdaMin: filters.ebitdaMin,
    ticketMin: filters.ticketMin, ticketMax: filters.ticketMax
  };
}
function applyFilterObject(f){
  const nn = (v) => (v === null || v === undefined) ? null : Number(v);
  filters.origin = new Set(f.origin || []);
  filters.market = new Set(f.market || []);
  filters.stage = new Set(f.stage || []);
  filters.sector = new Set(f.sector || []);
  filters.ue = f.ue || "All";
  filters.rq = f.rq || "All";
  filters.ce = f.ce || "All";
  filters.advEnabled = !!f.advEnabled;
  filters.nrrMin = nn(f.nrrMin); filters.ltvCacMin = nn(f.ltvCacMin);
  filters.mrrMin = nn(f.mrrMin); filters.mrrMax = nn(f.mrrMax);
  filters.growthMin = nn(f.growthMin); filters.runwayMin = nn(f.runwayMin);
  filters.burnMax = nn(f.burnMax); filters.ebitdaMin = nn(f.ebitdaMin);
  filters.ticketMin = nn(f.ticketMin); filters.ticketMax = nn(f.ticketMax);
}

let filters = makeFilters();

function safeGetJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if(!raw) return fallback;
    return JSON.parse(raw);
  }catch(e){
    return fallback;
  }
}
function safeSetJSON(key, value){
  try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){}
}

function getLeads(){
  const arr = safeGetJSON(LS_KEYS.leads, []);
  return Array.isArray(arr) ? arr.map(x=>({
    anon_id: String(x?.anon_id || ""),
    display_label: String(x?.display_label || ""),
    name: String(x?.name || ""),
    email: String(x?.email || ""),
    firm: String(x?.firm || ""),
    msg: String(x?.msg || ""),
    ts: Number(x?.ts || 0)
  })).filter(x=>x.anon_id && Number.isFinite(x.ts) && x.ts > 0) : [];
}
function setLeads(arr){
  safeSetJSON(LS_KEYS.leads, Array.isArray(arr) ? arr : []);
  updateCounts();
}

function getSavedSet(){
  const arr = safeGetJSON(LS_KEYS.saved, []);
  return new Set(Array.isArray(arr) ? arr.map(x=>String(x || "")).filter(Boolean) : []);
}
function setSavedIds(ids){
  const next = Array.isArray(ids) ? ids.map(x=>String(x || "")).filter(Boolean) : [];
  safeSetJSON(LS_KEYS.saved, Array.from(new Set(next)));
  updateCounts();
}
function setSavedSet(setObj){
  setSavedIds(Array.from(setObj || []));
}
function toggleSaved(id, btnEl){
  const safeId = String(id || "");
  if(!safeId) return false;

  const saved = getSavedSet();
  let isSaved = false;

  if(saved.has(safeId)){
    saved.delete(safeId);
    toast("Entfernt", "Aus Merkliste gelöscht");
    isSaved = false;
  }else{
    saved.add(safeId);
    toast("Gemerkt", "Zur Merkliste hinzugefügt");
    isSaved = true;
  }

  setSavedSet(saved);

  if(btnEl){
    btnEl.textContent = isSaved ? "Aus Merkliste" : "Merken";
  }

  if(currentView === "home") renderCards();
  if(currentView === "saved") renderSaved();

  const saveBtn = document.getElementById("saveToggleBtn");
  if(saveBtn && saveBtn.dataset.anonId === safeId){
    saveBtn.textContent = isSaved ? "Aus Merkliste" : "Zur Merkliste";
  }

  return isSaved;
}

/* =========================
   VC WORKSPACE STORAGE
========================= */
function getPipeline(){
  const arr = safeGetJSON(LS_KEYS.pipeline, []);
  if(!Array.isArray(arr)) return [];
  // backfill/migration
  return arr.map(x=>({
    anon_id: String(x.anon_id || ""),
    status: x.status || "Screening",
    owner: (x.owner===undefined || x.owner===null) ? "" : String(x.owner),
    signal_index: (x.signal_index===undefined || x.signal_index===null) ? 0 : Number(x.signal_index),
    last_updated: (x.last_updated===undefined || x.last_updated===null) ? Date.now() : Number(x.last_updated),
    created_at: (x.created_at===undefined || x.created_at===null) ? (Number(x.last_updated)||Date.now()) : Number(x.created_at)
  })).filter(x=>!!x.anon_id);
}
function setPipeline(arr){ safeSetJSON(LS_KEYS.pipeline, Array.isArray(arr)?arr:[]); }

function getCompare(){
  const arr = safeGetJSON(LS_KEYS.compare, []);
  return Array.isArray(arr) ? arr.map(String).filter(Boolean) : [];
}
function setCompare(arr){ safeSetJSON(LS_KEYS.compare, Array.isArray(arr)?arr:[]); }

function getSavedFilters(){
  const arr = safeGetJSON(LS_KEYS.savedFilters, []);
  return Array.isArray(arr) ? arr : [];
}
function setSavedFilters(arr){ safeSetJSON(LS_KEYS.savedFilters, Array.isArray(arr)?arr:[]); }

function getActivity(){
  const arr = safeGetJSON(LS_KEYS.activity, []);
  return Array.isArray(arr) ? arr : [];
}
function setActivity(arr){ safeSetJSON(LS_KEYS.activity, Array.isArray(arr)?arr:[]); }

function activityLogAppend(event, anon_id=null, meta=null){
  const a = getActivity();
  a.unshift({ id: uid(), ts: Date.now(), event: String(event||""), anon_id: anon_id?String(anon_id):null, meta: meta||null });
  if(a.length > 500) a.length = 500;
  setActivity(a);
  if(currentView==="activity") renderActivity();
}

function pipelineUpsertInterested(anon_id){
  const p = getPipeline();
  const idx = p.findIndex(x=>x.anon_id===anon_id);
  if(idx>=0){
    p[idx].last_updated = Date.now();
    p[idx].signal_index = computeSignalIndex(anon_id);
    setPipeline(p);
    activityLogAppend("INTERESTED_AGAIN", anon_id, null);
    return { created:false, item:p[idx] };
  }
  const item = {
    anon_id,
    status: "Screening",
    owner: "",
    signal_index: computeSignalIndex(anon_id),
    last_updated: Date.now(),
    created_at: Date.now()
  };
  p.unshift(item);
  setPipeline(p);
  activityLogAppend("INTERESTED", anon_id, null);
  return { created:true, item };
}

function pipelineSetStatus(anon_id, toStatus){
  const p = getPipeline();
  const idx = p.findIndex(x=>x.anon_id===anon_id);
  if(idx<0) return;
  const from = p[idx].status || "Screening";
  p[idx].status = toStatus;
  p[idx].last_updated = Date.now();
  p[idx].signal_index = computeSignalIndex(anon_id);
  setPipeline(p);
  activityLogAppend("STATUS_CHANGED", anon_id, { from, to: toStatus });
}

function pipelineSetOwner(anon_id, owner){
  const p = getPipeline();
  const idx = p.findIndex(x=>x.anon_id===anon_id);
  if(idx<0) return;
  p[idx].owner = owner || "";
  p[idx].last_updated = Date.now();
  p[idx].signal_index = computeSignalIndex(anon_id);
  setPipeline(p);
  activityLogAppend("OWNER_SET", anon_id, { owner: p[idx].owner });
}

function pipelineRemove(anon_id){
  const p = getPipeline().filter(x=>x.anon_id!==anon_id);
  setPipeline(p);
  activityLogAppend("PIPELINE_REMOVED", anon_id, null);
}

function pipelineMarkPassed(anon_id){
  pipelineSetStatus(anon_id, "Passed");
  activityLogAppend("PASSED", anon_id, null);
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
