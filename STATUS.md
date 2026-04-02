# CORE — Projekt Status Report
> Generiert am: 2026-04-02

---

## 1. Frontend-Vollständigkeit

### Gesamt-Einschätzung
Der Prototyp ist funktional überraschend weit. Alle 7 Views existieren und sind gerendert. Es handelt sich um einen vollwertigen interaktiven Demo-Prototypen, keinen Skelett-Entwurf.

### Views im Detail

| View | Datei/Funktion | Status | Anmerkung |
|---|---|---|---|
| **Dashboard** | `renderers.js:1361` `renderDashboard()` | ✅ Vollständig | KPI-Tiles, Pipeline-Stages, Score-Histogramm, Sektor/Stage-Verteilung, Activity-Feed |
| **Übersicht (Home)** | `renderers.js:152` `renderCards()` | ✅ Vollständig | Card-Grid mit 6 KPI-Tiles, Score-Ring, Skeleton-Loader, Empty State, Filter-Chips |
| **New Submissions** | `renderers.js:520` `renderSubmissions()` | ✅ Vollständig | Queue, Plausibilitäts-Checks, Bulk-Aktionen (Accept/Decline), Status-Filter |
| **Pipeline** | `renderers.js:773` `renderPipeline()` | ✅ Vollständig | Kanban-ähnliche Stage-Verwaltung, Owner-Zuweisung, Decline-Dialog mit Grund, Bulk-Aktionen |
| **Compare** | `renderers.js:1838` / `main.js:154` | ✅ Vollständig | Tabellen-Vergleich bis 10 Deals, KPI-Highlight für beste Werte |
| **Activity** | `renderers.js:1960` `renderActivity()` | ✅ Vollständig | Event-Feed mit Filter, Suche, Clear-Funktion |
| **Anfragen (Inbox)** | `renderers.js:382` `renderInbox()` | ✅ Vollständig | Lead-Liste aus localStorage |

### Components

| Component | Status | Anmerkung |
|---|---|---|
| Score-Ring (SVG) | ⚠️ Doppelt vorhanden | `_buildScoreRing()` (viewBox 56px) vs `_scoreRing()` (viewBox 58px) – zwei Implementierungen, leicht unterschiedliche Farben |
| Filter-Modal | ✅ Vollständig | Multi-Select-Dropdowns, Range-Inputs, Advanced-Toggle |
| Details-Modal | ✅ Vollständig | KPI-Grid, Notizen, Lead-Formular, Pipeline/CRM/Compare-Buttons |
| Custom Index (Score-Konfigurator) | ✅ Vollständig | Regel-Editor, Metriken-Library, Preview-Tab, JSON-Import/Export |
| Compare-Tray | ✅ Vollständig | Sticky-Tray am Seitenrand |
| Toast-Notifications | ✅ Vorhanden | Zu kurze Anzeigedauer (2,2 Sek) |
| Skeleton-Loader | ✅ Vorhanden | Nur in der Card-Grid-View |
| Dark/Light-Mode | ✅ Implementiert | Umschalten funktioniert, aber Farb-Konsistenz-Probleme (siehe Bugs) |
| Decline-Dialog | ✅ Vollständig | Pflicht-Grund-Auswahl, optionale Notiz |
| Privacy-Overlay | ✅ Vorhanden | Demo-Datenschutzhinweis |
| Signal-Index-Popover | ✅ Vorhanden | Score-Breakdown mit Drag-Funktion |

---

## 2. Code-Qualität & Struktur

### Dateistruktur
```
index.html          — 524 Zeilen  — HTML-Struktur + alle Modal-Overlays
styles/main.css     — 3003 Zeilen — Gesamtes Styling (ein File)
js/config.js        — 93 Zeilen  — Konstanten, Pipeline-Stages, Filter-Optionen, SECTOR_MAP
js/utils.js         — 194 Zeilen — RNG, DOM-Helpers, Format-Funktionen, Theme
js/data.js          — 550 Zeilen — Data Generator (30 Startups via seeded RNG)
js/state.js         — 453 Zeilen — App-State, localStorage-Wrapper, Pipeline/Notes/Compare-Logik
js/filters.js       — 435 Zeilen — Filter-Logik, Filter-Modal, Dropdown-Components
js/renderers.js     — 2331 Zeilen — ALLE View-Render-Funktionen (monolithisch)
js/custom-index.js  — 1287 Zeilen — Score-Konfigurator (Rules Engine)
js/signal-index.js  — 330 Zeilen — Score-Popover, Proxy auf Custom Index
js/activity.js      — 64 Zeilen  — Event-Wrapping (toggleSaved, setCompare)
js/main.js          — 456 Zeilen — App-Init, Event-Listener, Compare/renderPipeline-Patching
```

### Positiv
- **Separation of Concerns**: Die Aufteilung in config/utils/data/state/renderers ist sinnvoll und für einen Freelancer gut lesbar.
- **Escaping**: `escapeHTML()` wird konsequent eingesetzt – kein offensichtliches XSS-Risiko.
- **localStorage-Wrapper**: `safeGetJSON`/`safeSetJSON` mit try/catch – robust gegen Corrupt-Storage.
- **Seeded RNG**: Deterministische Datengenerierung (`mulberry32`) – Demo ist reproduzierbar.
- **ARIA-Labels**: Wichtige Dialoge und Buttons haben `aria-label`, `aria-modal`, `aria-hidden`.

### Probleme

**1. Monolithisches Renderer-File**
`renderers.js` mit 2331 Zeilen enthält Dashboard, Cards, Submissions, Pipeline, Compare, Activity, Inbox, Modal, Decline-Dialog – alles in einer Datei. Ein neuer Entwickler braucht Zeit, sich zu orientieren.

**2. Monkey-Patching-Muster (fragil)**
`main.js` und `custom-index.js` wrappen bestehende Funktionen zur Laufzeit (`renderCompare._v41`, `renderPipeline._ciV6`). Das ist ein Zeichen, dass die Module ursprünglich nicht sauber getrennt waren. Wird schwieriger zu debuggen, je mehr Wrapping-Layer existieren.

**3. Zwei parallele CSS-Token-Systeme**
In `main.css` existieren zwei Sets an Variablen nebeneinander:
- Altes System: `--bg`, `--text`, `--muted`, `--card`, `--border`, `--brand`, `--brand2`
- Neues System: `--surface-base`, `--surface-raised`, `--text-primary`, `--text-secondary`, `--accent`

Beide Systeme sind im `:root` und `[data-theme="dark"]` definiert. Components nutzen mal das alte, mal das neue System – keine einheitliche Linie.

**4. Hardcodierte Hex-Werte im JavaScript**
In `renderers.js:105-136` sind die Score-Ring-Farben hartcodiert:
```js
ringColor = '#00dfc1';  // renderers.js:105
ring = '#10b981';       // renderers.js:134
```
Diese Farben können Dark/Light-Mode-wechsel nicht berücksichtigen und stehen nicht unter dem Token-System.

**5. Hardcodierte Hex-Werte im CSS (außerhalb von :root)**
Ab `main.css:1961` existiert ein größerer Block mit vielen `!important`-Overrides und hardcodierten Hex-Werten (`#111827`, `#f1f5f9`, `#64748b`, etc.). Das deutet auf nachträgliches Patching hin.

**6. `prompt()` für Filterset-Namen**
`state.js:413`: `const name = (prompt("Filterset-Name:") || "").trim()` — blockierender Browser-Dialog, nicht produktionsreif.

**7. `document.execCommand("copy")` (deprecated)**
`utils.js:74`: Diese Methode ist veraltet und wird von modernen Browsern ohne https-Kontext teilweise geblockt. Sollte durch `navigator.clipboard.writeText()` ersetzt werden.

---

## 3. Backend-Readiness

### Aktueller Stand: 0% Backend — alles ist statisch

Alle Daten werden beim Laden der Seite clientseitig generiert (`data.js:generateDataset(seed)`) und ausschließlich im `localStorage` des Browsers gespeichert. Es gibt keine Netzwerkaufrufe, keine Authentifizierung, keine echte Datenbank.

### Datenmodelle (würden in Supabase gebraucht)

| Tabelle | Beschreibung | Wichtigste Felder |
|---|---|---|
| `startups` | Startup-Stammdaten | `anon_id`, `company_name`, `sector`, `stage`, `origin_country`, `market_served[]` |
| `kpis` | Finanzkennzahlen pro Startup | `startup_id`, `mrr_eur`, `arr_eur`, `burn_eur`, `runway_months`, `growth_pct`, `nrr_pct`, `ltv_cac_ratio`, `gross_margin_pct` |
| `pipeline_items` | Deal-Status pro Fund | `startup_id`, `fund_id`, `status`, `owner_id`, `decline_reason`, `created_at`, `last_updated_at` |
| `notes` | Team-Notizen pro Deal | `id`, `startup_id`, `author_id`, `text`, `created_at`, `pinned` |
| `submissions` | Inbound-Queue | `startup_id`, `submitted_at`, `plausibility_status`, `plausibility_checks`, `signal_index` |
| `activity_log` | Audit-Trail | `id`, `event_type`, `startup_id`, `user_id`, `meta`, `created_at` |
| `leads` | Investoren-Anfragen | `startup_id`, `name`, `email`, `firm`, `message`, `created_at` |
| `score_rulesets` | Custom Index Config | `id`, `fund_id`, `name`, `rule_groups`, `scoring_config`, `enabled` |
| `saved_filters` | Gespeicherte Filter | `id`, `fund_id`, `name`, `filter_config`, `created_at` |
| `users` / `funds` | Authentifizierung | Supabase Auth reicht für MVP |

### Notwendige Frontend-Änderungen für Backend-Anbindung

1. **Data Layer abstrahieren**: `generateDataset()` in `data.js` muss durch `fetch('/api/startups')` oder Supabase-Client-Calls ersetzt werden.
2. **localStorage-Wrapper ersetzen**: Alle `safeGetJSON`/`safeSetJSON`-Calls in `state.js` müssen durch async Supabase-Calls ersetzt werden – das betrifft ~20 Funktionen.
3. **Async-Rendering**: Alle `renderXxx()`-Funktionen sind synchron. Mit echten API-Calls werden Skeleton-Loader und Error-States wichtiger.
4. **Authentifizierung**: Kein Login vorhanden. Supabase Auth (Email/Magic Link) muss hinzugefügt werden.
5. **Multi-Tenancy**: Aktuell gibt es keine Fund-ID oder User-ID in den Datenstrukturen – alles ist global. Muss von Anfang an eingebaut werden.

---

## 4. Offene Bugs & Probleme

### Kritisch (beeinflussen Funktionalität oder Dark-Mode-Darstellung)

**Bug #1: Doppelte Score-Ring-Implementierung**
- `renderers.js:99` → `_buildScoreRing()` (viewBox 56×56, Farben: `#00dfc1`, `#f97316`, `#ef4444`)
- `renderers.js:128` → `_scoreRing()` (viewBox 58×58, Farben: `#10b981`, `#f59e0b`, `#f87171`)
- Beide Funktionen existieren und rendern leicht unterschiedliche Farben/Größen. Inkonsistentes visuelles Ergebnis je nach Context.

**Bug #2: Hardcodierte Farben im Score-Ring umgehen Dark/Light-Mode**
- Die SVG-Stroke-Farben der Score-Ringe sind nicht an CSS Custom Properties gebunden. Im Dark-Mode sind sie identisch zu Light-Mode – kein Rendering-Fehler, aber keine Theme-Anpassung.

**Bug #3: Großer `!important`-Block in main.css (ab Zeile 1961)**
- Viele Card-Komponenten-Styles werden mit `!important` überschrieben. Das deutet auf einen Patch-Mechanismus hin, der spezifischer als das Basis-Styling sein musste. Kann zu unerwarteten Rendering-Problemen führen, wenn weitere Styles hinzukommen.

**Bug #4: Toast zu schnell weg**
- `utils.js:108`: `setTimeout(..., 2200)` — Toast verschwindet nach 2,2 Sekunden. Best Practice ist 4–6 Sekunden mit manueller Dismissal-Option. Nutzer könnten Bestätigungen verpassen.

### Mittel (UX-Probleme)

**Bug #5: `prompt()` für Filterset-Name**
- `state.js:413`: Native Browser-`prompt()` blockiert den UI-Thread, ist nicht stylbar, und wird auf mobilen Geräten oft geblockt.

**Bug #6: Focus-State mit hardcodiertem Hex**
- `main.css:184, 222, 398, 532, 570, 754`: `border-color:#2a7de1` beim Focus ist hardcodiert statt `var(--accent)`. Im Dark Mode hat `--accent` einen anderen Blauwert (`#4b96f5`) – die Focus-Farbe wechselt nicht mit.

**Bug #7: `document.execCommand("copy")` (deprecated)**
- `utils.js:74`: Sollte durch `navigator.clipboard.writeText()` ersetzt werden, funktioniert nur über HTTPS.

### Gering (Code-Hygiene)

**Bug #8: `renderCompare` / `renderPipeline` werden mehrfach überschrieben**
- `main.js:154-292` und `main.js:360-449` sowie `custom-index.js:1223-1241`: Dieselbe Funktion wird dreimal gepatcht. Reihenfolge und Kompatibilität hängen von Script-Load-Order ab.

**Bug #9: `startupLabel()` in activity.js gibt nur anon_id zurück**
- `activity.js:7`: `startupLabelById()` gibt den company_name nicht aus (gibt nur `s.anon_id` zurück), sodass im Activity-Log nur IDs, keine lesbaren Namen erscheinen.

---

## 5. Nächste Schritte

### Track A: Frontend fertigstellen (vor Backend-Anbindung)

**Priorität 1 — Score-Ring konsolidieren**
Die zwei Implementierungen (`_buildScoreRing` vs `_scoreRing`) auf eine einzige reduzieren. Farben als CSS Custom Properties definieren und aus dem JS herauslösen. Aufwand: 2–4h.

**Priorität 2 — CSS-Token-System vereinheitlichen**
Altes Token-System (`--bg`, `--brand`, etc.) vollständig auf das neue System (`--surface-*`, `--text-*`, `--accent`) migrieren. Damit werden auch die `!important`-Overrides überflüssig. Aufwand: 4–8h.

**Priorität 3 — `prompt()` durch echtes Input-Modal ersetzen**
Für Filterset-Namen und ähnliche Eingaben ein natives In-App-Overlay bauen statt `window.prompt()`. Aufwand: 2–4h.

**Priorität 4 — renderers.js aufsplitten**
Datei nach Views aufteilen: `renderers-dashboard.js`, `renderers-submissions.js`, `renderers-pipeline.js`, etc. Macht Codebase für zukünftige Entwickler verständlicher. Aufwand: 4–8h.

**Priorität 5 — Toast-Dauer und Clipboard-API**
Toast auf 4s verlängern + manuelle Schließ-Option. `execCommand` durch `navigator.clipboard` ersetzen. Aufwand: 1–2h.

### Track B: Backend anbinden (Supabase)

**Schritt 1 — Supabase-Projekt aufsetzen + Auth**
Supabase-Instanz erstellen, Auth aktivieren (Magic Link / Email), Basis-Schema deployen. Aufwand: 4–8h.

**Schritt 2 — Datenmodell erstellen und migieren**
SQL-Schema für alle Tabellen (startups, kpis, pipeline_items, notes, submissions, activity_log, score_rulesets, saved_filters, users). Migrations-Script für Demo-Daten. Aufwand: 8–16h.

**Schritt 3 — Data Layer im Frontend abstrahieren**
`generateDataset()` und alle `localStorage`-Zugriffe in `state.js` durch Supabase-JS-Client-Calls ersetzen. Async-Rendering und Skeleton-Loader ausbauen. Aufwand: 16–32h (größtes Einzelpaket).

**Schritt 4 — Multi-Tenancy und Berechtigungen**
Fund-ID und User-ID in alle Datenstrukturen einbauen. Row-Level Security in Supabase konfigurieren. Aufwand: 8–16h.

**Schritt 5 — Testing & Deployment**
E2E-Tests für kritische Flows (Submit → Accept → Pipeline → CRM). Hosting (Vercel/Netlify) + CI/CD. Aufwand: 8–16h.

---

## 6. Kostenschätzung

> Basis: Marktpreise DACH 2024/2025. Alle Zahlen sind Schätzungen — finale Kosten hängen von Scope-Änderungen, Code-Qualität des Bestandscodes und verfügbaren Dev-Ressourcen ab.

### Aufwandsschätzung (Stunden)

| Bereich | Low | High |
|---|---|---|
| Frontend fertigstellen (Track A) | 14h | 26h |
| Backend entwickeln & anbinden (Track B) | 44h | 88h |
| Testing & Deployment | 8h | 16h |
| **Gesamt** | **66h** | **130h** |

---

### Freelancer (DACH, ~80–120 €/h)

| Szenario | Stunden | Kosten (Low) | Kosten (High) |
|---|---|---|---|
| Frontend only | 14–26h | 1.120 € | 3.120 € |
| Backend only | 44–88h | 3.520 € | 10.560 € |
| Komplett (A+B+Testing) | 66–130h | 5.280 € | 15.600 € |

**Empfehlung**: Mit einem erfahrenen Freelancer (5+ Jahre, Supabase-Kenntnisse) liegt ein realistischer All-In-Preis bei **7.000–12.000 €** für einen vollständig produktionsreifen MVP.

---

### Junior-Entwickler (Festanstellung)

Ein Junior-Frontend-Entwickler in AT/DE mit 1–3 Jahren Erfahrung:

| Posten | Kosten/Jahr |
|---|---|
| Bruttogehalt | 35.000–50.000 €/Jahr |
| Lohnnebenkosten (~30% Arbeitgeber-Anteil) | 10.500–15.000 €/Jahr |
| **Gesamtkosten Arbeitgeber** | **45.500–65.000 €/Jahr** |
| Entspricht Tagesrate | ~175–250 €/Tag |

Bei einem Projekt-Scope von 66–130h (ca. 8–16 Arbeitstage):
**Projektkosten anteilig: 1.400–4.000 €** (ohne Overhead für Onboarding, Management, Ausfallzeiten).

**Wichtig**: Ein Junior braucht wahrscheinlich 1,5–2× mehr Zeit als ein erfahrener Freelancer. Realistischer Aufwand: 100–180h. Qualitätsrisiko bei komplexen Teilen wie Supabase Row-Level Security.

---

### Agentur (Projektbasis, DACH)

Digitalagentur mit Supabase-/SaaS-Erfahrung, Projektbasis:

| Scope | Kosten (Low) | Kosten (High) |
|---|---|---|
| Frontend-Optimierung only (Track A) | 3.000 € | 6.000 € |
| MVP komplett (A+B+Testing+Deployment) | 18.000 € | 35.000 € |
| Enterprise-Qualität (inkl. Design-Sprint, Doku, QA) | 40.000 € | 70.000 € |

**Hinweis**: Agenturen im DACH-Raum rechnen üblicherweise mit 120–180 €/h (netto), haben aber mehr Overhead (Projektmanagement, mehrere Ansprechpartner, Übergabekosten). Der Aufpreis gegenüber Freelancern ist oft 50–100%. Dafür gibt es eine klare Verantwortlichkeit und SLA.

---

## MVP-Readiness Score

### **6 / 10**

**Begründung:**

Der Prototyp ist für eine Investoren-Demo oder interne Vorführung sehr gut geeignet — alle Views funktionieren, das Design ist solide, und die Kernlogik (Scoring, Pipeline, Compare) ist vollständig implementiert.

Für einen echten MVP-Launch fehlt aber noch:
- Keine echte Datenbank (alles localStorage) — kein Multi-User, kein Daten-Persistenz über Browser-Reset
- Keine Authentifizierung
- Kein Hosting / Deployment
- Kleinere Code-Qualitätsprobleme (Doppelungen, hardcodierte Werte)

Mit ca. 3–4 Monaten Entwicklungszeit eines guten Freelancers (oder einer Agentur) wäre ein produktionsreifer MVP realistisch. Der Prototyp ist ein sehr guter Ausgangspunkt — der Code ist nicht wegzuwerfen, sondern zu erweitern.
