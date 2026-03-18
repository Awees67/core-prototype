function computeSignalIndex(anon_id){
  const s = startups.find(x=>x.anon_id===anon_id);
  if(!s) return 0;

  // Demo-only heuristic: combine UE/RQ/CE + some KPI norms
  const ue = classifyUE(s);
  const rq = classifyRQ(s);
  const ce = classifyCE(s);

  let score = 50;
  const bump = (v)=>{ score += v; };

  if(ue==="Strong") bump(12);
  if(ue==="No Risk") bump(7);
  if(ue==="Risk") bump(-10);

  if(rq==="High") bump(12);
  if(rq==="Stable") bump(4);
  if(rq==="Risk") bump(-10);

  if(ce==="Efficient") bump(12);
  if(ce==="Neutral") bump(4);
  if(ce==="Inefficient") bump(-12);

  const mrr = Number(s.mrr_eur || 0);
  const growth = Number(s.growth?.value_pct ?? 0);
  const runway = Number(s.runway_months || 0);
  const burn = Number(s.burn_eur || 0);
  const nrr = Number(s.nrr_pct || 0);
  const ltvCac = Number(s.ltv_cac_ratio || 0);

  if(mrr >= 50000) bump(6);
  else if(mrr >= 20000) bump(3);

  if(growth >= 15) bump(6);
  else if(growth >= 8) bump(3);
  else if(growth < 0) bump(-4);

  if(runway >= 18) bump(6);
  else if(runway >= 12) bump(3);
  else if(runway < 6) bump(-6);

  if(burn <= 40000) bump(3);
  else if(burn >= 120000) bump(-4);

  if(nrr >= 120) bump(6);
  else if(nrr >= 110) bump(3);
  else if(nrr < 100) bump(-6);

  if(ltvCac >= 5) bump(6);
  else if(ltvCac >= 3) bump(3);
  else if(ltvCac < 2) bump(-6);

  score = Math.max(0, Math.min(100, Math.round(score)));
  return score;
}

/* =========================
   ADD-ONLY: Signal Index Explainability (v2)
========================= */
let _signalPopoverState = { open:false, anon_id:null };

function closeSignalPopover(){
  const pop = document.getElementById("signalIndexPopover");
  if(!pop) return;
  pop.style.display = "none";
  pop.innerHTML = "";
  _signalPopoverState = { open:false, anon_id:null };
}

function openSignalPopover(anchorEl, html, anon_id=null){
  const pop = document.getElementById("signalIndexPopover");
  if(!pop || !anchorEl) return;

  pop.innerHTML = html;
  pop.style.display = "block";
  _signalPopoverState = { open:true, anon_id: anon_id };

  // Position near anchor (viewport safe)
  const r = anchorEl.getBoundingClientRect();
  const pad = 10;

  // make sure we can measure
  pop.style.left = "0px";
  pop.style.top = "0px";
  const pr = pop.getBoundingClientRect();

  let left = r.left + window.scrollX;
  let top = r.bottom + window.scrollY + 8;

  // clamp horizontally
  left = Math.min(left, window.scrollX + window.innerWidth - pr.width - pad);
  left = Math.max(left, window.scrollX + pad);

  // if too low, place above
  if(top + pr.height > window.scrollY + window.innerHeight - pad){
    top = r.top + window.scrollY - pr.height - 8;
  }
  top = Math.max(top, window.scrollY + pad);

  pop.style.left = left + "px";
  pop.style.top = top + "px";
}

function _siRuleHit(label, value, ruleText, points){
  return { label, value, rule: ruleText, points };
}

function buildSignalIndexBreakdown(anon_id){
  const s = startups.find(x=>x.anon_id===anon_id);
  if(!s){
    return { anon_id, total:0, computed_at:Date.now(), parts:[], note:"Startup nicht gefunden." };
  }

  // Use existing computeSignalIndex logic, but expose contributions.
  const ue = classifyUE(s);
  const rq = classifyRQ(s);
  const ce = classifyCE(s);

  const mrr = Number(s.mrr_eur || 0);
  const growth = Number(s.growth?.value_pct ?? 0);
  const runway = Number(s.runway_months || 0);
  const burn = Number(s.burn_eur || 0);
  const nrr = Number(s.nrr_pct || 0);
  const ltvCac = Number(s.ltv_cac_ratio || 0);

  let base = 50;
  const parts = [];

  // Signals UE/RQ/CE
  if(ue==="Strong") parts.push(_siRuleHit("UE", ue, "Strong → +12", 12));
  else if(ue==="No Risk") parts.push(_siRuleHit("UE", ue, "No Risk → +7", 7));
  else if(ue==="Risk") parts.push(_siRuleHit("UE", ue, "Risk → -10", -10));
  else parts.push(_siRuleHit("UE", ue, "—", 0));

  if(rq==="High") parts.push(_siRuleHit("RQ", rq, "High → +12", 12));
  else if(rq==="Stable") parts.push(_siRuleHit("RQ", rq, "Stable → +4", 4));
  else if(rq==="Risk") parts.push(_siRuleHit("RQ", rq, "Risk → -10", -10));
  else parts.push(_siRuleHit("RQ", rq, "—", 0));

  if(ce==="Efficient") parts.push(_siRuleHit("CE", ce, "Efficient → +12", 12));
  else if(ce==="Neutral") parts.push(_siRuleHit("CE", ce, "Neutral → +4", 4));
  else if(ce==="Inefficient") parts.push(_siRuleHit("CE", ce, "Inefficient → -12", -12));
  else parts.push(_siRuleHit("CE", ce, "—", 0));

  // KPI bumps (same thresholds as computeSignalIndex)
  if(mrr >= 50000) parts.push(_siRuleHit("MRR", mrr, ">= 50k → +6", 6));
  else if(mrr >= 20000) parts.push(_siRuleHit("MRR", mrr, ">= 20k → +3", 3));
  else parts.push(_siRuleHit("MRR", mrr, "< 20k → +0", 0));

  if(growth >= 15) parts.push(_siRuleHit("Growth", growth, ">= 15% → +6", 6));
  else if(growth >= 8) parts.push(_siRuleHit("Growth", growth, ">= 8% → +3", 3));
  else if(growth < 0) parts.push(_siRuleHit("Growth", growth, "< 0% → -4", -4));
  else parts.push(_siRuleHit("Growth", growth, "0–<8% → +0", 0));

  if(runway >= 18) parts.push(_siRuleHit("Runway", runway, ">= 18m → +6", 6));
  else if(runway >= 12) parts.push(_siRuleHit("Runway", runway, ">= 12m → +3", 3));
  else if(runway < 6) parts.push(_siRuleHit("Runway", runway, "< 6m → -6", -6));
  else parts.push(_siRuleHit("Runway", runway, "6–<12m → +0", 0));

  if(burn <= 40000) parts.push(_siRuleHit("Burn", burn, "<= 40k → +3", 3));
  else if(burn >= 120000) parts.push(_siRuleHit("Burn", burn, ">= 120k → -4", -4));
  else parts.push(_siRuleHit("Burn", burn, "40k–<120k → +0", 0));

  if(nrr >= 120) parts.push(_siRuleHit("NRR", nrr, ">= 120% → +6", 6));
  else if(nrr >= 110) parts.push(_siRuleHit("NRR", nrr, ">= 110% → +3", 3));
  else if(nrr < 100 && nrr>0) parts.push(_siRuleHit("NRR", nrr, "< 100% → -6", -6));
  else parts.push(_siRuleHit("NRR", nrr||null, "missing/neutral → +0", 0));

  if(ltvCac >= 5) parts.push(_siRuleHit("LTV/CAC", ltvCac, ">= 5 → +6", 6));
  else if(ltvCac >= 3) parts.push(_siRuleHit("LTV/CAC", ltvCac, ">= 3 → +3", 3));
  else if(ltvCac > 0 && ltvCac < 2) parts.push(_siRuleHit("LTV/CAC", ltvCac, "< 2 → -6", -6));
  else parts.push(_siRuleHit("LTV/CAC", ltvCac||null, "missing/neutral → +0", 0));

  const delta = parts.reduce((a,b)=>a + (Number(b.points)||0), 0);
  let total = base + delta;
  total = Math.max(0, Math.min(100, Math.round(total)));

  return {
    anon_id,
    base,
    delta,
    total,
    computed_at: Date.now(),
    parts
  };
}

function buildSignalLegendHTML(){
  return `
    <h4>Signal Index – Erklärung (Demo)</h4>
    <div class="muted">Signal Index ist ein Demo-Score zur Orientierung und ersetzt keine Due Diligence.</div>
    <ul>
      <li><b>Basis</b>: Startwert 50</li>
      <li><b>Signals</b>: UE/RQ/CE (badges) beeinflussen den Score</li>
      <li><b>KPIs</b>: MRR, Growth, Runway, Burn, NRR, LTV/CAC liefern zusätzliche Punkte</li>
    </ul>
    <div class="mini">Tipp: In der Pipeline kannst du auch auf das kleine ⓘ neben einem konkreten Wert klicken, um den Breakdown pro Deal zu sehen.</div>
    <div class="mini" style="margin-top:8px;">Hinweis: Anonymisierte Demo. Daten können unvollständig/ungeprüft sein.</div>
  `;
}

function buildSignalBreakdownHTML(anon_id){
  const b = buildSignalIndexBreakdown(anon_id);
  const rows = (b.parts||[]).map(p=>`
    <tr>
      <td>${escapeHTML(String(p.label||""))}</td>
      <td>${escapeHTML(p.value===null || p.value===undefined ? "—" : String(p.value))}</td>
      <td>${escapeHTML(String(p.rule||""))}</td>
      <td>${escapeHTML(String(p.points||0))}</td>
    </tr>
  `).join("");

  return `
    <h4>Signal Index – Breakdown</h4>
    <div class="muted">Startup: <b>${escapeHTML(anon_id)}</b> • Gesamt: <b>${escapeHTML(String(b.total))}</b> (Basis ${escapeHTML(String(b.base))} + Delta ${escapeHTML(String(b.delta))})</div>
    <table>
      <thead>
        <tr><th>Faktor</th><th>Wert</th><th>Regel (Demo)</th><th>Punkte</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="mini" style="margin-top:8px;">Zuletzt berechnet: ${new Date(b.computed_at||Date.now()).toLocaleString("de-DE")}</div>
    <div class="mini">Signal Index ist ein Demo-Score zur Orientierung und ersetzt keine Due Diligence.</div>
  `;
}

// Close popover on outside click
document.addEventListener("click",(e)=>{
  const pop = document.getElementById("signalIndexPopover");
  if(!pop || pop.style.display==="none") return;
  const onIcon = e.target.closest(".infoicon");
  const inside = pop.contains(e.target);
  if(!onIcon && !inside){
    closeSignalPopover();
  }
});
window.addEventListener("resize", ()=>{
  // close on resize to avoid awkward positions
  if(_signalPopoverState.open) closeSignalPopover();
});

/* =========================
   V4.1 JS patches (requested)
========================= */

// Lock background scroll while Signal popover is open
(function(){
  if(typeof openSignalPopover === "function" && !openSignalPopover._v41){
    const _o = openSignalPopover;
    openSignalPopover = function(anchorEl, html, anon_id=null){
      document.body.classList.add("no-scroll");
      _o(anchorEl, html, anon_id);
    };
    openSignalPopover._v41 = true;
  }
  if(typeof closeSignalPopover === "function" && !closeSignalPopover._v41){
    const _c = closeSignalPopover;
    closeSignalPopover = function(){
      document.body.classList.remove("no-scroll");
      _c();
    };
    closeSignalPopover._v41 = true;
  }
})();

// Make Signal class a bit more "realistic" (less optimistic) in V4.1
function sigClassFromScore(score){
  const n = Number(score||0);
  // slightly stricter thresholds
  if(n >= 80) return "HIGH";
  if(n >= 55) return "MID";
  return "LOW";
}

function sigToneFromClass(cls){
  if(cls==="HIGH") return "high";
  if(cls==="MID") return "mid";
  return "low";
}

// Expand Signal popover with an (i) legend for classes + signal badges
function buildSignalExplainHTML(anon_id){
  const score = computeSignalIndex(anon_id);
  const cls = sigClassFromScore(score);
  const tone = sigToneFromClass(cls);

  const breakdown = (typeof buildSignalIndexBreakdown === "function")
    ? buildSignalIndexBreakdown(anon_id)
    : null;

  let breakdownHtml = "";
  if(breakdown){
    const rows = (breakdown.parts||[]).map(p=>`
      <tr>
        <td>${escapeHTML(String(p.label||""))}</td>
        <td>${escapeHTML(p.value===null || p.value===undefined ? "—" : String(p.value))}</td>
        <td>${escapeHTML(String(p.rule||""))}</td>
        <td>${escapeHTML(String(p.points||0))}</td>
      </tr>
    `).join("");
    breakdownHtml = `
      <div class="sig-mini">Komponenten (Demo):</div>
      <div class="sig-reasons" style="margin-top:8px;">
        <div class="t">Breakdown</div>
        <table>
          <thead><tr><th>Faktor</th><th>Wert</th><th>Regel</th><th>Punkte</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  const legendId = "sigLegend_" + anon_id.replace(/[^a-z0-9]/gi,"");
  return `
    <div class="panel" style="border-radius:14px;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <div style="font-weight:950;">
          Signal Index: <span class="mono">${score}</span>
          <span class="badge ${tone==="high"?"good":(tone==="mid"?"hot":"watch")}">${cls}</span>
          <button class="btn secondary small" style="padding:2px 8px; margin-left:6px;" data-toggle-legend="${legendId}" aria-label="Erklärung öffnen">(i)</button>
        </div>
        <div class="muted-note" style="font-weight:900;">Demo-Score • ersetzt keine Due Diligence</div>
      </div>

      <div id="${legendId}" style="display:none; margin-top:10px;">
        <div class="helper" style="margin-bottom:10px;">
          <b>Signal Klassen (realistisch/konservativ)</b><br>
          HIGH: ≥ 80 • MID: 55–79 • LOW: &lt; 55<br>
          Zusätzlich: fehlende KPIs werden als <i>Missing</i> ausgewiesen (kein Schönrechnen).
        </div>
        <div class="helper">
          <b>Hot / Watch / Standard</b> (Signals): entstehen aus Kombinationen von Momentum (Growth), Risiko (Runway/Burn) und Effizienz (LTV/CAC/NRR), nicht aus einem einzigen KPI.
        </div>
      </div>

      ${breakdownHtml}

      <div class="helper" style="margin-top:10px;">
        Hinweis: Anonymisierte Demo. KPI/Signale sind indikativ und können unvollständig/ungeprüft sein.
      </div>
    </div>
  `;
}

// Toggle legend inside popover (event delegation)
document.addEventListener("click", (e)=>{
  const btn = e.target.closest("[data-toggle-legend]");
  if(!btn) return;
  const id = btn.getAttribute("data-toggle-legend");
  const el = document.getElementById(id);
  if(!el) return;
  el.style.display = (el.style.display === "none" || !el.style.display) ? "block" : "none";
});

// Pipeline: stronger status color semantics (without redesign)
function statusTone(status){
  const s = String(status||"").toLowerCase();
  if(s==="passed") return "bad";
  if(s==="invested" || s==="term sheet") return "good";
  if(s==="ic" || s==="diligence" || s==="contacted") return "warn";
  return ""; // screening/unknown neutral
}
