/* ============================================================
   renderers.js PATCH — 2026-03-24
   Apply these two replacements in js/renderers.js
   ============================================================ */

/* ────────────────────────────────────────────────────────────
   CHANGE 1: Replace the entire _scoreRing() function
   Find:   function _scoreRing(scoreRaw, rulesetName, anonId) {
   Replace with the function below
   ─────────────────────────────────────────────────────────── */

function _scoreRing(scoreRaw, rulesetName, anonId) {
  const n = Number(scoreRaw ?? 0);
  const R = 26;
  const circ = +(2 * Math.PI * R).toFixed(2);
  const off  = +(circ * (1 - n / 100)).toFixed(2);
  let ring, track, txt;
  if (n >= 70)      { ring = '#00dfc1'; track = 'rgba(0,223,193,0.14)';  txt = '#00dfc1'; }
  else if (n >= 40) { ring = '#f97316'; track = 'rgba(249,115,22,0.14)'; txt = '#f97316'; }
  else              { ring = '#ef4444'; track = 'rgba(239,68,68,0.14)';  txt = '#ef4444'; }
  const disp = (scoreRaw !== null && scoreRaw !== undefined) ? String(n) : '—';
  return `<div class="score-wrap">
    <div class="score-ring">
      <svg viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="${R}" fill="none" stroke="${track}" stroke-width="5"/>
        <circle cx="32" cy="32" r="${R}" fill="none" stroke="${ring}" stroke-width="5"
          stroke-dasharray="${circ}" stroke-dashoffset="${off}" stroke-linecap="round"/>
      </svg>
      <span class="score-num" style="color:${txt}">${escapeHTML(disp)}</span>
    </div>
    <button class="infoicon" data-action="scoreinfo" data-id="${escapeHTML(anonId)}" type="button" aria-label="Score Breakdown">ⓘ</button>
    <span class="score-lbl">${escapeHTML(rulesetName)}</span>
  </div>`;
}


/* ────────────────────────────────────────────────────────────
   CHANGE 2: Replace card.innerHTML inside _renderCardsContent()
   Find the line:   card.innerHTML = `
   (inside the list.forEach loop)
   Replace the entire template literal with the one below
   ─────────────────────────────────────────────────────────── */

    card.innerHTML = `
  <div class="card-head">
    <div class="card-head-left">
      <div class="card-name">
        ${escapeHTML(startupLabel(s))}
        <span class="cid">${escapeHTML(s.anon_id)}</span>
      </div>
      <div class="tags">
        <span class="tag">🌍 ${escapeHTML(s.origin_country)}</span>
        <span class="tag">${escapeHTML(marketLabel)}</span>
        <span class="tag stage">${escapeHTML(s.stage)}</span>
        <span class="tag">${escapeHTML(s.sector)}</span>
        ${s.sub_sector ? `<span class="tag">${escapeHTML(s.sub_sector)}</span>` : ''}
      </div>
      ${s.description ? `<p class="desc">${escapeHTML(s.description)}</p>` : ''}
      ${nc > 0 ? `<span class="card-notes-indicator" style="margin-top:4px;display:inline-flex;">📝 ${nc}</span>` : ''}
    </div>
    ${_scoreRing(_scoreRaw, activeRulesetName, s.anon_id)}
  </div>

  <div class="kpi-grid">
    <div class="kpi-tile">
      <span class="kpi-val">${escapeHTML(fmtEUR(s.mrr_eur))}</span>
      <span class="kpi-lbl">MRR</span>
    </div>
    <div class="kpi-tile">
      <span class="kpi-val${g > 0 ? ' pos' : g < 0 ? ' neg' : ''}">${g === null ? '—' : escapeHTML(fmtPct(g))}</span>
      <span class="kpi-lbl">Wachstum (${escapeHTML(s.growth?.type || '—')})</span>
    </div>
    <div class="kpi-tile">
      <span class="kpi-val neg">${escapeHTML(fmtEUR(s.burn_eur_per_month))}</span>
      <span class="kpi-lbl">Burn / Monat</span>
    </div>
    <div class="kpi-tile">
      <span class="kpi-val">${escapeHTML(String(s.runway_months))} M</span>
      <span class="kpi-lbl">Runway</span>
    </div>
    <div class="kpi-tile">
      <span class="kpi-val">${escapeHTML(String(s.nrr_pct))}%</span>
      <span class="kpi-lbl">NRR</span>
    </div>
    <div class="kpi-tile">
      <span class="kpi-val">${escapeHTML(s.ltv_cac_ratio.toFixed(1))}</span>
      <span class="kpi-lbl">LTV/CAC</span>
    </div>
  </div>

  <div class="actions">
    <button class="btn-primary" data-action="open" data-id="${escapeHTML(s.anon_id)}">Details öffnen</button>
    <div class="btn-row">
      <button class="btn-secondary" data-action="addpipeline" data-id="${escapeHTML(s.anon_id)}" ${pipelineBtnDisabled}>${escapeHTML(pipelineBtnText)}</button>
      <button class="btn-secondary" data-action="compare" data-id="${escapeHTML(s.anon_id)}">⇄ Compare</button>
    </div>
  </div>
`;
