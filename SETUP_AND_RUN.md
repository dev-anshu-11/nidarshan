# NIDARSHAN Setup and Run Guide

This guide explains how to install, configure, run, test, and use the NIDARSHAN prototype locally. Run the commands in the order shown.

> **Important:** The current NIDARSHAN project uses MySQL/TiDB through `DATABASE_URL`, platform object storage for original uploaded files, Manus OAuth variables, and the built-in LLM API. The application can run locally, but a fully offline deployment requires replacing those cloud services with local alternatives.

## 1. Required software

Install the following software before starting:

| Requirement | Recommended version | Purpose |
|---|---:|---|
| Node.js | 22 or newer | Runs the Express server and React tooling |
| pnpm | 10.x | Installs dependencies and runs project scripts |
| MySQL or TiDB | 8.x-compatible | Stores cases, evidence metadata, APK results, and audit events |
| Git | Current stable version | Downloads the project source |

Check the installed versions:

```bash
node --version
pnpm --version
git --version
mysql --version
```

If `pnpm` is not installed, install it with:

```bash
corepack enable
corepack prepare pnpm@10.4.1 --activate
```

## 1A. Windows installation procedure

The following procedure is for **Windows 10 or Windows 11 using PowerShell**. Open PowerShell as Administrator when installing software. After installation, close and reopen PowerShell so that the updated `PATH` is loaded.

Install Git, Node.js, and MySQL with Windows Package Manager:

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Oracle.MySQL -e
```

If the MySQL package is unavailable in Windows Package Manager, install MySQL Community Server from the [official MySQL downloads page](https://dev.mysql.com/downloads/mysql/). During installation, remember the root password and keep the default MySQL port `3306`.

Open a new PowerShell window and enable pnpm through Corepack:

```powershell
corepack enable
corepack prepare pnpm@10.4.1 --activate
```

Verify the Windows installation:

```powershell
node --version
pnpm --version
git --version
mysql --version
```

Clone and enter the project:

```powershell
git clone YOUR_REPOSITORY_URL nidarshan
Set-Location .\\nidarshan
```

Install project dependencies:

```powershell
pnpm install
```

Create the NIDARSHAN database from PowerShell. Replace `CHANGE_THIS_PASSWORD` with the password you want for the NIDARSHAN database user:

```powershell
mysql.exe -u root -p -e "CREATE DATABASE nidarshan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER 'nidarshan_user'@'localhost' IDENTIFIED BY 'CHANGE_THIS_PASSWORD'; GRANT ALL PRIVILEGES ON nidarshan.* TO 'nidarshan_user'@'localhost'; FLUSH PRIVILEGES;"
```

Create the project `.env` file with PowerShell:

```powershell
@'
DATABASE_URL=mysql://nidarshan_user:CHANGE_THIS_PASSWORD@127.0.0.1:3306/nidarshan
NODE_ENV=development
PORT=3000
'@ | Set-Content -Encoding utf8 .env
```

Apply the database migrations:

```powershell
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

Start NIDARSHAN:

```powershell
pnpm dev
```

Open the application in a browser at `http://localhost:3000`.

Run validation commands from a second PowerShell window in the project directory:

```powershell
pnpm check
pnpm test
pnpm build
```

Use `curl.exe` rather than `curl` in PowerShell because `curl` may be mapped to the PowerShell `Invoke-WebRequest` alias:

```powershell
curl.exe http://localhost:3000/api/cases/KRN-261014-001/analysis
```

Open a generated PDF on Windows with:

```powershell
Start-Process .\\nidarshan-report.pdf
```

Stop the development server by pressing `Ctrl+C`.

The remaining sections use standard project commands. Most `pnpm` commands work unchanged in PowerShell. For Linux-specific commands such as `export`, `cat`, `xdg-open`, or `lsof`, use the Windows alternatives in this section and the troubleshooting section.

## 2. Get the project

Clone the repository if it is hosted in Git:

```bash
git clone YOUR_REPOSITORY_URL nidarshan
```

Enter the project directory:

```bash
cd nidarshan
```

If the project already exists locally, use its existing directory instead:

```bash
cd /path/to/nidarshan
```

## 3. Install dependencies

Install all frontend, backend, database, parser, APK, PDF, and test dependencies:

```bash
pnpm install
```

The project currently uses these important packages:

- React, TypeScript, Vite, and Tailwind CSS for the interface.
- Express and tRPC for the API layer.
- Drizzle ORM and MySQL/TiDB for persistence.
- Multer for multipart file uploads.
- MailParser for EML parsing.
- AdmZip for APK archive inspection.
- PDFKit for PDF investigative briefs.
- Vitest for automated tests.

## 4. Create the database

Start MySQL or TiDB before running the application.

Create a database and a database user using a MySQL administrator account:

```bash
mysql -u root -p
```

Run these SQL statements inside the MySQL prompt:

```sql
CREATE DATABASE nidarshan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nidarshan_user'@'localhost' IDENTIFIED BY 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON nidarshan.* TO 'nidarshan_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Set the database connection string in the shell. Replace the password with the password you created:

```bash
export DATABASE_URL='mysql://nidarshan_user:CHANGE_THIS_PASSWORD@127.0.0.1:3306/nidarshan'
```

For a persistent local configuration, create a `.env` file in the project root:

```bash
cat > .env <<'EOF'
DATABASE_URL=mysql://nidarshan_user:CHANGE_THIS_PASSWORD@127.0.0.1:3306/nidarshan
NODE_ENV=development
PORT=3000
EOF
```

Do not commit `.env` to Git. Confirm that it is ignored:

```bash
git status --short
```

## 5. Apply database migrations

Generate the current Drizzle migration files:

```bash
pnpm drizzle-kit generate
```

Apply the migrations to the configured MySQL/TiDB database:

```bash
pnpm drizzle-kit migrate
```

The database contains these main tables:

| Table | Purpose |
|---|---|
| `users` | Optional Manus-authenticated investigator accounts |
| `cases` | Investigation case snapshots |
| `evidence_files` | CSV/EML metadata, hashes, parsed previews, and extracted entities |
| `apk_artifacts` | APK hashes, permissions, URLs, IPs, and risk flags |
| `audit_events` | Evidence uploads, analysis actions, report hashes, and offline imports |

Verify that the tables exist:

```bash
mysql "$DATABASE_URL" -e "SHOW TABLES;"
```

## 6. Configure external services for the hosted feature set

The following variables are needed for the complete hosted version:

```bash
export BUILT_IN_FORGE_API_URL='YOUR_FORGE_API_URL'
export BUILT_IN_FORGE_API_KEY='YOUR_FORGE_API_KEY'
export JWT_SECRET='YOUR_LONG_RANDOM_SESSION_SECRET'
export VITE_APP_ID='YOUR_MANUS_APP_ID'
export OAUTH_SERVER_URL='YOUR_OAUTH_SERVER_URL'
export VITE_OAUTH_PORTAL_URL='YOUR_OAUTH_PORTAL_URL'
```

These values are normally injected automatically by the WebDev environment. Do not invent placeholder values and expect cloud storage, OAuth, or AI features to work.

The external-service requirements are:

| Feature | Required service |
|---|---|
| Original CSV/EML/APK file storage | Configured object storage through `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` |
| Investigator login | Manus OAuth variables |
| AI narrative generation | Built-in LLM service variables |
| Case and evidence metadata | MySQL/TiDB through `DATABASE_URL` |

## 7. Run the development server

Start the React frontend and Express/tRPC backend together:

```bash
pnpm dev
```

Open the local URL printed by the server, normally:

```text
http://localhost:3000
```

The server exposes the frontend and API from the same process.

## 8. Use the upload pipeline

Open the **Evidence Review** view in the NIDARSHAN interface.

Click **Add evidence**.

Select one or more `.csv` or `.eml` files.

The upload request is sent to:

```text
POST /api/cases/{caseNumber}/evidence
```

The multipart field name is:

```text
files
```

CSV processing includes delimiter detection, headers, row counts, previews, phones, UPI handles, IP addresses, IMEIs, amounts, and account numbers.

EML processing includes sender, recipient, subject, date, body text, `Received` headers, received IP addresses, and the same entity patterns.

Each original file receives a SHA-256 hash. The original bytes are placed in object storage, while parsed metadata is saved in the `evidence_files` table.

## 9. Test the upload API without the browser

List stored evidence for the demo case:

```bash
curl -sS http://localhost:3000/api/cases/KRN-261014-001/evidence
```

Upload a CSV file:

```bash
curl -sS -X POST \
  -F 'files=@/absolute/path/to/sample.csv' \
  http://localhost:3000/api/cases/KRN-261014-001/evidence
```

Upload an EML file:

```bash
curl -sS -X POST \
  -F 'files=@/absolute/path/to/message.eml' \
  http://localhost:3000/api/cases/KRN-261014-001/evidence
```

The current upload limit is 10 files per request and 15 MB per CSV or EML file.

## 10. Run live correlation and scoring

Run cross-file entity correlation and explainable scoring:

```bash
curl -sS -X POST \
  http://localhost:3000/api/cases/KRN-261014-001/analyze
```

Read the current derived analysis:

```bash
curl -sS \
  http://localhost:3000/api/cases/KRN-261014-001/analysis
```

The analysis groups repeated entities across uploaded files and creates source-linked relationships. It assigns risk scores using source count, entity type, confidence, and cross-source indicators.

## 11. Analyze APK artifacts

Open **Evidence Review** and click **Analyze APK**.

Or upload an APK through the API:

```bash
curl -sS -X POST \
  -F 'files=@/absolute/path/to/sample.apk' \
  http://localhost:3000/api/cases/KRN-261014-001/apk
```

List APK triage results:

```bash
curl -sS \
  http://localhost:3000/api/cases/KRN-261014-001/apk
```

APK triage checks the archive for Android permissions, hardcoded URLs, IP addresses, and phishing-related indicators. It does not execute the APK.

## 12. Generate reports

Generate a JSON investigative report:

```bash
curl -sS \
  http://localhost:3000/api/cases/KRN-261014-001/report.json \
  -o nidarshan-report.json
```

Generate a PDF investigative brief:

```bash
curl -sS \
  http://localhost:3000/api/cases/KRN-261014-001/report.pdf \
  -o nidarshan-report.pdf
```

Open the PDF after downloading:

```bash
xdg-open nidarshan-report.pdf
```

The report includes source-file hashes, case summary, top entities, risk tiers, recommendations, and a human-review disclaimer.

## 13. Generate the AI narrative

Run the evidence-grounded narrative endpoint:

```bash
curl -sS -X POST \
  http://localhost:3000/api/cases/KRN-261014-001/narrative
```

This feature requires the configured LLM service and internet access in the current hosted architecture. The narrative is intended to support human review and must not be treated as an automatic finding of guilt.

## 14. Export and import an offline bundle

Export a case bundle:

```bash
curl -sS \
  http://localhost:3000/api/cases/KRN-261014-001/offline-bundle \
  -o nidarshan-offline-bundle.json
```

Import the bundle into another NIDARSHAN case:

```bash
curl -sS -X POST \
  -H 'Content-Type: application/json' \
  --data-binary @nidarshan-offline-bundle.json \
  http://localhost:3000/api/cases/KRN-261014-001/offline-bundle
```

The bundle contains parsed evidence metadata, analysis results, APK metadata, and audit events. The current bundle does not replace the cloud object-storage files automatically.

## 15. Read the chain-of-custody audit log

Read audit events for a case:

```bash
curl -sS \
  http://localhost:3000/api/cases/KRN-261014-001/audit
```

Audit events are recorded for evidence uploads, APK analysis, live analysis, AI narrative generation, report generation, and offline imports.

## 16. Run automated tests

Run all tests:

```bash
pnpm test
```

Run TypeScript validation:

```bash
pnpm check
```

Build the production bundle:

```bash
pnpm build
```

Start the production server after building:

```bash
pnpm start
```

## 17. Current offline limitations

The application is not fully offline by default. Full offline operation requires all of the following changes:

1. Replace MySQL/TiDB with a local SQLite database.
2. Replace object storage with a local `uploads/` directory.
3. Replace Manus OAuth with local authentication or disable login.
4. Replace the hosted LLM with a local Ollama model, or disable AI narrative generation.
5. Package Node.js, the database, and the frontend as a local installer or portable application.

The local parsing, correlation, APK triage, scoring, PDF generation, audit logging, and offline bundle logic can run without an external AI service after those storage and database substitutions are completed.

## 18. Stop the development server

Press this key combination in the terminal running `pnpm dev`:

```text
Ctrl+C
```

## Troubleshooting

If the application reports a missing database connection, inspect the variable:

```bash
printf '%s\n' "$DATABASE_URL"
```

If migrations fail, confirm that MySQL is running and that the user has privileges:

```bash
mysql "$DATABASE_URL" -e "SELECT 1;"
```

If uploads fail, confirm the file extension is `.csv`, `.eml`, or `.apk`, confirm the file is within the size limit, and confirm object-storage variables are configured.

If AI narrative generation fails, continue using CSV/EML parsing, correlation, scoring, APK triage, reports, and offline bundles. The AI narrative is an optional hosted feature.

If port 3000 is busy, stop the process using it or allow the project server to select another available port:

```bash
lsof -i :3000
```

> NIDARSHAN is an investigative assistance tool. Preserve original evidence, verify every inferred relationship, and obtain applicable authorization before taking operational or legal action.
