/* =========================
   RENDERERS — SHARED HELPERS
   Used across multiple view renderers.
   NOTE: escapeHTML, downloadJSON, copyToClipboard, startupLabel are in utils.js
========================= */

function hideAllViews(){
  const grid = document.getElementById("cardGrid");
  const ids = ["viewDashboard","viewSubmissions","viewPipeline","viewCompare","viewActivity","viewInbox"];
  grid.style.display = "none";
  ids.forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.style.display = "none";
  });
  // Hide the home-only control bars for ALL non-home views.
  // renderCards() (home/Übersicht) will call showControls() to make them visible again.
  const ctrlBar = document.querySelector(".controls");
  const summaryBar = document.querySelector(".summarybar");
  const chipsBar = document.querySelector(".activechips");
  if(ctrlBar) ctrlBar.style.display = "none";
  if(summaryBar) summaryBar.style.display = "none";
  if(chipsBar) chipsBar.style.display = "none";
}

function updateCounts(){
  const resultCount = document.getElementById("resultCount");
  const activeFilterCount = document.getElementById("activeFilterCount");
  const savedCount = document.getElementById("savedCount");
  const saved = getSavedSet();

  if(savedCount) savedCount.textContent = saved.size + " gemerkt";

  if(currentView === "inbox"){
    const leads = getLeads();
    if(resultCount) resultCount.textContent = leads.length + " Anfragen";
    if(activeFilterCount) activeFilterCount.textContent = "0 Filter aktiv";
  }
}

function renderMiniKPI(label, value){
  return `
    <div class="metric-tile">
      <div class="k">${escapeHTML(label)}</div>
      <div class="v">${escapeHTML(String(value))}</div>
      <div class="s">—</div>
    </div>`;
}
