/* =========================
   APP STATE KEYS (localStorage)
========================= */
const LS_KEYS = {
  ui: "core_demo_ui_v4",
  theme: "core_demo_theme_v4",
  seed: "core_demo_seed_v4",

  pipeline: "core_pipeline_v1",
  compare: "core_compare_v1",
  leads: "core_demo_leads_v4",
  saved: "core_demo_saved_v1",
  savedFilters: "core_saved_filters_v1",
  activity: "core_activity_v1"
};

/* =========================
   FILTER OPTIONS
========================= */
const FILTER_OPTIONS = {
  origin: ["AT","DE","CH","UK","US","FR","NL","SE","DK","ES"],
  market: [
    { key:"Austria", label:"Austria" },
    { key:"Germany", label:"Germany" },
    { key:"Switzerland", label:"Switzerland" },
    { key:"DACH", label:"DACH (DE•AT•CH)" },
    { key:"EU", label:"EU" },
    { key:"UK", label:"UK" },
    { key:"US", label:"US" },
    { key:"Global", label:"Global" }
  ],
  stage: ["Pre-Seed","Seed","Pre-Series A","Series A","Series B"],
  sector: ["B2B SaaS","FinTech","HealthTech","DeepTech","AI","ClimateTech","Cybersecurity","PropTech","Marketplace","DevTools"]
};
