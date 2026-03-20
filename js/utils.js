/* Safe DOM binding helper (prevents demo freeze if optional elements are missing) */
function on(id, evt, fn){ const el=document.getElementById(id); if(el) el.addEventListener(evt, fn); }

/* =========================
   UTIL: Seeded RNG (deterministic)
========================= */
function mulberry32(a){
  return function(){
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function randInt(rng, min, max){
  return Math.floor(rng() * (max - min + 1)) + min;
}
function randChoice(rng, arr){
  return arr[Math.floor(rng() * arr.length)];
}
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function uid(){
  return "id_" + Date.now().toString(36) + "_" + Math.floor(Math.random()*1e6).toString(36);
}

function escapeHTML(str){
  return String(str||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

function downloadTextFile(filename, text){
  try{
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1200);
    return true;
  }catch(e){
    return false;
  }
}

function downloadJSON(filename, data){
  try{
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }catch(e){}
}

function copyText(text){
  if(!text) return;
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try{ document.execCommand("copy"); }catch(e){}
  document.body.removeChild(ta);
}

function fmtEUR(n){ return (n || 0).toLocaleString("de-DE") + " €"; }
function fmtPct(n){
  if(n === null || n === undefined) return "—";
  const sign = n > 0 ? "+" : "";
  return sign + n + " %";
}
function fmtTicket(n){
  const v = n || 0;
  if(v >= 1000000) return (v/1000000).toFixed(2).replace(".",",") + "M€";
  if(v >= 1000) return (v/1000).toFixed(0) + "k€";
  return v + "€";
}
function startupLabel(s){
  return s?.company_name || `Startup ${s?.anon_id || "—"}`;
}
function computeBadge(s){
  const ue = classifyUE(s), rq = classifyRQ(s), ce = classifyCE(s);
  const g = s.growth?.value_pct ?? 0;
  if((ue === "Strong" || ue === "No Risk") && rq !== "Risk" && ce !== "Inefficient" && s.mrr_eur >= 60000 && g >= 20) return { cls:"good", text:"High signal" };
  if(g < 0 || rq === "Risk") return { cls:"watch", text:"Watch" };
  if(s.mrr_eur >= 120000) return { cls:"hot", text:"Hot" };
  return { cls:"", text:"Standard" };
}

function toast(title, sub){
  const t = document.getElementById("toast");
  document.getElementById("toastTitle").textContent = title || "OK";
  document.getElementById("toastSub").textContent = sub || "";
  t.style.display = "block";
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>{ t.style.display = "none"; }, 2200);
}

/* =========================
   THEME
========================= */
function setTheme(mode){
  const root = document.documentElement;
  if(mode === "dark"){
    root.setAttribute("data-theme","dark");
    document.getElementById("toggleThemeBtn").textContent = "Light Mode";
  }else{
    root.removeAttribute("data-theme");
    document.getElementById("toggleThemeBtn").textContent = "Dark Mode";
  }
  safeSetJSON(LS_KEYS.theme, mode);
}
function loadTheme(){
  const t = safeGetJSON(LS_KEYS.theme, null);
  if(t === "dark") setTheme("dark");
  else setTheme("light");
}
function toggleTheme(){
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  setTheme(isDark ? "light" : "dark");
}

/* =========================
   PRIVACY OVERLAY
========================= */
function openPrivacy(){
  const bd = document.getElementById("privacyBackdrop");
  bd.style.display = "block";
  bd.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
  // focus close for accessibility
  setTimeout(()=>{ document.getElementById("privacyCloseBtn").focus(); }, 0);
}
function closePrivacy(){
  const bd = document.getElementById("privacyBackdrop");
  bd.style.display = "none";
  bd.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}

/* =========================
   DASHBOARD HELPERS
========================= */
function timeAgo(ts){
  const diff = Date.now() - ts;
  if(diff < 60000) return "gerade eben";
  if(diff < 3600000) return "vor " + Math.floor(diff/60000) + " Min";
  if(diff < 86400000) return "vor " + Math.floor(diff/3600000) + " Std";
  return new Date(ts).toLocaleDateString("de-DE");
}

function groupBy(arr, keyFn){
  const map = {};
  arr.forEach(x=>{ const k = keyFn(x) || "—"; map[k] = (map[k]||0) + 1; });
  return Object.entries(map).sort((a,b)=>b[1]-a[1]);
}

function pctOf(part, total){
  return total > 0 ? Math.round((part/total)*100) : 0;
}

const DASHBOARD_EVENT_LABELS = {
  "SUBMISSION_ACCEPTED": "📥 Angenommen",
  "SUBMISSION_DECLINED": "📥 Abgelehnt",
  "PIPELINE_ADDED": "📋 Pipeline",
  "CRM_PUSHED": "🔗 CRM",
  "STATUS_CHANGED": "🔄 Status",
  "OWNER_SET": "👤 Owner",
  "PIPELINE_REMOVED": "🗑 Entfernt",
  "COMPARE_ADDED": "⚖ Compare",
  "COMPARE_REMOVED": "⚖ Compare",
  "COMPARE_CLEARED": "⚖ Compare",
  "COMPARE_OPENED": "⚖ Compare",
  "SAVED": "⭐ Gemerkt",
  "UNSAVED": "⭐ Entfernt",
  "LEAD_SAVED": "📧 Anfrage",
  "INTERESTED": "📋 Pipeline",
  "INTERESTED_AGAIN": "📋 Pipeline",
  "PASSED": "✗ Passed",
  "NOTE_ADDED": "📝 Notiz",
  "NOTE_DELETED": "📝 Notiz gelöscht"
};
