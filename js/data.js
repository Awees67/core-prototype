/* =========================
   DATA GENERATOR (30 Startups)
========================= */
const GEN = {
  origins: ["AT","DE","CH","UK","US","FR","NL","SE","DK","ES"],
  markets: ["Austria","Germany","Switzerland","DACH","EU","UK","US","Global"],
  stages: ["Pre-Seed","Seed","Pre-Series A","Series A","Series B"],
  sectors: ["B2B SaaS","FinTech","HealthTech","DeepTech","AI","ClimateTech","Cybersecurity","PropTech","Marketplace","DevTools"],
  growthTypes: ["MoM","QoQ","YoY"]
};

function idFromIndex(rng, i){
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const prefix = letters[i % letters.length];
  const num = randInt(rng, 1000, 9999);
  return `${prefix}-${num}`;
}

function buildStartup(rng, i){
  const origin = randChoice(rng, GEN.origins);
  const marketCount = randInt(rng, 1, 3);
  const marketSet = new Set();
  while(marketSet.size < marketCount){
    marketSet.add(randChoice(rng, GEN.markets));
  }

  const stage = randChoice(rng, GEN.stages);
  const sector = randChoice(rng, GEN.sectors);
  const subSectors = SECTOR_MAP[sector] || [];
  const sub_sector = subSectors.length ? randChoice(rng, subSectors) : null;
  const growthType = randChoice(rng, GEN.growthTypes);

  const base = Math.pow(rng(), 2) * 450000;
  const mrr = Math.round(clamp(base + randInt(rng, 5000, 35000), 6000, 520000) / 100) * 100;

  const growthPct = clamp(Math.round((rng()*220 - 30)), -25, 190);
  const burn = Math.round(clamp(mrr * (0.25 + rng()*0.75) + randInt(rng, 5000, 55000), 6000, 220000)/100)*100;
  const runway = clamp(randInt(rng, 6, 28) + (rng() < 0.12 ? randInt(rng, 8, 18) : 0), 4, 42);

  const eFrom = clamp(randInt(rng, -40, 10), -50, 20);
  const eTo = clamp(eFrom + randInt(rng, -6, 18), -50, 25);

  const grossMargin = clamp(Math.round(55 + rng()*35), 40, 92);
  const logoChurn = clamp(Number((rng()*7).toFixed(1)), 0.2, 9.5);
  const revenueChurn = clamp(Number((rng()*10).toFixed(1)), 0.0, 14.0);

  const nrr = clamp(Math.round(88 + rng()*42), 70, 150);

  const cac = Math.round(clamp(1800 + rng()*14000, 500, 45000));
  const ltv = Math.round(clamp(cac * (1.6 + rng()*5.2), 1200, 240000));
  const ltvCac = Number((ltv / Math.max(1, cac)).toFixed(1));

  const payback = clamp(Math.round(6 + rng()*18 + (stage === "Pre-Seed" ? rng()*6 : 0)), 3, 30);

  // Revenue metrics
  const arr = Math.round(mrr * 12);
  const netNewArr = Math.round(clamp(arr * (rng()*0.45) * (growthPct > 0 ? 1 : 0.35), 0, arr*0.9));

  const netNewMonthly = Math.max(1, netNewArr / 12);
  const burnMultiple = Number((burn / netNewMonthly).toFixed(2));

  // Ticket (raise / round size) + Ownership
  const ticket = Math.round(clamp(400000 + rng()*5200000, 250000, 8000000) / 10000) * 10000;

  const esop = clamp(Number((6 + rng()*14).toFixed(1)), 3.0, 20.0);           // 3–20%
  const employees = clamp(Number((2.5 + rng()*10).toFixed(1)), 1.0, 15.0);     // 1–15%
  const founder = clamp(Number((55 + rng()*30).toFixed(1)), 40.0, 90.0);       // 40–90%

  // Ensure not absurd totals; keep it simple for demo
  const totalOwn = founder + esop + employees;
  if(totalOwn > 98){
    const scale = 98 / totalOwn;
    return {
      ...buildStartup(rng, i),
      ticket_eur: ticket,
      founder_pct: Number((founder*scale).toFixed(1)),
      esop_pct: Number((esop*scale).toFixed(1)),
      employees_pct: Number((employees*scale).toFixed(1))
    };
  }

  return {
    anon_id: idFromIndex(rng, i),            // shown as Startup #ID
    origin_country: origin,
    market_served: Array.from(marketSet),
    stage,
    sector,
    sub_sector,

    mrr_eur: mrr,
    growth: { type: growthType, value_pct: growthPct },
    burn_eur_per_month: burn,
    runway_months: runway,

    ebitda_margin_pct: { from: eFrom, to: eTo },

    gross_margin_pct: grossMargin,
    logo_churn_pct: logoChurn,
    revenue_churn_pct: revenueChurn,
    nrr_pct: nrr,
    cac_eur: cac,
    ltv_eur: ltv,
    ltv_cac_ratio: ltvCac,
    cac_payback_months: payback,
    burn_multiple: burnMultiple,

    arr_eur: arr,
    net_new_arr_eur: netNewArr,

    ticket_eur: ticket,            // Ticket = Round/Raise size
    founder_pct: founder,          // Ownership
    esop_pct: esop,
    employees_pct: employees,

    notes: `HQ: ${origin} • Markt: ${Array.from(marketSet).join(", ")} • ${sector}${sub_sector ? " › " + sub_sector : ""} • ${stage}`
  };
}

function generateDataset(seed){
  const rng = mulberry32(seed);
  const out = [];
  for(let i=0;i<30;i++) out.push(buildStartup(rng, i));
  return out;
}

/* =========================
   SUBMISSIONS SEEDING
========================= */
function generateSubmissionsFromStartups(arr, rng){
  if(!arr || !arr.length) return [];
  const count = Math.min(arr.length, randInt(rng, 5, 8));
  // Shuffle and pick first N
  const shuffled = arr.slice().sort(()=> rng() - 0.5);
  const chosen = shuffled.slice(0, count);

  const possibleFlags = ["missing_mrr","suspicious_growth","low_runway","high_burn_multiple","incomplete_data"];

  return chosen.map(s => {
    const r = rng();
    let plausibility_status, plausibility_flags;
    if(r < 0.70){
      plausibility_status = "passed";
      plausibility_flags = [];
    } else if(r < 0.90){
      plausibility_status = "flagged";
      plausibility_flags = [possibleFlags[Math.floor(rng() * possibleFlags.length)]];
    } else {
      plausibility_status = "failed";
      plausibility_flags = ["spam_detected", "invalid_data"];
    }
    // submitted_at: random time in last 7 days
    const submitted_at = Date.now() - Math.floor(rng() * 7 * 24 * 60 * 60 * 1000);
    return {
      anon_id: s.anon_id,
      signal_index: 0, // will be computed after signal-index.js loads
      plausibility_status,
      plausibility_flags,
      submitted_at,
      sector: s.sector,
      sub_sector: s.sub_sector || null,
      stage: s.stage
    };
  });
}

/* =========================
   QUALITY CLASSIFICATION
========================= */
function classifyUE(s){
  const ok1 = s.ltv_cac_ratio >= 3;
  const ok2 = s.cac_payback_months <= 12;
  const ok3 = s.gross_margin_pct >= 70;
  const passed = [ok1,ok2,ok3].filter(Boolean).length;
  if(passed === 3) return "Strong";
  if(passed >= 2) return "No Risk";
  return "Risk";
}
function classifyRQ(s){
  const high = (s.nrr_pct >= 110 && s.logo_churn_pct <= 3);
  if(high) return "High";
  if(s.nrr_pct >= 100 && s.nrr_pct <= 109) return "Stable";
  if(s.nrr_pct < 100 || s.logo_churn_pct > 5) return "Risk";
  return "Stable";
}
function classifyCE(s){
  if(s.burn_multiple <= 1.5 && s.runway_months >= 12) return "Efficient";
  if(s.burn_multiple > 1.5 && s.burn_multiple <= 2.5) return "Neutral";
  return "Inefficient";
}
function kpiChipClass(kind, value){
  const green = new Set(["Strong","High","Efficient"]);
  const orange = new Set(["Stable","Neutral","No Risk"]);
  const red = new Set(["Risk","Inefficient"]);
  if(green.has(value)) return "kpi-good";
  if(orange.has(value)) return "kpi-warn";
  if(red.has(value)) return "kpi-bad";
  return "";
}
