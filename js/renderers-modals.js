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

  // ── Helpers ──────────────────────────────────
  function fmt(n){
    if(n===null||n===undefined) return "—";
    if(n>=1000000) return "€"+(n/1000000).toFixed(2).replace(/\.?0+$/,"")+"M";
    if(n>=1000) return "€"+(n/1000).toFixed(0)+"k";
    return "€"+Math.round(n);
  }
  function fmtFull(n){ return fmtEUR(n||0); }

  // ── Custom Score ──────────────────────────────
  let scoreVal="—", rulesetName="Standard Screening";
  try{
    const res = computeCustomIndexV6(s.anon_id);
    const rules = getCustomRulesV6();
    rulesetName = rules.name||"Standard Screening";
    if(res&&res.score!==null) scoreVal = String(res.score);
  }catch(_){}
  const scoreNum = parseFloat(scoreVal);
  const scoreColorClass = scoreNum>=70?"high":scoreNum>=40?"mid":"low";

  // ── Plausibility ──────────────────────────────
  const subs=(typeof getSubmissions==="function")?getSubmissions():[];
  const sub=subs.find(x=>x.anon_id===s.anon_id);
  let plausHTML="";
  if(sub){
    const pm={
      passed:{cls:"dv-pill-pass",txt:"✓ Plausibility Passed"},
      flagged:{cls:"dv-pill-warn",txt:"⚠ Flagged"},
      failed:{cls:"dv-pill-fail",txt:"✗ Failed"}
    }[sub.plausibility_status]||{cls:"dv-pill-fail",txt:"✗ Failed"};
    plausHTML=`<span class="dv-pill ${pm.cls}" id="dvPlausBadge" data-plaus="${escapeHTML(s.anon_id)}">${pm.txt}</span>`;
  }

  // ── Pipeline / CRM state ─────────────────────
  const pipeline=getPipeline();
  const pipeItem=pipeline.find(x=>x.anon_id===s.anon_id);
  const isSynced=pipeItem?.status==="Synced";
  const inPipeline=!!pipeItem;
  const alreadySent=(typeof getOutreach==="function")&&getOutreach().some(x=>x.anon_id===s.anon_id);

  // ── Sector / market display ───────────────────
  const sectorFull=s.sub_sector?`${s.sector} › ${s.sub_sector}`:s.sector;
  const marketStr=(s.market_served||[]).join(", ").replace("DACH","DACH (DE · AT · CH)");

  // ── Growth ───────────────────────────────────
  const g=s.growth?.value_pct??null;
  const gVal=g===null?"—":(g>0?"+":"")+g+" %";
  const gCls=g===null?"":g>20?"g":g>0?"a":"r";

  // ── Semantic color helpers ────────────────────
  function nrrCls(v){ return v>=110?"g":v>=100?"a":"r"; }
  function churnCls(v){ return v<=3?"g":v<=6?"a":"r"; }
  function ltvcCls(v){ return v>=3?"g":v>=1?"a":"r"; }
  function bmCls(v){ return v<=1.5?"g":v<=3?"a":"r"; }
  function rwCls(v){ return v>=18?"g":v>=12?"a":"r"; }

  // ── Notes HTML ───────────────────────────────
  const notes=(typeof getNotesForDeal==="function")?getNotesForDeal(s.anon_id):[];
  const notesHTML=notes.length===0
    ?`<div class="dv-note-empty">Noch keine Notizen.</div>`
    :notes.map(n=>`
      <div class="dv-note-entry">
        <div class="dv-note-meta">
          <span class="dv-note-ts">${escapeHTML(timeAgo(n.created_at).toUpperCase())}</span>
          <span class="dv-note-author">${escapeHTML(n.author||"Analyst")}</span>
        </div>
        <div class="dv-note-body">
          <button class="dv-note-del" data-del="${escapeHTML(n.id)}">✕</button>
          ${escapeHTML(n.text)}
        </div>
      </div>
    `).join("");

  // ── Burn Multiple ─────────────────────────────
  const bm=s.burn_multiple!==null&&s.burn_multiple!==undefined?s.burn_multiple.toFixed(2)+" ×":"—";
  const bmCl=s.burn_multiple!==null?bmCls(s.burn_multiple):"";

  // ── Ownership ─────────────────────────────────
  const owAllocated=((s.esop_pct||0)+(s.employees_pct||0)).toFixed(1);
  const owAvail=(100-parseFloat(owAllocated)).toFixed(1);

  // ── Render ────────────────────────────────────
  modal.innerHTML=`
    <div class="dv-topbar">
      <span class="dv-topbar-id">${escapeHTML(startupLabel(s))}</span>
      <span class="dv-topbar-sep">/</span>
      <span class="dv-topbar-meta">${escapeHTML(s.anon_id)} · ${escapeHTML(s.sector)} · ${escapeHTML(s.stage)} · ${escapeHTML(s.origin_country)}</span>
      <button class="dv-btn" id="dvPrevBtn">← Zurück</button>
      <button class="dv-btn" id="dvNextBtn">Weiter →</button>
      <button class="dv-btn" id="dvCompareBtn">Compare</button>
      <button class="dv-btn" id="dvPipeBtn" ${inPipeline?"disabled":""}>${inPipeline?"✓ In Pipeline":"Pipeline"}</button>
      <button class="dv-btn dv-btn-crm" id="dvCrmBtn" ${isSynced?"disabled":""}>${isSynced?"✓ Synced":"Push to CRM"}</button>
      <button class="dv-btn dv-btn-prim" id="dvAnfrageBtn" ${alreadySent?"disabled":""}>${alreadySent?"✓ Angefragt":"Anfrage senden"}</button>
    </div>

    <div class="dv-main">
      <div class="dv-left">

        <div class="dv-hero">
          <div class="dv-hero-info">
            <div class="dv-hero-name">
              ${escapeHTML(startupLabel(s))}
              <span class="dv-pill dv-pill-seed">${escapeHTML(s.stage)}</span>
              <span class="dv-pill">${escapeHTML(sectorFull)}</span>
              ${plausHTML}
            </div>
            <div class="dv-hero-desc">${escapeHTML(s.description||s.notes||"")}</div>
          </div>
          <div class="dv-score-block">
            <span class="dv-score-label">Custom Score</span>
            <span class="dv-score-number ${scoreColorClass}">${escapeHTML(scoreVal)}</span>
            <span class="dv-score-ruleset">${escapeHTML(rulesetName)}</span>
            <button class="dv-score-info" id="dvScoreInfo" data-si="${escapeHTML(s.anon_id)}">(i) Breakdown</button>
          </div>
        </div>

        <div class="dv-section">
          <div class="dv-sec-head"><span class="dv-sec-title">Kontext</span><div class="dv-sec-line"></div></div>
          <div class="dv-pgrid">
            <div class="dv-prow"><span class="dv-pl">HQ</span><span class="dv-pv ui">${escapeHTML(s.origin_country)}</span></div>
            <div class="dv-prow"><span class="dv-pl">Markt</span><span class="dv-pv ui">${escapeHTML(marketStr)}</span></div>
            <div class="dv-prow"><span class="dv-pl">Stage</span><span class="dv-pv b ui">${escapeHTML(s.stage)}</span></div>
            <div class="dv-prow"><span class="dv-pl">Teamgröße</span><span class="dv-pv">${escapeHTML(String(s.team_size))} Mitarbeiter</span></div>
            ${s.contact_name?`<div class="dv-prow full"><span class="dv-pl">Kontakt</span><span class="dv-pv ui">${escapeHTML(s.contact_name)}${s.contact_email?" — "+escapeHTML(s.contact_email):""}</span></div>`:""}
          </div>
        </div>

        <div class="dv-section">
          <div class="dv-sec-head"><span class="dv-sec-title">Revenue & Wachstum</span><div class="dv-sec-line"></div></div>
          <div class="dv-pgrid">
            <div class="dv-prow"><span class="dv-pl">MRR</span><span class="dv-pv">${escapeHTML(fmtFull(s.mrr_eur))}</span></div>
            <div class="dv-prow"><span class="dv-pl">ARR</span><span class="dv-pv">${escapeHTML(fmtFull(s.arr_eur))}</span></div>
            <div class="dv-prow"><span class="dv-pl">Wachstum ${escapeHTML(s.growth?.type||"MoM")}</span><span class="dv-pv ${gCls}">${escapeHTML(gVal)}</span></div>
            <div class="dv-prow"><span class="dv-pl">Net New ARR</span><span class="dv-pv">${escapeHTML(fmtFull(s.net_new_arr_eur))}</span></div>
          </div>
        </div>

        <div class="dv-section">
          <div class="dv-sec-head"><span class="dv-sec-title">Retention</span><div class="dv-sec-line"></div></div>
          <div class="dv-pgrid">
            <div class="dv-prow"><span class="dv-pl">NRR</span><span class="dv-pv ${nrrCls(s.nrr_pct)}">${escapeHTML(String(s.nrr_pct))} %</span></div>
            <div class="dv-prow"><span class="dv-pl">Logo Churn</span><span class="dv-pv ${churnCls(s.logo_churn_pct)}">${escapeHTML(String(s.logo_churn_pct))} %</span></div>
            <div class="dv-prow full"><span class="dv-pl">Revenue Churn</span><span class="dv-pv ${churnCls(s.revenue_churn_pct)}">${escapeHTML(String(s.revenue_churn_pct))} %</span></div>
          </div>
        </div>

        <div class="dv-section">
          <div class="dv-sec-head"><span class="dv-sec-title">Unit Economics</span><div class="dv-sec-line"></div></div>
          <div class="dv-pgrid">
            <div class="dv-prow"><span class="dv-pl">Gross Margin</span><span class="dv-pv">${escapeHTML(String(s.gross_margin_pct))} %</span></div>
            <div class="dv-prow"><span class="dv-pl">LTV</span><span class="dv-pv">${escapeHTML(fmtFull(s.ltv_eur))}</span></div>
            <div class="dv-prow"><span class="dv-pl">CAC</span><span class="dv-pv">${escapeHTML(fmtFull(s.cac_eur))}</span></div>
            <div class="dv-prow"><span class="dv-pl">CAC Payback</span><span class="dv-pv">${escapeHTML(String(s.cac_payback_months))} Monate</span></div>
            <div class="dv-prow full"><span class="dv-pl">LTV / CAC</span><span class="dv-pv ${ltvcCls(s.ltv_cac_ratio)}">${escapeHTML(s.ltv_cac_ratio.toFixed(1))} ×</span></div>
          </div>
        </div>

        <div class="dv-section">
          <div class="dv-sec-head"><span class="dv-sec-title">Capital Efficiency</span><div class="dv-sec-line"></div></div>
          <div class="dv-pgrid">
            <div class="dv-prow"><span class="dv-pl">Burn / Monat</span><span class="dv-pv r">${escapeHTML(fmtFull(s.burn_eur_per_month))}</span></div>
            <div class="dv-prow"><span class="dv-pl">Runway</span><span class="dv-pv ${rwCls(s.runway_months)}">${escapeHTML(String(s.runway_months))} Monate</span></div>
            <div class="dv-prow full"><span class="dv-pl">Burn Multiple</span><span class="dv-pv ${bmCl}">${escapeHTML(bm)}</span></div>
          </div>
        </div>

        <div class="dv-section">
          <div class="dv-sec-head"><span class="dv-sec-title">Cap Table & Runde</span><div class="dv-sec-line"></div></div>
          <div class="dv-pgrid">
            <div class="dv-prow"><span class="dv-pl">Ticket</span><span class="dv-pv">${escapeHTML(fmtFull(s.ticket_eur))}</span></div>
            <div class="dv-prow"><span class="dv-pl">Founder</span><span class="dv-pv">${escapeHTML((s.founder_pct||0).toFixed(1))} %</span></div>
            <div class="dv-prow"><span class="dv-pl">ESOP</span><span class="dv-pv">${escapeHTML((s.esop_pct||0).toFixed(1))} %</span></div>
            <div class="dv-prow"><span class="dv-pl">Employees</span><span class="dv-pv">${escapeHTML((s.employees_pct||0).toFixed(1))} %</span></div>
            <div class="dv-prow full"><span class="dv-pl">Verfügbar</span><span class="dv-pv muted">${escapeHTML(owAllocated)} % vergeben · ${escapeHTML(owAvail)} % frei</span></div>
          </div>
        </div>

      </div>

      <div class="dv-right">
        <div class="dv-notes">
          <div class="dv-notes-head">
            <span class="dv-notes-title">Notes</span>
          </div>
          <div class="dv-notes-list" id="dvNotesList">${notesHTML}</div>
          <div class="dv-note-add">
            <textarea class="dv-note-inp" id="dvNoteInput" placeholder="Neue Notiz…" rows="3" maxlength="500"></textarea>
            <button class="dv-note-save" id="dvNoteSave">Speichern</button>
            <div class="dv-note-hint">Ctrl+Enter zum Speichern</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ── Event Bindings ─────────────────────────────
  const arr=(list&&list.length)?list:[s];
  const idx=arr.findIndex(z=>z.anon_id===s.anon_id);

  // Navigation
  document.getElementById("dvPrevBtn").onclick=()=>openModalByIndex((idx-1+arr.length)%arr.length,arr);
  document.getElementById("dvNextBtn").onclick=()=>openModalByIndex((idx+1)%arr.length,arr);

  // Keyboard
  if(modal._keyHandler) document.removeEventListener("keydown",modal._keyHandler);
  modal._keyHandler=(e)=>{
    if(backdrop.style.display!=="flex") return;
    if(e.key==="ArrowRight") document.getElementById("dvNextBtn")?.click();
    if(e.key==="ArrowLeft")  document.getElementById("dvPrevBtn")?.click();
    if(e.key==="Escape") closeModal();
  };
  document.addEventListener("keydown",modal._keyHandler);

  // Pipeline
  const pipeBtn=document.getElementById("dvPipeBtn");
  if(pipeBtn&&!inPipeline){
    pipeBtn.onclick=()=>{
      pipelineAdd(s.anon_id,"In Review");
      toast("Pipeline","Deal zur Pipeline hinzugefügt");
      pipeBtn.textContent="✓ In Pipeline";
      pipeBtn.disabled=true;
      if(currentView==="pipeline") renderPipeline();
    };
  }

  // CRM
  const crmBtn=document.getElementById("dvCrmBtn");
  if(crmBtn&&!isSynced){
    crmBtn.onclick=()=>{
      const pi=getPipeline().find(x=>x.anon_id===s.anon_id);
      if(pi&&pi.status==="Declined"){
        if(!confirm("Dieser Deal wurde declined. Trotzdem ins CRM pushen?")) return;
      }
      pipelinePushToCRM(s.anon_id);
      crmBtn.textContent="✓ Synced";
      crmBtn.disabled=true;
      if(currentView==="pipeline") renderPipeline();
    };
  }

  // Compare
  document.getElementById("dvCompareBtn").onclick=()=>addToCompare(s.anon_id);

  // Anfrage
  const anfBtn=document.getElementById("dvAnfrageBtn");
  if(anfBtn&&!alreadySent){
    anfBtn.onclick=()=>{ closeModal(); if(typeof _otOpenSendModal==="function") _otOpenSendModal(s); };
  }

  // Plausibility
  const plausEl=document.getElementById("dvPlausBadge");
  if(plausEl) plausEl.onclick=(e)=>{ if(typeof openPlausibilityBreakdown==="function") openPlausibilityBreakdown(s.anon_id,plausEl); e.stopPropagation(); };

  // Score breakdown
  const scoreInfoBtn=document.getElementById("dvScoreInfo");
  if(scoreInfoBtn) scoreInfoBtn.onclick=(e)=>{ if(typeof openScoreBreakdown==="function") openScoreBreakdown(s.anon_id,scoreInfoBtn); e.stopPropagation(); };

  // Notes: save
  const noteSave=document.getElementById("dvNoteSave");
  const noteInput=document.getElementById("dvNoteInput");
  if(noteSave&&noteInput){
    const doSave=()=>{
      const text=noteInput.value.trim();
      if(!text) return;
      const pi=getPipeline().find(x=>x.anon_id===s.anon_id);
      const author=(pi&&pi.owner)?pi.owner:"Analyst";
      addNote(s.anon_id,text,author);
      noteInput.value="";
      toast("Gespeichert","Notiz hinzugefügt");
      const updatedNotes=(typeof getNotesForDeal==="function")?getNotesForDeal(s.anon_id):[];
      const listEl=document.getElementById("dvNotesList");
      if(listEl){
        if(updatedNotes.length===0){
          listEl.innerHTML='<div class="dv-note-empty">Noch keine Notizen.</div>';
        }else{
          listEl.innerHTML=updatedNotes.map(n=>`
            <div class="dv-note-entry">
              <div class="dv-note-meta">
                <span class="dv-note-ts">${escapeHTML(timeAgo(n.created_at).toUpperCase())}</span>
                <span class="dv-note-author">${escapeHTML(n.author||"Analyst")}</span>
              </div>
              <div class="dv-note-body">
                <button class="dv-note-del" data-del="${escapeHTML(n.id)}">\u2715</button>
                ${escapeHTML(n.text)}
              </div>
            </div>
          `).join("");
          listEl.querySelectorAll("[data-del]").forEach(btn=>{
            btn.onclick=(e)=>{
              e.stopPropagation();
              deleteNote(btn.getAttribute("data-del"));
              btn.closest(".dv-note-entry").remove();
              toast("Gelöscht","Notiz gelöscht");
            };
          });
        }
      }
    };
    noteSave.onclick=doSave;
    noteInput.addEventListener("keydown",(e)=>{ if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){ e.preventDefault(); doSave(); } });
  }

  // Notes: delete
  modal.querySelectorAll("[data-del]").forEach(btn=>{
    btn.onclick=(e)=>{ e.stopPropagation(); deleteNote(btn.getAttribute("data-del")); btn.closest(".dv-note-entry").remove(); toast("Gelöscht","Notiz gelöscht"); };
  });
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
  const backdrop=document.getElementById("modalBackdrop");
  backdrop.style.display="none";
  backdrop.setAttribute("aria-hidden","true");
  const modal=backdrop.querySelector(".modal");
  if(modal&&modal._keyHandler){
    document.removeEventListener("keydown",modal._keyHandler);
    modal._keyHandler=null;
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
