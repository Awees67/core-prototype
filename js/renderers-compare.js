/* =========================
   COMPARE ACTIONS
   renderCompare() ist in js/main.js definiert (einzige Implementierung).
========================= */
function addToCompare(anon_id){
  const ids = getCompare();
  if(ids.includes(anon_id)){
    toast("Compare", "Bereits ausgewählt");
    return;
  }
  if(ids.length >= 10){
    toast("Compare", "Max. 10 Deals");
    return;
  }
  ids.push(anon_id);
  setCompare(ids);
  updateCompareTray();
  toast("Compare", "Hinzugefügt");
}

function removeFromCompare(anon_id){
  const ids = getCompare().filter(x=>x!==anon_id);
  setCompare(ids);
  updateCompareTray();
}

function clearCompare(){
  setCompare([]);
  updateCompareTray();
}

function updateCompareTray(){
  const tray = document.getElementById("compareTray");
  const box = document.getElementById("compareIds");
  const ids = getCompare();

  box.innerHTML = "";
  if(ids.length===0){
    tray.style.display = "none";
    return;
  }
  tray.style.display = "";

  ids.forEach(id=>{
    const t = document.createElement("span");
    t.className = "mini-tag";
    t.innerHTML = `${escapeHTML(id)} <span class="mini-x" data-x="${id}">×</span>`;
    box.appendChild(t);
  });

  box.querySelectorAll("[data-x]").forEach(x=>{
    x.onclick = ()=>{ removeFromCompare(x.getAttribute("data-x")); };
  });
}
