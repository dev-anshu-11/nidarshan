# NIDARSHAN — Cyber-Fraud Intelligence

NIDARSHAN is an evidence-first investigation workspace for cyber-fraud teams. It connects UPI, CDR, IPDR, and chat signals into a verifiable network of accounts, devices, phone numbers, and shared infrastructure.

> **Prototype status:** This release ships a seeded investigation story and typed full-stack contracts for demonstrating the evidence-to-network workflow. Findings are investigative leads and require human verification.

## What is included

- Dark, responsive investigator workspace with persistent case navigation.
- Overview dashboard with risk-ranked entities, active signals, and a time-ordered evidence timeline.
- Interactive relationship graph for the victim → mule → downstream account → cash-out chain.
- Evidence review with source file integrity status, confidence scores, and provenance cards.
- Real multipart upload and server-side parsing for `.csv` and `.eml` evidence files.
- SHA-256 hashing, built-in object storage, CSV previews, EML header/body extraction, and received-IP detection.
- Cross-file entity correlation with explainable risk scores and source-linked relationships.
- Static APK triage for permissions, hardcoded URLs/IPs, and phishing indicators.
- Live JSON/PDF investigative reports, AI-assisted cautious narrative generation, audit events, and offline bundles.
- Investigative brief view with narrative, priority entities, recommendations, and export-ready structure.
- Full-stack tRPC procedures backed by Drizzle/MySQL for case snapshots.
- Seeded case data demonstrating rapid fund splitting, shared devices, reused IP infrastructure, and mule-recruitment chat language.

## Local setup

```bash
pnpm install
pnpm db:push
pnpm dev
```

The development server runs the React client and Express/tRPC backend together. Open the preview URL shown by the WebDev environment.

For a production build:

```bash
pnpm check
pnpm test
pnpm build
pnpm start
```

## Main project areas

```text
frontend/src/pages/Home.tsx        Investigator workspace and views
backend/nidarshanData.ts              Seeded investigation narrative
backend/evidenceParser.ts          CSV and EML parsing, hashing, and entity extraction
backend/evidenceRoutes.ts          Multipart upload and evidence listing endpoints
backend/analysisRoutes.ts          Correlation, AI narrative, reports, audit, and offline endpoints
backend/intelligence.ts            Cross-file entity linking and explainable scoring
backend/apkParser.ts               Static APK permission/URL/IP triage
backend/reportGenerator.ts         JSON and PDF investigative brief generation
backend/routers.ts                 Public tRPC case procedures
backend/db.ts                      Drizzle case helpers
backend/drizzle/schema.ts           Users, case snapshots, and uploaded evidence metadata
backend/shared/nidarshan.ts            Shared evidence, graph, risk, and report types
backend/nidarshan.test.ts              NIDARSHAN behavior coverage
backend/evidenceParser.test.ts      Parser coverage for CSV, EML, entities, and hashes
backend/intelligence.test.ts        Cross-file correlation coverage
backend/apkParser.test.ts           APK triage coverage
backend/reportGenerator.test.ts     PDF report coverage
```

## Demo case

The default case is `KRN-261014-001`, titled **UPI mule network · Pune**. The seeded story includes:

- A reported ₹50,000 transfer into `9876543210@paytm`.
- Three downstream destinations reached within eight minutes.
- A shared IMEI mapped to multiple phone identities.
- A reused IP address across account sessions.
- Chat language suggesting account recruitment and OTP urgency.

## Real evidence uploads

From the **Evidence review** view, choose one or more `.csv` or `.eml` files. The server accepts up to 10 files per request and 15 MB per file at:

```text
POST /api/cases/{caseNumber}/evidence
Content-Type: multipart/form-data
field: files
```

CSV uploads use delimiter detection, header extraction, row counts, previews, and regex extraction for phone numbers, UPI IDs, IPs, IMEIs, amounts, and account numbers. EML uploads are parsed for sender, recipient, subject, date, body text, `Received` headers, received IPs, and the same entity patterns. The original bytes are stored through the configured object-storage helper, while the database stores the SHA-256 hash, storage reference, parsed preview, and extracted metadata.

Uploaded evidence can be listed with:

```text
GET /api/cases/{caseNumber}/evidence
```

## Responsible use

NIDARSHAN should be used to organize and prioritize evidence, not to automatically identify guilt or make legal decisions. Preserve source records and their hashes, review every inferred relationship against the original files, and apply applicable authorization and procedural safeguards before taking action.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS, Express, tRPC, Drizzle ORM, MySQL/TiDB, Multer, MailParser, AdmZip, PDFKit, built-in LLM integration, Vitest, Lucide icons, Space Grotesk, and DM Sans.
