import { describe, expect, it } from "vitest";
import { buildIntelligence } from "./intelligence";
import type { EvidenceFile } from "./drizzle/schema";

function file(id: number, name: string, entities: unknown[]): EvidenceFile {
  return { id, caseNumber: "KRN-TEST", originalName: name, format: "CSV", mimeType: "text/csv", sizeBytes: 20, sha256: `${id}`.repeat(64), storageKey: name, storageUrl: `/manus-storage/${name}`, rowCount: 1, headers: "[]", preview: "[]", receivedIps: "[]", entities: JSON.stringify(entities), textSummary: "parsed", createdAt: new Date("2026-10-01T10:00:00Z") };
}

describe("intelligence", () => {
  it("correlates repeated entities across files and explains risk", () => {
    const result = buildIntelligence([
      file(1, "upi.csv", [{ type: "UPI", value: "9876543210@paytm", confidence: 0.95 }, { type: "IP", value: "103.21.244.17", confidence: 0.98 }]),
      file(2, "ipdr.csv", [{ type: "UPI", value: "9876543210@paytm", confidence: 0.95 }, { type: "IP", value: "103.21.244.17", confidence: 0.98 }]),
    ]);
    expect(result.entityCount).toBe(2);
    expect(result.entities[0]?.sourceFiles).toHaveLength(2);
    expect(result.entities[0]?.reasons.join(" ")).toContain("independent evidence files");
    expect(result.linkCount).toBeGreaterThan(0);
  });
});
