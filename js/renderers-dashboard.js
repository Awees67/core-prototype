/* =========================
   RENDERER — DASHBOARD VIEW
========================= */
function buildDonutSVG(segments, size, strokeWidth) {
  const R = size / 2 - strokeWidth / 2;
  const circ = 2 * Math.PI * R;
  const total = segments.reduce((a, s) => a + (Number(s.value) || 0), 0);
  if (!total) {
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="transform:rotate(-90deg);display:block;"><circle cx="${size/2}" cy="${size/2}" r="${R}" fill="none" stroke="var(--score-ring-bg)" stroke-width="${strokeWidth}"/></svg>`;
  }
  let accumulated = 0;
  const circles = segments.map(s => {
    const val = Number(s.value) || 0;
    const dash = (val / total) * circ;
    const offset = -accumulated;
    accumulated += dash;
    return `<circle cx="${size/2}" cy="${size/2}" r="${R}" fill="none" stroke="${escapeHTML(s.color)}" stroke-width="${strokeWidth}" stroke-dasharray="${dash.toFixed(2)} ${circ.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" stroke-linecap="butt"/>`;
  });
  const bg = `<circle cx="${size/2}" cy="${size/2}" r="${R}" fill="none" stroke="var(--score-ring-bg)" stroke-width="${strokeWidth}"/>`;
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="transform:rotate(-90deg);display:block;">${bg}${circles.join('')}</svg>`;
}

function renderDashboard(){
  hideAllViews();
  const view = document.getElementById('viewDashboard');
  if (!view) return;
  view.style.display = '';

  const ctrlBar = document.querySelector('.controls');
  const summaryBar = document.querySelector('.summarybar');
  const chipsBar = document.querySelector('.activechips');
  if (ctrlBar) ctrlBar.style.display = 'none';
  if (summaryBar) summaryBar.style.display = 'none';
  if (chipsBar) chipsBar.style.display = 'none';

  // --- Data ---
  const subs = getSubmissions();
  const pipeline = getPipeline();
  const activity = getActivity();

  const scores = startups.map(s => {
    try { const r = computeCustomIndexV6(s.anon_id); return (r && r.score !== null) ? Number(r.score) : null; } catch(_) { return null; }
  }).filter(n => n !== null && Number.isFinite(n));

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  let rulesetName = 'Standard Screening';
  try { const rules = getCustomRulesV6(); rulesetName = rules.name || 'Standard Screening'; } catch(_) {}

  const syncedCount = pipeline.filter(x => x.status === 'Synced').length;
  const funnelTotal = startups.length;
  const funnelPipeline = pipeline.length;
  const funnelSynced = syncedCount;

  // Pipeline stage counts
  const STAGES = ['In Review', 'Hot Deal', 'Watching', 'Declined', 'Synced'];
  const STAGE_DOT_COLORS = { 'In Review': '#0A84FF', 'Hot Deal': '#ef4444', 'Watching': '#f59e0b', 'Declined': '#6b7280', 'Synced': '#00dfc1' };
  const STAGE_DOT_LABELS = { 'In Review': 'IN REVIEW', 'Hot Deal': 'HOT DEALS', 'Watching': 'WATCHING', 'Declined': 'DECLINED', 'Synced': 'SYNCED' };
  const stageCounts = {};
  STAGES.forEach(st => { stageCounts[st] = 0; });
  pipeline.forEach(x => { if (stageCounts[x.status] !== undefined) stageCounts[x.status]++; });

  // Score buckets
  const buckets = [0, 0, 0, 0, 0];
  scores.forEach(sc => {
    if (sc <= 20) buckets[0]++;
    else if (sc <= 40) buckets[1]++;
    else if (sc <= 60) buckets[2]++;
    else if (sc <= 80) buckets[3]++;
    else buckets[4]++;
  });
  const BUCKET_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#00dfc1', '#059669'];
  const BUCKET_LABELS = ['0–20', '21–40', '41–60', '61–80', '81–100'];
  const scoreDonutSegs = buckets.map((v, i) => ({ value: v, color: BUCKET_COLORS[i] }));

  // Sector donut
  const SECTOR_COLORS = {
    'B2B SaaS': '#0A84FF', 'FinTech': '#00dfc1', 'HealthTech': '#f59e0b',
    'DeepTech': '#ef4444', 'AI': '#a78bfa', 'ClimateTech': '#34d399',
    'Cybersecurity': '#fb923c', 'PropTech': '#60a5fa', 'Marketplace': '#f472b6', 'DevTools': '#94a3b8'
  };
  // All sectors — used for donut segments so they sum to 100%
  const sectorDistAll  = groupBy(startups, s => s.sector);
  // Top 5 only — used for the text legend beside the donut
  const sectorDistTop5 = sectorDistAll.slice(0, 5);

  // Donut segments use ALL sectors
  const sektorDonutSegs = sectorDistAll.map(([name, cnt]) => ({ value: cnt, color: SECTOR_COLORS[name] || '#94a3b8' }));

  // Stage distribution (all stages)
  const ALL_STAGES = ['Pre-Seed', 'Seed', 'Pre-Series A', 'Series A', 'Series B'];
  const stageDist = {};
  ALL_STAGES.forEach(st => { stageDist[st] = 0; });
  startups.forEach(s => { if (stageDist[s.stage] !== undefined) stageDist[s.stage]++; });
  const maxStageCount = Math.max(1, ...Object.values(stageDist));

  // Decline reasons
  const declinedDeals = pipeline.filter(x => x.status === 'Declined' && x.decline_reason);
  const declineReasonDist = groupBy(declinedDeals, x => x.decline_reason);
  const maxDeclineCount = declineReasonDist.length > 0 ? declineReasonDist[0][1] : 1;

  // --- KPI Tiles ---
  const subsPulse = subs.length > 0 ? 'dash-pulse' : '';
  const kpiHtml = `
    <div class="dbv2-kpi-row">
      <div class="dbv2-kpi">
        <div class="dbv2-kpi-tag"><div class="dbv2-kpi-dot" style="background:#0A84FF"></div>GESAMT DEALS</div>
        <div class="dbv2-kpi-val">${funnelTotal}</div>
        <div class="dbv2-kpi-sub">Im aktuellen Dataset</div>
      </div>
      <div class="dbv2-kpi ${subsPulse}">
        <div class="dbv2-kpi-tag"><span class="dash-pulse" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#0A84FF;flex-shrink:0;"></span>NEUE SUBMISSIONS</div>
        <div class="dbv2-kpi-val">${subs.length}</div>
        <div class="dbv2-kpi-sub">Warten auf Review</div>
      </div>
      <div class="dbv2-kpi">
        <div class="dbv2-kpi-tag"><div class="dbv2-kpi-dot" style="background:#a78bfa"></div>IN PIPELINE</div>
        <div class="dbv2-kpi-val">${pipeline.length}</div>
        <div class="dbv2-kpi-sub">Aktive Deals im Screening</div>
      </div>
      <div class="dbv2-kpi">
        <div class="dbv2-kpi-tag"><div class="dbv2-kpi-dot" style="background:#00dfc1"></div>SYNCED TO CRM</div>
        <div class="dbv2-kpi-val">${syncedCount}</div>
        <div class="dbv2-kpi-sub">Erfolgreich übergeben</div>
      </div>
      <div class="dbv2-kpi">
        <div class="dbv2-kpi-tag"><div class="dbv2-kpi-dot" style="background:#f59e0b"></div>Ø SCORE</div>
        <div class="dbv2-kpi-val">${avgScore}</div>
        <div class="dbv2-kpi-sub">Aktives Ruleset: ${escapeHTML(rulesetName)}</div>
      </div>
    </div>`;

  // --- Pipeline Status + Funnel ---
  const dotsHtml = STAGES.map(st => `
    <div class="dbv2-dot-item">
      <div class="dbv2-dot-top"><div class="dbv2-dot-circle" style="background:${STAGE_DOT_COLORS[st]}"></div>${escapeHTML(STAGE_DOT_LABELS[st])}</div>
      <div class="dbv2-dot-count">${stageCounts[st]}</div>
    </div>`).join('');

  // Accepted = total startups minus those still pending in the submissions queue
  const funnelAccepted = Math.max(0, funnelTotal - subs.length);

  const funnelSteps = [
    { label: 'EINGEREICHT', val: funnelTotal,    pct: 100,                                    color: 'rgba(128,128,128,0.35)' },
    { label: 'ANGENOMMEN',  val: funnelAccepted, pct: pctOf(funnelAccepted, funnelTotal || 1), color: 'var(--accent)' },
    { label: 'IN PIPELINE', val: funnelPipeline, pct: pctOf(funnelPipeline, funnelTotal || 1), color: '#f59e0b' },
    { label: 'AN CRM',      val: funnelSynced,   pct: pctOf(funnelSynced,   funnelTotal || 1), color: '#00dfc1' }
  ];
  const funnelHtml = funnelSteps.map(f => `
    <div class="dbv2-frow">
      <div class="dbv2-flabel">${escapeHTML(f.label)}</div>
      <div class="dbv2-ftrack"><div class="dbv2-ffill" style="width:${f.pct}%;background:${f.color}"></div></div>
      <div class="dbv2-fcount">${f.val}</div>
    </div>`).join('');

  const row2Html = `
    <div class="dbv2-row2">
      <div class="dbv2-panel dbv2-p-wide">
        <div class="dbv2-panel-title">Pipeline Status</div>
        <div class="dbv2-panel-sub">Aktueller Bearbeitungsstatus der gesamten Pipeline</div>
        <div class="dbv2-big-bar"></div>
        <div class="dbv2-dots-row">${dotsHtml}</div>
      </div>
      <div class="dbv2-panel dbv2-p-narrow">
        <div class="dbv2-panel-title">Dealflow Funnel</div>
        <div class="dbv2-panel-sub">Eingang bis CRM</div>
        ${funnelHtml}
      </div>
    </div>`;

  // --- Score Donut + Absage-Gründe ---
  const scoreDonutSvg = buildDonutSVG(scoreDonutSegs, 120, 18);
  const scoreLegendHtml = BUCKET_LABELS.map((lbl, i) => `
    <div class="dbv2-dleg-item">
      <div class="dbv2-dleg-dot" style="background:${BUCKET_COLORS[i]}"></div>
      ${escapeHTML(lbl)} (${buckets[i]})
    </div>`).join('');

  const absageHtml = declineReasonDist.length === 0
    ? `<div class="dbv2-empty"><div class="dbv2-empty-icon">!</div><div class="dbv2-empty-text">Noch keine Deals abgelehnt.</div></div>`
    : declineReasonDist.map(([key, cnt]) => {
        const label = DECLINE_REASONS.find(r => r.key === key)?.label || key;
        const w = pctOf(cnt, maxDeclineCount);
        return `<div class="dbv2-frow"><div class="dbv2-flabel" title="${escapeHTML(label)}" style="min-width:130px;font-size:9px">${escapeHTML(label)}</div><div class="dbv2-ftrack"><div class="dbv2-ffill" style="width:${w}%;background:var(--dangerText)"></div></div><div class="dbv2-fcount">${cnt}</div></div>`;
      }).join('');

  const row3Html = `
    <div class="dbv2-row3">
      <div class="dbv2-panel dbv2-p-half">
        <div class="dbv2-panel-title">Score Verteilung</div>
        <div class="dbv2-panel-sub">Anzahl Deals pro Score-Bereich</div>
        <div class="dbv2-donut-wrap">
          <div class="dbv2-donut-pos">${scoreDonutSvg}</div>
          <div class="dbv2-dleg">${scoreLegendHtml}</div>
        </div>
      </div>
      <div class="dbv2-panel dbv2-p-half">
        <div class="dbv2-panel-title">Häufigste Absage-Gründe</div>
        <div class="dbv2-panel-sub">Nur Deals mit Status „Declined"</div>
        ${absageHtml}
      </div>
    </div>`;

  // --- Stage Column-Chart + Sektor Donut ---
  const stageColsHtml = ALL_STAGES.map(st => {
    const cnt = stageDist[st] || 0;
    const h = Math.round((cnt / maxStageCount) * 100);
    return `<div class="dbv2-sc-wrap"><div class="dbv2-sc-count">${cnt}</div><div class="dbv2-sc-bar" style="height:${Math.max(h, 4)}%"></div><div class="dbv2-sc-label">${escapeHTML(st)}</div></div>`;
  }).join('');

  const sektorDonutSvg = buildDonutSVG(sektorDonutSegs, 120, 16);
  const sektorLegendHtml = sectorDistTop5.map(([name, cnt]) => `
    <div class="dbv2-dleg-item">
      <div class="dbv2-dleg-dot" style="background:${SECTOR_COLORS[name] || '#94a3b8'}"></div>
      ${escapeHTML(name)} &nbsp;<strong style="color:var(--text-primary);font-weight:800">${cnt}</strong>
    </div>`).join('');

  const row4Html = `
    <div class="dbv2-row3">
      <div class="dbv2-panel dbv2-p-half">
        <div class="dbv2-panel-title">Stage Verteilung</div>
        <div class="dbv2-panel-sub">Pipeline-Reife über alle Deals</div>
        <div class="dbv2-stage-chart">${stageColsHtml}</div>
      </div>
      <div class="dbv2-panel dbv2-p-half">
        <div class="dbv2-panel-title">Sektor Verteilung</div>
        <div class="dbv2-panel-sub">Top-Sektoren im aktuellen Datensatz</div>
        <div class="dbv2-donut-wrap">
          <div class="dbv2-donut-pos">
            ${sektorDonutSvg}
            <div class="dbv2-donut-center">
              <div class="dbv2-donut-center-val">${funnelTotal}</div>
              <div class="dbv2-donut-center-sub">TOTAL</div>
            </div>
          </div>
          <div class="dbv2-dleg">${sektorLegendHtml}</div>
        </div>
      </div>
    </div>`;

  // --- Activity Table ---
  const recentEvents = activity.slice(0, 10);
  const actRowsHtml = recentEvents.length === 0
    ? `<tr><td colspan="4" style="padding:20px 0;color:var(--text-secondary);font-weight:800;">Noch keine Aktivitäten.</td></tr>`
    : recentEvents.map(ev => {
        const ts = ev.ts ? timeAgo(ev.ts) : '—';
        const s = startups.find(x => x?.anon_id === ev.anon_id);
        const dealName = s ? escapeHTML(s.company_name || s.anon_id) : (ev.anon_id ? escapeHTML(ev.anon_id) : '—');
        const actionLabel = escapeHTML(DASHBOARD_EVENT_LABELS[ev.event] || ev.event || 'Event');
        const moduleLabel = ev.event && ev.event.startsWith('PIPELINE') ? 'PIPELINE'
          : ev.event && ev.event.startsWith('SUBMISSION') ? 'SUBMISSION'
          : ev.event && ev.event.startsWith('CRM') ? 'CRM'
          : ev.event && ev.event.startsWith('NOTE') ? 'NOTIZ'
          : ev.event && ev.event.startsWith('COMPARE') ? 'COMPARE'
          : 'EVENT';
        return `<tr>
          <td class="dbv2-act-time">${escapeHTML(ts)}</td>
          <td><span class="dbv2-act-badge">${escapeHTML(moduleLabel)}</span></td>
          <td>${dealName}</td>
          <td>${actionLabel}</td>
        </tr>`;
      }).join('');

  const actHtml = `
    <div class="dbv2-panel" style="margin-top:10px;">
      <div class="dbv2-act-header">
        <div>
          <div class="dbv2-panel-title">Letzte Aktivitäten</div>
          <div class="dbv2-panel-sub">Die neuesten Workspace-Events und Statusänderungen</div>
        </div>
        <button class="dbv2-act-link" id="dashActAllBtn">Alle anzeigen</button>
      </div>
      <table class="dbv2-act-table">
        <thead><tr><th>ZEITPUNKT</th><th>STATUS / MODUL</th><th>DEAL</th><th>AKTION</th></tr></thead>
        <tbody>${actRowsHtml}</tbody>
      </table>
    </div>`;

  // --- Assemble ---
  view.innerHTML = `<div style="padding:4px 0 8px;">${kpiHtml}${row2Html}${row3Html}${row4Html}${actHtml}</div>`;

  // Bind activity link
  const dashActBtn = document.getElementById('dashActAllBtn');
  if (dashActBtn) dashActBtn.onclick = () => { currentView = 'activity'; renderCurrent(); };
}
