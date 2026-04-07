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
  backdrop.setAttribute("aria-hidden", "false");

  document.getElementById("modalH2").textContent = startupLabel(s);

  const ue = classifyUE(s);
  const rq = classifyRQ(s);
  const ce = classifyCE(s);

  const kpis = [
    { label:"HQ", value: s.origin_country, sub:"Sitz / Herkunft" },
    { label:"Markt", value: (s.market_served || []).join(", ").replace("DACH","DACH (DE•AT•CH)"), sub:"Served markets" },
    { label:"Team", value: (s.team_size || "—") + " Mitarbeiter", sub:"Aktuelle Teamgröße" },

    { label:"MRR", value: fmtEUR(s.mrr_eur), sub:"aktueller Wert" },
    { label:`Wachstum ${s.growth?.type || ""}`.trim(), value: s.growth ? fmtPct(s.growth.value_pct) : "—", sub:"Veränderung" },
    { label:"Burn / Monat", value: fmtEUR(s.burn_eur_per_month), sub:"Cash-Abfluss" },
    { label:"Runway", value: s.runway_months + " Monate", sub:"bei aktuellem Burn" },

    { label:"NRR", value: s.nrr_pct + "%", sub:"Net Revenue Retention" },
    { label:"LTV/CAC", value: s.ltv_cac_ratio.toFixed(1), sub:"Unit Economics" },

    { label:"Ticket (Rundengröße)", value: fmtEUR(s.ticket_eur), sub:"Raise / Round size" },
    { label:"ARR", value: fmtEUR(s.arr_eur), sub:"MRR × 12" },
    { label:"Net New ARR", value: fmtEUR(s.net_new_arr_eur), sub:"(Demo)" },

    { label:"Gross Margin", value: s.gross_margin_pct + "%", sub:"Profitability signal" },
    { label:"Logo Churn", value: s.logo_churn_pct + "%", sub:"(Demo)" },
    { label:"Revenue Churn", value: s.revenue_churn_pct + "%", sub:"(Demo)" },

    { label:"CAC", value: fmtEUR(s.cac_eur), sub:"Customer Acquisition Cost" },
    { label:"LTV", value: fmtEUR(s.ltv_eur), sub:"Lifetime Value" },
    { label:"CAC Payback", value: s.cac_payback_months + " Monate", sub:"Payback" },

    { label:"Burn Multiple", value: String(s.burn_multiple), sub:"Capital efficiency" },
    { label:"Founder (selbst)", value: (s.founder_pct ?? 0).toFixed(1) + "%", sub:"Ownership" },
    { label:"ESOP (reserviert)", value: (s.esop_pct ?? 0).toFixed(1) + "%", sub:"Employee option pool" },
    { label:"Employees (halten)", value: (s.employees_pct ?? 0).toFixed(1) + "%", sub:"Employee ownership" },

    { label:"Quality", value: `UE ${ue} • RQ ${rq} • CE ${ce}`, sub:"Scores (Demo)" }
  ];

  const grid = document.getElementById("kpiGrid");
  grid.innerHTML = "";
  kpis.forEach(k=>{
    const div = document.createElement("div");
    div.className = "kpi";
    div.innerHTML = `
      <div class="label">${k.label}</div>
      <div class="value mono">${k.value}</div>
      <div class="sub">${k.sub}</div>
    `;
    grid.appendChild(div);
  });

  document.getElementById("kpiHint").textContent = s.notes || "—";
  document.getElementById("modalSub").textContent = `${s.anon_id} • ${s.sector}${s.sub_sector ? " › " + s.sub_sector : ""} • ${s.stage}`;

  // Plausibility badge in modal (shown if startup has a submission entry)
  let plausModalEl = document.getElementById("modalPlausibilityBadge");
  if(!plausModalEl){
    plausModalEl = document.createElement("div");
    plausModalEl.id = "modalPlausibilityBadge";
    plausModalEl.style.cssText = "margin-top:6px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;";
    const modalSub = document.getElementById("modalSub");
    if(modalSub && modalSub.parentNode) modalSub.parentNode.insertBefore(plausModalEl, modalSub.nextSibling);
  }
  const subForModal = (typeof getSubmissions === "function") ? getSubmissions().find(x=>x.anon_id===s.anon_id) : null;
  if(subForModal){
    const statusMap2 = {
      passed: { cls:"badge plaus-passed", icon:"✓", label:"Passed" },
      flagged: { cls:"badge plaus-flagged", icon:"⚠", label:"Flagged" },
      failed:  { cls:"badge plaus-failed",  icon:"✗", label:"Failed" }
    };
    const sm2 = statusMap2[subForModal.plausibility_status] || statusMap2.failed;
    plausModalEl.innerHTML = `<span class="${sm2.cls}" style="font-size:0.82rem;">${sm2.icon} Plausibility: ${sm2.label}</span><button class="infoicon" id="modalPlausInfoBtn" type="button" title="Plausibility Breakdown" aria-label="Plausibility Breakdown">ⓘ</button>`;
    plausModalEl.style.display = "flex";
    const infoBtn = document.getElementById("modalPlausInfoBtn");
    if(infoBtn) infoBtn.onclick = (e)=>{ openPlausibilityBreakdown(s.anon_id, infoBtn); e.stopPropagation(); };
  } else {
    plausModalEl.innerHTML = "";
    plausModalEl.style.display = "none";
  }

  bindLeadFormForStartup(s);
  syncModalPipelineButtons(s);
  renderModalNotes(s.anon_id);

  document.getElementById("nextBtn").onclick = ()=>{
    const arr = (list && list.length) ? list : [s];
    const current = arr.findIndex(z=>z.anon_id===s.anon_id);
    const next = (current + 1) % arr.length;
    openModalByIndex(next, arr);
  };
  document.getElementById("prevBtn").onclick = ()=>{
    const arr = (list && list.length) ? list : [s];
    const current = arr.findIndex(z=>z.anon_id===s.anon_id);
    const prev = (current - 1 + arr.length) % arr.length;
    openModalByIndex(prev, arr);
  };
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
  backdrop.setAttribute("aria-hidden", "true");
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
