/* =========================
   APP STATE (localStorage)
========================= */
let startups = [];
let currentView = "dashboard"; // dashboard | home | submissions | pipeline | compare | activity | inbox
let modalIndex = -1;
let lastListContext = [];

/* =========================
   BULK SELECTION STATE
========================= */
let bulkSelection = new Set(); // Temporary, RAM-only. Cleared on every view change.

function bulkToggle(id){ bulkSelection.has(id) ? bulkSelection.delete(id) : bulkSelection.add(id); }
function bulkSelectAll(ids){ ids.forEach(id => bulkSelection.add(id)); }
function bulkDeselectAll(){ bulkSelection.clear(); }
function bulkIsSelected(id){ return bulkSelection.has(id); }
function bulkCount(){ return bulkSelection.size; }

/** Returns true if the pipeline transition from current status → toStatus is allowed (without side effects). */
function isPipelineTransitionAllowed(anon_id, toStatus){
  const item = getPipeline().find(x => x.anon_id === anon_id);
  if(!item) return false;
  const from = item.status;
  if(from === "Synced") return false;
  const allowed = PIPELINE_TRANSITIONS[from] || [];
  return allowed.includes(toStatus) || toStatus === from;
}

const FILTER_DEFAULTS = {
  ue: "All", rq: "All", ce: "All",
  advEnabled: false,
  nrrMin: null, ltvCacMin: null,
  mrrMin: null, mrrMax: null,
  growthMin: null, runwayMin: null, burnMax: null, ebitdaMin: null,
  ticketMin: null, ticketMax: null
};
function makeFilters(){
  return { origin: new Set(), market: new Set(), stage: new Set(), sector: new Set(), sub_sector: new Set(), ...FILTER_DEFAULTS };
}
function serializeFilters(){
  return {
    origin: Array.from(filters.origin), market: Array.from(filters.market),
    stage: Array.from(filters.stage), sector: Array.from(filters.sector),
    sub_sector: Array.from(filters.sub_sector),
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
  filters.sub_sector = new Set(f.sub_sector || []);
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

  return isSaved;
}

/* =========================
   VC WORKSPACE STORAGE
========================= */
function getPipeline(){
  const arr = safeGetJSON(LS_KEYS.pipeline, []);
  if(!Array.isArray(arr)) return [];
  // backfill/migration: map old stages to new stages
  return arr.map(x=>{
    const rawStatus = x.status || "Screening";
    const status = PIPELINE_NEW_STAGES.has(rawStatus)
      ? rawStatus
      : (PIPELINE_STAGE_MIGRATION[rawStatus] || "In Review");
    return {
      anon_id: String(x.anon_id || ""),
      status,
      owner: (x.owner===undefined || x.owner===null) ? "" : String(x.owner),
      signal_index: (x.signal_index===undefined || x.signal_index===null) ? 0 : Number(x.signal_index),
      last_updated: (x.last_updated===undefined || x.last_updated===null) ? Date.now() : Number(x.last_updated),
      created_at: (x.created_at===undefined || x.created_at===null) ? (Number(x.last_updated)||Date.now()) : Number(x.created_at),
      decline_reason: (x.decline_reason || null),
      decline_note: (x.decline_note || '')
    };
  }).filter(x=>!!x.anon_id);
}

/* =========================
   SUBMISSIONS STORAGE
========================= */
function getSubmissions(){
  const arr = safeGetJSON(LS_KEYS.submissions, []);
  if(!Array.isArray(arr)) return [];
  return arr.map(x=>({
    anon_id: String(x?.anon_id || ""),
    signal_index: Number(x?.signal_index || 0),
    plausibility_status: String(x?.plausibility_status || "passed"),
    plausibility_checks: Array.isArray(x?.plausibility_checks) ? x.plausibility_checks : [],
    plausibility_summary: (x?.plausibility_summary && typeof x.plausibility_summary === "object")
      ? x.plausibility_summary
      : { total: 0, passed: 0, failed_hard: 0, failed_soft: 0 },
    submitted_at: Number(x?.submitted_at || 0),
    sector: String(x?.sector || ""),
    sub_sector: x?.sub_sector ? String(x.sub_sector) : null,
    stage: String(x?.stage || "")
  })).filter(x=>!!x.anon_id);
}
function setSubmissions(arr){ safeSetJSON(LS_KEYS.submissions, Array.isArray(arr)?arr:[]); }

function acceptSubmission(anon_id){
  setSubmissions(getSubmissions().filter(x=>x.anon_id!==anon_id));
  // Startup now visible in Übersicht (no longer in queue)
}

function declineSubmission(anon_id){
  setSubmissions(getSubmissions().filter(x=>x.anon_id!==anon_id));
  // Remove from in-memory startups so it doesn't reappear in Übersicht
  if(Array.isArray(window.startups)){
    window.startups = window.startups.filter(x=>x.anon_id!==anon_id);
    startups = window.startups;
  }
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

/* =========================
   NOTES STORAGE
========================= */
function getNotes(){
  const arr = safeGetJSON(LS_KEYS.notes, []);
  if(!Array.isArray(arr)) return [];
  return arr.filter(n => n && typeof n.id === "string" && typeof n.anon_id === "string");
}
function setNotes(arr){ safeSetJSON(LS_KEYS.notes, Array.isArray(arr) ? arr : []); }

function getNotesForDeal(anon_id){
  return getNotes()
    .filter(n => n.anon_id === anon_id)
    .sort((a, b) => b.created_at - a.created_at);
}

function addNote(anon_id, text, author){
  const note = {
    id: uid(),
    anon_id: String(anon_id || ""),
    text: String(text || "").trim(),
    author: String(author || "Analyst"),
    created_at: Date.now(),
    pinned: false
  };
  const notes = getNotes();
  notes.push(note);
  setNotes(notes);
  activityLogAppend("NOTE_ADDED", anon_id, { text: note.text.slice(0, 80), author: note.author });
  return note;
}

function deleteNote(noteId){
  const notes = getNotes();
  const idx = notes.findIndex(n => n.id === noteId);
  if(idx < 0) return;
  const note = notes[idx];
  setNotes(notes.filter(n => n.id !== noteId));
  activityLogAppend("NOTE_DELETED", note.anon_id, { note_id: noteId });
}

function getNotesCount(anon_id){
  return getNotes().filter(n => n.anon_id === anon_id).length;
}

function activityLogAppend(event, anon_id=null, meta=null){
  const a = getActivity();
  a.unshift({ id: uid(), ts: Date.now(), event: String(event||""), anon_id: anon_id?String(anon_id):null, meta: meta||null });
  if(a.length > 500) a.length = 500;
  setActivity(a);
  if(currentView==="activity") renderActivity();
}

function pipelineAdd(anon_id, initialStatus){
  const status = initialStatus || "In Review";
  const p = getPipeline();
  const idx = p.findIndex(x=>x.anon_id===anon_id);
  if(idx>=0){
    p[idx].last_updated = Date.now();
    setPipeline(p);
    return { created:false, item:p[idx] };
  }
  const item = {
    anon_id,
    status,
    owner: "",
    signal_index: computeSignalIndex(anon_id),
    last_updated: Date.now(),
    created_at: Date.now()
  };
  p.unshift(item);
  setPipeline(p);
  activityLogAppend("PIPELINE_ADDED", anon_id, { status });
  return { created:true, item };
}

function pipelineSetStatus(anon_id, toStatus, declineReason, declineNote){
  const p = getPipeline();
  const idx = p.findIndex(x=>x.anon_id===anon_id);
  if(idx<0) return false;
  const from = p[idx].status || "In Review";

  if(from === "Synced"){
    toast("Gesperrt", "Synced Deals können nicht geändert werden");
    return false;
  }

  const allowed = PIPELINE_TRANSITIONS[from] || [];
  if(!allowed.includes(toStatus) && toStatus !== from){
    toast("Ungültig", `${from} → ${toStatus} nicht erlaubt`);
    return false;
  }

  if(toStatus === "Declined" && !declineReason){
    return false;
  }

  p[idx].status = toStatus;
  p[idx].last_updated = Date.now();
  p[idx].signal_index = computeSignalIndex(anon_id);
  p[idx].decline_reason = (toStatus === "Declined") ? declineReason : null;
  p[idx].decline_note   = (toStatus === "Declined") ? (declineNote || '') : '';
  setPipeline(p);
  activityLogAppend("STATUS_CHANGED", anon_id, {
    from,
    to: toStatus,
    decline_reason: (toStatus === "Declined") ? (declineReason || null) : null,
    decline_note:   (toStatus === "Declined") ? (declineNote || '') : ''
  });
  return true;
}

function pipelinePushToCRM(anon_id){
  const p = getPipeline();
  const idx = p.findIndex(x=>x.anon_id===anon_id);
  if(idx < 0){
    const item = {
      anon_id,
      status: "Synced",
      owner: "",
      signal_index: computeSignalIndex(anon_id),
      last_updated: Date.now(),
      created_at: Date.now()
    };
    p.unshift(item);
    setPipeline(p);
  } else {
    p[idx].status = "Synced";
    p[idx].last_updated = Date.now();
    p[idx].signal_index = computeSignalIndex(anon_id);
    setPipeline(p);
  }
  activityLogAppend("CRM_PUSHED", anon_id, null);
  toast("CRM", "Deal an CRM übergeben");
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

// pipelineMarkPassed removed – use pipelineSetStatus(anon_id, 'Declined') instead

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

async function saveCurrentFilters(){
  const name = await showInputModal('Filterset-Name eingeben');
  if (!name) return;
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

/* =========================
   OUTREACH TRACKER STATE
========================= */
function getOutreach(){
  const arr = safeGetJSON(LS_KEYS.outreach, []);
  return Array.isArray(arr) ? arr : [];
}
function setOutreach(arr){
  safeSetJSON(LS_KEYS.outreach, Array.isArray(arr) ? arr : []);
}
function updateOutreachItem(id, patch){
  const arr = getOutreach();
  const idx = arr.findIndex(x=>x.id===id);
  if(idx<0) return;
  arr[idx] = { ...arr[idx], ...patch, last_activity_at: Date.now() };
  setOutreach(arr);
}
function computeFollowupRecommended(item){
  if(item.followup_sent) return false;
  if(item.status !== 'keine_antwort' && item.status !== 'anfrage_gesendet') return false;
  const days = (Date.now() - item.sent_at) / (1000 * 60 * 60 * 24);
  return days >= 3;
}
function seedDemoOutreach(startups) {
  if (getOutreach().length > 0) return;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // Use contact data from startup objects if available (generated in data.js), fallback to hardcoded
  function _contactFor(startup, fallbackName, fallbackEmail, fallbackSector, fallbackStage) {
    return {
      name: (startup && startup.contact_name) || fallbackName,
      email: (startup && startup.contact_email) || fallbackEmail,
      sector: (startup && startup.sector) || fallbackSector,
      stage: (startup && startup.stage) || fallbackStage
    };
  }
  const contacts = [
    _contactFor(startups[0], 'Tim Berger',  't.berger@stackly.io',  'B2B SaaS',   'Seed'),
    _contactFor(startups[1], 'Sarah Moll',  's.moll@pipeforge.io',  'DevTools',   'Pre-Seed'),
    _contactFor(startups[2], 'Anna Kern',   'a.kern@mediloop.io',   'HealthTech', 'Seed'),
    _contactFor(startups[3], 'Leon Huber',  'l.huber@cortexia.io',  'AI',         'Pre-Seed')
  ];

  const configs = [
    {
      startup: startups[0] || startups[0],
      label: startups[0] ? (startups[0].company_name || startups[0].anon_id) : 'Stackly',
      contact: contacts[0],
      status: 'keine_antwort',
      daysAgo: 5,
      tpl: 'interesse'
    },
    {
      startup: startups[1] || startups[1],
      label: startups[1] ? (startups[1].company_name || startups[1].anon_id) : 'Pipeforge',
      contact: contacts[1],
      status: 'keine_antwort',
      daysAgo: 3,
      tpl: 'screening'
    },
    {
      startup: startups[2] || startups[2],
      label: startups[2] ? (startups[2].company_name || startups[2].anon_id) : 'Mediloop',
      contact: contacts[2],
      status: 'geantwortet',
      daysAgo: 2,
      tpl: 'interesse'
    },
    {
      startup: startups[3] || startups[3],
      label: startups[3] ? (startups[3].company_name || startups[3].anon_id) : 'Cortexia',
      contact: contacts[3],
      status: 'anfrage_gesendet',
      daysAgo: 0,
      tpl: 'interesse'
    }
  ];

  const outreachItems = configs.map(cfg => {
    const sentAt = now - cfg.daysAgo * day;
    const outMsg = {
      id: uid(),
      direction: 'outbound',
      sender: 'Paretix Ventures',
      text: cfg.tpl === 'screening'
        ? `Hallo ${cfg.contact.name.split(' ')[0]},\n\nvielen Dank für eure Einreichung bei unserem Fonds. Nach einer ersten Sichtung eures Profils würden wir euch gern besser kennenlernen.\n\nWäre ein 20-minütiges Screening-Gespräch in den nächsten Tagen möglich? Dabei würde ich gern mehr über euren aktuellen Stand, eure Traktion und euren Kapitalbedarf erfahren.\n\nMit freundlichen Grüßen\nParetix Ventures`
        : `Hallo ${cfg.contact.name.split(' ')[0]},\n\nvielen Dank für eure Bewerbung bei Paretix Ventures. Wir haben euer Profil gesichtet und sind sehr interessiert an einem kurzen Kennenlernen.\n\nHätten Sie in den nächsten Tagen kurz Zeit für einen 15-minütigen Intro-Call? Ich würde mich freuen, mehr über euren aktuellen Stand zu erfahren.\n\nMit freundlichen Grüßen\nParetix Ventures`,
      ts: sentAt
    };

    const msgs = [outMsg];

    if (cfg.status === 'geantwortet') {
      msgs.push({
        id: uid(),
        direction: 'inbound',
        sender: cfg.contact.name,
        text: `Hallo Andreas,\n\nvielen Dank für Ihre Nachricht! Wir freuen uns sehr über Ihr Interesse. Ein Kennenlerngespräch klingt toll — ich schicke Ihnen gleich einen Calendly-Link.\n\nBeste Grüße\n${cfg.contact.name}`,
        ts: sentAt + 6 * 60 * 60 * 1000
      });
    }

    const lastMsg = msgs[msgs.length - 1];
    return {
      id: uid(),
      anon_id: cfg.startup ? cfg.startup.anon_id : null,
      display_label: cfg.label,
      contact_name: cfg.contact.name,
      contact_email: cfg.contact.email,
      sector: cfg.contact.sector,
      stage: cfg.contact.stage,
      status: cfg.status,
      sent_at: sentAt,
      last_activity_at: lastMsg.ts,
      last_message_preview: lastMsg.text.slice(0, 70),
      last_message_from: lastMsg.direction,
      thread_id: null,
      conversation_id: uid(),
      messages: msgs
    };
  });

  setOutreach(outreachItems);
}
