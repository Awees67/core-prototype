/* =========================
   RENDERER — COMPARE VIEW
   NOTE: renderCompare is monkey-patched/replaced in main.js (V5 version).
   This version serves as the V4.1 base and is not executed at runtime.
   KEEP: The V5 override in main.js defines the actual compare functionality.
========================= */
function renderCompare(){
  hideAllViews();
  const v = document.getElementById("viewCompare");
  v.style.display = "";

  const ids = getCompare().slice(0, 10);
  const deals = ids.map(id => startups.find(s => s.anon_id === id)).filter(Boolean);

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
      Keine Deals im Compare. Füge Deals über „Add to Compare" hinzu.
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
          ${escapeHTML(s.anon_id)}
          <div class="tiny" style="margin:4px 0 0 0;">${escapeHTML(s.hq||"")} • ${escapeHTML(s.stage||"")}</div>
        </td>
        <td>${cell(mrr, maxMRR, s.anon_id===topMRR.anon_id, fmtEUR)}</td>
        <td>${cell(gr, maxGrowth, s.anon_id===topGrowth.anon_id, fmtPct)}</td>
        <td>${cell(rw, maxRunway, s.anon_id===topRunway.anon_id, fmtM)}</td>
        <td>${cell(lv, maxLTV, s.anon_id===topLTV.anon_id, fmtRatio)}</td>
      </tr>
    `;
  }).join("");
}

/* =========================
   COMPARE ACTIONS
========================= */
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
