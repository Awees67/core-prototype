/* =========================
   DROPDOWN MULTI (Reusable)
========================= */
function closeAllDropdowns(exceptEl){
  document.querySelectorAll(".dd.open").forEach(dd=>{
    if(exceptEl && dd === exceptEl) return;
    dd.classList.remove("open");
  });
}
function renderDropdownMulti(containerId, title, options, selectedSet, labelFn, onChange){
  const host = document.getElementById(containerId);
  host.innerHTML = "";

  const dd = document.createElement("div");
  dd.className = "dd";
  dd.tabIndex = -1;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "dd-btn";

  function labelSummary(){
    const n = selectedSet.size;
    if(n===0) return { main:"Alle", pills:[] };
    const vals = Array.from(selectedSet).slice(0,2).map(v=>labelFn ? labelFn(v) : v);
    const pills = vals.map(t=>t);
    if(n>2) pills.push("+"+(n-2));
    return { main: n + " ausgewählt", pills };
  }

  function renderBtn(){
    const s = labelSummary();
    btn.innerHTML = `
      <div class="left">
        <span style="font-weight:950;">${title}</span>
        <span class="dd-pill">${s.main}</span>
        ${s.pills.map(p=>`<span class="dd-pill">${p}</span>`).join("")}
      </div>
      <span style="font-weight:950; opacity:0.8;">▾</span>
    `;
  }

  const panel = document.createElement("div");
  panel.className = "dd-panel";

  const search = document.createElement("input");
  search.className = "dd-search";
  search.type = "text";
  search.placeholder = "Suchen…";

  const list = document.createElement("div");
  list.className = "dd-list";

  function renderList(filterText){
    const ft = String(filterText||"").trim().toLowerCase();
    list.innerHTML = "";
    options.forEach(v=>{
      const label = labelFn ? labelFn(v) : v;
      if(ft && !String(label).toLowerCase().includes(ft)) return;

      const item = document.createElement("label");
      item.className = "dd-item";
      const id = `${containerId}_${String(v).replace(/[^a-z0-9]/gi,'_')}`;
      item.setAttribute("for", id);
      item.innerHTML = `<input id="${id}" type="checkbox" ${selectedSet.has(v) ? "checked" : ""}/> <span>${label}</span>`;
      const cb = item.querySelector("input");
      cb.addEventListener("change",(e)=>{
        if(e.target.checked) selectedSet.add(v);
        else selectedSet.delete(v);
        renderBtn();
        if(onChange) onChange();
      });
      list.appendChild(item);
    });

    if(list.children.length===0){
      const empty = document.createElement("div");
      empty.className = "tiny";
      empty.textContent = "Keine Treffer.";
      list.appendChild(empty);
    }
  }

  const actions = document.createElement("div");
  actions.className = "dd-actions";
  actions.innerHTML = `
    <div class="tiny" style="margin:0;">OR innerhalb der Kategorie</div>
    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <button type="button" class="mini" data-act="all">Alle</button>
      <button type="button" class="mini" data-act="none">Keine</button>
    </div>
  `;
  actions.querySelector('[data-act="all"]').addEventListener("click", ()=>{
    options.forEach(v=>selectedSet.add(v));
    renderList(search.value);
    renderBtn();
    if(onChange) onChange();
  });
  actions.querySelector('[data-act="none"]').addEventListener("click", ()=>{
    selectedSet.clear();
    renderList(search.value);
    renderBtn();
    if(onChange) onChange();
  });

  panel.appendChild(search);
  panel.appendChild(list);
  panel.appendChild(actions);

  btn.addEventListener("click",(e)=>{
    e.preventDefault();
    const isOpen = dd.classList.contains("open");
    closeAllDropdowns(dd);
    dd.classList.toggle("open", !isOpen);
    if(!isOpen){
      search.value = "";
      renderList("");
      setTimeout(()=>search.focus(), 0);
    }
  });

  search.addEventListener("input", ()=> renderList(search.value));

  dd.appendChild(btn);
  dd.appendChild(panel);
  host.appendChild(dd);

  renderBtn();
  renderList("");

  return { dd, refresh: ()=>{ renderBtn(); renderList(search.value); } };
}

/* =========================
   SUB-SECTOR DROPDOWN (context-aware)
========================= */
function getAvailableSubSectors(sectorSet){
  const available = [];
  const seen = new Set();
  for(const sector of sectorSet){
    for(const sub of (SECTOR_MAP[sector] || [])){
      if(!seen.has(sub)){ available.push(sub); seen.add(sub); }
    }
  }
  return available;
}

function cleanSubSectorsByAvailable(tempSubSectorSet, available){
  const availSet = new Set(available);
  for(const sub of [...tempSubSectorSet]){
    if(!availSet.has(sub)) tempSubSectorSet.delete(sub);
  }
}

function renderSubSectorDropdown(containerId, tempSectorSet, tempSubSectorSet){
  let ddRef = null;

  function render(){
    const available = getAvailableSubSectors(tempSectorSet);
    cleanSubSectorsByAvailable(tempSubSectorSet, available);
    const host = document.getElementById(containerId);
    if(!host) return;
    host.innerHTML = "";

    if(available.length === 0){
      const dd = document.createElement("div");
      dd.className = "dd";
      dd.innerHTML = `<button type="button" class="dd-btn" disabled style="opacity:0.5; cursor:not-allowed;">
        <div class="left">
          <span style="font-weight:950;">Auswahl</span>
          <span class="dd-pill">Wähle zuerst einen Sektor</span>
        </div>
        <span style="font-weight:950; opacity:0.8;">▾</span>
      </button>`;
      host.appendChild(dd);
      ddRef = null;
    } else {
      ddRef = renderDropdownMulti(containerId, "Auswahl", available, tempSubSectorSet, (x)=>x);
    }
  }

  render();
  return { refresh: render };
}

/* =========================
   FILTER MODAL UI
========================= */
let DD_REFS = null;

function openFilterModal(){
  syncFilterModalFromState();
  const bd = document.getElementById("filterBackdrop");
  bd.style.display = "flex";
  bd.setAttribute("aria-hidden","false");
}
function closeFilterModal(){
  closeAllDropdowns();
  const bd = document.getElementById("filterBackdrop");
  bd.style.display = "none";
  bd.setAttribute("aria-hidden","true");
}

function syncFilterModalFromState(){
  const tempOrigin = new Set(filters.origin);
  const tempMarket = new Set(filters.market);
  const tempStage = new Set(filters.stage);
  const tempSector = new Set(filters.sector);
  const tempSubSector = new Set(filters.sub_sector);

  document.getElementById("filterBackdrop")._temp = { tempOrigin, tempMarket, tempStage, tempSector, tempSubSector };

  const marketLabel = (k)=>{
    const m = FILTER_OPTIONS.market.find(x=>x.key===k);
    return m ? m.label : k;
  };

  const subSectorDDRef = renderSubSectorDropdown("subSectorDD", tempSector, tempSubSector);

  DD_REFS = {
    origin: renderDropdownMulti("originDD", "Auswahl", FILTER_OPTIONS.origin, tempOrigin, (x)=>x),
    market: renderDropdownMulti("marketDD", "Auswahl", FILTER_OPTIONS.market.map(x=>x.key), tempMarket, marketLabel),
    stage: renderDropdownMulti("stageDD", "Auswahl", FILTER_OPTIONS.stage, tempStage, (x)=>x),
    sector: renderDropdownMulti("sectorDD", "Auswahl", FILTER_OPTIONS.sector, tempSector, (x)=>x, ()=>subSectorDDRef.refresh())
  };

  document.getElementById("ueSelect").value = filters.ue;
  document.getElementById("rqSelect").value = filters.rq;
  document.getElementById("ceSelect").value = filters.ce;

  document.getElementById("advToggle").checked = !!filters.advEnabled;
  document.getElementById("advFields").style.display = filters.advEnabled ? "" : "none";
  document.getElementById("nrrMin").value = filters.nrrMin ?? "";
  document.getElementById("ltvCacMin").value = filters.ltvCacMin ?? "";

  document.getElementById("mrrMin").value = filters.mrrMin ?? "";
  document.getElementById("mrrMax").value = filters.mrrMax ?? "";
  document.getElementById("growthMin").value = filters.growthMin ?? "";
  document.getElementById("runwayMin").value = filters.runwayMin ?? "";
  document.getElementById("burnMax").value = filters.burnMax ?? "";
  document.getElementById("ebitdaMin").value = filters.ebitdaMin ?? "";

  document.getElementById("ticketMin").value = filters.ticketMin ?? "";
  document.getElementById("ticketMax").value = filters.ticketMax ?? "";
}

function applyFilterModal(){
  const bd = document.getElementById("filterBackdrop");
  const temp = bd._temp || {};
  const pn = parseNullableNumber;
  const f = {
    origin: Array.from(temp.tempOrigin || []),
    market: Array.from(temp.tempMarket || []),
    stage: Array.from(temp.tempStage || []),
    sector: Array.from(temp.tempSector || []),
    sub_sector: Array.from(temp.tempSubSector || []),
    ue: document.getElementById("ueSelect").value,
    rq: document.getElementById("rqSelect").value,
    ce: document.getElementById("ceSelect").value,
    advEnabled: document.getElementById("advToggle").checked,
    nrrMin: pn(document.getElementById("nrrMin").value),
    ltvCacMin: pn(document.getElementById("ltvCacMin").value),
    mrrMin: pn(document.getElementById("mrrMin").value),
    mrrMax: pn(document.getElementById("mrrMax").value),
    growthMin: pn(document.getElementById("growthMin").value),
    runwayMin: pn(document.getElementById("runwayMin").value),
    burnMax: pn(document.getElementById("burnMax").value),
    ebitdaMin: pn(document.getElementById("ebitdaMin").value),
    ticketMin: pn(document.getElementById("ticketMin").value),
    ticketMax: pn(document.getElementById("ticketMax").value)
  };
  applyFilterObject(f);
  saveUIState();
  renderCurrent();
  closeFilterModal();
  toast("Filter angewendet", `${countActiveFilters()} aktiv`);
}

function resetFiltersAll(){
  filters = makeFilters();
  saveUIState();
  renderCurrent();
  toast("Reset", "Filter zurückgesetzt");
}

function parseNullableNumber(v){
  const t = String(v || "").trim();
  if(!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function countActiveFilters(){
  let c = 0;
  c += filters.origin.size;
  c += filters.market.size;
  c += filters.stage.size;
  c += filters.sector.size;
  c += filters.sub_sector.size;

  if(filters.ue !== "All") c++;
  if(filters.rq !== "All") c++;
  if(filters.ce !== "All") c++;

  if(filters.advEnabled && filters.nrrMin !== null) c++;
  if(filters.advEnabled && filters.ltvCacMin !== null) c++;

  if(filters.mrrMin !== null) c++;
  if(filters.mrrMax !== null) c++;
  if(filters.growthMin !== null) c++;
  if(filters.runwayMin !== null) c++;
  if(filters.burnMax !== null) c++;
  if(filters.ebitdaMin !== null) c++;

  if(filters.ticketMin !== null) c++;
  if(filters.ticketMax !== null) c++;

  return c;
}

/* =========================
   FILTER MATCHING
========================= */
function inSetOrAll(setObj, value){
  if(!setObj || setObj.size === 0) return true;
  return setObj.has(value);
}
function anyInSetOrAll(setObj, arr){
  if(!setObj || setObj.size === 0) return true;
  for(const v of arr || []) if(setObj.has(v)) return true;
  return false;
}

function matchesFilters(s){
  if(!inSetOrAll(filters.origin, s.origin_country)) return false;
  if(!anyInSetOrAll(filters.market, s.market_served)) return false;
  if(!inSetOrAll(filters.stage, s.stage)) return false;
  if(!inSetOrAll(filters.sector, s.sector)) return false;
  if(!inSetOrAll(filters.sub_sector, s.sub_sector)) return false;

  const ue = classifyUE(s);
  const rq = classifyRQ(s);
  const ce = classifyCE(s);

  if(filters.ue !== "All" && ue !== filters.ue) return false;
  if(filters.rq !== "All" && rq !== filters.rq) return false;
  if(filters.ce !== "All" && ce !== filters.ce) return false;

  if(filters.advEnabled){
    if(filters.nrrMin !== null && s.nrr_pct < filters.nrrMin) return false;
    if(filters.ltvCacMin !== null && s.ltv_cac_ratio < filters.ltvCacMin) return false;
  }

  if(filters.mrrMin !== null && s.mrr_eur < filters.mrrMin) return false;
  if(filters.mrrMax !== null && s.mrr_eur > filters.mrrMax) return false;

  const g = s.growth?.value_pct ?? null;
  if(filters.growthMin !== null && (g === null || g < filters.growthMin)) return false;

  if(filters.runwayMin !== null && s.runway_months < filters.runwayMin) return false;
  if(filters.burnMax !== null && s.burn_eur_per_month > filters.burnMax) return false;

  const e = s.ebitda_margin_pct?.to ?? null;
  if(filters.ebitdaMin !== null && (e === null || e < filters.ebitdaMin)) return false;

  // Ticket range (round size)
  if(filters.ticketMin !== null && s.ticket_eur < filters.ticketMin) return false;
  if(filters.ticketMax !== null && s.ticket_eur > filters.ticketMax) return false;

  return true;
}

/* =========================
   SORTING + SEARCH
========================= */
function getSortFn(){
  const v = document.getElementById("sortSelect").value;
  if(v==="growth_desc"){
    return (a,b)=> ((b.growth?.value_pct||0) - (a.growth?.value_pct||0));
  }
  if(v==="runway_desc"){
    return (a,b)=> (b.runway_months - a.runway_months);
  }
  if(v==="burn_asc"){
    return (a,b)=> (a.burn_eur_per_month - b.burn_eur_per_month);
  }
  if(v==="nrr_desc"){
    return (a,b)=> (b.nrr_pct - a.nrr_pct);
  }
  if(v==="ltvcac_desc"){
    return (a,b)=> (b.ltv_cac_ratio - a.ltv_cac_ratio);
  }
  if(v==="ticket_desc"){
    return (a,b)=> (b.ticket_eur - a.ticket_eur);
  }
  if(v==="arr_desc"){
    return (a,b)=> (b.arr_eur - a.arr_eur);
  }
  return (a,b)=> (b.mrr_eur - a.mrr_eur);
}

function matchesSearch(s, q){
  if(!q) return true;
  const t = q.toLowerCase().trim();
  if(!t) return true;

  // allow search by ID like L-7507
  if(s.anon_id && s.anon_id.toLowerCase() === t) return true;

  const hay = [
    s.anon_id,
    s.origin_country,
    (s.market_served||[]).join(" "),
    s.stage,
    s.sector,
    s.sub_sector || "",
    s.notes || ""
  ].join(" ").toLowerCase();

  return hay.includes(t);
}

function buildFilteredList(){
  const searchVal = document.getElementById("searchInput").value;
  const sortFn = getSortFn();
  return startups
    .filter(s=>matchesFilters(s))
    .filter(s=>matchesSearch(s, searchVal))
    .slice()
    .sort(sortFn);
}
