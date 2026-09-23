import crypto from "node:crypto";
import type { EvidenceFile } from "../drizzle/schema";

export type IntelligenceEntity = {
  id: string;
  value: string;
  type: string;
  sourceFiles: string[];
  score: number;
  tier: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
};

export type IntelligenceLink = {
  id: string;
  from: string;
  to: string;
  linkType: string;
  weight: number;
  sources: string[];
};

function tier(score: number): IntelligenceEntity["tier"] {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "LOW";
}

function parseJson<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export function buildIntelligence(files: EvidenceFile[]) {
  const byValue = new Map<string, { type: string; files: Set<string>; confidence: number; values: string[] }>();
  const sourceEntities = files.map(file => ({ file, entities: parseJson<{ type: string; value: string; confidence: number }[]>(file.entities, []) }));

  for (const { file, entities } of sourceEntities) {
    for (const entity of entities) {
      const key = `${entity.type}:${entity.value.toLowerCase()}`;
      const current = byValue.get(key) ?? { type: entity.type, files: new Set<string>(), confidence: entity.confidence, values: [] };
      current.files.add(file.originalName);
      current.confidence = Math.max(current.confidence, entity.confidence);
      if (!current.values.includes(entity.value)) current.values.push(entity.value);
      byValue.set(key, current);
    }
  }

  const entities: IntelligenceEntity[] = Array.from(byValue.entries()).map(([key, value]) => {
    const [type] = key.split(":");
    const sourceCount = value.files.size;
    const reasons: string[] = [];
    let score = Math.round(value.confidence * 25);
    if (sourceCount >= 2) { score += 25; reasons.push(`Entity appears across ${sourceCount} independent evidence files`); }
    if (type === "IP") { score += 15; reasons.push("Shared network infrastructure can connect otherwise separate records"); }
    if (type === "UPI" || type === "ACCOUNT") { score += 15; reasons.push("Financial endpoint is suitable for transaction-flow correlation"); }
    if (type === "AMOUNT") { score += 5; reasons.push("Currency amount is available for transaction timeline matching"); }
    if (!reasons.length) reasons.push("Entity extracted from uploaded evidence and retained with source provenance");
    score = Math.min(100, score);
    return { id: `entity-${crypto.createHash("md5").update(key).digest("hex").slice(0, 12)}`, value: value.values[0] ?? key, type, sourceFiles: Array.from(value.files), score, tier: tier(score), reasons };
  }).sort((a, b) => b.score - a.score);

  const links: IntelligenceLink[] = [];
  for (const { file, entities: fileEntities } of sourceEntities) {
    const unique = Array.from(new Map(fileEntities.map(entity => [`${entity.type}:${entity.value.toLowerCase()}`, entity])).values()).slice(0, 80);
    for (let index = 0; index < unique.length; index += 1) {
      const from = entities.find(entity => entity.value.toLowerCase() === unique[index]?.value.toLowerCase() && entity.type === unique[index]?.type);
      const to = entities.find(entity => entity.value.toLowerCase() === unique[index + 1]?.value.toLowerCase() && entity.type === unique[index + 1]?.type);
      if (from && to && from.id !== to.id) links.push({ id: `link-${links.length + 1}`, from: from.id, to: to.id, linkType: `${from.type}→${to.type}`, weight: Math.max(from.score, to.score), sources: [file.originalName] });
    }
  }

  const timeline = files.flatMap(file => [{ file: file.originalName, timestamp: file.createdAt, summary: file.textSummary }]).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return { entities, links, timeline, fileCount: files.length, entityCount: entities.length, linkCount: links.length };
}
