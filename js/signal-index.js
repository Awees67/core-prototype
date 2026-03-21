/* =========================
   computeSignalIndex → Proxy für computeCustomIndexV6
   Signal Index ist ersetzt durch Custom Index (Score).
   Diese Funktion bleibt als Proxy um bestehende Referenzen nicht zu brechen.
========================= */
function computeSignalIndex(anon_id){
  try{
    const res = computeCustomIndexV6(anon_id);
    return (res && res.score !== null) ? res.score : 50;
  }catch(_){ return 50; }
}

/* =========================
   Popover-Infrastruktur (wird für Score Breakdown wiederverwendet)
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

  // Popover uses position:fixed — coordinates are viewport-relative, no scroll offset needed
  const r = anchorEl.getBoundingClientRect();
  const pad = 10;

  pop.style.left = "0px";
  pop.style.top = "0px";
  const pr = pop.getBoundingClientRect();

  let left = r.left;
  let top = r.bottom + 8;

  // clamp horizontally within viewport
  left = Math.min(left, window.innerWidth - pr.width - pad);
  left = Math.max(left, pad);

  // if too low, place above anchor
  if(top + pr.height > window.innerHeight - pad){
    top = r.top - pr.height - 8;
  }
  top = Math.max(top, pad);

  pop.style.left = left + "px";
  pop.style.top = top + "px";

  _initPopoverDrag(pop);
}

/* =========================
   Score Breakdown Hilfsfunktionen (neu)
========================= */

function getScoreColorClass(score){
  const n = Number(score ?? 0);
  if(n <= 30) return "score-red";
  if(n <= 60) return "score-orange";
  if(n <= 80) return "score-yellow";
  return "score-green";
}

function formatOperatorLabel(operator, value, unit){
  const op = String(operator || "").toLowerCase();
  const fmt = (v) => {
    if(v === null || v === undefined) return "—";
    if(unit === "EUR") return fmtEUR(v);
    if(unit === "percent") return v + "%";
    if(unit === "months") return v + " Monate";
    if(unit === "x") return v + "x";
    if(unit === "Personen") return v + " Mitarbeiter";
    return String(v);
  };

  if(op === "between_inclusive" || op === "between_exclusive"){
    const min = value?.min, max = value?.max;
    return "zwischen " + fmt(min) + " und " + fmt(max);
  }

  const labels = {
    lt: "unter",
    lte: "maximal",
    gt: "über",
    gte: "mindestens",
    eq: "genau",
    neq: "nicht"
  };
  return (labels[op] || op) + " " + fmt(value);
}

function buildCustomBreakdownHTML(anon_id, res){
  const rules = (typeof getCustomRulesV6 === "function") ? getCustomRulesV6() : {};
  const rulesetName = rules.name || "Ruleset";
  const score = (res && res.score !== null && res.score !== undefined) ? res.score : "—";
  const breakdown = (res && Array.isArray(res.breakdown)) ? res.breakdown : [];
  const startScore = rules.scoring?.start_score ?? 50;

  const triggered = breakdown.filter(b => !b.skipped);

  const rows = triggered.map(b => {
    const kpiDef = rules.kpi_map?.[b.kpi] || {};
    const kpiLabel = kpiDef.label || b.kpi;
    const unit = kpiDef.unit || "";
    const pts = Number(b.points || 0);
    const sign = pts > 0 ? "+" : "";
    const opLabel = formatOperatorLabel(b.operator, b.threshold, unit);
    const icon = pts > 0 ? "✓" : (pts < 0 ? "⚠" : "—");
    const cls = pts > 0 ? "breakdown-positive" : (pts < 0 ? "breakdown-negative" : "breakdown-zero");

    return `
      <div class="breakdown-item">
        <div class="breakdown-rule">${escapeHTML(icon)} ${escapeHTML(kpiLabel)} ${escapeHTML(opLabel)}</div>
        <div class="breakdown-points ${cls}">${sign}${pts} Pkt.</div>
      </div>
    `;
  }).join("");

  const delta = triggered.reduce((sum, b) => sum + Number(b.points || 0), 0);
  const deltaSign = delta >= 0 ? "+" : "";
  const ts = res?.computed_at ? new Date(res.computed_at).toLocaleString("de-DE") : "—";

  return `
    <div style="min-width:300px; max-width:400px; padding:4px;">
      <div class="popover-drag-handle" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; cursor:grab; user-select:none;">
        <div style="font-weight:950; font-size:1.02rem;">Score Breakdown</div>
        <div style="font-size:0.8rem; color:var(--muted); font-weight:800;">${escapeHTML(rulesetName)}</div>
      </div>
      <div style="font-weight:950; font-size:2rem; margin-bottom:14px; line-height:1;">
        ${escapeHTML(String(score))} <span style="font-size:1rem; color:var(--muted); font-weight:700;">/ 100</span>
      </div>
      <div style="border-top:1px solid var(--border); padding-top:10px;">
        ${rows || `<div style="color:var(--muted); font-size:0.9rem; padding:8px 0;">Keine Regeln getriggert.</div>`}
      </div>
      <div style="margin-top:12px; padding-top:10px; border-top:1px solid var(--border); font-size:0.8rem; color:var(--muted);">
        Basis ${escapeHTML(String(startScore))} ${deltaSign}${escapeHTML(String(delta))} Pkt. = ${escapeHTML(String(score))}
        <br>Zuletzt berechnet: ${escapeHTML(ts)}
      </div>
    </div>
  `;
}

function _initPopoverDrag(pop){
  if(pop._dragBound) return;
  pop._dragBound = true;

  pop.addEventListener("mousedown", (e)=>{
    if(!e.target.closest(".popover-drag-handle")) return;
    e.preventDefault();

    let startX = e.clientX;
    let startY = e.clientY;
    let startLeft = parseInt(pop.style.left) || 0;
    let startTop  = parseInt(pop.style.top)  || 0;

    const onMove = (e)=>{
      let newLeft = startLeft + (e.clientX - startX);
      let newTop  = startTop  + (e.clientY - startY);
      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth  - pop.offsetWidth));
      newTop  = Math.max(0, Math.min(newTop,  window.innerHeight - pop.offsetHeight));
      pop.style.left = newLeft + "px";
      pop.style.top  = newTop  + "px";
    };
    const onUp = ()=>{
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
}

function openScoreBreakdown(anon_id, anchorEl){
  const res = computeCustomIndexV6(anon_id);
  const html = buildCustomBreakdownHTML(anon_id, res);
  openSignalPopover(anchorEl, html, anon_id);
}

/* =========================
   PLAUSIBILITY BREAKDOWN POPOVER
========================= */
function buildPlausibilityBreakdownHTML(anon_id){
  const subs = (typeof getSubmissions === "function") ? getSubmissions() : [];
  const sub = subs.find(x => x.anon_id === anon_id);
  const startup = (typeof startups !== "undefined") ? startups.find(x => x.anon_id === anon_id) : null;
  const name = startup ? (startup.company_name || anon_id) : anon_id;

  if(!sub || !sub.plausibility_checks || !sub.plausibility_checks.length){
    return `<div style="min-width:280px; padding:4px;">
      <div style="font-weight:950; font-size:1rem; margin-bottom:8px;">Plausibility Check – ${escapeHTML(name)}</div>
      <div style="color:var(--muted); font-size:0.9rem;">Keine Daten verfügbar.</div>
    </div>`;
  }

  const status = sub.plausibility_status || "passed";
  const summary = sub.plausibility_summary || {};
  const checks = sub.plausibility_checks.slice();

  // Sort: hard fails first, soft fails second, passes last
  checks.sort((a, b) => {
    const rank = (c) => c.result === "fail" && c.schwere === "hard" ? 0 : c.result === "fail" ? 1 : 2;
    return rank(a) - rank(b);
  });

  const statusMap = {
    passed: { cls: "plaus-passed", icon: "✓", label: "Passed" },
    flagged: { cls: "plaus-flagged", icon: "⚠", label: "Flagged" },
    failed:  { cls: "plaus-failed",  icon: "✗", label: "Failed" }
  };
  const sm = statusMap[status] || statusMap.failed;

  const summaryText = (() => {
    const t = summary.total || checks.length;
    const p = summary.passed || checks.filter(c=>c.result==="pass").length;
    const fh = summary.failed_hard || 0;
    const fs = summary.failed_soft || 0;
    const parts = [`${p} von ${t} Checks bestanden`];
    if(fh > 0) parts.push(`${fh} kritisch`);
    if(fs > 0) parts.push(`${fs} Hinweis${fs > 1 ? "e" : ""}`);
    return parts.join(" • ");
  })();

  const checkRows = checks.map(c => {
    let icon, cls;
    if(c.result === "fail" && c.schwere === "hard"){ icon = "✗"; cls = "plaus-icon-fail-hard"; }
    else if(c.result === "fail"){ icon = "⚠"; cls = "plaus-icon-fail-soft"; }
    else { icon = "✓"; cls = "plaus-icon-pass"; }
    return `
      <div class="plaus-check">
        <div class="plaus-icon ${cls}">${icon}</div>
        <div class="plaus-check-body">
          <span class="plaus-check-label">${escapeHTML(c.label)}</span>
          <span class="plaus-check-kategorie">${escapeHTML(c.kategorie)}</span>
          <div class="plaus-check-message">${escapeHTML(c.message)}</div>
        </div>
      </div>`;
  }).join("");

  return `
    <div style="min-width:320px; max-width:420px; padding:4px;">
      <div class="popover-drag-handle" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; cursor:grab; user-select:none;">
        <div style="font-weight:950; font-size:1rem;">Plausibility Check</div>
        <div style="font-size:0.8rem; color:var(--muted); font-weight:800;">${escapeHTML(name)}</div>
      </div>
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
        <span class="badge ${sm.cls}" style="font-size:1rem; padding:4px 12px;">${sm.icon} ${sm.label}</span>
        <span style="font-size:0.82rem; color:var(--muted); font-weight:700;">${escapeHTML(summaryText)}</span>
      </div>
      <div style="border-top:1px solid var(--border); padding-top:8px;">
        ${checkRows}
      </div>
      <div style="margin-top:10px; padding-top:8px; border-top:1px solid var(--border); font-size:0.78rem; color:var(--muted); font-style:italic;">
        Plausibilitätsprüfung ersetzt keine Due Diligence. Sie macht Inkonsistenzen sichtbar.
      </div>
    </div>
  `;
}

function openPlausibilityBreakdown(anon_id, anchorEl){
  const html = buildPlausibilityBreakdownHTML(anon_id);
  openSignalPopover(anchorEl, html, anon_id);
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
  if(_signalPopoverState.open) closeSignalPopover();
});

/* =========================
   V4.1 JS patches
========================= */

// V4.1 patch: no-scroll body lock removed — caused scroll-reset & freeze for cards below the fold

function sigClassFromScore(score){
  const n = Number(score||0);
  if(n >= 80) return "HIGH";
  if(n >= 55) return "MID";
  return "LOW";
}

function sigToneFromClass(cls){
  if(cls==="HIGH") return "high";
  if(cls==="MID") return "mid";
  return "low";
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
  return "";
}
