(function(){
  if(window.__CORE_ACTIVITY_COMPARE_PIPELINE_V6__) return;
  window.__CORE_ACTIVITY_COMPARE_PIPELINE_V6__ = true;


  function startupLabelById(anon_id){
    try{
      const id = String(anon_id || "");
      if(!id || !Array.isArray(window.startups)) return id;
      const s = window.startups.find(x=>String(x?.anon_id||"")===id);
      if(!s) return id;
      return String(s.anon_id || id);
    }catch(_){ return String(anon_id || ""); }
  }



  const _toggleSaved = window.toggleSaved;
  if(typeof _toggleSaved === "function"){
    window.toggleSaved = function(id, btnEl){
      const anonId = String(id || "");
      const before = getSavedSet().has(anonId);
      const res = _toggleSaved.apply(this, arguments);
      const after = getSavedSet().has(anonId);
      if(!before && after){
        activityLogAppend("SAVED", anonId, { display_label: startupLabelById(anonId) });
      }else if(before && !after){
        activityLogAppend("UNSAVED", anonId, { display_label: startupLabelById(anonId) });
      }
      return res;
    };
  }

  const _setCompare = window.setCompare;
  if(typeof _setCompare === "function"){
    window.setCompare = function(arr){
      const before = (typeof getCompare === "function") ? getCompare().slice() : [];
      const beforeSet = new Set(before);
      const next = Array.isArray(arr) ? arr.map(x=>String(x || "")).filter(Boolean) : [];
      const nextSet = new Set(next);
      const added = next.filter(id=>!beforeSet.has(id));
      const removed = before.filter(id=>!nextSet.has(id));
      const cleared = before.length > 0 && next.length === 0;
      const result = _setCompare.apply(this, arguments);
      if(cleared){
        activityLogAppend("COMPARE_CLEARED", null, { count: before.length, ids: before });
      }else{
        added.forEach(id=> activityLogAppend("COMPARE_ADDED", id, { display_label: startupLabelById(id) }));
        removed.forEach(id=> activityLogAppend("COMPARE_REMOVED", id, { display_label: startupLabelById(id) }));
      }
      return result;
    };
  }

  function logCompareOpened(source){
    activityLogAppend("COMPARE_OPENED", null, { source: String(source || "ui") });
  }

  document.addEventListener("click", function(e){
    const btn = e.target && e.target.closest ? e.target.closest("#compareOpenBtn, #navCompare") : null;
    if(!btn) return;
    logCompareOpened(btn.id === "navCompare" ? "nav" : "tray");
  }, true);

})();