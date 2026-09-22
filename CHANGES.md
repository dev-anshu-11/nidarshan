# CHANGES ΓÇö Nidarshan

A running record of every feature branch, what was changed, and what comes next.
Each entry links to the relevant branch and describes the exact files touched.

---

## [dashboard-changes] ΓÇö Smart Bulk Upload Block

**Branch:** `dashboard-changes`
**Status:** Γ£à Committed ΓÇö ready for PR merge into `main`

### What changed

| File | Change |
|---|---|
| `frontend/src/screens/Upload.tsx` | Added `SmartFolderUpload` component and `detectZone()` auto-routing function |
| `package.json` | Added `pnpm.onlyBuiltDependencies` for `better-sqlite3`, `esbuild`, `@tailwindcss/oxide` |
| `pnpm-lock.yaml` | Updated lockfile to reflect package.json changes |
| `.gitignore` | Added `.pnpm-approved-builds.json` (machine-local, not source) |

### What it does

- New **Smart Bulk Upload** block on the `/upload` screen sits below the 4 individual zone cards
- Users can drop a **whole folder** (`webkitdirectory`) or pick **mixed files** in one action
- `detectZone()` auto-routes each file to the correct evidence block by extension + filename keyword:
  - `.apk` ΓåÆ APK Files
  - `.txt / .json / .eml` ΓåÆ Chat / Email
  - `.csv / .xlsx` + keyword `upi / bank / txn` ΓåÆ Bank / UPI
  - `.csv / .xlsx` + keyword `cdr / ipdr / call` ΓåÆ CDR / IPDR
  - unmatched ΓåÆ shown as **Unrecognised / skipped**
- A **Routing Preview** panel shows destination badge per file before confirming
- Merges into the shared upload queue with deduplication; the same `startInvestigation` handler submits everything

### How to test

1. Run `pnpm dev`
2. Navigate to `http://localhost:3000/upload`
3. Drag a folder containing `upi_jan.csv`, `cdr_march.csv`, `chat.txt` onto the Smart Bulk Upload block
4. Verify preview shows correct routing arrows before clicking "Add N Files to Queue"

---

## [feature/network-graph] ΓÇö Network Graph Visualizer Upgrade

**Branch:** `feature/network-graph`
**Status:** Γ£à Committed ΓÇö ready for PR merge into `main`

### What changed

| File | Change |
|---|---|
| `frontend/src/components/graph/GraphFilterBar.tsx` | **New** ΓÇö filter toolbar: toggle by entity type (Victim / Mule / Cashout / Device / IP) and risk tier (Critical / High / Medium / Low) |
| `frontend/src/components/graph/GraphCanvas.tsx` | Community cluster glow colouring via Louvain palette; working screenshot ΓåÆ PNG download; `communityMap` + `caseNumber` props |
| `frontend/src/screens/Dashboard.tsx` | Wires `GraphFilterBar` and filter state; runs Louvain community detection via `useMemo`; passes `communityMap` and `caseNumber` to canvas |
| `backend/services/intelligence.ts` | Cross-source link merging: pairs appearing in ΓëÑ2 files get `+20` weight boost and `┬╖CROSS_SOURCE` marker |

### What it does

- **Filter bar** above the graph canvas: click entity type or risk tier pills to dim/hide unmatched nodes. Live `N / total nodes` counter. "Reset" button clears all filters.
- **Community colouring**: Louvain algorithm (graphology) runs on every analysis load and assigns each detected cluster a distinct glow colour. "N communities detected" badge appears in the legend.
- **Screenshot**: Camera button captures the canvas as PNG and triggers browser download named `nidarshan-graph-<caseNumber>.png`.
- **Better link weights**: cross-source links (same entity pair in ΓëÑ2 evidence files) now score higher, making them appear as `strong` confidence tier in the graph ΓÇö directly reflecting real forensic correlation strength.

### How to test

1. Run `pnpm dev` ΓåÆ open `http://localhost:3000`
2. Upload `sample_upi.csv` + `sample_cdr.csv` ΓåÆ run analysis ΓåÆ open Dashboard
3. Verify: filter bar appears above graph; clicking "Mule" shows only mule nodes
4. Verify: node glows are tinted by community; legend shows community count
5. Click Camera icon ΓåÆ verify PNG downloads
6. Check cross-source links show as solid (strong) if entities appear in both files

---

## [feature/timeline-view] — Cross-Source Event Timeline

**Branch:** `feature/timeline-view`
**Status:** ✅ Committed — ready for PR merge into `main`

### What changed

| File | Change |
|---|---|
| `frontend/src/screens/Timeline.tsx` | Full rewrite — date grouping, rapid-sequence detection, entity chips, gap labels, source-type colouring |

### What it does

- **Date grouping** — events bucketed under sticky day headers with per-day event count
- **Rapid-sequence detection** — events within 60 s of adjacent event flagged with red ⚡ dot, red border, and warning banner
- **Gap labels** — `+30s` / `+4m` indicators between events on the same day
- **Entity chips** — phone numbers, UPI handles, IPs, IMEIs extracted from summary text and rendered as coloured chips
- **Source-type colouring** — each event card has a left border + icon badge tinted by source (UPI orange, CDR blue, IPDR violet, Chat green, Email pink)
- **Stats bar** — date range, total events, rapid-sequence count badge in header
- **Filter pills** — hide empty source types; pills tinted by source colour when active

### How to test

1. `pnpm dev` → open `http://localhost:3000`
2. Upload `sample_upi.csv` + `sample_cdr.csv` → analyze → open Timeline
3. Verify events grouped by date with day headers
4. Verify rapid-sequence events show red ⚡ dots and gap labels
5. Click a source filter pill (e.g. CDR) — only CDR events remain

---

## Upcoming features (backlog)

| Branch name (planned) | Feature | Evaluation criteria |
|---|---|---|
| `feature/brief-export` | One-page court-admissible PDF with suspect clusters + seizure recs | Usability 25% |
| `feature/imei-crosslink` | IMEI/IMSI SIM-switching anomaly detection | Technical Feasibility 30% |

---

## Project run workflow

```powershell
# First time only
$env:PATH = "$env:APPDATA\npm;$env:PATH"
pnpm install
pnpm db:push

# Every session
$env:PATH = "$env:APPDATA\npm;$env:PATH"
pnpm dev
# ΓåÆ http://localhost:3000
```

See `SETUP_AND_RUN.md` for the full step-by-step guide.
