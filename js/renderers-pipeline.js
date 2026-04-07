/* =========================
   RENDERER — PIPELINE TAB
========================= */
function stageBadgeClass(stage){
  const map = {
    "In Review": "stage-badge-review",
    "Hot Deal":  "stage-badge-hot",
    "Watching":  "stage-badge-watching",
    "Declined":  "stage-badge-declined",
    "Synced":    "stage-badge-synced"
  };
  return map[stage] || "";
}

function renderPipeline(){
  hideAllViews();
  const viewPipeline = document.getElementById("viewPipeline");
  if(!viewPipeline) return;
  viewPipeline.style.display = "";
  const pipeline = getPipeline();
  const stages = ["In Review","Hot Deal","Watching","Declined","Synced"];
  const stageCounts = {};
  stages.forEach(st=>{ stageCounts[st] = 0; });
  pipeline.forEach(x=>{ if(stageCounts[x.status]!==undefined) stageCounts[x.status]++; });
  const statusFilter = renderPipeline._statusFilter || "Alle";
  const searchFilter = (renderPipeline._search || "").toLowerCase().trim();
  let list = pipeline.slice();
  if(statusFilter !== "Alle") list = list.filter(x=>x.status===statusFilter);
  if(searchFilter) list = list.filter(x=>
    x.anon_id.toLowerCase().includes(searchFilter) ||
    (x.owner||"").toLowerCase().includes(searchFilter)
  );
  const resultCount = document.getElementById("resultCount");
  const activeFilterCount = document.getElementById("activeFilterCount");
  if(resultCount) resultCount.textContent = pipeline.length + " Deals";
  if(activeFilterCount) activeFilterCount.textContent = "0 Filter aktiv";
  // ── Controls + stage badges (unchanged structure, same IDs) ──────────────
  viewPipeline.innerHTML = `
    <div class="panelhead">
      <h2>Pipeline</h2>
      <div class="note">Screening-Layer: Qualifiziere Deals bevor sie ins CRM gehen.</div>
    </div>
    <div class="stage-badges">
      ${stages.map(st=>{
        const count = stageCounts[st]||0;
        const cls = stageBadgeClass(st);
        return `<div class="stage-badge ${cls}${statusFilter===st?' active':''}" data-stage-filter="${escapeHTML(st)}">${escapeHTML(st)}: ${count}</div>`;
      }).join("")}
      ${statusFilter!=="Alle" ? `<div class="stage-badge" data-stage-filter="Alle" style="background:var(--soft2);border-color:var(--border);color:var(--muted);">Alle anzeigen</div>` : ""}
    </div>
    <div class="controls" style="margin-top:0;">
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <select class="select" id="pipelineStatusFilter">
          ${["Alle",...stages].map(st=>`<option value="${st}"${statusFilter===st?" selected":""}>${st}</option>`).join("")}
        </select>
        <input class="select" style="max-width:240px;" id="pipelineSearch" placeholder="Suche: ID, Owner" value="${escapeHTML(renderPipeline._search||"")}">
      </div>
      <div class="cell-actions">
        <button class="btn secondary small" id="pipelineExportBtn">Export JSON</button>
      </div>
    </div>
    <div id="pipelineTableMount"></div>
  `;
  // ── Stage-filter badge click ─────────────────────────────────────────────
  viewPipeline.querySelectorAll("[data-stage-filter]").forEach(badge=>{
    badge.style.cursor="pointer";
    badge.onclick=()=>{ renderPipeline._statusFilter = badge.getAttribute("data-stage-filter"); renderPipeline(); };
  });
  document.getElementById("pipelineStatusFilter").onchange = e=>{
    renderPipeline._statusFilter = e.target.value; renderPipeline();
  };
  document.getElementById("pipelineSearch").oninput = e=>{
    renderPipeline._search = e.target.value; renderPipeline();
  };
  document.getElementById("pipelineExportBtn").onclick = ()=>{
    downloadJSON("core_pipeline_export.json", getPipeline());
  };
  const mount = document.getElementById("pipelineTableMount");
  // ── Empty state ───────────────────────────────────────────────────────────
  if(list.length === 0){
    mount.innerHTML = `<div class="empty">Noch keine Deals in der Pipeline.<div class="hint">Füge Deals aus der Übersicht hinzu.</div></div>`;
    return;
  }
  const allNotes = getNotes();
  const noteCountMap = {};
  allNotes.forEach(n => { noteCountMap[n.anon_id] = (noteCountMap[n.anon_id] || 0) + 1; });
  const checkableIds = list.filter(item => item.status !== "Synced").map(item => item.anon_id);
  const selectedCount = checkableIds.filter(id => bulkIsSelected(id)).length;
  const allChecked = selectedCount === checkableIds.length && checkableIds.length > 0;
  const someChecked = selectedCount > 0 && selectedCount < checkableIds.length;
  // ── Bulk toolbar (identical logic, identical IDs) ─────────────────────────
  const bulkToolbarHtml = bulkCount() > 0 ? `
    <div class="bulk-toolbar" id="pipeBulkToolbar">
      <span class="bulk-count">${bulkCount()} ausgewählt</span>
      <label style="font-weight:700;font-size:0.85rem;">Status setzen &rarr;</label>
      <select id="pipeBulkStatusSel">
        <option value="">— wählen —</option>
        <option value="In Review">In Review</option>
        <option value="Hot Deal">Hot Deal</option>
        <option value="Watching">Watching</option>
        <option value="Declined">Declined</option>
      </select>
      <button class="btn small" id="pipeBulkCRM">Push to CRM</button>
      <button class="btn secondary small" id="pipeBulkRemove">Entfernen</button>
      <button class="btn secondary small" id="pipeBulkDeselect">Auswahl aufheben</button>
    </div>
  ` : "";
  // ── Table (pipe2 design, all data-* and IDs preserved) ───────────────────
  mount.innerHTML = `
    ${bulkToolbarHtml}
    <div class="pipe2-scroll">
      <div class="pipe2-wrap">
        <table class="pipe2-table">
          <thead>
            <tr>
              <th style="width:40px;"><input type="checkbox" id="pipeBulkAll" ${allChecked ? "checked" : ""}></th>
              <th>Startup</th>
              <th>Status</th>
              <th class="tc">Score</th>
              <th>Owner</th>
              <th class="tc">Notes</th>
              <th>Last Updated</th>
              <th style="min-width:210px;">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(item=>{
              const dt = item.last_updated ? new Date(item.last_updated).toLocaleDateString("de-DE") : "—";
              const signal = Math.round(item.signal_index||0);
              const scoreClass2 = signal >= 70 ? "s-high" : signal >= 40 ? "s-mid" : "s-low";
              const ps = startups.find(x=>x.anon_id===item.anon_id);
              const nc = noteCountMap[item.anon_id] || 0;
              const isSynced = item.status === "Synced";
              const isSelected = bulkIsSelected(item.anon_id);
              const declineReasonLabel = item.status === "Declined" && item.decline_reason
                ? (DECLINE_REASONS.find(r => r.key === item.decline_reason)?.label || item.decline_reason)
                : null;
              // Status cell — select with data-pipe-id preserved for event binding
              const statusCell = isSynced
                ? `<span class="pipe2-synced synced-label">✓ Synced to CRM</span>`
                : `<select class="statusSel" data-status data-pipe-id="${escapeHTML(item.anon_id)}" style="min-width:130px;">
                     <option value="${escapeHTML(item.status)}" selected>${escapeHTML(item.status)}</option>
                     ${(PIPELINE_TRANSITIONS[item.status]||[]).map(t=>`<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`).join("")}
                   </select>
                   ${declineReasonLabel ? `<div class="pipe2-dreason decline-reason-text"${item.decline_note ? ` title="${escapeHTML(item.decline_note)}"` : ""}>${escapeHTML(declineReasonLabel)}</div>` : ""}`;
              // Actions cell — data-crm and data-pipe-remove preserved
              const actionsCell = isSynced
                ? `<button class="btn secondary small" disabled>✓ Im CRM</button>`
                : `<button class="pipe2-crm crm-push-btn" data-crm="${escapeHTML(item.anon_id)}">Push to CRM</button>
                   <button class="pipe2-remove" data-pipe-remove="${escapeHTML(item.anon_id)}">Remove</button>`;
              // Notes badge — data-notes-open preserved
              const notesCell = nc > 0
                ? `<span class="pipe2-nbadge has-n notes-badge" data-notes-open="${escapeHTML(item.anon_id)}">${nc}</span>`
                : `<span class="pipe2-nbadge no-n notes-badge empty">—</span>`;
              // Checkbox cell — bulk-check class and data-bulk preserved
              const checkboxCell = isSynced
                ? `<td></td>`
                : `<td><input type="checkbox" class="bulk-check" data-bulk="${escapeHTML(item.anon_id)}" ${isSelected ? "checked" : ""}></td>`;
              return `<tr class="${isSelected ? "bulk-selected" : ""}">
                ${checkboxCell}
                <td>
                  <button class="pipe2-sname" data-open="${escapeHTML(item.anon_id)}">${escapeHTML(ps?.company_name || item.anon_id)}</button>
                  <div class="pipe2-sid">ID: ${escapeHTML(item.anon_id)}</div>
                </td>
                <td>${statusCell}</td>
                <td class="tc"><span class="pipe2-score ${scoreClass2}">${signal}</span></td>
                <td><input class="pipe2-owner owner-input" data-owner-id="${escapeHTML(item.anon_id)}" value="${escapeHTML(item.owner||"")}" placeholder="—"></td>
                <td class="tc">${notesCell}</td>
                <td class="pipe2-date">${dt}</td>
                <td><div class="cell-actions">${actionsCell}</div></td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
  // Set indeterminate state on header checkbox
  const pipeBulkAll = document.getElementById("pipeBulkAll");
  if(pipeBulkAll) pipeBulkAll.indeterminate = someChecked;
  // ── All event binding below is 100% IDENTICAL to the original ─────────────
  // Select-All handler
  if(pipeBulkAll){
    pipeBulkAll.onchange = ()=>{
      if(pipeBulkAll.checked) bulkSelectAll(checkableIds);
      else bulkDeselectAll();
      renderPipeline();
    };
  }
  // Individual checkbox handlers
  mount.querySelectorAll(".bulk-check").forEach(cb=>{
    cb.onchange = ()=>{
      bulkToggle(cb.getAttribute("data-bulk"));
      renderPipeline();
    };
  });
  // Bulk toolbar handlers
  const pipeBulkStatusSel = document.getElementById("pipeBulkStatusSel");
  const pipeBulkCRM = document.getElementById("pipeBulkCRM");
  const pipeBulkRemove = document.getElementById("pipeBulkRemove");
  const pipeBulkDeselect = document.getElementById("pipeBulkDeselect");
  if(pipeBulkStatusSel){
    pipeBulkStatusSel.onchange = ()=>{
      const toStatus = pipeBulkStatusSel.value;
      if(!toStatus) return;
      pipeBulkStatusSel.value = "";
      if(toStatus === "Declined"){
        const ids = Array.from(bulkSelection);
        openDeclineDialog(null, null, null, ids);
        return;
      }
      const ids = Array.from(bulkSelection);
      let changed = 0;
      let skipped = 0;
      ids.forEach(id=>{
        if(isPipelineTransitionAllowed(id, toStatus)){
          pipelineSetStatus(id, toStatus);
          changed++;
        } else {
          skipped++;
        }
      });
      bulkDeselectAll();
      if(skipped > 0){
        toast("Status gesetzt", `${changed} Deal${changed!==1?"s":""} geändert, ${skipped} übersprungen (Status-Übergang nicht erlaubt)`);
      } else {
        toast("Status gesetzt", `${changed} Deal${changed!==1?"s":""} geändert`);
      }
      renderPipeline();
    };
  }
  if(pipeBulkCRM){
    pipeBulkCRM.onclick = ()=>{
      const ids = Array.from(bulkSelection);
      const count = ids.length;
      ids.forEach(id=>pipelinePushToCRM(id));
      bulkDeselectAll();
      toast("CRM", `${count} Deal${count!==1?"s":""} an CRM übergeben`);
      renderPipeline();
    };
  }
  if(pipeBulkRemove){
    pipeBulkRemove.onclick = ()=>{
      const ids = Array.from(bulkSelection);
      const count = ids.length;
      if(!confirm(`${count} Deal${count!==1?"s":""} aus der Pipeline entfernen?`)) return;
      ids.forEach(id=>pipelineRemove(id));
      bulkDeselectAll();
      toast("Entfernt", `${count} Deal${count!==1?"s":""} entfernt`);
      renderPipeline();
    };
  }
  if(pipeBulkDeselect){
    pipeBulkDeselect.onclick = ()=>{ bulkDeselectAll(); renderPipeline(); };
  }
  mount.querySelectorAll("[data-open]").forEach(b=>{
    b.onclick=()=>openModalByAnonId(b.getAttribute("data-open"), startups);
  });
  mount.querySelectorAll("[data-pipe-id]").forEach(sel=>{
    sel.onchange=()=>{
      const id = sel.getAttribute("data-pipe-id");
      const newStatus = sel.value;
      if(newStatus === "Declined"){
        const prevStatus = getPipeline().find(x=>x.anon_id===id)?.status || "In Review";
        openDeclineDialog(id, prevStatus, sel);
        return;
      }
      const ok = pipelineSetStatus(id, newStatus);
      if(ok === false){ sel.value = getPipeline().find(x=>x.anon_id===id)?.status || sel.value; return; }
      renderPipeline();
    };
  });
  mount.querySelectorAll("[data-crm]").forEach(b=>{
    b.onclick=()=>{ pipelinePushToCRM(b.getAttribute("data-crm")); renderPipeline(); };
  });
  mount.querySelectorAll("[data-pipe-remove]").forEach(b=>{
    b.onclick=()=>{ pipelineRemove(b.getAttribute("data-pipe-remove")); renderPipeline(); };
  });
  mount.querySelectorAll(".owner-input").forEach(inp=>{
    inp.onchange=()=>pipelineSetOwner(inp.getAttribute("data-owner-id"), inp.value);
  });
  mount.querySelectorAll("[data-notes-open]").forEach(b=>{
    b.onclick=()=>openModalByAnonId(b.getAttribute("data-notes-open"), startups);
  });
}
