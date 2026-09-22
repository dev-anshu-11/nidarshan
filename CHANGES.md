# CHANGES — Nidarshan

A running record of every feature branch, what was changed, and what comes next.
Each entry links to the relevant branch and describes the exact files touched.

---

## [dashboard-changes] — Smart Bulk Upload Block

**Branch:** `dashboard-changes`
**Status:** ✅ Committed — ready for PR merge into `main`

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
  - `.apk` → APK Files
  - `.txt / .json / .eml` → Chat / Email
  - `.csv / .xlsx` + keyword `upi / bank / txn` → Bank / UPI
  - `.csv / .xlsx` + keyword `cdr / ipdr / call` → CDR / IPDR
  - unmatched → shown as **Unrecognised / skipped**
- A **Routing Preview** panel shows destination badge per file before confirming
- Merges into the shared upload queue with deduplication; the same `startInvestigation` handler submits everything

### How to test

1. Run `pnpm dev`
2. Navigate to `http://localhost:3000/upload`
3. Drag a folder containing `upi_jan.csv`, `cdr_march.csv`, `chat.txt` onto the Smart Bulk Upload block
4. Verify preview shows correct routing arrows before clicking "Add N Files to Queue"

---

## [feature/network-graph] — Network Graph Visualizer Upgrade

**Branch:** `feature/network-graph`
**Status:** 🔜 Planned — see `network-graph-plan.md`

### What will change

| File | Change |
|---|---|
| `frontend/src/components/graph/GraphCanvas.tsx` | Screenshot fix, flow-direction mode, community cluster colouring |
| `frontend/src/components/graph/GraphFilterBar.tsx` | **New** — filter toolbar (entity type, risk tier, confidence) |
| `frontend/src/components/graph/GraphMinimap.tsx` | **New** — minimap overlay for large graphs |
| `frontend/src/screens/Dashboard.tsx` | Wire filter state into GraphCanvas + add view-mode toggle |
| `frontend/src/lib/graphUtils.ts` | Fix graphology type errors; expose community map to frontend |
| `backend/services/intelligence.ts` | Improve link weight: use actual cross-file co-occurrence score |

### What it will do

- **Directional flow arrows** visually trace victim → mule → cash-out chain
- **Filter bar** to isolate by entity type (victim / mule / device / IP) and risk tier
- **Community clusters** coloured by Louvain detection (graphology already installed)
- **Working screenshot** button (canvas `toDataURL` → PNG download)
- **Minimap** for navigating dense graphs with many nodes

### Why it matters for the hackathon

> *"Mule Account & Network Graph Visualizer — Generate a directional transaction and communication flow graph mapping the chain from victim to intermediary mule nodes and ultimate cash-out points."*

Directly addresses the **core deliverable** and contributes to **Usability for Field Officers (25%)** and **Forensic Accuracy (25%)** evaluation criteria.

---

## Upcoming features (backlog)

| Branch name (planned) | Feature | Evaluation criteria |
|---|---|---|
| `feature/timeline-view` | Cross-source chronological event stitching | Forensic Accuracy 25% |
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
# → http://localhost:3000
```

See `SETUP_AND_RUN.md` for the full step-by-step guide.
