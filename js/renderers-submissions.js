/* =========================
   RENDERER — NEW SUBMISSIONS TAB
========================= */
function renderSubmissions(){
  hideAllViews();
  const viewSub = document.getElementById("viewSubmissions");
  if(!viewSub) return;
  viewSub.style.display = "";

  const allSubs = getSubmissions().slice().sort((a,b)=>b.submitted_at-a.submitted_at);
  const statusFilter = renderSubmissions._filter || "Alle";
  const list = statusFilter === "Alle" ? allSubs : allSubs.filter(x=>x.plausibility_status===statusFilter);

  const resultCount = document.getElementById("resultCount");
  const activeFilterCount = document.getElementById("activeFilterCount");
  if(resultCount) resultCount.textContent = allSubs.length + " Bewerbungen";
  if(activeFilterCount) activeFilterCount.textContent = "0 Filter aktiv";

  const plausiBadge = (sub)=>{
    const status = sub.plausibility_status || "passed";
    const summary = sub.plausibility_summary || {};
    const map = {
      passed:  { icon:"✓", label:"PASSED" },
      flagged: { icon:"⚠", label:"FLAGGED" },
      failed:  { icon:"✕", label:"FAILED"  }
    };
    const m = map[status] || map.failed;
    const t = summary.total || 0;
    const p = summary.passed || 0;
    const fh = summary.failed_hard || 0;
    const fs = summary.failed_soft || 0;
    let summaryParts = [];
    if(t > 0) summaryParts.push(`${p}/${t} bestanden`);
    if(fh > 0) summaryParts.push(`${fh} kritisch`);
    if(fs > 0) summaryParts.push(`${fs} Hinweis${fs > 1 ? "e" : ""}`);
    const summaryHtml = summaryParts.length
      ? `<div class="subs2-plaus-summary">${escapeHTML(summaryParts.join(" · "))}</div>`
      : "";
    return `<div class="subs2-plaus">
      <div class="subs2-plaus-label ${escapeHTML(status)}">
        <span>${m.icon}</span>
        <span>${m.label}</span>
        <button class="subs2-infoicon" data-plaus="${escapeHTML(sub.anon_id)}"
          type="button" aria-label="Plausibility Breakdown">ⓘ</button>
      </div>
      ${summaryHtml}
    </div>`;
  };

  viewSub.innerHTML = `
    <div class="panelhead">
      <h2>New Submissions</h2>
      <div class="note">Neue Bewerbungen via CoreLink. Plausibility Check + Score bereits berechnet.</div>
    </div>
    <div class="controls" style="margin-top:0;">
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <span class="pill">${allSubs.length} neue Bewerbungen</span>
        <select class="select" id="submissionsFilter">
          <option value="Alle" ${statusFilter==="Alle"?"selected":""}>Alle</option>
          <option value="passed" ${statusFilter==="passed"?"selected":""}>Passed</option>
          <option value="flagged" ${statusFilter==="flagged"?"selected":""}>Flagged</option>
          <option value="failed" ${statusFilter==="failed"?"selected":""}>Failed</option>
        </select>
      </div>
      <div class="cell-actions">
        <button class="btn secondary small" id="submissionsExportBtn">Export JSON</button>
        <button class="btn small" id="acceptAllBtn">Alle annehmen</button>
      </div>
    </div>
    <div id="submissionsMount"></div>
  `;

  document.getElementById("submissionsFilter").onchange = e=>{
    renderSubmissions._filter = e.target.value;
    renderSubmissions();
  };
  document.getElementById("submissionsExportBtn").onclick = ()=>{
    downloadJSON("core_submissions_export.json", getSubmissions());
  };
  document.getElementById("acceptAllBtn").onclick = ()=>{
    const all = getSubmissions();
    all.forEach(x=>acceptSubmission(x.anon_id));
    activityLogAppend("SUBMISSION_ACCEPTED", null, { count: all.length, bulk: true });
    toast("OK", all.length + " Bewerbungen angenommen");
    renderSubmissions();
    if(currentView==="home") renderCards();
  };

  const mount = document.getElementById("submissionsMount");
  if(list.length === 0){
    mount.innerHTML = `<div class="empty">Keine neuen Bewerbungen.<div class="hint">Wenn Startups sich über deinen CoreLink bewerben, erscheinen sie hier.</div></div>`;
    return;
  }

  const visibleIds = list.map(s => s.anon_id);
  const selectedCount = visibleIds.filter(id => bulkIsSelected(id)).length;
  const allChecked = selectedCount === visibleIds.length && visibleIds.length > 0;
  const someChecked = selectedCount > 0 && selectedCount < visibleIds.length;

  const bulkToolbarHtml = bulkCount() > 0 ? `
    <div class="bulk-toolbar" id="submBulkToolbar">
      <span class="bulk-count">${bulkCount()} ausgewählt</span>
      <button class="btn small" id="submBulkAccept">Alle annehmen</button>
      <button class="btn secondary small" id="submBulkDecline">Alle ablehnen</button>
      <button class="btn secondary small" id="submBulkDeselect">Auswahl aufheben</button>
    </div>
  ` : "";

  mount.innerHTML = `
    ${bulkToolbarHtml}
    <div class="subs2-wrap">
      <table>
        <thead>
          <tr>
            <th style="width:40px;"><input type="checkbox" id="submBulkAll" title="Alle auswählen" ${allChecked ? "checked" : ""}></th>
            <th>STARTUP NAME</th>
            <th>SEKTOR</th>
            <th style="text-align:center;">STAGE</th>
            <th style="text-align:center;">SCORE</th>
            <th>PLAUSIBILITY</th>
            <th style="white-space:nowrap; min-width:120px;">EINGEREICHT AM</th>
            <th style="text-align:center; min-width:180px;">AKTIONEN</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(sub=>{
            const dt = sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString("de-DE") : "—";
            const sectorStr = sub.sector + (sub.sub_sector ? ` › ${sub.sub_sector}` : "");
            const ss = startups.find(x=>x.anon_id===sub.anon_id);
            const isSelected = bulkIsSelected(sub.anon_id);
            let score = Math.round(sub.signal_index||0);
            try {
              const _liveRes = computeCustomIndexV6(sub.anon_id);
              if (_liveRes && _liveRes.score !== null && _liveRes.score !== undefined) {
                score = Math.round(_liveRes.score);
              }
            } catch (_) {}
            const scoreClass = score >= 70 ? "high" : score >= 40 ? "mid" : "low";
            return `<tr class="${isSelected ? "bulk-selected" : ""}">
              <td><input type="checkbox" class="bulk-check" data-bulk="${escapeHTML(sub.anon_id)}" ${isSelected ? "checked" : ""}></td>
              <td>
                <button class="subs2-name" data-open="${escapeHTML(sub.anon_id)}">${escapeHTML(ss?.company_name || sub.anon_id)}</button>
                <div class="subs2-id">ID: ${escapeHTML(sub.anon_id)}</div>
              </td>
              <td class="subs2-sector">${escapeHTML(sectorStr)}</td>
              <td class="subs2-stage">${escapeHTML(sub.stage||"—")}</td>
              <td class="subs2-score">
                <div class="subs2-score-inner">
                  <span class="subs2-score-val ${scoreClass}">${score}</span>
                  <button class="subs2-infoicon" data-action="scoreinfo" data-id="${escapeHTML(sub.anon_id)}" type="button" aria-label="Score Breakdown">ⓘ</button>
                </div>
              </td>
              <td>${plausiBadge(sub)}</td>
              <td class="subs2-date">${dt}</td>
              <td class="subs2-actions">
                <div class="subs2-actions-inner">
                  <button class="subs2-btn-accept" data-accept="${escapeHTML(sub.anon_id)}">Annehmen</button>
                  <button class="subs2-btn-decline" data-decline="${escapeHTML(sub.anon_id)}">Ablehnen</button>
                </div>
              </td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;

  // Set indeterminate state on header checkbox
  const submBulkAll = document.getElementById("submBulkAll");
  if(submBulkAll) submBulkAll.indeterminate = someChecked;

  // Select-All handler
  if(submBulkAll){
    submBulkAll.onchange = ()=>{
      if(submBulkAll.checked) bulkSelectAll(visibleIds);
      else bulkDeselectAll();
      renderSubmissions();
    };
  }

  // Individual checkbox handlers
  mount.querySelectorAll(".bulk-check").forEach(cb=>{
    cb.onchange = ()=>{
      bulkToggle(cb.getAttribute("data-bulk"));
      renderSubmissions();
    };
  });

  // Bulk toolbar handlers
  const submBulkAccept = document.getElementById("submBulkAccept");
  const submBulkDecline = document.getElementById("submBulkDecline");
  const submBulkDeselect = document.getElementById("submBulkDeselect");

  if(submBulkAccept){
    submBulkAccept.onclick = ()=>{
      const ids = Array.from(bulkSelection);
      const count = ids.length;
      ids.forEach(id=>{ acceptSubmission(id); activityLogAppend("SUBMISSION_ACCEPTED", id); });
      bulkDeselectAll();
      toast("OK", `${count} Deal${count !== 1 ? "s" : ""} angenommen`);
      renderSubmissions();
    };
  }
  if(submBulkDecline){
    submBulkDecline.onclick = ()=>{
      const ids = Array.from(bulkSelection);
      const count = ids.length;
      ids.forEach(id=>{ declineSubmission(id); activityLogAppend("SUBMISSION_DECLINED", id); });
      bulkDeselectAll();
      toast("Abgelehnt", `${count} Bewerbung${count !== 1 ? "en" : ""} abgelehnt`);
      renderSubmissions();
    };
  }
  if(submBulkDeselect){
    submBulkDeselect.onclick = ()=>{ bulkDeselectAll(); renderSubmissions(); };
  }

  mount.querySelectorAll("[data-open]").forEach(b=>{
    b.onclick = ()=>openModalByAnonId(b.getAttribute("data-open"), startups);
  });
  mount.querySelectorAll("[data-action='scoreinfo']").forEach(b=>{
    b.onclick = (e)=>{ openScoreBreakdown(b.getAttribute("data-id"), b); e.stopPropagation(); };
  });
  mount.querySelectorAll("[data-plaus]").forEach(b=>{
    b.onclick = (e)=>{ openPlausibilityBreakdown(b.getAttribute("data-plaus"), b); e.stopPropagation(); };
  });
  mount.querySelectorAll("[data-accept]").forEach(b=>{
    b.onclick = ()=>{
      const id = b.getAttribute("data-accept");
      acceptSubmission(id);
      activityLogAppend("SUBMISSION_ACCEPTED", id);
      bulkSelection.delete(id);
      toast("Angenommen", "Deal erscheint jetzt in der Übersicht");
      renderSubmissions();
    };
  });
  mount.querySelectorAll("[data-decline]").forEach(b=>{
    b.onclick = ()=>{
      const id = b.getAttribute("data-decline");
      declineSubmission(id);
      activityLogAppend("SUBMISSION_DECLINED", id);
      bulkSelection.delete(id);
      toast("Abgelehnt", "Bewerbung entfernt");
      renderSubmissions();
    };
  });
}
