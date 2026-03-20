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

const STARTUP_NAMES = {
  "B2B SaaS": [
    "Stackly","Pipeforge","Clarisync","Workbase","Tenanta",
    "Metriflow","Boardloop","Quotient","Datatide","Syncwell",
    "Opslane","Vendorly","Planbase","FlowNest","Rampify"
  ],
  "FinTech": [
    "Neoledger","PayCircle","Vaultik","CashRail","Finbrix",
    "LendStack","Kapivo","Clearfin","Monarc","Tresora",
    "Coinpath","Bankwise","Fundara","Paylix","Wealthcore"
  ],
  "HealthTech": [
    "Mediloop","Carestack","Vitalix","Healwise","Docstream",
    "Symbiora","Pulsara","Cliniqo","Remedix","Neurova",
    "Biolinq","MedSphere","Curaflow","Healthpod","Genara"
  ],
  "DeepTech": [
    "Quantara","Atomyx","Fermion","Photonex","Synthera",
    "Cryonik","NanoEdge","Materico","Iontec","Fusionlabs",
    "Gravion","Plexar","Qubitec","Spectron","Neutrino.ai"
  ],
  "AI": [
    "Cortexia","Inferix","DeepLayer","Synthminds","NeuralOps",
    "Promptwise","ModelForge","Cognara","Tensora","DataMind",
    "Vectorly","Percepta","AIForge","Brainstack","Autologic"
  ],
  "ClimateTech": [
    "Carbonia","GreenGrid","SolarEdge","EcoVolt","TerraLoop",
    "Windara","CleanStack","Hydrogena","CircuTech","Renewix",
    "BioCarbon","Gridwise","Solanta","EarthCore","Leaflogic"
  ],
  "Cybersecurity": [
    "Shieldify","CipherNet","Threatbase","VaultEdge","Secura",
    "Hackproof","Sentrix","Guardara","CyberNest","Lockwise",
    "Firechain","ZeroTrust.io","Ironclad","Encryptis","Watchpost"
  ],
  "PropTech": [
    "Estatify","Brickflow","Propcore","Homestack","Rentwise",
    "BuildLayer","Realytics","Plothub","Domara","Spacemint",
    "Roofline","Keyvault","Yardbase","Plotwise","TenantIQ"
  ],
  "Marketplace": [
    "Tradely","Swapline","Vendorloop","Matchfield","Bazario",
    "Offerstack","Gridmarket","Bidflex","Hubtrader","Peerloop",
    "Sellcraft","Nexbay","Dealyard","Shopflow","Auctora"
  ],
  "DevTools": [
    "Devstream","CodeForge","Deployr","Buildkite.dev","Testara",
    "Pipekit","Repowise","Debugly","Lintbase","Stackpilot",
    "Mergeflow","Compilr","Dockhub","Infraly","Terminalix"
  ]
};

const STARTUP_DESCRIPTIONS = {
  "B2B SaaS": [
    "Automatisiert Vertrags- und Dokumentenmanagement für mittelständische Unternehmen.",
    "Zentralisiert Team-Workflows und Projektmanagement in einer Plattform.",
    "Bietet modulare ERP-Lösung speziell für SaaS-Unternehmen.",
    "Optimiert Vertriebsprozesse durch KI-gestütztes Lead Scoring.",
    "Vernetzt interne Toolstacks über eine einheitliche API-Schicht.",
    "Automatisiert Rechnungsstellung und Subscription Management.",
    "Bietet Self-Service-Analytics für Nicht-Techniker in B2B-Teams.",
    "Vereinfacht Compliance-Dokumentation für regulierte Branchen.",
    "Baut kollaborative Workspace-Tools für Remote-First-Unternehmen.",
    "Liefert Echtzeit-Dashboards für Operational KPIs in SaaS-Firmen."
  ],
  "FinTech": [
    "Baut Echtzeit-Zahlungsinfrastruktur für europäische KMU.",
    "Automatisiert Kreditentscheidungen mit alternativen Datensignalen.",
    "Bietet Embedded-Finance-APIs für Plattform-Unternehmen.",
    "Entwickelt regulierungskonforme Wallet-Infrastruktur für digitale Assets.",
    "Vereinfacht grenzüberschreitende B2B-Zahlungen im DACH-Raum.",
    "Baut KI-gestützte Risikobewertung für Online-Lending.",
    "Liefert White-Label-Banking-Module für Neobanken.",
    "Automatisiert Buchhaltung und Cashflow-Prognosen für Startups.",
    "Entwickelt Open-Banking-Integrationen für den Mittelstand.",
    "Bietet programmierbare Konten und Zahlungsflüsse via API."
  ],
  "HealthTech": [
    "Digitalisiert Patientenpfade von der Diagnose bis zur Nachsorge.",
    "Entwickelt KI-gestützte Bildgebungsanalyse für die Radiologie.",
    "Baut eine Plattform für dezentrale klinische Studien.",
    "Bietet Teletherapie-Lösung mit integriertem Outcome-Tracking.",
    "Entwickelt Biomarker-Analytik für personalisierte Medizin.",
    "Automatisiert klinische Dokumentation durch Spracherkennung.",
    "Baut Remote-Monitoring-Plattform für chronisch Kranke.",
    "Vernetzt Krankenhäuser mit niedergelassenen Ärzten digital.",
    "Entwickelt digitale Therapeutika für neurologische Erkrankungen.",
    "Bietet Datenplattform für Arzneimittelentwicklung."
  ],
  "DeepTech": [
    "Entwickelt Quantencomputing-Algorithmen für Materialforschung.",
    "Baut neue Generation von Festkörperbatterien für industrielle Anwendung.",
    "Erforscht programmierbare Metamaterialien für die Halbleiterindustrie.",
    "Entwickelt autonome Robotersysteme für Logistik und Fertigung.",
    "Baut photonische Chips für energieeffiziente Datenverarbeitung.",
    "Entwickelt Quantensensoren für medizinische und industrielle Nutzung.",
    "Erforscht synthetische Biologie zur Produktion nachhaltiger Chemikalien.",
    "Baut miniaturisierte Spektroskopie-Sensoren für Inline-Qualitätskontrolle.",
    "Entwickelt neuartige Supraleitermaterialien für Energieübertragung.",
    "Baut autonome Drohnensysteme für Inspektion kritischer Infrastruktur."
  ],
  "AI": [
    "Baut spezialisierte Sprachmodelle für den europäischen Rechtsmarkt.",
    "Entwickelt AutoML-Plattform für Nicht-ML-Engineers.",
    "Bietet KI-gestützte Dokumentenanalyse für Finanzdienstleister.",
    "Baut Computer-Vision-Pipeline für industrielle Qualitätsprüfung.",
    "Entwickelt konversationelle KI für den Kundenservice.",
    "Automatisiert Datenaufbereitung und Feature Engineering.",
    "Baut multimodale KI-Modelle für die Gesundheitsbranche.",
    "Liefert Echtzeit-Anomalieerkennung für IoT-Netzwerke.",
    "Entwickelt AI-Agents für automatisierte Geschäftsprozesse.",
    "Baut Retrieval-Augmented-Generation-Infrastruktur für Enterprises."
  ],
  "ClimateTech": [
    "Entwickelt Direct-Air-Capture-Technologie zur CO2-Entfernung.",
    "Baut intelligente Energiespeichersysteme für Gewerbegebäude.",
    "Optimiert Solaranlagen-Erträge durch KI-basierte Steuerung.",
    "Entwickelt Kreislaufwirtschafts-Plattform für die Baubranche.",
    "Baut Ladeinfrastruktur-Management für Flottenbetreiber.",
    "Entwickelt Precision-Farming-Sensorik für nachhaltige Landwirtschaft.",
    "Bietet Carbon-Accounting-Software für Unternehmen.",
    "Baut grüne Wasserstoff-Elektrolyseure im Pilotmaßstab.",
    "Entwickelt Biodiversitäts-Monitoring durch Satellitenanalyse.",
    "Optimiert Gebäudeenergieeffizienz durch digitale Zwillinge."
  ],
  "Cybersecurity": [
    "Baut Zero-Trust-Architektur für hybride Cloud-Umgebungen.",
    "Entwickelt KI-gestützte Bedrohungserkennung in Echtzeit.",
    "Bietet automatisierte Penetrationstests als SaaS.",
    "Sichert API-Schnittstellen gegen Missbrauch und Data Leaks.",
    "Baut Identity-Management-Plattform für dezentrale Teams.",
    "Entwickelt Endpoint-Protection für industrielle Steuerungssysteme.",
    "Automatisiert Compliance-Audits für ISO 27001 und SOC 2.",
    "Bietet verschlüsselte Collaboration-Tools für regulierte Branchen.",
    "Entwickelt Ransomware-Prävention durch Verhaltensanalyse.",
    "Baut Security-Operations-Center als Managed Service."
  ],
  "PropTech": [
    "Digitalisiert Immobilienverwaltung für große Wohnungsbestände.",
    "Baut KI-gestützte Immobilienbewertung für Investoren.",
    "Entwickelt Smart-Building-Plattform mit IoT-Sensorintegration.",
    "Automatisiert Mieterprozesse von der Bewerbung bis zur Kündigung.",
    "Bietet digitale Bauprojektsteuerung für Generalunternehmer.",
    "Baut 3D-Visualisierung für Immobilienvermarktung.",
    "Entwickelt Energie-Monitoring für Gewerbeimmobilien.",
    "Automatisiert Facility Management durch prädiktive Wartung.",
    "Baut Plattform für tokenisierte Immobilieninvestments.",
    "Bietet Marktdaten-Analytics für institutionelle Immobilieninvestoren."
  ],
  "Marketplace": [
    "Verbindet mittelständische Zulieferer mit globalen Abnehmern.",
    "Baut vertikalen Marktplatz für nachhaltige Baumaterialien.",
    "Entwickelt Matching-Plattform für Freelancer und Unternehmen.",
    "Baut B2B-Handelsplattform für industrielle Ersatzteile.",
    "Bietet kuratierte Service-Vermittlung für Unternehmen.",
    "Entwickelt Secondhand-Marktplatz für Elektronik mit Garantie.",
    "Verbindet lokale Produzenten direkt mit Gastronomiebetrieben.",
    "Baut Plattform für den Handel mit überschüssigem Lagerbestand.",
    "Entwickelt Nischen-Marktplatz für spezialisierte Industriechemikalien.",
    "Bietet Reverse-Auction-Plattform für Logistikdienstleistungen."
  ],
  "DevTools": [
    "Baut CI/CD-Pipeline-Optimierung für Monorepo-Setups.",
    "Entwickelt Echtzeit-Observability für Microservice-Architekturen.",
    "Bietet Low-Code-Backend-Builder für schnelles Prototyping.",
    "Automatisiert Code-Reviews durch statische Analyse und KI.",
    "Baut Entwicklerportal für interne API-Dokumentation.",
    "Entwickelt Testing-Infrastruktur für mobile Anwendungen.",
    "Bietet Feature-Flag-Management mit A/B-Testing-Integration.",
    "Baut lokale Entwicklungsumgebungen die Production spiegeln.",
    "Automatisiert Dependency-Management und Security-Scanning.",
    "Entwickelt Kollaborations-Tools für verteilte Engineering-Teams."
  ]
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

  const description = randChoice(rng, STARTUP_DESCRIPTIONS[sector] || ["Entwickelt innovative Lösungen."]);

  const teamRanges = {
    "Pre-Seed": [2, 6],
    "Seed": [4, 15],
    "Pre-Series A": [8, 25],
    "Series A": [15, 50],
    "Series B": [30, 120]
  };
  const [tMin, tMax] = teamRanges[stage] || [3, 20];
  const team_size = randInt(rng, tMin, tMax);

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
    company_name: null,                      // assigned by generateDataset (duplicate-free)
    description,
    team_size,

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

function shuffleArray(arr, rng){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function generateDataset(seed){
  const rng = mulberry32(seed);

  // Pre-shuffle name pools per sector for duplicate-free assignment
  const namePools = {};
  const nameUsed = {};
  for(const sec of GEN.sectors){
    namePools[sec] = shuffleArray(STARTUP_NAMES[sec] || [], rng);
    nameUsed[sec] = 0;
  }

  const out = [];
  for(let i = 0; i < 30; i++){
    const s = buildStartup(rng, i);
    const pool = namePools[s.sector] || [];
    const used = nameUsed[s.sector] || 0;
    s.company_name = pool[used] || `Startup ${s.anon_id}`;
    nameUsed[s.sector] = used + 1;
    s.notes = `${s.company_name} • ${s.notes}`;
    out.push(s);
  }
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
