import crypto from "node:crypto";
import express from "express";
import multer from "multer";
import { insertApkArtifact, insertAuditEvent, listApkArtifacts, listAuditEvents, insertEvidenceFile, listEvidenceFiles } from "../db/db";
import { analyzeApk } from "../parsers/apkParser";
import { parseEvidenceFile, sha256 } from "../parsers/evidenceParser";
import { storagePut } from "../services/storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 10, fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const lower = file.originalname.toLowerCase();
    const allowed = [".csv", ".eml", ".txt", ".xlsx", ".xls", ".apk"];
    callback(null, allowed.some(ext => lower.endsWith(ext)));
  },
});

const apkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 3, fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, file.originalname.toLowerCase().endsWith(".apk")),
});

function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export function registerEvidenceRoutes(app: express.Express) {
  app.get("/api/cases/:caseNumber/evidence", async (req, res) => {
    try {
      const files = await listEvidenceFiles(req.params.caseNumber);
      res.json({ files: files.map(file => ({
        id: file.id,
        caseNumber: file.caseNumber,
        originalName: file.originalName,
        format: file.format,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        sha256: file.sha256,
        storageUrl: file.storageUrl,
        rowCount: file.rowCount,
        headers: JSON.parse(file.headers),
        preview: JSON.parse(file.preview),
        receivedIps: JSON.parse(file.receivedIps),
        entities: JSON.parse(file.entities),
        textSummary: file.textSummary,
        createdAt: file.createdAt,
      })) });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unable to list evidence" });
    }
  });

  app.post("/api/cases/:caseNumber/evidence", (req, res, next) => {
    upload.array("files", 10)(req, res, error => {
      if (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Invalid multipart upload" });
        return;
      }
      next();
    });
  }, async (req, res) => {
    try {
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      if (files.length === 0) {
        res.status(400).json({ message: "Attach at least one evidence file (.csv, .eml, .txt, or .apk)." });
        return;
      }

      const uploads = [];
      for (const file of files) {
        const lower = file.originalname.toLowerCase();
        const isApk = lower.endsWith(".apk");

        if (isApk) {
          // APK files — run APK analysis
          const analysis = analyzeApk(file.buffer);
          const storage = await storagePut(`nidarshan/${safeSegment(req.params.caseNumber)}/apk/${safeSegment(file.originalname)}`, file.buffer, file.mimetype || "application/vnd.android.package-archive");
          const saved = await insertApkArtifact({ caseNumber: req.params.caseNumber, originalName: file.originalname, sha256: analysis.sha256, sizeBytes: file.size, storageKey: storage.key, storageUrl: storage.url, permissions: JSON.stringify(analysis.permissions), urls: JSON.stringify(analysis.urls), ips: JSON.stringify(analysis.ips), riskFlags: JSON.stringify(analysis.riskFlags) });
          await insertAuditEvent({ caseNumber: req.params.caseNumber, action: "apk.analyzed", actor: "investigator", detail: `${file.originalname} triaged with ${analysis.riskFlags.length} risk flag(s)`, evidenceHash: analysis.sha256 });
          uploads.push({
            id: saved?.id ?? crypto.randomUUID(),
            caseNumber: req.params.caseNumber,
            originalName: file.originalname,
            format: "APK",
            mimeType: file.mimetype,
            sizeBytes: file.size,
            sha256: analysis.sha256,
            storageUrl: storage.url,
            rowCount: 0,
            headers: [],
            preview: [],
            receivedIps: [],
            entities: analysis.riskFlags.map((f: string) => ({ type: "RISK_FLAG" as const, value: f, confidence: 1 })),
            textSummary: `APK with ${analysis.permissions.length} permissions, ${analysis.riskFlags.length} risk flags`,
            createdAt: saved?.createdAt ?? new Date(),
          });
        } else {
          // Evidence files — CSV, EML, TXT
          const parsed = await parseEvidenceFile(file);
          const hash = sha256(file.buffer);
          const storage = await storagePut(`nidarshan/${safeSegment(req.params.caseNumber)}/${safeSegment(file.originalname)}`, file.buffer, file.mimetype || "application/octet-stream");
          const saved = await insertEvidenceFile({
            caseNumber: req.params.caseNumber,
            originalName: file.originalname,
            format: parsed.format,
            mimeType: file.mimetype || "application/octet-stream",
            sizeBytes: file.size,
            sha256: hash,
            storageKey: storage.key,
            storageUrl: storage.url,
            rowCount: parsed.rowCount,
            headers: JSON.stringify(parsed.headers),
            preview: JSON.stringify(parsed.preview),
            receivedIps: JSON.stringify(parsed.receivedIps),
            entities: JSON.stringify(parsed.entities),
            textSummary: parsed.textSummary,
          });
          uploads.push({
            id: saved?.id ?? crypto.randomUUID(),
            caseNumber: req.params.caseNumber,
            originalName: file.originalname,
            format: parsed.format,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            sha256: hash,
            storageUrl: storage.url,
            rowCount: parsed.rowCount,
            headers: parsed.headers,
            preview: parsed.preview,
            receivedIps: parsed.receivedIps,
            entities: parsed.entities,
            textSummary: parsed.textSummary,
            createdAt: saved?.createdAt ?? new Date(),
          });
          await insertAuditEvent({ caseNumber: req.params.caseNumber, action: "evidence.uploaded", actor: "investigator", detail: `${file.originalname} parsed as ${parsed.format}; ${parsed.rowCount} record(s) extracted`, evidenceHash: hash });
        }
      }
      res.status(201).json({ uploads });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Evidence upload failed";
      const status = message.includes("Unsupported evidence") ? 415 : 400;
      res.status(status).json({ message });
    }
  });

  app.get("/api/cases/:caseNumber/apk", async (req, res) => {
    const artifacts = await listApkArtifacts(req.params.caseNumber);
    res.json({ artifacts: artifacts.map(artifact => ({
      ...artifact,
      permissions: JSON.parse(artifact.permissions),
      urls: JSON.parse(artifact.urls),
      ips: JSON.parse(artifact.ips),
      riskFlags: JSON.parse(artifact.riskFlags),
    })) });
  });

  app.post("/api/cases/:caseNumber/apk", (req, res, next) => {
    apkUpload.array("files", 3)(req, res, error => {
      if (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Invalid APK upload" });
        return;
      }
      next();
    });
  }, async (req, res) => {
    try {
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      if (!files.length) { res.status(400).json({ message: "Attach at least one .apk file under the files field." }); return; }
      const artifacts = [];
      for (const file of files) {
        const analysis = analyzeApk(file.buffer);
        const storage = await storagePut(`nidarshan/${safeSegment(req.params.caseNumber)}/apk/${safeSegment(file.originalname)}`, file.buffer, file.mimetype || "application/vnd.android.package-archive");
        const saved = await insertApkArtifact({ caseNumber: req.params.caseNumber, originalName: file.originalname, sha256: analysis.sha256, sizeBytes: file.size, storageKey: storage.key, storageUrl: storage.url, permissions: JSON.stringify(analysis.permissions), urls: JSON.stringify(analysis.urls), ips: JSON.stringify(analysis.ips), riskFlags: JSON.stringify(analysis.riskFlags) });
        await insertAuditEvent({ caseNumber: req.params.caseNumber, action: "apk.analyzed", actor: "investigator", detail: `${file.originalname} triaged with ${analysis.riskFlags.length} risk flag(s)`, evidenceHash: analysis.sha256 });
        artifacts.push({ id: saved?.id ?? crypto.randomUUID(), originalName: file.originalname, storageUrl: storage.url, ...analysis });
      }
      res.status(201).json({ artifacts });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "APK triage failed" });
    }
  });

  app.get("/api/cases/:caseNumber/audit", async (req, res) => {
    const events = await listAuditEvents(req.params.caseNumber);
    res.json({ events });
  });
}
