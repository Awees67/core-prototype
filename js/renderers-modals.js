/* =========================
   RENDERER — MODALS
   Includes: Details modal, Decline dialog, Score/Plausibility popovers
========================= */

let _modalStartup = null;

function openModalByIndex(idx, list){
  if(!list || !list.length) return;
  modalIndex = Math.max(0, Math.min(idx, list.length-1));
  const s = list[modalIndex];
  openModalWithStartup(s, list);
}

function openModalById(id){
  const list = buildFilteredList();
  const idx = list.findIndex(x=>x.anon_id===id);
  if(idx>=0) openModalByIndex(idx, list);
  else{
    const s = startups.find(x=>x.anon_id===id);
    if(s) openModalWithStartup(s, [s]);
  }
}

function openModalByAnonId(anon_id, list){
  const arr = (list && list.length) ? list : startups;
  const idx = arr.findIndex(x=>x.anon_id===anon_id);
  if(idx>=0) openModalByIndex(idx, arr);
}

function openModalWithStartup(s, list){
  _modalStartup = s;
  const backdrop = document.getElementById("modalBackdrop");
  backdrop.style.display = "flex";
  backdrop.setAttribute("aria-hidden","false");

  const modal = backdrop.querySelector(".modal");
  if(!modal) return;

  // ── Helpers ──────────────────────────────────────────────
  function fmtDeal(n){
    if(n === null || n === undefined) return "—";
    if(n >= 1000000) return "€" + (n/1000000).toFixed(2).replace(/\.?0+$/,"") + "M";
    if(n >= 1000)    return "€" + Math.round(n/1000) + "k";
    return "€" + Math.round(n);
  }

  // ── Plausibility ─────────────────────────────────────────
  const subs = (typeof getSubmissions==="function") ? getSubmissions() : [];
  const sub  = subs.find(x=>x.anon_id===s.anon_id);
  let plausBadgeHTML = "";
  if(sub){
    const pm = {
      passed:  { cls:"",     txt:"✓ Plausibility Passed" },
      flagged: { cls:"warn", txt:"⚠ Flagged" },
      failed:  { cls:"fail", txt:"✗ Failed" }
    }[sub.plausibility_status] || { cls:"fail", txt:"✗ Failed" };
    plausBadgeHTML = `<span class="deal-plaus-badge ${pm.cls}" id="dealPlausBadge" data-plaus="${escapeHTML(s.anon_id)}">${pm.txt}</span>`;
  }

  // ── Custom Score ──────────────────────────────────────────
  let scoreVal = "—"; let rulesetName = "Score";
  try{
    const res = computeCustomIndexV6(s.anon_id);
    const rules = getCustomRulesV6();
    rulesetName = rules.name || "Score";
    if(res && res.score !== null) scoreVal = String(res.score);
  }catch(_){}

  // ── Avatar initials ───────────────────────────────────────
  const initials = (s.company_name || s.anon_id || "?")
    .split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase().slice(0,2);

  // ── Signal classifications ────────────────────────────────
  const ue = classifyUE(s);
  const rq = classifyRQ(s);
  const ce = classifyCE(s);
  const ueColor = ue==="Strong" ? "green" : ue==="No Risk" ? "amber" : "red";
  const rqColor = rq==="High"   ? "green" : rq==="Stable"  ? "amber" : "red";
  const ceColor = ce==="Efficient"?"green" : ce==="Neutral" ? "amber" : "red";

  // ── Growth ────────────────────────────────────────────────
  const g = s.growth?.value_pct ?? null;
  const gVal   = g===null ? "—" : (g>0?"+":"")+g+" %";
  const gClass = g===null ? "" : g>20?"pos" : g>0?"warn" : "neg";
  const gColor = g===null ? "" : g>20?"green" : g>0?"amber" : "red";

  // ── KPI color helpers ─────────────────────────────────────
  const nrrColor  = s.nrr_pct>=110?"green":s.nrr_pct>=100?"amber":"red";
  const nrrClass  = s.nrr_pct>=100?"pos":"neg";
  const lcColor   = s.logo_churn_pct<=3?"green":s.logo_churn_pct<=6?"amber":"red";
  const rcColor   = s.revenue_churn_pct<=3?"green":s.revenue_churn_pct<=6?"amber":"red";
  const ltvcColor = s.ltv_cac_ratio>=3?"green":s.ltv_cac_ratio>=1?"amber":"red";
  const ltvcClass = s.ltv_cac_ratio>=3?"pos":"neg";
  const rwColor   = s.runway_months>=18?"green":s.runway_months>=12?"amber":"red";
  const rwClass   = s.runway_months>=12?"warn":"neg";
  const bmVal     = (s.burn_multiple!==null&&s.burn_multiple!==undefined) ? s.burn_multiple.toFixed(2)+" ×" : "—";
  const bmColor   = s.burn_multiple<=1.5?"green":s.burn_multiple<=3?"amber":"red";
  const bmClass   = s.burn_multiple<=1.5?"pos":"warn";
  const scoreNum  = parseFloat(scoreVal);
  const scoreColor= scoreNum>=70?"green":scoreNum>=40?"amber":"red";

  // ── Ownership ─────────────────────────────────────────────
  const owSum   = ((s.founder_pct||0)+(s.esop_pct||0)+(s.employees_pct||0)).toFixed(1);
  const owAvail = (100-parseFloat(owSum)).toFixed(1);

  // ── Pipeline / CRM state ─────────────────────────────────
  const pipeline    = getPipeline();
  const pipeItem    = pipeline.find(x=>x.anon_id===s.anon_id);
  const isSynced    = pipeItem?.status==="Synced";
  const inPipeline  = !!pipeItem;
  const alreadySent = (typeof getOutreach==="function") && getOutreach().some(x=>x.anon_id===s.anon_id);

  // ── Notes HTML ───────────────────────────────────────────
  const notes = (typeof getNotesForDeal==="function") ? getNotesForDeal(s.anon_id) : [];
  const notesHTML = notes.length===0
    ? `<div class="deal-notes-empty">Noch keine Notizen.</div>`
    : notes.map(n=>`
      <div class="deal-note-entry">
        <div class="deal-note-meta">
          <span class="deal-note-ts">${escapeHTML(timeAgo(n.created_at).toUpperCase())}</span>
          <span class="deal-note-author">${escapeHTML(n.author||"Analyst")}</span>
        </div>
        <div class="deal-note-text">
          <button class="deal-note-delete" data-del-note="${escapeHTML(n.id)}">✕</button>
          ${escapeHTML(n.text)}
        </div>
      </div>
      <div class="deal-note-sep"></div>
    `).join("");

  // ── Sector label ─────────────────────────────────────────
  const sectorDisplay = s.sub_sector ? `${s.sector} › ${s.sub_sector}` : s.sector;
  const marketStr = (s.market_served||[]).join(", ").replace("DACH","DACH (DE·AT·CH)");

  // ── Render ────────────────────────────────────────────────
  modal.innerHTML = `
    <div class="deal-topbar">
      <div class="deal-topbar-nav">
        <button class="deal-btn-nav" id="dealPrevBtn">← Zurück</button>
        <button class="deal-btn-nav" id="dealNextBtn">Weiter →</button>
      </div>
      <div class="deal-topbar-spacer"></div>
      <button class="deal-btn-sec" id="dealCompareBtn">Add to Compare</button>
      <button class="deal-btn-sec" id="dealPipelineBtn" ${inPipeline?"disabled":""}>${inPipeline?"✓ In Pipeline":"Add to Pipeline"}</button>
      <button class="deal-btn-crm" id="dealCrmBtn" ${isSynced?"disabled":""}>${isSynced?"✓ Synced":"Push to CRM"}</button>
      <button class="deal-btn-primary" id="dealAnfrageBtn" ${alreadySent?"disabled":""}>${alreadySent?"✓ Angefragt":"Anfrage senden"}</button>
    </div>

    <div class="deal-main">
      <div class="deal-left">

        <div class="deal-hero">
          <div class="deal-avatar">${escapeHTML(initials)}</div>
          <div class="deal-hero-info">
            <div class="deal-hero-name">
              ${escapeHTML(startupLabel(s))}
              <span class="deal-stage-badge">${escapeHTML(s.stage)}</span>
              ${plausBadgeHTML}
            </div>
            <div class="deal-hero-desc">${escapeHTML(s.description||s.notes||"")}</div>
            <div class="deal-hero-meta">
              <span class="deal-meta-pill">${escapeHTML(sectorDisplay)}</span>
              <span class="deal-meta-pill">${escapeHTML(s.anon_id)}</span>
              ${s.contact_name?`<span class="deal-meta-pill">📧 ${escapeHTML(s.contact_name)}</span>`:""}
            </div>
          </div>
        </div>

        <div class="deal-section">
          <div class="deal-sec-label">Kontext</div>
          <div class="deal-kpi-row c4">
            <div class="deal-kpi"><div class="deal-kpi-lbl">HQ</div><div class="deal-kpi-val sm">${escapeHTML(s.origin_country)}</div></div>
            <div class="deal-kpi"><div class="deal-kpi-lbl">Markt</div><div class="deal-kpi-val sm" style="font-size:12px;">${escapeHTML(marketStr)}</div></div>
            <div class="deal-kpi"><div class="deal-kpi-lbl">Stage</div><div class="deal-kpi-val blue sm">${escapeHTML(s.stage)}</div></div>
            <div class="deal-kpi"><div class="deal-kpi-lbl">Team</div><div class="deal-kpi-val">${escapeHTML(String(s.team_size))}</div><div class="deal-kpi-sub">Mitarbeiter</div></div>
          </div>
        </div>

        <div class="deal-section">
          <div class="deal-sec-label">Revenue &amp; Wachstum</div>
          <div class="deal-kpi-row c4">
            <div class="deal-kpi"><div class="deal-kpi-lbl">MRR</div><div class="deal-kpi-val">${escapeHTML(fmtDeal(s.mrr_eur))}</div></div>
            <div class="deal-kpi"><div class="deal-kpi-lbl">ARR</div><div class="deal-kpi-val">${escapeHTML(fmtDeal(s.arr_eur))}</div></div>
            <div class="deal-kpi ${gClass}"><div class="deal-kpi-lbl">Wachstum ${escapeHTML(s.growth?.type||"")}</div><div class="deal-kpi-val ${gColor}">${escapeHTML(gVal)}</div></div>
            <div class="deal-kpi"><div class="deal-kpi-lbl">Net New ARR</div><div class="deal-kpi-val">${escapeHTML(fmtDeal(s.net_new_arr_eur))}</div></div>
          </div>
        </div>

        <div class="deal-section">
          <div class="deal-sec-label">Retention</div>
          <div class="deal-kpi-row c3">
            <div class="deal-kpi ${nrrClass}"><div class="deal-kpi-lbl">NRR</div><div class="deal-kpi-val ${nrrColor}">${escapeHTML(String(s.nrr_pct))} %</div><div class="deal-kpi-sub">Net Revenue Retention</div></div>
            <div class="deal-kpi ${s.logo_churn_pct<=3?"pos":"neg"}"><div class="deal-kpi-lbl">Logo Churn</div><div class="deal-kpi-val ${lcColor}">${escapeHTML(String(s.logo_churn_pct))} %</div><div class="deal-kpi-sub">Kunden-Abwanderung</div></div>
            <div class="deal-kpi ${s.revenue_churn_pct<=3?"pos":"neg"}"><div class="deal-kpi-lbl">Revenue Churn</div><div class="deal-kpi-val ${rcColor}">${escapeHTML(String(s.revenue_churn_pct))} %</div><div class="deal-kpi-sub">Umsatz-Abwanderung</div></div>
          </div>
        </div>

        <div class="deal-section">
          <div class="deal-sec-label">Unit Economics</div>
          <div class="deal-kpi-row c5">
            <div class="deal-kpi"><div class="deal-kpi-lbl">Gross Margin</div><div class="deal-kpi-val">${escapeHTML(String(s.gross_margin_pct))} %</div></div>
            <div class="deal-kpi"><div class="deal-kpi-lbl">LTV</div><div class="deal-kpi-val sm">${escapeHTML(fmtDeal(s.ltv_eur))}</div></div>
            <div class="deal-kpi"><div class="deal-kpi-lbl">CAC</div><div class="deal-kpi-val sm">${escapeHTML(fmtDeal(s.cac_eur))}</div></div>
            <div class="deal-kpi"><div class="deal-kpi-lbl">CAC Payback</div><div class="deal-kpi-val sm">${escapeHTML(String(s.cac_payback_months))} Mo.</div></div>
            <div class="deal-kpi ${ltvcClass}"><div class="deal-kpi-lbl">LTV / CAC</div><div class="deal-kpi-val ${ltvcColor}">${escapeHTML(s.ltv_cac_ratio.toFixed(1))} ×</div></div>
          </div>
        </div>

        <div class="deal-section">
          <div class="deal-sec-label">Capital Efficiency</div>
          <div class="deal-kpi-row c3">
            <div class="deal-kpi neg"><div class="deal-kpi-lbl">Burn / Monat</div><div class="deal-kpi-val red">${escapeHTML(fmtDeal(s.burn_eur_per_month))}</div></div>
            <div class="deal-kpi ${rwClass}"><div class="deal-kpi-lbl">Runway</div><div class="deal-kpi-val ${rwColor}">${escapeHTML(String(s.runway_months))} Mo.</div><div class="deal-kpi-sub">bei aktuellem Burn</div></div>
            <div class="deal-kpi ${bmClass}"><div class="deal-kpi-lbl">Burn Multiple</div><div class="deal-kpi-val ${bmColor}">${escapeHTML(bmVal)}</div></div>
          </div>
        </div>

        <div class="deal-section">
          <div class="deal-sec-label">Cap Table &amp; Runde</div>
          <div class="deal-own-row">
            <div class="deal-own-ticket"><div class="deal-kpi-lbl">Ticket</div><div class="deal-kpi-val lg">${escapeHTML(fmtDeal(s.ticket_eur))}</div><div class="deal-kpi-sub">Rundengröße</div></div>
            <div class="deal-own-item"><div class="deal-kpi-lbl">Founder</div><div class="deal-kpi-val">${escapeHTML((s.founder_pct||0).toFixed(1))} %</div></div>
            <div class="deal-own-item dim"><div class="deal-kpi-lbl">ESOP</div><div class="deal-kpi-val">${escapeHTML((s.esop_pct||0).toFixed(1))} %</div></div>
            <div class="deal-own-item dim"><div class="deal-kpi-lbl">Employees</div><div class="deal-kpi-val">${escapeHTML((s.employees_pct||0).toFixed(1))} %</div></div>
          </div>
          <div class="deal-own-sum">Summe: ${escapeHTML(owSum)} % · ${escapeHTML(owAvail)} % verfügbar</div>
        </div>

        <div class="deal-section">
          <div class="deal-sec-label">Signal-Scores</div>
          <div class="deal-kpi-row c4">
            <div class="deal-kpi score-good"><div class="deal-kpi-lbl">Unit Economics</div><div class="deal-kpi-val ${ueColor} sm" style="margin-top:5px;">${escapeHTML(ue)}</div></div>
            <div class="deal-kpi score-good"><div class="deal-kpi-lbl">Retention Quality</div><div class="deal-kpi-val ${rqColor} sm" style="margin-top:5px;">${escapeHTML(rq)}</div></div>
            <div class="deal-kpi score-good"><div class="deal-kpi-lbl">Capital Efficiency</div><div class="deal-kpi-val ${ceColor} sm" style="margin-top:5px;">${escapeHTML(ce)}</div></div>
            <div class="deal-kpi score-info"><div class="deal-kpi-lbl">Custom Score</div><div class="deal-kpi-val ${scoreColor} lg" style="margin-top:3px;">${escapeHTML(scoreVal)}</div><div class="deal-kpi-sub">/ 100 · ${escapeHTML(rulesetName)}</div></div>
          </div>
        </div>

      </div>

      <div class="deal-right">
        <div class="deal-notes-head">
          <div class="deal-notes-title">Intelligence Notes</div>
          <button class="deal-notes-edit" title="Bearbeiten">✎</button>
        </div>
        ${notesHTML}
        <div class="deal-note-add">
          <textarea class="deal-note-input" id="dealNoteInput" placeholder="Neue Notiz hinzufügen…" rows="3" maxlength="500"></textarea>
          <button class="deal-note-save" id="dealNoteSave">Speichern</button>
          <div class="deal-note-hint">Lokal gespeichert · für das gesamte Team sichtbar</div>
        </div>
      </div>
    </div>
  `;

  // ── Event Bindings ────────────────────────────────────────
  const arr = (list && list.length) ? list : [s];
  const idx = arr.findIndex(z=>z.anon_id===s.anon_id);

  document.getElementById("dealPrevBtn").onclick = () => {
    openModalByIndex((idx - 1 + arr.length) % arr.length, arr);
  };
  document.getElementById("dealNextBtn").onclick = () => {
    openModalByIndex((idx + 1) % arr.length, arr);
  };

  // Keyboard nav
  if(modal._keyHandler) document.removeEventListener("keydown", modal._keyHandler);
  modal._keyHandler = (e) => {
    if(backdrop.style.display !== "flex") return;
    if(e.key === "ArrowRight") document.getElementById("dealNextBtn")?.click();
    if(e.key === "ArrowLeft")  document.getElementById("dealPrevBtn")?.click();
    if(e.key === "Escape") closeModal();
  };
  document.addEventListener("keydown", modal._keyHandler);

  // Pipeline
  const pipeBtn = document.getElementById("dealPipelineBtn");
  if(pipeBtn && !inPipeline){
    pipeBtn.onclick = () => {
      pipelineAdd(s.anon_id, "In Review");
      toast("Pipeline", "Deal zur Pipeline hinzugefügt");
      pipeBtn.textContent = "✓ In Pipeline";
      pipeBtn.disabled = true;
      if(currentView==="pipeline") renderPipeline();
    };
  }

  // CRM
  const crmBtn = document.getElementById("dealCrmBtn");
  if(crmBtn && !isSynced){
    crmBtn.onclick = () => {
      const p2 = getPipeline();
      const pi2 = p2.find(x=>x.anon_id===s.anon_id);
      if(pi2 && pi2.status==="Declined"){
        if(!confirm("Dieser Deal wurde declined. Trotzdem ins CRM pushen?")) return;
      }
      pipelinePushToCRM(s.anon_id);
      crmBtn.textContent = "✓ Synced";
      crmBtn.disabled = true;
      if(currentView==="pipeline") renderPipeline();
    };
  }

  // Compare
  const cmpBtn = document.getElementById("dealCompareBtn");
  if(cmpBtn) cmpBtn.onclick = () => addToCompare(s.anon_id);

  // Anfrage senden
  const anfBtn = document.getElementById("dealAnfrageBtn");
  if(anfBtn && !alreadySent){
    anfBtn.onclick = () => {
      closeModal();
      if(typeof _otOpenSendModal==="function") _otOpenSendModal(s);
    };
  }

  // Plausibility info
  const plausEl = document.getElementById("dealPlausBadge");
  if(plausEl){
    plausEl.onclick = (e) => {
      if(typeof openPlausibilityBreakdown==="function") openPlausibilityBreakdown(s.anon_id, plausEl);
      e.stopPropagation();
    };
  }

  // Notes: save
  const noteSave  = document.getElementById("dealNoteSave");
  const noteInput = document.getElementById("dealNoteInput");
  if(noteSave && noteInput){
    const doSave = () => {
      const text = noteInput.value.trim();
      if(!text) return;
      const pi3 = getPipeline().find(x=>x.anon_id===s.anon_id);
      const author = (pi3 && pi3.owner) ? pi3.owner : "Analyst";
      addNote(s.anon_id, text, author);
      noteInput.value = "";
      toast("Gespeichert", "Notiz hinzugefügt");
      openModalWithStartup(s, list);
    };
    noteSave.onclick = doSave;
    noteInput.addEventListener("keydown", (e) => {
      if((e.ctrlKey||e.metaKey) && e.key==="Enter"){ e.preventDefault(); doSave(); }
    });
  }

  // Notes: delete
  modal.querySelectorAll("[data-del-note]").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      deleteNote(btn.getAttribute("data-del-note"));
      toast("Gelöscht", "Notiz gelöscht");
      openModalWithStartup(s, list);
    };
  });

  // Score breakdown (i) buttons if present from custom-index patch
  try{ patchDealModal(); }catch(_){}
}

function renderModalNotes(anon_id){
  const notesList = document.getElementById("notesList");
  const notesCount = document.getElementById("notesCount");
  const noteInput = document.getElementById("noteInput");
  const addNoteBtn = document.getElementById("addNoteBtn");
  if(!notesList || !notesCount || !noteInput || !addNoteBtn) return;

  const notes = getNotesForDeal(anon_id);

  notesCount.textContent = notes.length ? `(${notes.length})` : "";

  if(notes.length === 0){
    notesList.innerHTML = `<div class="hint" style="margin-bottom:8px;">Keine Notizen – Fang an zu schreiben.</div>`;
  } else {
    notesList.innerHTML = notes.map(note => `
      <div class="note-item">
        <div class="note-header">
          <span class="note-author">${escapeHTML(note.author)}</span>
          <span class="note-time">${timeAgo(note.created_at)}</span>
          <button class="note-delete" data-note-id="${escapeHTML(note.id)}" title="Löschen">✕</button>
        </div>
        <div class="note-text">${escapeHTML(note.text)}</div>
      </div>
    `).join("");

    notesList.querySelectorAll(".note-delete").forEach(btn => {
      btn.onclick = () => {
        deleteNote(btn.getAttribute("data-note-id"));
        renderModalNotes(anon_id);
        toast("Gelöscht", "Notiz gelöscht");
      };
    });
  }

  // Rebind add handler (clone to remove old listeners)
  const newBtn = addNoteBtn.cloneNode(true);
  addNoteBtn.parentNode.replaceChild(newBtn, addNoteBtn);

  const doSave = () => {
    const text = document.getElementById("noteInput").value.trim();
    if(!text) return;
    const pipeline = getPipeline();
    const pipeItem = pipeline.find(x => x.anon_id === anon_id);
    const author = (pipeItem && pipeItem.owner) ? pipeItem.owner : "Analyst";
    addNote(anon_id, text, author);
    document.getElementById("noteInput").value = "";
    renderModalNotes(anon_id);
    toast("Gespeichert", "Notiz gespeichert");
  };

  newBtn.onclick = doSave;

  // Rebind textarea keyboard shortcut (clone to remove old listeners)
  const oldInput = document.getElementById("noteInput");
  const newInput = oldInput.cloneNode(true);
  oldInput.parentNode.replaceChild(newInput, oldInput);
  newInput.addEventListener("keydown", (e) => {
    if((e.ctrlKey || e.metaKey) && e.key === "Enter"){
      e.preventDefault();
      doSave();
    }
  });
}

function closeModal(){
  const backdrop = document.getElementById("modalBackdrop");
  backdrop.style.display = "none";
  backdrop.setAttribute("aria-hidden","true");
  // Clean up keyboard handler
  const modal = backdrop.querySelector(".modal");
  if(modal && modal._keyHandler){
    document.removeEventListener("keydown", modal._keyHandler);
    modal._keyHandler = null;
  }
}

/* =========================
   DECLINE DIALOG
========================= */
let _declineAnonId = null;
let _declinePrevStatus = null;
let _declineSelectEl = null;
let _declineBulkIds = null; // non-null = bulk mode

function openDeclineDialog(anon_id, prevStatus, selectEl, bulkIds){
  _declineAnonId = anon_id;
  _declinePrevStatus = prevStatus;
  _declineSelectEl = selectEl;
  _declineBulkIds = bulkIds || null;

  const dlg = document.getElementById("declineDialog");
  const dealNameEl = document.getElementById("declineDealName");
  const reasonSel = document.getElementById("declineReasonSelect");
  const noteInput = document.getElementById("declineNoteInput");
  if(!dlg || !dealNameEl || !reasonSel || !noteInput) return;

  // Set deal name (bulk vs. single)
  if(_declineBulkIds){
    dealNameEl.textContent = `${_declineBulkIds.length} ausgewählte Deals (Grund gilt für alle)`;
  } else {
    const startup = startups.find(x => x.anon_id === anon_id);
    dealNameEl.textContent = startup ? startupLabel(startup) : anon_id;
  }

  // Fill reason dropdown
  reasonSel.innerHTML = `<option value="">— Bitte auswählen —</option>` +
    DECLINE_REASONS.map(r => `<option value="${escapeHTML(r.key)}">${escapeHTML(r.label)}</option>`).join("");
  reasonSel.classList.remove("shake");

  // Clear note
  noteInput.value = "";

  dlg.style.display = "flex";

  const confirmBtn = document.getElementById("declineConfirmBtn");
  const cancelBtn  = document.getElementById("declineCancelBtn");

  // Clone buttons to remove old listeners
  const newConfirm = confirmBtn.cloneNode(true);
  const newCancel  = cancelBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
  cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

  newConfirm.addEventListener("click", ()=>{
    const reason = document.getElementById("declineReasonSelect").value;
    if(!reason){
      const sel = document.getElementById("declineReasonSelect");
      sel.classList.remove("shake");
      void sel.offsetWidth; // reflow to restart animation
      sel.classList.add("shake");
      toast("Pflichtfeld", "Bitte einen Grund auswählen");
      return;
    }
    const note = document.getElementById("declineNoteInput").value.trim();

    if(_declineBulkIds){
      // Bulk decline mode: apply reason to all selected IDs
      const ids = _declineBulkIds;
      let changed = 0;
      let skipped = 0;
      ids.forEach(id=>{
        if(isPipelineTransitionAllowed(id, "Declined")){
          pipelineSetStatus(id, "Declined", reason, note);
          changed++;
        } else {
          skipped++;
        }
      });
      bulkDeselectAll();
      closeDeclineDialog();
      if(skipped > 0){
        toast("Declined", `${changed} Deal${changed!==1?"s":""} abgelehnt, ${skipped} übersprungen`);
      } else {
        toast("Declined", `${changed} Deal${changed!==1?"s":""} abgelehnt`);
      }
      renderPipeline();
    } else {
      const ok = pipelineSetStatus(_declineAnonId, "Declined", reason, note);
      closeDeclineDialog();
      if(ok){ renderPipeline(); }
    }
  });

  newCancel.addEventListener("click", ()=>{
    // Revert dropdown to previous status (single mode only)
    if(_declineSelectEl && !_declineBulkIds){
      _declineSelectEl.value = _declinePrevStatus || "";
    }
    closeDeclineDialog();
  });
}

function closeDeclineDialog(){
  const dlg = document.getElementById("declineDialog");
  if(dlg) dlg.style.display = "none";
  _declineAnonId = null;
  _declinePrevStatus = null;
  _declineSelectEl = null;
}

/* =========================
   MODAL PIPELINE BUTTONS
========================= */
function syncModalPipelineButtons(s){
  if(!s) return;
  const p = getPipeline();
  const item = p.find(x=>x.anon_id===s.anon_id);

  const addBtn = document.getElementById("addToPipelineBtn");
  const crmBtn = document.getElementById("pushToCrmBtn");
  if(!addBtn || !crmBtn) return;

  if(!item){
    addBtn.textContent = "Add to Pipeline";
    addBtn.disabled = false;
    addBtn.title = "";
    crmBtn.textContent = "Push to CRM";
    crmBtn.disabled = false;
    crmBtn.style.opacity = "";
  } else if(item.status === "Synced"){
    addBtn.textContent = "In Pipeline ✓";
    addBtn.disabled = true;
    addBtn.title = "Status: Synced";
    crmBtn.textContent = "✓ Synced to CRM";
    crmBtn.disabled = true;
    crmBtn.style.opacity = "0.5";
  } else {
    addBtn.textContent = "In Pipeline ✓";
    addBtn.disabled = true;
    addBtn.title = `Status: ${item.status}`;
    crmBtn.textContent = "Push to CRM";
    crmBtn.disabled = false;
    crmBtn.style.opacity = "";
  }
}
