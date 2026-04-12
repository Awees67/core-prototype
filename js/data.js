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

const STARTUP_DETAIL_SENTENCES = {
  'B2B SaaS': [
    'Das Unternehmen bedient primär mittelständische Unternehmen in der DACH-Region und wächst zunehmend in angrenzende europäische Märkte.',
    'Die Plattform integriert sich nahtlos in bestehende Tool-Stacks und reduziert so Implementierungsaufwand auf ein Minimum.',
    'Das Gründerteam vereint Expertise aus Enterprise-Vertrieb, Produktentwicklung und skalierbarer Cloud-Infrastruktur.',
    'Kernkunden schätzen vor allem die Self-Service-Funktionen und den geringen Onboarding-Aufwand im Vergleich zu Legacy-Lösungen.',
    'Die Architektur ist API-first aufgebaut und erlaubt tief greifende Integrationen in CRM-, ERP- und BI-Systeme.',
    'Aktuell befindet sich das Unternehmen in der Expansionsphase und erschließt neue Vertikalen und Unternehmensgrößen.'
  ],
  'FinTech': [
    'Das Unternehmen operiert unter vollständiger regulatorischer Compliance und hält alle relevanten europäischen Lizenzen.',
    'Kernzielgruppe sind digitale Plattformen und wachstumsstarke KMU, die Finanzinfrastruktur als strategischen Wettbewerbsvorteil einsetzen.',
    'Das Gründerteam bringt Erfahrung aus Banken, Regulierungsbehörden und erfolgreichen FinTech-Exits mit.',
    'Die Lösung ist white-label-fähig und kann von Partnern unter eigener Marke eingesetzt werden.',
    'Dank modularer API-Architektur können Kunden einzelne Bausteine bedarfsgerecht kombinieren und skalieren.',
    'Das Unternehmen expandiert aktuell in weitere EU-Märkte und sieht insbesondere in der DACH-Region signifikantes Wachstumspotenzial.'
  ],
  'HealthTech': [
    'Die Lösung ist CE-zertifiziert und erfüllt alle Anforderungen der MDR sowie der relevanten Datenschutzrichtlinien.',
    'Pilotpartner aus dem stationären und ambulanten Bereich bestätigen eine signifikante Reduktion administrativer Aufwände.',
    'Das Team vereint medizinisches Fachwissen mit tiefer Technologie-Expertise aus Machine Learning und Cloud-Architektur.',
    'Der Go-to-Market erfolgt primär über Krankenhausgruppen und Kassenärztliche Vereinigungen als strategische Partner.',
    'Langfristiges Ziel ist eine pan-europäische Gesundheitsdatenplattform mit standardisierten Schnittstellen zu nationalen Systemen.',
    'Das Unternehmen arbeitet eng mit Universitätskliniken zusammen und betreibt laufend klinische Evaluierungsstudien.'
  ],
  'DeepTech': [
    'Die zugrundeliegende Kerntechnologie ist durch mehrere internationale Patente geschützt und basiert auf jahrelanger universitärer Forschung.',
    'Das Unternehmen kooperiert mit führenden Forschungsinstituten und hat Zugang zu einzigartiger Laborinfrastruktur.',
    'Erste Pilotkunden aus der Halbleiter- und Automobilindustrie bestätigen die technische Überlegenheit gegenüber Bestandslösungen.',
    'Die Technologie adressiert ein Marktversagen, für das es bislang keine skalierbare kommerzielle Lösung gibt.',
    'Das Gründerteam besteht aus promovierten Wissenschaftlern mit kombinierter Forschungserfahrung von über zwanzig Jahren.',
    'Neben dem Primärmarkt eröffnen sich attraktive Lizenzierungsmöglichkeiten für angrenzende Industriebereiche.'
  ],
  'AI': [
    'Alle Modelle werden vollständig on-premise oder in privaten Cloud-Umgebungen betrieben und erfüllen europäische Datenschutzanforderungen.',
    'Das Unternehmen setzt auf domänenspezifisches Fine-Tuning statt generischer Basismodelle und erreicht damit deutlich höhere Präzision.',
    'Erste Enterprise-Kunden berichten von einer Reduktion manueller Prozesszeiten um mehr als sechzig Prozent.',
    'Das Gründerteam hat zuvor an führenden Forschungslabors und KI-Startups in Europa und den USA gearbeitet.',
    'Die Plattform ist modular aufgebaut und lässt sich ohne tiefgreifende IT-Kenntnisse in bestehende Workflows einbinden.',
    'Neben dem SaaS-Kernprodukt bietet das Unternehmen maßgeschneiderte Modellentwicklung als Professional-Services-Komponente an.'
  ],
  'ClimateTech': [
    'Das Unternehmen hat bereits CO2-Zertifikate mit führenden Verifizierungsstandards wie Gold Standard und Verra erhalten.',
    'Kernkunden sind große Industrieunternehmen mit verbindlichen Net-Zero-Zielen bis 2030 oder 2040.',
    'Die Lösung ist komplementär zu bestehenden Nachhaltigkeitsinitiativen und integriert sich in gängige ESG-Reporting-Frameworks.',
    'Das Gründerteam verbindet Erfahrung aus Energiewirtschaft, Klimaforschung und digitalem Produktaufbau.',
    'Strategische Partnerschaften mit Energieversorgern und Kommunen sichern langfristige Abnahmeverträge.',
    'Das Unternehmen verfolgt eine Dual-Revenue-Strategie aus Software-Lizenzen und ergebnisbasierter CO2-Vergütung.'
  ],
  'Cybersecurity': [
    'Die Lösung erkennt Bedrohungen in Echtzeit ohne regelbasierte Signatur-Datenbanken — rein verhaltensbasiert mittels Machine Learning.',
    'Das Unternehmen ist SOC 2 Type II zertifiziert und unterstützt Kunden aktiv bei ISO 27001 und NIS2-Compliance.',
    'Kernzielgruppe sind mittelständische Unternehmen in regulierten Branchen wie Finanz, Gesundheit und kritischer Infrastruktur.',
    'Das Gründerteam bringt Erfahrung aus militärischer Cyber-Abwehr, nationalen CERTs und erfolgreichen Security-Exits mit.',
    'Dank agentloser Architektur ist die Implementierung in wenigen Stunden abgeschlossen — ohne Eingriff in Produktivsysteme.',
    'Das Produkt ergänzt bestehende SIEM- und SOAR-Lösungen und schließt kritische Lücken in der Angriffserkennung.'
  ],
  'PropTech': [
    'Das Unternehmen verwaltet aktuell über zehntausend Wohneinheiten auf der Plattform und wächst monatlich um rund fünfzehn Prozent.',
    'Kernkunden sind institutionelle Bestandshalter, Family Offices und wachstumsorientierte Hausverwaltungen.',
    'Durch prädiktive Wartungsalgorithmen reduzieren Kunden ungeplante Instandhaltungskosten nachweislich um bis zu dreißig Prozent.',
    'Das Gründerteam vereint Immobilienwirtschaft, PropTech und B2B-Software-Expertise auf Basis von zwei vorherigen Gründungserfahrungen.',
    'Die offene API-Schnittstelle erlaubt die nahtlose Anbindung an ERP-Systeme, Buchhaltungssoftware und Mieterportale.',
    'Langfristig positioniert sich das Unternehmen als Datenschicht für den europäischen Immobilienmarkt.'
  ],
  'Marketplace': [
    'Der Marktplatz adressiert eine strukturelle Ineffizienz in einem fragmentierten Markt mit hohem Standardisierungspotenzial.',
    'Transaktionsvolumen und Käufer-Seller-Verhältnis entwickeln sich konsistent in Richtung eines gesunden Marktplatznetzwerkeffekts.',
    'Das Unternehmen setzt auf kuratiertes Supply statt reiner Aggregation und sichert damit überdurchschnittliche Conversion-Rates.',
    'Das Gründerteam hat zuvor einen Marktplatz in einem angrenzenden Bereich erfolgreich aufgebaut und verkauft.',
    'Durch managed Fulfillment-Komponenten differenziert sich die Plattform klar von reinen Listing-Lösungen.',
    'Internationale Expansion ist für das kommende Geschäftsjahr geplant, beginnend mit Deutschland und der Schweiz.'
  ],
  'DevTools': [
    'Das Tool löst ein tägliches Schmerzproblem für Engineering-Teams in wachstumsstarken Produktunternehmen.',
    'Die Developer Experience steht im Mittelpunkt — Onboarding dauert unter dreißig Minuten, auch ohne umfangreiche Dokumentation.',
    'Das Unternehmen betreibt eine aktive Open-Source-Community mit mehreren tausend Github-Stars als strategisches GTM-Instrument.',
    'Das Gründerteam hat die Lösung aus einem eigenen Schmerzproblem heraus entwickelt und ist tief in der Developer-Community verankert.',
    'Bestehende Kunden berichten von einer signifikanten Reduktion von Deployment-Zyklen und Fehlerquoten in Produktivsystemen.',
    'Das PLG-Modell (Product-Led Growth) sorgt für organische Viralität innerhalb von Engineering-Organisationen.'
  ]
};

const CONTACT_FIRST_NAMES = ['Klaus','Stefan','Anna','Maria','Thomas','Sarah','Michael','Julia','Markus','Laura','David','Nina','Felix','Lena','Christian','Sophie','Andreas','Hannah','Tobias','Lisa','Sebastian','Emma','Patrick','Mia','Florian','Leonie'];
const CONTACT_LAST_NAMES = ['Winter','Müller','Weber','Fischer','Schneider','Bauer','Koch','Richter','Hoffmann','Wagner','Becker','Schulz','Wolf','Schäfer','Meyer','Lehmann','Hartmann','Klein','Krause','Braun','Zimmermann','Neumann','Schwarz','Lange','Huber','Maier'];

function generateContactPerson(rng, companyName) {
  const first = randChoice(rng, CONTACT_FIRST_NAMES);
  const last = randChoice(rng, CONTACT_LAST_NAMES);
  const slug = (companyName || 'startup').toLowerCase().replace(/[^a-z0-9]/g, '');
  const email = first[0].toLowerCase() + '.' + last.toLowerCase().replace(/ü/g,'ue').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ß/g,'ss') + '@' + slug + '.io';
  return { contact_name: first + ' ' + last, contact_email: email };
}

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

  const teaser = randChoice(rng, STARTUP_DESCRIPTIONS[sector] || ['Entwickelt innovative Lösungen.']);
  const detailPool = STARTUP_DETAIL_SENTENCES[sector] || [];
  // Shuffle detail pool deterministically using the seeded rng, pick 2
  const shuffledDetails = detailPool.slice().sort(() => rng() - 0.5);
  const pickedDetails = shuffledDetails.slice(0, 2);
  const description = [teaser, ...pickedDetails].join(' ');

  const base = Math.pow(rng(), 2) * 450000;
  const mrr = Math.round(clamp(base + randInt(rng, 5000, 35000), 6000, 520000) / 100) * 100;

  const teamRanges = {
    "Pre-Seed": [2, 6],
    "Seed": [4, 15],
    "Pre-Series A": [8, 25],
    "Series A": [15, 50],
    "Series B": [30, 120]
  };
  const [tMin, tMax] = teamRanges[stage] || [3, 20];
  const rawTeamSize = randInt(rng, tMin, tMax);

  // Revenue-per-employee floor: ensures team size is credible relative to MRR.
  // Sector modifier: DeepTech/HealthTech/AI can be R&D-heavy (lower revenue/head ok).
  // FinTech/B2B SaaS/Marketplace should be more efficient.
  const sectorEfficiencyFloor = {
    'FinTech':       25000,   // €25k ARR / employee minimum
    'B2B SaaS':      20000,
    'Marketplace':   18000,
    'DevTools':      20000,
    'Cybersecurity': 18000,
    'PropTech':      15000,
    'AI':            15000,
    'ClimateTech':   10000,
    'HealthTech':    8000,
    'DeepTech':      6000     // R&D heavy, can have low revenue per head
  };
  const floorPerEmployee = sectorEfficiencyFloor[sector] || 12000;
  const maxTeamFromRevenue = Math.max(tMin, Math.floor((mrr * 12) / floorPerEmployee));
  const team_size = Math.min(rawTeamSize, maxTeamFromRevenue);

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

    notes: `HQ: ${origin} • Markt: ${Array.from(marketSet).join(", ")} • ${sector}${sub_sector ? " › " + sub_sector : ""} • ${stage}`,
    contact_name: null,
    contact_email: null
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
    const contact = generateContactPerson(rng, s.company_name);
    s.contact_name = contact.contact_name;
    s.contact_email = contact.contact_email;
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

  const results = chosen.map(s => {
    const plaus = computePlausibility(s);
    const submitted_at = Date.now() - Math.floor(rng() * 7 * 24 * 60 * 60 * 1000);
    return {
      anon_id: s.anon_id,
      signal_index: 0, // will be computed after signal-index.js loads
      plausibility_status: plaus.status,
      plausibility_checks: plaus.checks,
      plausibility_summary: plaus.summary,
      submitted_at,
      sector: s.sector,
      sub_sector: s.sub_sector || null,
      stage: s.stage
    };
  });

  // Forced-fail: ensure at least 1 Failed case for demo visibility.
  // Patch the last chosen startup with ownership > 100% so it always fails.
  const failTarget = chosen[chosen.length - 1];
  if(failTarget && results[results.length - 1].plausibility_status !== "failed"){
    // Only overflow ownership — does not touch MRR so score and plausibility stay consistent
    const patchedStartup = { ...failTarget, founder_pct: 80, esop_pct: 15, employees_pct: 10 };
    const forcedPlaus = computePlausibility(patchedStartup);
    const last = results[results.length - 1];
    last.plausibility_status = forcedPlaus.status;
    last.plausibility_checks = forcedPlaus.checks;
    last.plausibility_summary = forcedPlaus.summary;
  }

  return results;
}

/* =========================
   PLAUSIBILITY RULES + COMPUTE
========================= */
const PLAUSIBILITY_RULES = [
  {
    id: "mrr_arr_consistency",
    label: "MRR/ARR Konsistenz",
    kategorie: "Konsistenz",
    schwere: "hard",
    check: (s) => Math.abs((s.arr_eur || 0) - ((s.mrr_eur || 0) * 12)) < 1000,
    fail_text: "ARR weicht von MRR × 12 ab",
    pass_text: "ARR konsistent mit MRR"
  },
  {
    id: "burn_vs_mrr",
    label: "Burn/MRR Verhältnis",
    kategorie: "Konsistenz",
    schwere: "soft",
    check: (s) => s.burn_eur_per_month > 0 && s.burn_eur_per_month < (s.mrr_eur * 10),
    fail_text: "Burn unrealistisch hoch im Verhältnis zum MRR (>10x)",
    pass_text: "Burn/MRR Verhältnis plausibel"
  },
  {
    id: "runway_consistency",
    label: "Runway Plausibilität",
    kategorie: "Konsistenz",
    schwere: "hard",
    check: (s) => s.runway_months >= 2 && s.runway_months <= 48,
    fail_text: "Runway außerhalb plausibler Spanne (2–48 Monate)",
    pass_text: "Runway im plausiblen Bereich"
  },
  {
    id: "growth_plausibility",
    label: "Wachstum realistisch",
    kategorie: "Konsistenz",
    schwere: "soft",
    check: (s) => s.growth && s.growth.value_pct >= -50 && s.growth.value_pct <= 200,
    fail_text: "Wachstumsrate außerhalb plausibler Spanne (-50% bis 200%)",
    pass_text: "Wachstumsrate im plausiblen Bereich"
  },
  {
    id: "mrr_positive",
    label: "MRR vorhanden",
    kategorie: "Vollständigkeit",
    schwere: "hard",
    check: (s) => s.mrr_eur > 0,
    fail_text: "Kein MRR angegeben oder 0€",
    pass_text: "MRR vorhanden"
  },
  {
    id: "ownership_total",
    label: "Ownership-Summe",
    kategorie: "Konsistenz",
    schwere: "hard",
    check: (s) => ((s.founder_pct || 0) + (s.esop_pct || 0) + (s.employees_pct || 0)) <= 100.5,
    fail_text: "Ownership-Anteile summieren sich auf über 100%",
    pass_text: "Ownership-Summe plausibel"
  },
  {
    id: "ltv_cac_positive",
    label: "LTV/CAC vorhanden",
    kategorie: "Vollständigkeit",
    schwere: "soft",
    check: (s) => s.ltv_cac_ratio > 0 && s.cac_eur > 0,
    fail_text: "LTV oder CAC fehlt",
    pass_text: "Unit Economics angegeben"
  },
  {
    id: "gross_margin_range",
    label: "Gross Margin Spanne",
    kategorie: "Konsistenz",
    schwere: "soft",
    check: (s) => s.gross_margin_pct >= 0 && s.gross_margin_pct <= 99,
    fail_text: "Gross Margin außerhalb plausibler Spanne (0–99%)",
    pass_text: "Gross Margin plausibel"
  },
  {
    id: "ticket_range",
    label: "Rundengröße plausibel",
    kategorie: "Konsistenz",
    schwere: "soft",
    check: (s) => {
      const ranges = {
        "Pre-Seed": [50000, 2000000],
        "Seed": [200000, 5000000],
        "Pre-Series A": [500000, 8000000],
        "Series A": [1000000, 15000000],
        "Series B": [3000000, 50000000]
      };
      const r = ranges[s.stage];
      if(!r) return true;
      return s.ticket_eur >= r[0] && s.ticket_eur <= r[1];
    },
    fail_text: "Rundengröße ungewöhnlich für die angegebene Stage",
    pass_text: "Rundengröße passt zur Stage"
  },
  {
    id: "team_size_range",
    label: "Teamgröße plausibel",
    kategorie: "Vollständigkeit",
    schwere: "soft",
    check: (s) => s.team_size >= 1 && s.team_size <= 500,
    fail_text: "Teamgröße außerhalb plausibler Spanne",
    pass_text: "Teamgröße plausibel"
  }
];

function computePlausibility(s){
  const checks = PLAUSIBILITY_RULES.map(rule => {
    let passed;
    try { passed = !!rule.check(s); } catch(e) { passed = false; }
    return {
      id: rule.id,
      label: rule.label,
      kategorie: rule.kategorie,
      schwere: rule.schwere,
      result: passed ? "pass" : "fail",
      message: passed ? rule.pass_text : rule.fail_text
    };
  });
  const failed_hard = checks.filter(c => c.result === "fail" && c.schwere === "hard").length;
  const failed_soft = checks.filter(c => c.result === "fail" && c.schwere === "soft").length;
  const passed_count = checks.filter(c => c.result === "pass").length;
  let status;
  if(failed_hard > 0) status = "failed";
  else if(failed_soft > 0) status = "flagged";
  else status = "passed";
  return {
    status,
    checks,
    summary: { total: checks.length, passed: passed_count, failed_hard, failed_soft }
  };
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
