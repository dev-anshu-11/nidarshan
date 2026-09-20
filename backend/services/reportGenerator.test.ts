import { describe, expect, it } from "vitest";
import { buildReportData, generatePdfReport } from "./reportGenerator";
import type { EvidenceFile } from "./drizzle/schema";

describe("reportGenerator", () => {
  it("creates structured report data and a PDF buffer", async () => {
    const file = { id: 1, caseNumber: "KRN-TEST", originalName: "sample.csv", format: "CSV", mimeType: "text/csv", sizeBytes: 10, sha256: "a".repeat(64), storageKey: "sample.csv", storageUrl: "/manus-storage/sample.csv", rowCount: 2, headers: "[]", preview: "[]", receivedIps: "[]", entities: JSON.stringify([{ type: "UPI", value: "victim@paytm", confidence: 0.95 }]), textSummary: "2 rows parsed", createdAt: new Date() } as EvidenceFile;
    const report = buildReportData("KRN-TEST", [file], 1);
    const pdf = await generatePdfReport(report);
    expect(report.summary.files).toBe(1);
    expect(report.summary.apkArtifacts).toBe(1);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
