# Network Graph Visualizer — Plan

## Top-Level Overview

**Goal:** Upgrade the existing `GraphCanvas` + `Dashboard` to be a production-quality
directional mule-chain visualizer that directly satisfies the hackathon deliverable:
*"Generate a directional transaction and communication flow graph mapping the chain
from victim to intermediary mule nodes and ultimate cash-out points."*

**Scope:** Frontend-only changes plus a small intelligence service improvement.
No new routes, no schema changes. The existing `/api/cases/:id/analysis` response
is sufficient — we improve how the frontend consumes and presents it.

**Non-goals:**
- No new backend routes
- No changes to authentication or case management
- No changes to Upload, Processing, Report, Entities, or AuditLog screens

**Branch:** `feature/network-graph` (off `main`)

---

## Sub-Tasks

---

### Sub-Task 1 — Fix graphology type errors in `graphUtils.ts`

**Status:** `[ ] pending`

**Intent:**
`frontend/src/lib/graphUtils.ts` has pre-existing TypeScript errors (Property
'hasNode' / 'addNode' / 'addEdge' / 'order' do not exist). These block using
community detection in the frontend. Fix by using the correct graphology API.

**Expected Outcomes:**
- `pnpm check` produces zero errors in `graphUtils.ts`
- `buildGraph()` and `detectCommunities()` work correctly
- Community IDs (0, 1, 2 …) are returned as a `Map<nodeId, communityId>`

**Todo List:**
1. Read `frontend/src/lib/graphUtils.ts`
2. Import `Graph` from `graphology` with correct constructor usage
3. Replace `.hasNode/.addNode/.addEdge/.order` with the correct graphology v0.26 API
4. Expose `detectCommunities` return type clearly: `Map<string, number>`
5. Run `pnpm check` and confirm zero new errors in this file

**Relevant Context:**
- File: `frontend/src/lib/graphUtils.ts`
- Graphology v0.26 docs: nodes use `graph.hasNode(id)`, `graph.addNode(id, attrs)`,
  edges use `graph.addEdge(src, tgt, attrs)`, size is `graph.order`
- Louvain: `louvain(graph)` returns `Record<nodeId, communityId>`

---

### Sub-Task 2 — Add `GraphFilterBar` component

**Status:** `[ ] pending`

**Intent:**
Field officers need to isolate specific parts of the graph (e.g., show only mules
and cash-out nodes, or only critical-risk entities). A compact filter bar above the
graph canvas lets them toggle entity types and risk tiers without leaving the view.

**Expected Outcomes:**
- New file `frontend/src/components/graph/GraphFilterBar.tsx` exists
- Renders a horizontal pill-toggle row: entity types (Victim / Mule / Cashout / Device / IP)
  and risk tiers (Critical / High / Medium / Low)
- Selecting a filter dims/hides unmatched nodes in `GraphCanvas`
- "Reset filters" clears all active filters
- Matches existing dark theme (`bg-[#0f1018]`, `border-[#1c1e2e]`, purple active state)

**Todo List:**
1. Create `frontend/src/components/graph/GraphFilterBar.tsx`
2. Props: `activeTypes: EntityType[]`, `activeTiers: RiskTier[]`,
   `onTypeToggle(type)`, `onTierToggle(tier)`, `onReset()`
3. Style: horizontal flex row of pill buttons using existing color palette from
   `frontend/src/lib/colors.ts` entity + risk colors
4. Export from component
5. Import and wire in `Dashboard.tsx`:
   - Add `activeTypes` and `activeTiers` state
   - Filter `entities` and `edges` passed to `GraphCanvas` based on active filters
   - Place `GraphFilterBar` above the graph canvas container

**Relevant Context:**
- `frontend/src/lib/types.ts` — `EntityType`, `RiskTier`
- `frontend/src/lib/colors.ts` — entity + risk color palettes
- `frontend/src/screens/Dashboard.tsx` — where filter state lives
- `frontend/src/components/graph/GraphCanvas.tsx` — receives filtered nodes/edges

---

### Sub-Task 3 — Community cluster colouring in `GraphCanvas`

**Status:** `[ ] pending`

**Intent:**
Run Louvain community detection on the graph and subtly tint node glow rings by
community ID. This visually groups phone/UPI clusters that co-appear across files —
making mule rings immediately visible to field officers without any manual inspection.

**Expected Outcomes:**
- `GraphCanvas` accepts optional `communityMap?: Map<string, number>` prop
- Each unique community ID maps to a distinct pastel overlay colour (6–8 colours cycling)
- Node glow (`ctx.shadowColor`) uses the community tint instead of the entity colour
- A small "Communities detected: N" badge appears in the legend when map is provided
- Falls back to existing entity-colour glow when no community map is passed

**Todo List:**
1. Add `communityMap?: Map<string, number>` to `GraphCanvas` Props interface
2. Define a `COMMUNITY_PALETTE` array of 8 distinct colours (distinct from entity colours)
3. In `paintNode`, derive `communityColor` from `communityMap?.get(node.id)` using modulo
4. Use `communityColor` for `shadowColor` and outer glow ring; keep entity colour for
   node fill/stroke so type is still visually clear
5. Add community count badge to legend section
6. In `Dashboard.tsx`:
   - Import `buildGraph`, `detectCommunities` from `graphUtils`
   - Run detection inside a `useMemo` when `entities`/`edges` change
   - Pass resulting `Map` as `communityMap` to `GraphCanvas`

**Relevant Context:**
- `frontend/src/components/graph/GraphCanvas.tsx` — `paintNode` function (lines 81–141)
- `frontend/src/lib/graphUtils.ts` — after Sub-Task 1 fix
- `frontend/src/screens/Dashboard.tsx` — `useMemo` for community detection

---

### Sub-Task 4 — Working screenshot button

**Status:** `[ ] pending`

**Intent:**
The screenshot button in `GraphCanvas` currently only `console.log`s. For the
hackathon demo and court evidence use-case, investigators need to export the graph
as a PNG with one click.

**Expected Outcomes:**
- Clicking the Camera button triggers a real canvas capture
- Browser downloads a file named `nidarshan-graph-<caseNumber>.png`
- No external libraries needed (uses native `canvas.toDataURL`)

**Todo List:**
1. In `GraphCanvas.tsx`, replace the `handleScreenshot` stub
2. Access the underlying `<canvas>` element via `fgRef.current.renderer().domElement`
   or query `containerRef.current.querySelector('canvas')`
3. Call `canvas.toDataURL('image/png')`
4. Create an `<a>` element, set `href` and `download` attribute, trigger `.click()`
5. Accept optional `caseNumber?: string` prop for the filename
6. Wire `caseNumber` from `Dashboard.tsx` via `caseCtx.caseNumber`

**Relevant Context:**
- `frontend/src/components/graph/GraphCanvas.tsx` — `handleScreenshot` (line 60–63),
  `containerRef` (line 26), `fgRef` (line 24)
- `frontend/src/lib/CaseContext.tsx` — `caseCtx.caseNumber`
- `frontend/src/screens/Dashboard.tsx` — passes props to `GraphCanvas`

---

### Sub-Task 5 — Improve link weights in `intelligence.ts`

**Status:** `[ ] pending`

**Intent:**
Currently all links within a file get `weight = max(entityScore_A, entityScore_B)`.
This means unrelated adjacent entities in a CSV row get the same weight as genuinely
correlated ones. Improve by boosting weight when the same entity pair appears in
**multiple source files** (true cross-source correlation).

**Expected Outcomes:**
- Links that appear across ≥2 source files get a `+20` weight bonus
- `linkType` is enriched to include `CROSS_SOURCE` marker for multi-file links
- Existing frontend confidence tier mapping (`strong ≥70 / moderate ≥40 / weak <40`)
  now reflects actual evidence strength rather than entity score proxy
- No changes to API response shape — same fields, better values

**Todo List:**
1. In `backend/services/intelligence.ts`, after building the `links` array,
   group links by `from+to` pair (order-normalised)
2. For pairs appearing in ≥2 sources, merge into one link with combined `sources[]`
   and add `+20` to weight (capped at 100)
3. Append `CROSS_SOURCE` to `linkType` string for those links
4. Deduplicate the links array (remove per-file duplicates after merging)
5. Test with `sample_upi.csv` + `sample_cdr.csv` to verify stronger links appear
   between shared entities

**Relevant Context:**
- `backend/services/intelligence.ts` — `buildIntelligence()` function (lines 62–70)
- Sample data files: `sample_upi.csv`, `sample_cdr.csv` in project root

---

### Sub-Task 6 — Update `CHANGES.md` and commit

**Status:** `[ ] pending`

**Intent:**
Keep the living changelog accurate after each sub-task is merged.

**Todo List:**
1. Update `CHANGES.md` — move `feature/network-graph` entry from 🔜 to ✅
2. List exact files changed with one-line description each
3. `git add .`
4. `git commit -m "feat: network graph visualizer — filter bar, community clusters, screenshot, link quality"`
5. Report back to user for PR creation decision
