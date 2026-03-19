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

/* =========================
   SECTOR TAXONOMY (Sub-Sektoren)
========================= */
const SECTOR_MAP = {
  "B2B SaaS": ["Horizontal SaaS","Vertical SaaS","PLG / Self-Serve","Enterprise SaaS","API-first / Infrastructure"],
  "FinTech": ["Payments","Lending / Credit","InsurTech","WealthTech","Embedded Finance","RegTech"],
  "HealthTech": ["Digital Therapeutics","Clinical Workflow","Diagnostics / Imaging","Mental Health","Biotech Platform","MedTech / Devices"],
  "DeepTech": ["Quantum Computing","Advanced Materials","Robotics / Automation","Semiconductors","Photonics / Optics","Synthetic Biology"],
  "AI": ["Foundation Models / LLMs","Applied AI / Vertical AI","AI Infrastructure","Computer Vision","NLP / Conversational","MLOps / Data Tooling"],
  "ClimateTech": ["Carbon Capture / Removal","Energy Storage","CleanTech / Renewables","Circular Economy","AgriTech","Mobility / EV"],
  "Cybersecurity": ["Identity & Access","Cloud Security","Endpoint / XDR","Application Security","GRC / Compliance"],
  "PropTech": ["Construction Tech","Property Management","Real Estate Marketplace","Smart Building / IoT","Mortgage / Finance"],
  "Marketplace": ["B2B Marketplace","B2C Marketplace","Service Marketplace","Managed Marketplace","Niche / Vertical Marketplace"],
  "DevTools": ["CI/CD / Deployment","Observability / Monitoring","Developer Platforms","Low-Code / No-Code","Testing / QA"]
};
