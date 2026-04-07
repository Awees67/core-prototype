/* =========================
   RENDERER — DASHBOARD VIEW
========================= */
function renderDashboard(){
  hideAllViews();
  const view = document.getElementById("viewDashboard");
  if(!view) return;
  view.style.display = "";

  // Hide search/sort/chips — dashboard has its own KPIs
  const ctrlBar = document.querySelector(".controls");
  const summaryBar = document.querySelector(".summarybar");
  const chipsBar = document.querySelector(".activechips");
  if(ctrlBar) ctrlBar.style.display = "none";
  if(summaryBar) summaryBar.style.display = "none";
  if(chipsBar) chipsBar.style.display = "none";

  // --- Collect data ---
  const subs = getSubmissions();
  const pipeline = getPipeline();
  const activity = getActivity();

  // Compute scores for all startups
  const scores = startups.map(s=>{
    try{
      const res = computeCustomIndexV6(s.anon_id);
      return (res && res.score !== null && res.score !== undefined) ? Number(res.score) : null;
    }catch(_){ return null; }
  }).filter(n => n !== null && Number.isFinite(n));

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a,b)=>a+b,0) / scores.length)
    : 0;

  // Active ruleset name
  let rulesetName = "Standard Screening";
  try{
    const rules = getCustomRulesV6();
    rulesetName = rules.name || "Standard Screening";
  }catch(_){}

  const syncedCount = pipeline.filter(x=>x.status==="Synced").length;

  // Pipeline stage counts
  const STAGES = ["In Review","Hot Deal","Watching","Declined","Synced"];
  const STAGE_COLORS = {
    "In Review": "var(--brand2)",
    "Hot Deal": "var(--dangerText)",
    "Watching": "var(--warnText)",
    "Declined": "var(--muted)",
    "Synced": "var(--goodText)"
  };
  const STAGE_BG = {
    "In Review": "var(--chip)",
    "Hot Deal": "var(--dangerBg)",
    "Watching": "var(--warnBg)",
    "Declined": "var(--soft2)",
    "Synced": "var(--goodBg)"
  };
  const stageCounts = {};
  STAGES.forEach(st=>{ stageCounts[st] = 0; });
  pipeline.forEach(x=>{ if(stageCounts[x.status]!==undefined) stageCounts[x.status]++; });

  // Score histogram buckets
  const BUCKETS = [
    { range:"0–20",  label:"Sehr schwach", color:"#c62828" },
    { range:"21–40", label:"Schwach",       color:"#e65100" },
    { range:"41–60", label:"Mittel",        color:"#f9a825" },
    { range:"61–80", label:"Stark",         color:"#558b2f" },
    { range:"81–100",label:"Top",           color:"#1b5e20" }
  ];
  const bucketCounts = [0,0,0,0,0];
  scores.forEach(sc=>{
    if(sc <= 20) bucketCounts[0]++;
    else if(sc <= 40) bucketCounts[1]++;
    else if(sc <= 60) bucketCounts[2]++;
    else if(sc <= 80) bucketCounts[3]++;
    else bucketCounts[4]++;
  });
  const maxBucket = Math.max(1, ...bucketCounts);

  // Sector + Stage distributions
  const sectorDist = groupBy(startups, s=>s.sector);
  const stageDist = groupBy(startups, s=>s.stage);
  const maxSector = sectorDist.length > 0 ? sectorDist[0][1] : 1;
  const maxStage = stageDist.length > 0 ? stageDist[0][1] : 1;

  // Funnel numbers
  const funnelTotal = startups.length;
  const funnelAccepted = funnelTotal; // all in dataset are accepted
  const funnelPipeline = pipeline.length;
  const funnelSynced = syncedCount;

  // --- Build HTML ---

  // KPI Header
  const subsPulse = subs.length > 0 ? ' dash-pulse' : '';
  const kpiHtml = `
    <div class="dash-grid dash-grid-4 dash-kpi-grid">
      <div class="dash-kpi dash-kpi-priority-1">
        <div class="dash-kpi-value">${funnelTotal}</div>
        <div class="dash-kpi-label">📊 Gesamt Deals</div>
        <div class="dash-kpi-sub">Im aktuellen Dataset</div>
      </div>
      <div class="dash-kpi dash-kpi-priority-1${subsPulse}">
        <div class="dash-kpi-value">${subs.length}</div>
        <div class="dash-kpi-label">📥 Neue Submissions</div>
        <div class="dash-kpi-sub">Warten auf Review</div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi-value">${pipeline.length}</div>
        <div class="dash-kpi-label">📋 In Pipeline</div>
        <div class="dash-kpi-sub">Aktive Deals im Screening</div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi-value">${syncedCount}</div>
        <div class="dash-kpi-label">✓ Synced to CRM</div>
        <div class="dash-kpi-sub">Erfolgreich übergeben</div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi-value">${avgScore}</div>
        <div class="dash-kpi-label">⚡ Ø Score</div>
        <div class="dash-kpi-sub">Aktives Ruleset: ${escapeHTML(rulesetName)}</div>
      </div>
    </div>
  `;

  // Funnel bars
  const funnelSteps = [
    { label:"Eingereicht", val:funnelTotal, color:"var(--chip)", border:"var(--chipBorder)" },
    { label:"Angenommen", val:funnelAccepted, color:"var(--brand2)", border:"var(--brand2)" },
    { label:"In Pipeline", val:funnelPipeline, color:"var(--warnBg)", border:"var(--warnBorder)" },
    { label:"An CRM übergeben", val:funnelSynced, color:"var(--goodBg)", border:"var(--goodBorder)" }
  ];
  const funnelHtml = funnelSteps.map(step=>{
    const w = pctOf(step.val, funnelTotal);
    return `
      <div class="funnel-row">
        <div class="funnel-label">${escapeHTML(step.label)}</div>
        <div class="funnel-bar-wrap">
          <div class="funnel-bar" style="width:${w}%; background:${step.color}; border:1px solid ${step.border};"></div>
        </div>
        <div class="funnel-value"><span class="mono">${step.val}</span></div>
      </div>
    `;
  }).join("");

  // Pipeline segment bar
  const pipeTotal = Math.max(1, pipeline.length);
  const pipeSegHtml = pipeline.length === 0
    ? `<div class="dash-panel-sub">Noch keine Deals in der Pipeline.</div>`
    : `
      <div class="pipe-seg-bar">
        ${STAGES.map(st=>{
          const pct = pctOf(stageCounts[st], pipeTotal);
          if(pct === 0) return "";
          return `<div class="pipe-seg" style="width:${pct}%; background:${STAGE_BG[st]};" title="${escapeHTML(st)}: ${stageCounts[st]}"></div>`;
        }).join("")}
      </div>
      <div class="pipe-legend">
        ${STAGES.map(st=>`
          <div class="pipe-legend-item">
            <div class="pipe-legend-dot" style="background:${STAGE_COLORS[st]};"></div>
            <span>${escapeHTML(st)}: ${stageCounts[st]}</span>
          </div>
        `).join("")}
      </div>
    `;

  // Score histogram
  const histoHtml = `
    <div class="histogram">
      ${BUCKETS.map((b,i)=>{
        const cnt = bucketCounts[i];
        const pct = Math.round((cnt/maxBucket)*100);
        return `
          <div class="histo-col">
            <div class="histo-count">${cnt}</div>
            <div class="histo-bar" style="height:${pct}%; background:${b.color};"></div>
            <div class="histo-label">${escapeHTML(b.range)}<br>${escapeHTML(b.label)}</div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  // Sector distribution
  const sectorHtml = sectorDist.slice(0,10).map(([name,cnt])=>{
    const w = pctOf(cnt, maxSector);
    return `
      <div class="hbar-row">
        <div class="hbar-label" title="${escapeHTML(name)}">${escapeHTML(name)}</div>
        <div class="hbar-track"><div class="hbar-fill" style="width:${w}%;"></div></div>
        <div class="hbar-value">${cnt}</div>
      </div>
    `;
  }).join("");

  // Stage distribution
  const stageHtml = stageDist.map(([name,cnt])=>{
    const w = pctOf(cnt, maxStage);
    return `
      <div class="hbar-row">
        <div class="hbar-label" title="${escapeHTML(name)}">${escapeHTML(name)}</div>
        <div class="hbar-track"><div class="hbar-fill" style="width:${w}%;"></div></div>
        <div class="hbar-value">${cnt}</div>
      </div>
    `;
  }).join("");

  // Decline reasons distribution
  const declinedWithReason = pipeline.filter(x => x.status === "Declined" && x.decline_reason);
  const declineReasonDist = groupBy(declinedWithReason, x => x.decline_reason);
  const maxDeclineCount = declineReasonDist.length > 0 ? declineReasonDist[0][1] : 1;
  const declineHtml = declineReasonDist.length === 0
    ? `<div class="hint">Noch keine Deals abgelehnt.</div>`
    : declineReasonDist.map(([key, cnt]) => {
        const label = DECLINE_REASONS.find(r => r.key === key)?.label || key;
        const w = pctOf(cnt, maxDeclineCount);
        return `
          <div class="hbar-row">
            <div class="hbar-label" title="${escapeHTML(label)}">${escapeHTML(label)}</div>
            <div class="hbar-track"><div class="hbar-fill" style="width:${w}%;"></div></div>
            <div class="hbar-value">${cnt}</div>
          </div>
        `;
      }).join("");

  // Recent activity
  const recentEvents = activity.slice(0,10);
  const activityHtml = recentEvents.length === 0
    ? `<div class="hint">Noch keine Aktivitäten.</div>`
    : `
      <ul class="activity-mini">
        ${recentEvents.map(ev=>{
          const label = DASHBOARD_EVENT_LABELS[ev.event] || escapeHTML(ev.event || "Event");
          const ts = ev.ts ? timeAgo(ev.ts) : "—";
          const id = ev.anon_id ? escapeHTML(ev.anon_id) : "";
          return `
            <li>
              <span class="activity-mini-time">${escapeHTML(ts)}</span>
              <span class="activity-mini-event">${label}</span>
              ${id ? `<span class="activity-mini-label">${id}</span>` : ""}
            </li>
          `;
        }).join("")}
      </ul>
    `;

  view.innerHTML = `
    <div class="dash-shell">
    <div class="dash-head">
      <h2 class="dash-title">Dashboard</h2>
      <div class="dash-subtitle">Gesamtüberblick über Dealflow, Pipeline und Score-Verteilung (Live aus der lokalen Demo).</div>
    </div>

    ${kpiHtml}

    <div class="dash-grid dash-grid-2 dash-section">
      <div class="dash-panel">
        <div class="dash-panel-title">Dealflow Funnel</div>
        <div class="dash-panel-sub">Vom Eingang bis zur CRM-Übergabe.</div>
        ${funnelHtml}
      </div>
      <div class="dash-panel">
        <div class="dash-panel-title">Pipeline Status</div>
        <div class="dash-panel-sub">Verteilung nach aktuellem Bearbeitungsstatus.</div>
        ${pipeSegHtml}
      </div>
    </div>

    <div class="dash-grid dash-grid-2 dash-section">
      <div class="dash-panel">
        <div class="dash-panel-title">Score Verteilung</div>
        <div class="dash-panel-sub">Anzahl Deals pro Score-Bereich.</div>
        ${histoHtml}
      </div>
      <div class="dash-panel">
        <div class="dash-panel-title">Sektor Verteilung</div>
        <div class="dash-panel-sub">Top-Sektoren im aktuellen Datensatz.</div>
        ${sectorHtml || '<div class="hint">Keine Daten.</div>'}
      </div>
    </div>

    <div class="dash-grid dash-grid-2 dash-section">
      <div class="dash-panel">
        <div class="dash-panel-title">Stage Verteilung</div>
        <div class="dash-panel-sub">Pipeline-Reife über alle Deals.</div>
        ${stageHtml || '<div class="hint">Keine Daten.</div>'}
      </div>
      <div class="dash-panel">
        <div class="dash-panel-title">Häufigste Absage-Gründe</div>
        <div class="dash-panel-sub">Nur Deals mit Status „Declined".</div>
        ${declineHtml}
      </div>
    </div>

    <div class="dash-grid dash-grid-2 dash-section">
      <div class="dash-panel">
        <div class="dash-panel-title">Letzte Aktivitäten</div>
        <div class="dash-panel-sub">Die 10 neuesten Workspace-Events.</div>
        ${activityHtml}
      </div>
    </div>
    </div>
  `;
}
