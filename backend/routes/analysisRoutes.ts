import express from "express";
import { invokeLLM } from "../_core/llm";
import { buildIntelligence } from "../services/intelligence";
import { buildReportData, generatePdfReport } from "../services/reportGenerator";
import { insertAuditEvent, insertEvidenceFile, listApkArtifacts, listAuditEvents, listEvidenceFiles } from "../db/db";
import { sha256 } from "../parsers/evidenceParser";

function responseText(response: { choices?: { message?: { content?: unknown } }[] }) {
  const content = response.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : JSON.stringify(content ?? "");
}

async function contextFor(caseNumber: string) {
  const files = await listEvidenceFiles(caseNumber);
  const apks = await listApkArtifacts(caseNumber);
  const analysis = buildIntelligence(files);
  return { files, apks, analysis };
}

export function registerAnalysisRoutes(app: express.Express) {
  app.get("/api/cases/:caseNumber/analysis", async (req, res) => {
    const { files, apks, analysis } = await contextFor(req.params.caseNumber);
    res.json({ ...analysis, apks: apks.map(apk => ({ ...apk, permissions: JSON.parse(apk.permissions), urls: JSON.parse(apk.urls), ips: JSON.parse(apk.ips), riskFlags: JSON.parse(apk.riskFlags) })), fileCount: files.length });
  });

  app.post("/api/cases/:caseNumber/analyze", async (req, res) => {
    const { files, apks, analysis } = await contextFor(req.params.caseNumber);
    await insertAuditEvent({ caseNumber: req.params.caseNumber, action: "analysis.completed", actor: "investigator", detail: `Correlated ${files.length} evidence file(s), ${analysis.entityCount} entities, ${analysis.linkCount} links, and ${apks.length} APK artifact(s)` });
    res.json({ ...analysis, apkCount: apks.length });
  });

  app.post("/api/cases/:caseNumber/narrative", async (req, res) => {
    const { files, apks, analysis } = await contextFor(req.params.caseNumber);
    const compactEvidence = files.slice(0, 12).map(file => ({ name: file.originalName, format: file.format, summary: file.textSummary, entities: JSON.parse(file.entities).slice(0, 20), receivedIps: JSON.parse(file.receivedIps) }));
    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are NIDARSHAN, an evidence-first cyber-fraud analyst. Produce cautious, human-reviewable intelligence. Never claim guilt, never invent facts, and clearly separate observed evidence from hypotheses." },
          { role: "user", content: JSON.stringify({ caseNumber: req.params.caseNumber, evidence: compactEvidence, topEntities: analysis.entities.slice(0, 10), apkArtifacts: apks.length }) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "nidarshan_narrative",
            strict: true,
            schema: {
              type: "object",
              properties: {
                narrative: { type: "string" },
                observedSignals: { type: "array", items: { type: "string" } },
                hypotheses: { type: "array", items: { type: "string" } },
                recommendedActions: { type: "array", items: { type: "string" } },
                disclaimer: { type: "string" },
              },
              required: ["narrative", "observedSignals", "hypotheses", "recommendedActions", "disclaimer"],
              additionalProperties: false,
            },
          },
        },
      });
      const narrative = responseText(response);
      await insertAuditEvent({ caseNumber: req.params.caseNumber, action: "ai.narrative.generated", actor: "investigator", detail: "Generated evidence-grounded narrative with observed signals and hypotheses" });
      res.json({ narrative: JSON.parse(narrative) });
    } catch (error) {
      res.status(502).json({ message: error instanceof Error ? error.message : "AI narrative generation failed" });
    }
  });

  app.get("/api/cases/:caseNumber/report.json", async (req, res) => {
    const { files, apks } = await contextFor(req.params.caseNumber);
    const report = buildReportData(req.params.caseNumber, files, apks.length);
    const reportHash = sha256(Buffer.from(JSON.stringify(report)));
    await insertAuditEvent({ caseNumber: req.params.caseNumber, action: "report.json.generated", actor: "investigator", detail: "Generated structured investigative report", evidenceHash: reportHash });
    res.json(report);
  });

  app.get("/api/cases/:caseNumber/report.pdf", async (req, res) => {
    const { files, apks } = await contextFor(req.params.caseNumber);
    const report = buildReportData(req.params.caseNumber, files, apks.length);
    const pdf = await generatePdfReport(report);
    await insertAuditEvent({ caseNumber: req.params.caseNumber, action: "report.pdf.generated", actor: "investigator", detail: "Generated one-page PDF investigative brief", evidenceHash: sha256(pdf) });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="nidarshan-${req.params.caseNumber}.pdf"`);
    res.send(pdf);
  });

  app.get("/api/cases/:caseNumber/offline-bundle", async (req, res) => {
    const { files, apks, analysis } = await contextFor(req.params.caseNumber);
    const audits = await listAuditEvents(req.params.caseNumber);
    res.json({ schemaVersion: 1, caseNumber: req.params.caseNumber, exportedAt: new Date().toISOString(), evidenceFiles: files, apkArtifacts: apks, analysis, auditEvents: audits });
  });

  app.post("/api/cases/:caseNumber/offline-bundle", express.json({ limit: "25mb" }), async (req, res) => {
    const bundle = req.body as { schemaVersion?: number; caseNumber?: string; evidenceFiles?: any[] };
    if (bundle.schemaVersion !== 1 || !Array.isArray(bundle.evidenceFiles)) { res.status(400).json({ message: "Invalid NIDARSHAN offline bundle" }); return; }
    let imported = 0;
    for (const file of bundle.evidenceFiles) {
      if (!file.originalName || !file.format || !file.sha256) continue;
      await insertEvidenceFile({ caseNumber: req.params.caseNumber, originalName: file.originalName, format: file.format, mimeType: file.mimeType ?? "application/octet-stream", sizeBytes: Number(file.sizeBytes ?? 0), sha256: file.sha256, storageKey: file.storageKey ?? `offline/${file.sha256}`, storageUrl: file.storageUrl ?? "", rowCount: Number(file.rowCount ?? 0), headers: JSON.stringify(file.headers ?? []), preview: JSON.stringify(file.preview ?? []), receivedIps: JSON.stringify(file.receivedIps ?? []), entities: JSON.stringify(file.entities ?? []), textSummary: file.textSummary ?? "Imported offline evidence" });
      imported += 1;
    }
    await insertAuditEvent({ caseNumber: req.params.caseNumber, action: "offline.bundle.imported", actor: "investigator", detail: `Imported ${imported} evidence file(s) from an offline bundle` });
    res.status(201).json({ imported, message: "Offline bundle accepted and indexed" });
  });
}
