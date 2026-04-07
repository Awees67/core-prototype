/* =========================
   RENDERER — ACTIVITY VIEW
========================= */

const ACTIVITY_TYPES = [
  "Alle",
  "SAVED","UNSAVED",
  "COMPARE_ADDED","COMPARE_REMOVED","COMPARE_CLEARED","COMPARE_OPENED",
  "SUBMISSION_ACCEPTED","SUBMISSION_DECLINED",
  "PIPELINE_ADDED","CRM_PUSHED",
  "STATUS_CHANGED","OWNER_SET","PIPELINE_REMOVED",
  "FILTER_SAVED","FILTER_APPLIED","FILTER_DELETED","LEAD_SAVED",
  "NOTE_ADDED","NOTE_DELETED"
];

const ACTIVITY_LABELS = {
  "SAVED": "Gemerkt",
  "UNSAVED": "Entgemerkt",
  "COMPARE_ADDED": "Compare hinzugefügt",
  "COMPARE_REMOVED": "Compare entfernt",
  "COMPARE_CLEARED": "Compare geleert",
  "COMPARE_OPENED": "Compare geöffnet",
  "SUBMISSION_ACCEPTED": "📥 Submission angenommen",
  "SUBMISSION_DECLINED": "📥 Submission abgelehnt",
  "PIPELINE_ADDED": "📋 Zur Pipeline hinzugefügt",
  "CRM_PUSHED": "🔗 An CRM übergeben",
  "STATUS_CHANGED": "Status geändert",
  "OWNER_SET": "Owner gesetzt",
  "PIPELINE_REMOVED": "Aus Pipeline entfernt",
  "FILTER_SAVED": "Filter gespeichert",
  "FILTER_APPLIED": "Filter angewendet",
  "FILTER_DELETED": "Filter gelöscht",
  "LEAD_SAVED": "Lead gespeichert",
  "NOTE_ADDED": "📝 Notiz",
  "NOTE_DELETED": "📝 Notiz gelöscht"
};

function renderActivity(){
  hideAllViews();
  const v = document.getElementById("viewActivity");
  if(!v) return;
  v.style.display = "";

  const a = getActivity();
  const type = (renderActivity._type || "Alle");
  const search = (renderActivity._search || "").trim().toLowerCase();

  let list = a.slice();
  if(type !== "Alle") list = list.filter(x=>x.event===type);
  if(search){
    list = list.filter(x=>{
      const id = String(x?.anon_id || "").toLowerCase();
      const evt = String(x?.event || "").toLowerCase();
      const meta = (()=>{ try{ return JSON.stringify(x?.meta || {}).toLowerCase(); }catch(_){ return ""; }})();
      return id.includes(search) || evt.includes(search) || meta.includes(search);
    });
  }

  v.innerHTML = `
    <div class="panelhead">
      <h2>Verlauf</h2>
      <div class="note">Meta + Audit Trail (lokal). Export optional als JSON.</div>
    </div>
    <div class="panel" style="background:linear-gradient(180deg, var(--soft2), var(--card)); margin-bottom:12px;">
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <div class="pill" id="actMetaTotal">0 Events</div>
        <div class="pill" id="actMetaDeals">0 Deals</div>
        <div class="pill" id="actMetaLast">Letztes Event: —</div>
      </div>
      <div class="hint">Verlauf dient als nachvollziehbare Historie (Status, Owner, Merkliste, Compare, Filter, Leads). Lokal gespeichert.</div>
    </div>

    <div class="controls" style="margin-top:0;">
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <select class="select" id="actType">
          ${ACTIVITY_TYPES.map(o=>`<option value="${o}">${o}</option>`).join("")}
        </select>
        <input class="select" style="max-width:280px;" id="actSearch" placeholder="Suche: Startup ID / Event" value="${escapeHTML(renderActivity._search||"")}">
      </div>
      <div class="cell-actions">
        <button class="btn secondary small" id="actExportBtn">Export JSON</button>
        <button class="btn secondary small" id="actClearBtn">Clear</button>
      </div>
    </div>

    <div id="actList"></div>
  `;

  const sel = document.getElementById("actType");
  if(sel){
    sel.value = ACTIVITY_TYPES.includes(type) ? type : "Alle";
    sel.onchange = (e)=>{ renderActivity._type = e.target.value; renderActivity(); };
  }

  const si = document.getElementById("actSearch");
  if(si){
    si.oninput = (e)=>{ renderActivity._search = e.target.value; renderActivity(); };
  }

  const exportBtn = document.getElementById("actExportBtn");
  if(exportBtn) exportBtn.onclick = ()=>downloadJSON("core_activity_export.json", getActivity());
  const clearBtn = document.getElementById("actClearBtn");
  if(clearBtn) clearBtn.onclick = ()=>{ setActivity([]); renderActivity(); };

  try{
    const total = list.length;
    const deals = new Set(list.map(x=>x.anon_id).filter(Boolean)).size;
    const last = list[0]?.ts ? new Date(list[0].ts).toLocaleString("de-AT") : "—";
    const elTotal = document.getElementById("actMetaTotal");
    const elDeals = document.getElementById("actMetaDeals");
    const elLast = document.getElementById("actMetaLast");
    if(elTotal) elTotal.textContent = total + " Events";
    if(elDeals) elDeals.textContent = deals + " Deals";
    if(elLast) elLast.textContent = "Letztes Event: " + last;
  }catch(_){}

  const box = document.getElementById("actList");
  if(!box) return;
  if(list.length===0){
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.innerHTML = `Noch keine Activity.<div class="hint">Nutze Merkliste, Compare, Interested, Status-Wechsel oder Filter speichern.</div>`;
    box.appendChild(empty);
    return;
  }

  list.slice(0,200).forEach(ev=>{
    const card = document.createElement("div");
    card.className = "startup-card";
    card.style.marginBottom = "10px";
    const evLabel = ACTIVITY_LABELS[ev.event] || escapeHTML(ev.event || "EVENT");
    card.innerHTML = `
      <div class="card-head">
        <div>
          <h3>${evLabel}</h3>
          <div class="tagrow">
            <span class="tag">${new Date(ev.ts||Date.now()).toLocaleString("de-DE")}</span>
            <span class="tag">${ev.anon_id ? escapeHTML(ev.anon_id) : "—"}</span>
          </div>
        </div>
        <div class="card-actions">
          ${ev.anon_id ? `<button class="btn secondary small" data-open="${ev.anon_id}">Details</button>` : ``}
          ${ev.meta ? `<button class="btn secondary small" data-meta="${ev.id || ev.ts}">Meta</button>` : ``}
        </div>
      </div>
      <div class="helper">${ev.meta ? `Meta verfügbar.` : ""}</div>
      ${ev.meta ? `<pre class="helper" style="display:none; margin-top:8px;" data-metabox="${ev.id || ev.ts}">${escapeHTML(JSON.stringify(ev.meta, null, 2))}</pre>` : ``}
    `;
    box.appendChild(card);
    if(ev.anon_id){
      const b = card.querySelector(`[data-open="${CSS.escape(ev.anon_id)}"]`);
      if(b) b.onclick = ()=> openModalByAnonId(ev.anon_id, (lastListContext && lastListContext.length) ? lastListContext : startups);
    }
    const mb = card.querySelector(`[data-meta="${ev.id || ev.ts}"]`);
    if(mb){
      mb.onclick = ()=>{
        const metaBox = card.querySelector(`[data-metabox="${ev.id || ev.ts}"]`);
        if(!metaBox) return;
        const isOpen = metaBox.style.display !== "none";
        metaBox.style.display = isOpen ? "none" : "block";
      };
    }
  });
}
