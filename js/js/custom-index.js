/* =========================
   Custom Index V6 (Rules) — additive implementation
   Goal: Excel-like IF/THEN rules with points, stacking, caps, explainability.
========================= */
(function(){
  if(window.__CUSTOM_INDEX_V6__) return;
  window.__CUSTOM_INDEX_V6__ = true;

  const LS_CUSTOM_RULES_V6 = "core_custom_rules_v6";
  const LS_CUSTOM_RULES_V6_BACKUP = "core_custom_rules_v6_backup";
  const LS_CUSTOM_ACTIVE = "core_custom_rules_v6_enabled";
  const LS_CUSTOM_RULESETS_V6 = "core_custom_rulesets_v6";
  const LS_CUSTOM_ACTIVE_RULESET_ID = "core_custom_rules_v6_active_id";

  const DEFAULT_CUSTOM_RULES_V6 = {
    enabled: true,
    name: "My Fund Ruleset",
    updated_at: Date.now(),
    scoring: {
      start_score: 50,
      min_score: 0,
      max_score: 100,
      rounding: { mode: "int", precision: 0 },
      stacking: { mode: "sum", rule_conflicts: "allow_all", max_rules_triggered: 999 },
      missing_kpi_policy: {
        mode: "skip_rule",
        alternatives_supported: ["skip_rule","treat_as_zero","apply_penalty_points"],
        penalty_points_if_missing: -5
      }
    },
    rule_groups: [
      {
        group_id: "mrr",
        label: "Revenue (MRR)",
        enabled: true,
        rules: [
          { id:"r_mrr_0", enabled:true, priority:5,  kpi:"MRR_EUR", operator:"lt", value:50000, points:-10, stackable:true, note:"MRR <50k = -10p" },
          { id:"r_mrr_1", enabled:true, priority:10, kpi:"MRR_EUR", operator:"between_inclusive", value:{min:50000,max:100000}, points:15, stackable:true, note:"MRR 50–100k = 15p" },
          { id:"r_mrr_2", enabled:true, priority:20, kpi:"MRR_EUR", operator:"gte", value:100000, points:20, stackable:true, note:"MRR >=100k = 20p" }
        ]
      }
    ],
    kpi_map: {
      MRR_EUR: { path: "s.mrr_eur", type:"number", unit:"EUR", label:"MRR (EUR)" },
      GROWTH_MOM_PCT: { path: "s.growth.value_pct", type:"number", unit:"percent", label:"Growth MoM (%)" },
      RUNWAY_MONTHS: { path: "s.runway_months", type:"number", unit:"months", label:"Runway (Monate)" },
      BURN_EUR: { path: "s.burn_eur_per_month", type:"number", unit:"EUR", label:"Burn / Monat (EUR)" },
      LTV_CAC: { path: "s.ltv_cac_ratio", type:"number", unit:"x", label:"LTV/CAC (x)" },
      NRR_PCT: { path: "s.nrr_pct", type:"number", unit:"percent", label:"NRR (%)" },
      FOUNDER_OWNERSHIP_PCT: { path: "s.founder_pct", type:"number", unit:"percent", label:"Founder Ownership (%)" }
    }
  };

  /* ---------- helpers ---------- */
  function safeParseJSON(str){
    try{ return JSON.parse(str); }catch(e){ return null; }
  }
  function deepClone(obj){
    try{ return structuredClone(obj); }catch(_){ return JSON.parse(JSON.stringify(obj)); }
  }
  function getByPath(obj, path){
    if(!obj || !path) return undefined;
    const parts = String(path).split(".");
    let cur = obj;
    for(const p of parts){
      if(!p) continue;
      if(cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
      else return undefined;
    }
    return cur;
  }
  function toNumber(v){
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function clamp(n, min, max){
    const a = Number(min), b = Number(max), x = Number(n);
    if(!Number.isFinite(x)) return min;
    if(Number.isFinite(a) && x < a) return a;
    if(Number.isFinite(b) && x > b) return b;
    return x;
  }
  function roundScore(n, rounding){
    const mode = rounding?.mode || "int";
    const prec = Number(rounding?.precision ?? 0);
    if(mode === "int") return Math.round(n);
    if(mode === "fixed") return Number(n.toFixed(Math.max(0, prec)));
    return n;
  }
  function uid(prefix="r"){
    return prefix + "_" + Math.random().toString(16).slice(2,8) + "_" + Date.now().toString(16).slice(-6);
  }

  /* ---------- rules storage (multi-ruleset) ---------- */
  function validateRulesShape(r){
    if(!r || typeof r !== "object") return false;
    if(!("scoring" in r) || !("rule_groups" in r) || !("kpi_map" in r)) return false;
    if(!Array.isArray(r.rule_groups)) return false;
    return true;
  }

  function getStartupListV6(){
    try{
      if(Array.isArray(window.startups)) return window.startups;
      // fall back to global variable if present
      if(typeof startups !== "undefined" && Array.isArray(startups)) return startups;
    }catch(_){}
    return [];
  }
// Prefer previewing startups that are actually in the Pipeline (when possible)
function getPipelineStartupListV6(){
  try{
    if(typeof getPipeline !== "function") return getStartupListV6();
    const all = getStartupListV6();
    const byId = new Map(all.map(s=>[String(s.anon_id), s]));
    const pipe = getPipeline().map(x=>String(x.anon_id)).filter(Boolean);
    const list = pipe.map(id=>byId.get(id)).filter(Boolean);
    return list.length ? list : all;
  }catch(_){
    return getStartupListV6();
  }
}

  function _migrateSingleRulesToRulesets(){
    const legacy = safeGetJSON(LS_CUSTOM_RULES_V6);
    const legacyOk = legacy && validateRulesShape(legacy);
    const firstRules = legacyOk ? legacy : deepClone(DEFAULT_CUSTOM_RULES_V6);
    const id = "rs_" + Math.random().toString(16).slice(2,8) + "_" + Date.now().toString(16).slice(-6);
    const container = { active_id: id, rulesets: [{ id, rules: firstRules }] };
    safeSetJSON(LS_CUSTOM_RULESETS_V6, container);
    safeSetJSON(LS_CUSTOM_ACTIVE_RULESET_ID, id);
    return container;
  }

  function getRulesetsV6(){
    let c = safeGetJSON(LS_CUSTOM_RULESETS_V6);
    if(!c || typeof c!=="object" || !Array.isArray(c.rulesets) || !c.rulesets.length){
      c = _migrateSingleRulesToRulesets();
    }
    // validate each ruleset; drop invalid
    c.rulesets = (c.rulesets||[]).filter(rs => rs && rs.id && validateRulesShape(rs.rules));
    if(!c.rulesets.length){
      c = _migrateSingleRulesToRulesets();
    }
    // ensure active id
    let active = safeGetJSON(LS_CUSTOM_ACTIVE_RULESET_ID) || c.active_id;
    if(!active || !c.rulesets.some(rs=>rs.id===active)){
      active = c.rulesets[0].id;
    }
    c.active_id = active;
    safeSetJSON(LS_CUSTOM_RULESETS_V6, c);
    safeSetJSON(LS_CUSTOM_ACTIVE_RULESET_ID, active);
    return c;
  }

  function setRulesetsV6(container){
    const c = deepClone(container);
    safeSetJSON(LS_CUSTOM_RULESETS_V6, c);
    safeSetJSON(LS_CUSTOM_ACTIVE_RULESET_ID, c.active_id);
  }

  function getActiveRulesetIdV6(){
    const c = getRulesetsV6();
    return c.active_id;
  }

  function setActiveRulesetIdV6(id){
    const c = getRulesetsV6();
    if(!c.rulesets.some(rs=>rs.id===id)) return;
    c.active_id = id;
    setRulesetsV6(c);
    // invalidate cache + refresh
    _cache = {};
    try{ renderCustomIndexUI(true); }catch(_){}
    try{ patchVisibleCustomIndex(); }catch(_){}
    try{ if(typeof renderCompare === "function") renderCompare(); }catch(_){}
  }

  function getCustomRulesV6(){
    const c = getRulesetsV6();
    const active = c.rulesets.find(rs=>rs.id===c.active_id) || c.rulesets[0];
    let r = (active && validateRulesShape(active.rules)) ? active.rules : deepClone(DEFAULT_CUSTOM_RULES_V6);

    // enabled can be toggled separately for quick UX (global switch)
    const en = safeGetJSON(LS_CUSTOM_ACTIVE);
    if(typeof en === "boolean") r.enabled = en;

    // attach helpers for UI (non-persisted fields)
    r.__ruleset_id = active?.id || c.active_id;
    r.__rulesets = c.rulesets.map(rs=>({ id: rs.id, name: (rs.rules?.name || "Ruleset") }));
    return r;
  }

  function setCustomRulesV6(rules){
    const r = deepClone(rules || DEFAULT_CUSTOM_RULES_V6);
    r.updated_at = Date.now();

    const c = getRulesetsV6();
    const rid = r.__ruleset_id || c.active_id;
    const idx = c.rulesets.findIndex(rs=>rs.id===rid);
    if(idx>=0){
      c.rulesets[idx].rules = r;
    }else{
      c.rulesets.push({ id: rid, rules: r });
      c.active_id = rid;
    }
    setRulesetsV6(c);

    // keep a backup of the active ruleset
    safeSetJSON(LS_CUSTOM_RULES_V6_BACKUP, r);
    // keep legacy key updated for backwards compatibility
    safeSetJSON(LS_CUSTOM_RULES_V6, r);
    safeSetJSON(LS_CUSTOM_ACTIVE, !!r.enabled);

    // invalidate cache
    _cache = {};
    // refresh UI if present
    try{ renderCustomIndexUI(); }catch(_){}
    try{ patchVisibleCustomIndex(); }catch(_){}
    try{ if(typeof renderCompare === "function") renderCompare(); }catch(_){}
  }

  /* ---------- operator evaluation ---------- */
  function evalOp(op, actual, thr){
    const a = toNumber(actual);
    if(a===null) return { ok:false, missing:true };
    const o = String(op||"").toLowerCase();
    if(o==="gt")  return { ok: a >  toNumber(thr), missing:false };
    if(o==="gte") return { ok: a >= toNumber(thr), missing:false };
    if(o==="lt")  return { ok: a <  toNumber(thr), missing:false };
    if(o==="lte") return { ok: a <= toNumber(thr), missing:false };
    if(o==="eq")  return { ok: a === toNumber(thr), missing:false };
    if(o==="neq") return { ok: a !== toNumber(thr), missing:false };
    if(o==="between_inclusive"){
      const mn = toNumber(thr?.min), mx = toNumber(thr?.max);
      if(mn===null || mx===null) return { ok:false, missing:false };
      return { ok: a >= mn && a <= mx, missing:false };
    }
    if(o==="between_exclusive"){
      const mn = toNumber(thr?.min), mx = toNumber(thr?.max);
      if(mn===null || mx===null) return { ok:false, missing:false };
      return { ok: a > mn && a < mx, missing:false };
    }
    if(o==="in_set"){
      const set = Array.isArray(thr) ? thr : [];
      return { ok: set.map(String).includes(String(actual)), missing:false };
    }
    if(o==="not_in_set"){
      const set = Array.isArray(thr) ? thr : [];
      return { ok: !set.map(String).includes(String(actual)), missing:false };
    }
    return { ok:false, missing:false };
  }

  /* ---------- compute engine ---------- */
  let _cache = {}; // anon_id -> {score, breakdown, enabled, computed_at, v}
  function computeCustomIndexV6(anonOrStartup){
    const rules = getCustomRulesV6();

    // ruleset switcher
    try{
      const rsSel = document.getElementById("ciRulesetSelect");
      const rsNew = document.getElementById("ciRulesetNewBtn");
      const rsDup = document.getElementById("ciRulesetDupBtn");
      const rsDel = document.getElementById("ciRulesetDelBtn");

      if(rsSel){
        const list = rules.__rulesets || [];
        rsSel.innerHTML = list.map(x=>`<option value="${escapeHTML(x.id)}">${escapeHTML(x.name||"Ruleset")}</option>`).join("");
        const activeId = rules.__ruleset_id || getActiveRulesetIdV6();
        if(activeId) rsSel.value = activeId;

        if(!rsSel._bound){
          rsSel.addEventListener("change", ()=>{
            const id = rsSel.value;
            setActiveRulesetIdV6(id);
          });
          rsSel._bound = true;
        }
      }

      if(rsNew && !rsNew._bound){
        rsNew.onclick = ()=>{
          const name = (prompt("Name für neues Ruleset:", "New Fund Ruleset") || "").trim();
          if(!name) return;
          const id = "rs_" + Math.random().toString(16).slice(2,8) + "_" + Date.now().toString(16).slice(-6);
          const c = getRulesetsV6();
          const r = deepClone(DEFAULT_CUSTOM_RULES_V6);
          r.name = name;
          r.enabled = true;
          r.__ruleset_id = id;
          c.rulesets.push({ id, rules: r });
          c.active_id = id;
          setRulesetsV6(c);
          safeSetJSON(LS_CUSTOM_ACTIVE, true);
          setActiveRulesetIdV6(id);
        };
        rsNew._bound = true;
      }

      if(rsDup && !rsDup._bound){
        rsDup.onclick = ()=>{
          const base = getCustomRulesV6();
          const name = (prompt("Name für Duplikat:", (base.name||"Ruleset") + " (Copy)") || "").trim();
          if(!name) return;
          const id = "rs_" + Math.random().toString(16).slice(2,8) + "_" + Date.now().toString(16).slice(-6);
          const c = getRulesetsV6();
          const r = deepClone(base);
          delete r.__rulesets;
          r.name = name;
          r.__ruleset_id = id;
          c.rulesets.push({ id, rules: r });
          c.active_id = id;
          setRulesetsV6(c);
          setActiveRulesetIdV6(id);
        };
        rsDup._bound = true;
      }

      if(rsDel && !rsDel._bound){
        rsDel.onclick = ()=>{
          const c = getRulesetsV6();
          if((c.rulesets||[]).length <= 1){
            alert("Mindestens ein Ruleset muss bleiben.");
            return;
          }
          const activeId = getActiveRulesetIdV6();
          const active = c.rulesets.find(x=>x.id===activeId);
          const ok = confirm(`Ruleset "${(active?.rules?.name)||activeId}" wirklich löschen?`);
          if(!ok) return;
          c.rulesets = c.rulesets.filter(x=>x.id!==activeId);
          c.active_id = c.rulesets[0].id;
          setRulesetsV6(c);
          setActiveRulesetIdV6(c.active_id);
        };
        rsDel._bound = true;
      }
    }catch(_){}
    if(!rules.enabled) return { score: null, breakdown: [], enabled:false };

    const s = (typeof anonOrStartup === "string")
      ? (Array.isArray(window.startups) ? window.startups.find(x=>x.anon_id===anonOrStartup) : null)
      : anonOrStartup;

    const anon_id = s?.anon_id || String(anonOrStartup||"");
    const cacheKey = anon_id + "|" + String(rules.updated_at||0) + "|" + String(rules.enabled);
    const hit = _cache[cacheKey];
    if(hit) return hit;

    let score = toNumber(rules.scoring?.start_score) ?? 0;
    const minScore = toNumber(rules.scoring?.min_score) ?? 0;
    const maxScore = toNumber(rules.scoring?.max_score) ?? 100;

    const missingPolicy = rules.scoring?.missing_kpi_policy?.mode || "skip_rule";
    const missingPenalty = toNumber(rules.scoring?.missing_kpi_policy?.penalty_points_if_missing) ?? -5;

    const breakdown = [];
    const groups = (rules.rule_groups||[]).filter(g=>g && g.enabled!==false);

    for(const g of groups){
      const rulesArr = (g.rules||[]).slice().filter(r=>r && r.enabled!==false);
      rulesArr.sort((a,b)=>Number(a.priority||0)-Number(b.priority||0));
      for(const r of rulesArr){
        const kpiDef = rules.kpi_map?.[r.kpi];
        const path = kpiDef?.path;
        let actual = (path ? getByPath({s}, path) : undefined);
        let aNum = toNumber(actual);
        let missing = (aNum===null);

        if(missing){
          if(missingPolicy==="treat_as_zero"){
            aNum = 0;
            missing = false;
          }else if(missingPolicy==="apply_penalty_points"){
            score += missingPenalty;
            breakdown.push({
              group_id: g.group_id,
              rule_id: r.id,
              kpi: r.kpi,
              operator: "missing",
              threshold: null,
              points: missingPenalty,
              actual_value: null,
              note: "KPI fehlt → Penalty"
            });
            continue;
          }else{
            // skip_rule
            breakdown.push({
              group_id: g.group_id,
              rule_id: r.id,
              kpi: r.kpi,
              operator: r.operator,
              threshold: r.value ?? null,
              points: 0,
              actual_value: null,
              skipped: true,
              note: "KPI fehlt → Rule skipped"
            });
            continue;
          }
        }

        const res = evalOp(r.operator, aNum, r.value);
        if(res.ok){
          const pts = toNumber(r.points) ?? 0;
          score += pts;
          breakdown.push({
            group_id: g.group_id,
            rule_id: r.id,
            kpi: r.kpi,
            operator: r.operator,
            threshold: r.value ?? null,
            points: pts,
            actual_value: aNum,
            note: r.note || ""
          });
        }
      }
    }

    score = clamp(score, minScore, maxScore);
    score = roundScore(score, rules.scoring?.rounding);
    const out = { score, breakdown, enabled:true, computed_at: Date.now() };
    _cache[cacheKey] = out;
    return out;
  }

  function computeCustomIndexBreakdownV6(anon_id){
    const r = computeCustomIndexV6(anon_id);
    return r.breakdown || [];
  }

  /* ---------- explainability HTML ---------- */
  function fmtThreshold(op, thr){
    if(op==="between_inclusive" || op==="between_exclusive"){
      const mn = thr?.min, mx = thr?.max;
      return `${mn}…${mx}`;
    }
    if(Array.isArray(thr)) return thr.join(", ");
    if(thr===null || thr===undefined) return "—";
    if(typeof thr==="object") return JSON.stringify(thr);
    return String(thr);
  }
  function fmtRuleLine(b){
    const k = b.kpi || "KPI";
    const op = b.operator || "";
    const thr = fmtThreshold(op, b.threshold);
    const pts = Number(b.points||0);
    const sign = pts>=0 ? "+" : "";
    const actual = (b.actual_value===null || b.actual_value===undefined) ? "—" : String(b.actual_value);
    const extra = b.skipped ? " (skipped)" : "";
    return `${k} ${op} ${thr} → ${sign}${pts} (actual: ${actual})${extra}`;
  }
  function buildCustomExplainHTML(anon_id){
    const rules = getCustomRulesV6();
    const res = computeCustomIndexV6(anon_id);
    const enabled = !!rules.enabled;
    const scoreTxt = enabled ? String(res.score ?? "—") : "—";
    const list = (res.breakdown||[]);

    const rows = list.map(x=>`
      <tr>
        <td>${escapeHTML(String(x.group_id||""))}</td>
        <td>${escapeHTML(String(x.rule_id||""))}</td>
        <td>${escapeHTML(fmtRuleLine(x))}</td>
      </tr>
    `).join("");

    return `
      <div class="panel" style="border-radius:14px;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
          <div style="font-weight:950;">
            Custom Index: <span class="mono">${escapeHTML(scoreTxt)}</span> / 100
            <span class="badge ${enabled ? "good" : "watch"}">${enabled ? "ENABLED" : "DISABLED"}</span>
          </div>
          <div class="muted-note" style="font-weight:900;">Rules Engine • Fonds-spezifisch</div>
        </div>

        <div class="helper" style="margin-top:10px;">
          <b>Stacking</b>: Regeln addieren Punkte • <b>Caps</b>: Min/Max • <b>Missing KPI</b>: ${escapeHTML(rules.scoring?.missing_kpi_policy?.mode||"skip_rule")}
        </div>

        <div style="margin-top:10px;">
          <div class="sig-mini">Getriggerte Regeln / Events:</div>
          ${rows ? `
            <table style="margin-top:8px;">
              <thead><tr><th>Group</th><th>Rule</th><th>Detail</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          ` : `<div class="muted" style="margin-top:8px;">Keine Regeln getriggert.</div>`}
        </div>
      </div>
    `;
  }

  /* ---------- Modal UI rendering ---------- */
  let _uiState = { tab:"rules", debounce:null };

  function openCustomIndex(){
    const bd = document.getElementById("customIndexBackdrop");
    if(!bd) return;
    bd.style.display = "flex";
    bd.setAttribute("aria-hidden","false");
    document.body.classList.add("no-scroll");
    renderCustomIndexUI(true);
  }
  function closeCustomIndex(){
    const bd = document.getElementById("customIndexBackdrop");
    if(!bd) return;
    bd.style.display = "none";
    bd.setAttribute("aria-hidden","true");
    document.body.classList.remove("no-scroll");

    // After editing rules, refresh visible UI (Pipeline/Compare/Modal badges)
    try{ patchVisibleCustomIndex(); }catch(_){}
    try{
      if(typeof currentView !== "undefined" && (currentView==="pipeline" || currentView==="compare")){
        if(typeof renderCurrent === "function") renderCurrent();
      }
    }catch(_){}
  }

  function setTab(tabId){
    _uiState.tab = tabId;
    ["rules","library","preview"].forEach(t=>{
      const btn = document.getElementById("ciTabBtn_"+t);
      const pnl = document.getElementById("ciTab_"+t);
      if(btn){
        btn.classList.toggle("active", t===tabId);
        btn.setAttribute("aria-selected", t===tabId ? "true":"false");
      }
      if(pnl) pnl.style.display = (t===tabId) ? "" : "none";
    });
  }

  function scheduleSave(nextRules){
    clearTimeout(_uiState.debounce);
    _uiState.debounce = setTimeout(()=> setCustomRulesV6(nextRules), 350);
  }

  function renderKpiLibrary(rules){
    const mount = document.getElementById("ciKpiLibrary");
    if(!mount) return;
    const entries = Object.entries(rules.kpi_map||{});
    mount.innerHTML = entries.map(([k,v])=>`
      <div class="custom-row">
        <label>${escapeHTML(k)}</label>
        <div class="right">
          <span class="custom-mini">${escapeHTML(v.label||"")}</span>
          <span class="tag">${escapeHTML(v.unit||"")}</span>
          <span class="custom-mini">${escapeHTML(v.path||"")}</span>
        </div>
      </div>
    `).join("");
  }

  
  function renderPreview(rules){
    const input = document.getElementById("ciPreviewAnonInput");
    const dl = document.getElementById("ciPreviewAnonList");
    if(!input || !dl) return;

    const LS_PREVIEW = "core_ci_preview_anon_v6";

    const list = getPipelineStartupListV6();

    // populate datalist from PIPELINE (fallback handled in getPipelineStartupListV6)
    dl.innerHTML = list.map(s=>`<option value="${escapeHTML(s.anon_id)}"></option>`).join("");

    // keep the field editable: never force a default ID on every render
    if(!input.value){
      const saved = (localStorage.getItem(LS_PREVIEW)||"").trim();
      if(saved) input.value = saved;
      // otherwise leave empty so user can paste/copy an ID
    }

    const scoreEl = document.getElementById("ciPreviewScore");
    const pill = document.getElementById("ciPreviewEnabledPill");
    const bd = document.getElementById("ciPreviewBreakdown");

    function update(){
      const id = String(input.value||"").trim();
      pill.textContent = rules.enabled ? "enabled" : "disabled";

      if(!id){
        scoreEl.textContent = "—";
        bd.innerHTML = `<div class="muted">Anon ID aus Pipeline auswählen (Autocomplete) oder ID einfügen.</div>`;
        return;
      }

      // persist last used ID (so reload keeps your last preview target)
      try{ localStorage.setItem(LS_PREVIEW, id); }catch(e){}

      const res = computeCustomIndexV6(id);
      scoreEl.textContent = (rules.enabled ? String(res.score) : "—");

      const lines = (res.breakdown||[]);
      if(!lines.length){
        bd.innerHTML = `<div class="muted">Keine Regeln getriggert.</div>`;
        return;
      }
      bd.innerHTML = `
        <div class="panel" style="border-radius:12px; background:var(--soft2);">
          <ul style="margin:0; padding-left:18px;">
            ${lines.slice(0,200).map(x=>`<li class="mono" style="margin:6px 0;">${escapeHTML(fmtRuleLine(x))}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    if(!input._bound){
      input.addEventListener("input", update);
      input.addEventListener("change", update);
      input.addEventListener("blur", update);
      input._bound = true;
    }

    update();
  }

  function renderGroupsEditor(rules){
    const mount = document.getElementById("ciGroupsMount");
    if(!mount) return;
    const groups = rules.rule_groups || [];
    mount.innerHTML = "";

    groups.forEach((g, gi)=>{
      const box = document.createElement("div");
      box.className = "rules-group";
      box.innerHTML = `
        <div class="rules-group-head">
          <div class="title">
            <input type="checkbox" data-g-en="${gi}" ${g.enabled!==false ? "checked":""} />
            <input type="text" data-g-label="${gi}" value="${escapeHTML(g.label||"")}" />
            <span class="custom-mini">${escapeHTML(g.group_id||"")}</span>
          </div>
          <div class="rule-actions">
            <button class="btn secondary small" data-g-up="${gi}">Up</button>
            <button class="btn secondary small" data-g-down="${gi}">Down</button>
            <button class="btn secondary small" data-g-del="${gi}">Delete</button>
            <button class="btn small" data-g-add-rule="${gi}">Add Rule</button>
          </div>
        </div>
        <div class="rules-list" id="ciRulesList_${gi}"></div>
      `;
      mount.appendChild(box);

      const listEl = box.querySelector("#ciRulesList_"+gi);
      const rulesArr = (g.rules||[]);
      rulesArr.forEach((r, ri)=>{
        const row = document.createElement("div");
        row.className = "rule-row";
        const isBetween = (String(r.operator||"").startsWith("between"));
        const vMin = isBetween ? (r.value?.min ?? "") : "";
        const vMax = isBetween ? (r.value?.max ?? "") : "";
        row.innerHTML = `
          <div class="rule-row-top">
            <input type="checkbox" data-r-en="${gi}:${ri}" ${r.enabled!==false ? "checked":""} />
            <select data-r-kpi="${gi}:${ri}">
              ${Object.keys(rules.kpi_map||{}).map(k=>`<option value="${escapeHTML(k)}" ${k===r.kpi?"selected":""}>${escapeHTML(k)}</option>`).join("")}
            </select>
            <select data-r-op="${gi}:${ri}">
              ${["gt","gte","lt","lte","eq","neq","between_inclusive","between_exclusive","in_set","not_in_set"].map(op=>`<option value="${op}" ${op===r.operator?"selected":""}>${op}</option>`).join("")}
            </select>

            <input class="hide-sm" type="number" data-r-val="${gi}:${ri}" value="${escapeHTML(!isBetween ? (r.value ?? "") : "")}" placeholder="value" />
            <div class="hide-sm" style="display:flex; gap:6px; align-items:center;">
              <input type="number" data-r-min="${gi}:${ri}" value="${escapeHTML(vMin)}" placeholder="min" />
              <input type="number" data-r-max="${gi}:${ri}" value="${escapeHTML(vMax)}" placeholder="max" />
            </div>

            <input type="number" data-r-pts="${gi}:${ri}" value="${escapeHTML(r.points ?? 0)}" />
            <input class="hide-sm" type="number" data-r-pri="${gi}:${ri}" value="${escapeHTML(r.priority ?? 0)}" />

            <div class="rule-actions">
              <button class="btn secondary small" data-r-up="${gi}:${ri}">↑</button>
              <button class="btn secondary small" data-r-down="${gi}:${ri}">↓</button>
              <button class="btn secondary small" data-r-del="${gi}:${ri}">Del</button>
            </div>
          </div>
          <div class="note">
            <input type="text" data-r-note="${gi}:${ri}" value="${escapeHTML(r.note||"")}" style="width:100%;" placeholder="Note (optional)" />
          </div>
        `;
        listEl.appendChild(row);

        // show/hide between inputs quickly
        const opSel = row.querySelector(`[data-r-op="${gi}:${ri}"]`);
        const valSingle = row.querySelector(`[data-r-val="${gi}:${ri}"]`);
        const minWrap = row.querySelector(`[data-r-min="${gi}:${ri}"]`)?.parentElement;
        function syncBetweenUI(){
          const isB = String(opSel.value||"").startsWith("between");
          if(valSingle) valSingle.style.display = isB ? "none" : "";
          if(minWrap) minWrap.style.display = isB ? "" : "none";
        }
        if(opSel){
          opSel.addEventListener("change", syncBetweenUI);
          syncBetweenUI();
        }
      });
    });

    // bind group-level actions + input changes (event delegation)
    mount.onclick = (e)=>{
      const b = e.target.closest("button");
      if(!b) return;
      const next = deepClone(rules);
      const gs = next.rule_groups || [];

      const gUp = b.getAttribute("data-g-up");
      const gDown = b.getAttribute("data-g-down");
      const gDel = b.getAttribute("data-g-del");
      const gAdd = b.getAttribute("data-g-add-rule");

      if(gUp!==null){
        const i = Number(gUp);
        if(i>0){ const tmp=gs[i-1]; gs[i-1]=gs[i]; gs[i]=tmp; scheduleSave(next); }
      }
      if(gDown!==null){
        const i = Number(gDown);
        if(i<gs.length-1){ const tmp=gs[i+1]; gs[i+1]=gs[i]; gs[i]=tmp; scheduleSave(next); }
      }
      if(gDel!==null){
        const i = Number(gDel);
        gs.splice(i,1);
        scheduleSave(next);
      }
      if(gAdd!==null){
        const i = Number(gAdd);
        const g = gs[i];
        if(g){
          g.rules = g.rules || [];
          g.rules.push({ id: uid("r"), enabled:true, priority: (g.rules.length+1)*10, kpi:Object.keys(next.kpi_map||{})[0]||"MRR_EUR", operator:"gte", value: 0, points: 0, stackable:true, note:"" });
          scheduleSave(next);
        }
      }
    };

    mount.onchange = (e)=>{
      const t = e.target;
      const next = deepClone(rules);
      const gs = next.rule_groups || [];
      const gLabel = t.getAttribute("data-g-label");
      const gEn = t.getAttribute("data-g-en");
      const rEn = t.getAttribute("data-r-en");
      const rKpi = t.getAttribute("data-r-kpi");
      const rOp = t.getAttribute("data-r-op");
      const rVal = t.getAttribute("data-r-val");
      const rMin = t.getAttribute("data-r-min");
      const rMax = t.getAttribute("data-r-max");

      if(gLabel!==null){
        const i = Number(gLabel);
        if(gs[i]) gs[i].label = t.value;
        scheduleSave(next); return;
      }
      if(gEn!==null){
        const i = Number(gEn);
        if(gs[i]) gs[i].enabled = !!t.checked;
        scheduleSave(next); return;
      }
      function getGR(pair){
        const [gi,ri] = String(pair).split(":").map(Number);
        const g = gs[gi]; if(!g) return null;
        const r = (g.rules||[])[ri]; if(!r) return null;
        return {g,r,gi,ri};
      }
      if(rEn!==null){
        const gr = getGR(rEn); if(!gr) return;
        gr.r.enabled = !!t.checked;
        scheduleSave(next); return;
      }
      if(rKpi!==null){
        const gr = getGR(rKpi); if(!gr) return;
        gr.r.kpi = t.value;
        scheduleSave(next); return;
      }
      if(rOp!==null){
        const gr = getGR(rOp); if(!gr) return;
        gr.r.operator = t.value;
        // normalize value structure for between
        if(String(t.value).startsWith("between")){
          if(!gr.r.value || typeof gr.r.value!=="object") gr.r.value = {min:0,max:0};
        }else{
          if(typeof gr.r.value==="object") gr.r.value = toNumber(gr.r.value?.min) ?? 0;
        }
        scheduleSave(next); return;
      }
      if(rVal!==null){
        const gr = getGR(rVal); if(!gr) return;
        gr.r.value = toNumber(t.value) ?? 0;
        scheduleSave(next); return;
      }
      if(rMin!==null){
        const gr = getGR(rMin); if(!gr) return;
        gr.r.value = gr.r.value && typeof gr.r.value==="object" ? gr.r.value : {min:0,max:0};
        gr.r.value.min = toNumber(t.value) ?? 0;
        scheduleSave(next); return;
      }
      if(rMax!==null){
        const gr = getGR(rMax); if(!gr) return;
        gr.r.value = gr.r.value && typeof gr.r.value==="object" ? gr.r.value : {min:0,max:0};
        gr.r.value.max = toNumber(t.value) ?? 0;
        scheduleSave(next); return;
      }
    };

    mount.oninput = (e)=>{
      const t = e.target;
      const next = deepClone(rules);
      const gs = next.rule_groups || [];
      const rPts = t.getAttribute("data-r-pts");
      const rPri = t.getAttribute("data-r-pri");
      const rNote = t.getAttribute("data-r-note");
      if(!rPts && !rPri && !rNote) return;
      const [gi,ri] = String(rPts||rPri||rNote).split(":").map(Number);
      const g = gs[gi]; if(!g) return;
      const r = (g.rules||[])[ri]; if(!r) return;

      if(rPts) r.points = toNumber(t.value) ?? 0;
      if(rPri) r.priority = toNumber(t.value) ?? 0;
      if(rNote) r.note = t.value;

      scheduleSave(next);
    };

    mount.addEventListener("click",(e)=>{
      const b = e.target.closest("button");
      if(!b) return;
      const rUp = b.getAttribute("data-r-up");
      const rDown = b.getAttribute("data-r-down");
      const rDel = b.getAttribute("data-r-del");
      if(rUp===null && rDown===null && rDel===null) return;

      const next = deepClone(rules);
      const gs = next.rule_groups || [];
      const pair = String(rUp||rDown||rDel);
      const [gi,ri] = pair.split(":").map(Number);
      const g = gs[gi]; if(!g) return;
      const arr = g.rules || [];

      if(rUp!==null && ri>0){
        const tmp=arr[ri-1]; arr[ri-1]=arr[ri]; arr[ri]=tmp; scheduleSave(next);
      }
      if(rDown!==null && ri<arr.length-1){
        const tmp=arr[ri+1]; arr[ri+1]=arr[ri]; arr[ri]=tmp; scheduleSave(next);
      }
      if(rDel!==null){
        arr.splice(ri,1); scheduleSave(next);
      }
    }, true);
  }

  function renderCustomIndexUI(force=false){
    const bd = document.getElementById("customIndexBackdrop");
    if(!bd || bd.style.display!=="flex") return;
    const rules = getCustomRulesV6();

    // tabs
    bd.querySelectorAll("[data-ci-tab]").forEach(b=>{
      if(!b._bound){
        b.addEventListener("click", ()=> setTab(b.getAttribute("data-ci-tab")));
        b._bound = true;
      }
    });
    setTab(_uiState.tab || "rules");

    // bind top buttons once
    const closeBtn = document.getElementById("ciCloseBtn");
    const resetBtn = document.getElementById("ciResetBtn");
    const addGroupBtn = document.getElementById("ciAddGroupBtn");
    const exportBtn = document.getElementById("ciExportBtn");
    const importBtn = document.getElementById("ciImportBtn");

    if(closeBtn && !closeBtn._bound){
      closeBtn.onclick = closeCustomIndex;
      closeBtn._bound = true;
    }
    if(resetBtn && !resetBtn._bound){
      resetBtn.onclick = ()=>{
        const current = getCustomRulesV6();
        const r = deepClone(DEFAULT_CUSTOM_RULES_V6);
        r.name = current.name || r.name;
        r.enabled = current.enabled;
        r.__ruleset_id = current.__ruleset_id;
        setCustomRulesV6(r);
        try{ if(typeof toast==="function") toast("Custom Index","Reset auf Default"); }catch(_){ }
      };
      resetBtn._bound = true;
    }
    if(addGroupBtn && !addGroupBtn._bound){
      addGroupBtn.onclick = ()=>{
        const next = deepClone(getCustomRulesV6());
        next.rule_groups = next.rule_groups || [];
        next.rule_groups.push({ group_id: uid("g"), label:"New Group", enabled:true, rules:[] });
        setCustomRulesV6(next);
      };
      addGroupBtn._bound = true;
    }
    if(exportBtn && !exportBtn._bound){
      exportBtn.onclick = ()=>{
        const r = getCustomRulesV6();
        const text = JSON.stringify(r, null, 2);
        const ta = document.getElementById("ciJsonIO");
        if(ta) ta.value = text;
        try{ if(typeof copyText==="function") copyText(text); }catch(_){}
        try{ if(typeof toast==="function") toast("Export","Ruleset JSON kopiert"); }catch(_){}
      };
      exportBtn._bound = true;
    }
    if(importBtn && !importBtn._bound){
      importBtn.onclick = ()=>{
        const ta = document.getElementById("ciJsonIO");
        const txt = ta ? ta.value.trim() : "";
        const obj = safeParseJSON(txt);
        if(!obj || !validateRulesShape(obj)){
          try{ if(typeof toast==="function") toast("Import","Ungültiges JSON / Schema"); }catch(_){}
          return;
        }
        setCustomRulesV6(obj);
        try{ if(typeof toast==="function") toast("Import","Ruleset übernommen"); }catch(_){}
      };
      importBtn._bound = true;
    }

    // bind header inputs
    const elEnabled = document.getElementById("ciEnabled");
    const elName = document.getElementById("ciName");
    const elStart = document.getElementById("ciStart");
    const elMin = document.getElementById("ciMin");
    const elMax = document.getElementById("ciMax");
    const elMissing = document.getElementById("ciMissingPolicy");
    const elPenalty = document.getElementById("ciMissingPenalty");

    if(elEnabled) elEnabled.checked = !!rules.enabled;
    if(elName) elName.value = rules.name || "";
    if(elStart) elStart.value = String(toNumber(rules.scoring?.start_score) ?? 0);
    if(elMin) elMin.value = String(toNumber(rules.scoring?.min_score) ?? 0);
    if(elMax) elMax.value = String(toNumber(rules.scoring?.max_score) ?? 100);
    if(elMissing) elMissing.value = rules.scoring?.missing_kpi_policy?.mode || "skip_rule";
    if(elPenalty) elPenalty.value = String(toNumber(rules.scoring?.missing_kpi_policy?.penalty_points_if_missing) ?? -5);

    function onCoreChange(){
      const next = deepClone(getCustomRulesV6());
      next.enabled = !!(elEnabled && elEnabled.checked);
      next.name = elName ? elName.value.trim() : next.name;
      next.scoring = next.scoring || {};
      next.scoring.start_score = toNumber(elStart?.value) ?? next.scoring.start_score;
      next.scoring.min_score = toNumber(elMin?.value) ?? next.scoring.min_score;
      next.scoring.max_score = toNumber(elMax?.value) ?? next.scoring.max_score;
      next.scoring.missing_kpi_policy = next.scoring.missing_kpi_policy || {};
      next.scoring.missing_kpi_policy.mode = elMissing ? elMissing.value : next.scoring.missing_kpi_policy.mode;
      next.scoring.missing_kpi_policy.penalty_points_if_missing = toNumber(elPenalty?.value) ?? next.scoring.missing_kpi_policy.penalty_points_if_missing;
      scheduleSave(next);
      // update preview instantly
      try{ renderPreview(next); }catch(_){}
    }

    [elEnabled, elName, elStart, elMin, elMax, elMissing, elPenalty].forEach(x=>{
      if(x && !x._bound){
        x.addEventListener("change", onCoreChange);
        x.addEventListener("input", onCoreChange);
        x._bound = true;
      }
    });

    // show penalty only when policy requires
    try{
      if(elPenalty){
        elPenalty.style.display = (elMissing?.value === "apply_penalty_points") ? "" : "none";
      }
    }catch(_){}

    // groups editor + library + preview
    renderGroupsEditor(rules);
    renderKpiLibrary(rules);
    renderPreview(rules);
  }

  /* ---------- Integration into existing UI ---------- */

  // 1) Inject "Custom Index" button into Pipeline header actions area (best effort, no hard dependency)
  function injectPipelineButton(){
    const view = document.getElementById("viewPipeline");
    if(!view) return;
    if(document.getElementById("openCustomRulesBtn")) return;

    // try to locate an "Aktionen" header row within Pipeline and append there
    const candidates = view.querySelectorAll(".row, .toolbar, .pipeline-head, .pipelineHeader, .head, .toprow, .actions");
    let host = null;
    candidates.forEach(c=>{
      if(host) return;
      const t = (c.textContent||"").toLowerCase();
      if(t.includes("aktionen") || t.includes("pipeline") || t.includes("my pipeline")) host = c;
    });
    if(!host){
      // fallback: first child
      host = view.firstElementChild || view;
    }

    const btn = document.createElement("button");
    btn.className = "btn secondary";
    btn.id = "openCustomRulesBtn";
    btn.textContent = "Custom Index";
    btn.style.marginLeft = "8px";
    btn.onclick = (e)=>{ e.preventDefault(); e.stopPropagation(); openCustomIndex(); };

    // place near right side if possible
    try{
      host.style.display = host.style.display || "flex";
      host.style.alignItems = host.style.alignItems || "center";
      host.style.justifyContent = host.style.justifyContent || "space-between";
    }catch(_){}
    host.appendChild(btn);
  }

  // 2) Patch visible Pipeline rows to show Custom Index value next to Signal (no layout redesign)
  function patchVisibleCustomIndex(){
    const rules = getCustomRulesV6();
    const enabled = !!rules.enabled;

    // Pipeline table uses [data-si] as info buttons in some views; add custom label near it
    document.querySelectorAll("[data-si]").forEach(btn=>{
      const id = btn.getAttribute("data-si");
      if(!id) return;
      const parent = btn.parentElement;
      if(!parent) return;

      const res = computeCustomIndexV6(id);
      const scoreTxt = enabled ? String(res.score ?? "—") : "—";

      // If already patched -> just update score text (no duplicates)
      const existing = parent.querySelector("[data-ci-score]");
      if(existing){
        const scoreNode = existing.querySelector("[data-ci-score-val]");
        if(scoreNode) scoreNode.textContent = scoreTxt;
        const pill = existing.querySelector("[data-ci-enabled]");
        if(pill) pill.textContent = enabled ? "Custom" : "Custom (off)";
        return;
      }

      const wrap = document.createElement("span");
      wrap.setAttribute("data-ci-score","1");
      wrap.style.display = "inline-flex";
      wrap.style.alignItems = "center";
      wrap.style.gap = "6px";
      wrap.style.marginLeft = "8px";
      wrap.innerHTML = `
        <span class="custom-pill">
          <span class="muted-note" style="font-weight:950;" data-ci-enabled>${enabled ? "Custom" : "Custom (off)"}</span>
          <span class="mono" data-ci-score-val>${enabled ? escapeHTML(scoreTxt) : "—"}</span>
        </span>
        <button class="btn secondary small custom-i-btn" data-ci="${escapeHTML(id)}">(i)</button>
      `;
      parent.appendChild(wrap);
    });

    // bind custom (i)
    document.querySelectorAll("[data-ci]").forEach(b=>{
      if(b._bound) return;
      b.onclick = (e)=>{
        e.stopPropagation();
        const id = b.getAttribute("data-ci");
        if(typeof openSignalPopover === "function"){
          openSignalPopover(b, buildCustomExplainHTML(id), id);
        }else{
          // fallback: alert
          alert("Custom Index: " + JSON.stringify(computeCustomIndexV6(id), null, 2));
        }
      };
      b._bound = true;
    });
  }

  // 3) Deal modal: add a Custom KPI card at the top of KPI grid (additive)
  function patchDealModal(){
    const grid = document.getElementById("kpiGrid");
    const h2 = document.getElementById("modalH2");
    if(!grid || !h2) return;

    // derive current anon_id from title if possible; safest: look for last opened via modalIndex
    let currentId = null;
    try{
      // modal title is startupLabel; find matching startup by label (best-effort)
      const label = h2.textContent || "";
      const list = Array.isArray(window.startups) ? window.startups : [];
      const found = list.find(s=> startupLabel(s) === label);
      currentId = found?.anon_id || null;
    }catch(_){}
    if(!currentId){
      // fallback: if exactly one modal open via list pointer
      try{
        const list = Array.isArray(window.startups) ? window.startups : [];
        currentId = list[0]?.anon_id || null;
      }catch(_){}
    }
    if(!currentId) return;

    if(grid.querySelector("[data-ci-kpi]")) return;

    const rules = getCustomRulesV6();
    const res = computeCustomIndexV6(currentId);
    const enabled = !!rules.enabled;

    const div = document.createElement("div");
    div.className = "kpi";
    div.setAttribute("data-ci-kpi","1");
    div.innerHTML = `
      <div class="label">Custom Index</div>
      <div class="value mono" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <span>${enabled ? escapeHTML(String(res.score)) : "—"}</span>
        <button class="btn secondary small custom-i-btn" data-ci="${escapeHTML(currentId)}">(i)</button>
      </div>
      <div class="sub">${escapeHTML(rules.name || "Ruleset")} • ${enabled ? "enabled" : "disabled"}</div>
    `;
    grid.insertBefore(div, grid.firstChild);

    // bind i
    const iBtn = div.querySelector("[data-ci]");
    if(iBtn && !iBtn._bound){
      iBtn.onclick = (e)=>{
        e.stopPropagation();
        const id = iBtn.getAttribute("data-ci");
        if(typeof openSignalPopover === "function"){
          openSignalPopover(iBtn, buildCustomExplainHTML(id), id);
        }
      };
      iBtn._bound = true;
    }
  }

  // Wrap openModalWithStartup to patch after render
  if(typeof window.openModalWithStartup === "function" && !window.openModalWithStartup._ciV6){
    const _orig = window.openModalWithStartup;
    window.openModalWithStartup = function(s, list){
      const res = _orig(s, list);
      try{ patchDealModal(); }catch(_){}
      return res;
    };
    window.openModalWithStartup._ciV6 = true;
  }

  // Wrap renderPipeline and renderCompare to inject/patch after they render
  if(typeof window.renderPipeline === "function" && !window.renderPipeline._ciV6){
    const _rp = window.renderPipeline;
    window.renderPipeline = function(){
      const res = _rp();
      try{ injectPipelineButton(); }catch(_){}
      try{ patchVisibleCustomIndex(); }catch(_){}
      return res;
    };
    window.renderPipeline._ciV6 = true;
  }
  if(typeof window.renderCompare === "function" && !window.renderCompare._ciV6){
    const _rc = window.renderCompare;
    window.renderCompare = function(){
      const res = _rc();
      try{ patchVisibleCustomIndex(); }catch(_){}
      return res;
    };
    window.renderCompare._ciV6 = true;
  }

  // Add ESC close for custom modal
  document.addEventListener("keydown",(e)=>{
    if(e.key==="Escape"){
      const bd = document.getElementById("customIndexBackdrop");
      if(bd && bd.style.display==="flex"){
        closeCustomIndex();
      }
    }
  });

  // Bind backdrop clicks (outside sheet closes)
  document.addEventListener("click",(e)=>{
    const bd = document.getElementById("customIndexBackdrop");
    if(!bd || bd.style.display!=="flex") return;
    const sheet = bd.querySelector(".custom-sheet");
    if(sheet && !sheet.contains(e.target) && e.target === bd){
      closeCustomIndex();
    }
  });

  // Bind initial open button if it exists already
  function bindExistingEntryPoints(){
    const b = document.getElementById("openCustomRulesBtn");
    if(b && !b._bound){
      b.onclick = (e)=>{ e.preventDefault(); e.stopPropagation(); openCustomIndex(); };
      b._bound = true;
    }
  }

  // Public API (optional)
  window.getCustomRulesV6 = getCustomRulesV6;
  window.setCustomRulesV6 = setCustomRulesV6;
  window.computeCustomIndexV6 = computeCustomIndexV6;
  window.computeCustomIndexBreakdownV6 = computeCustomIndexBreakdownV6;
  window.openCustomIndex = openCustomIndex;
  window.closeCustomIndex = closeCustomIndex;

  // initial best-effort injections after load
  window.addEventListener("load", ()=>{
    try{ injectPipelineButton(); }catch(_){}
    try{ bindExistingEntryPoints(); }catch(_){}
    try{ patchVisibleCustomIndex(); }catch(_){}
  });

})();