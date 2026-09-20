import crypto from "node:crypto";
import path from "node:path";
import { simpleParser } from "mailparser";

export type ParsedEvidence = {
  format: "CSV" | "EML" | "TXT";
  rowCount: number;
  preview: unknown[];
  headers: string[];
  receivedIps: string[];
  entities: { type: "PHONE" | "UPI" | "IP" | "IMEI" | "AMOUNT" | "ACCOUNT" | "NAME"; value: string; confidence: number }[];
  textSummary: string;
};

export type EvidenceUploadResult = ParsedEvidence & {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  storageKey: string;
  storageUrl: string;
};

const patterns = {
  PHONE: /\b[6-9]\d{9}\b/g,
  UPI: /[\w.\-]+@[a-z]{2,}/gi,
  IP: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  IMEI: /\b\d{15}\b/g,
  AMOUNT: /(?:₹|INR|Rs\.?)\s?[\d,]+(?:\.\d{1,2})?/gi,
  ACCOUNT: /\b\d{9,18}\b/g,
};

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function detectDelimiter(line: string) {
  const candidates = [",", "\\t", ";", "|"];
  return candidates.sort((a, b) => line.split(b === "\\t" ? "\t" : b).length - line.split(a === "\\t" ? "\t" : a).length)[0];
}

function parseCsvRows(input: string): { headers: string[]; rows: Record<string, string>[] } {
  const delimiter = detectDelimiter(input.split(/\r?\n/).find(Boolean) ?? ",");
  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (char === '"' && quoted && next === '"') { field += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (!quoted && char === delimiter) { row.push(field.trim()); field = ""; continue; }
    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field.trim()); field = "";
      if (row.some(value => value.length > 0)) records.push(row);
      row = [];
      continue;
    }
    field += char;
  }
  if (field.length || row.length) { row.push(field.trim()); records.push(row); }

  const headers = (records.shift() ?? []).map(header => header.trim() || "column");
  const rows = records.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
  return { headers, rows };
}

function extractFromText(text: string) {
  const entities: ParsedEvidence["entities"] = [];
  for (const [type, pattern] of Object.entries(patterns) as [keyof typeof patterns, RegExp][]) {
    for (const value of unique(text.match(pattern) ?? [])) {
      entities.push({ type, value, confidence: type === "IP" ? 0.98 : 0.95 });
    }
  }
  return entities;
}

export function sha256(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function parseEvidenceFile(file: { originalname: string; mimetype: string; buffer: Buffer }): Promise<ParsedEvidence> {
  const extension = path.extname(file.originalname).toLowerCase();
  if (extension === ".csv" || file.mimetype.includes("csv")) {
    const text = file.buffer.toString("utf8");
    const { headers, rows } = parseCsvRows(text);
    return {
      format: "CSV",
      rowCount: rows.length,
      preview: rows.slice(0, 25),
      headers,
      receivedIps: unique((text.match(patterns.IP) ?? [])),
      entities: extractFromText(text),
      textSummary: `${rows.length} rows parsed from ${headers.length} columns`,
    };
  }

  if (extension === ".eml" || file.mimetype === "message/rfc822" || file.mimetype.includes("email")) {
    const parsed = await simpleParser(file.buffer);
    const receivedHeaders = parsed.headerLines.filter(line => line.key.toLowerCase() === "received").map(line => line.line).join("\n");
    const addressText = (value: unknown) => Array.isArray(value) ? value.map(item => typeof item === "object" && item && "text" in item ? String(item.text) : "").join(", ") : typeof value === "object" && value && "text" in value ? String(value.text) : "";
    const body = typeof parsed.text === "string" ? parsed.text : typeof parsed.html === "string" ? parsed.html : "";
    const from = addressText(parsed.from);
    const to = addressText(parsed.to);
    const text = [from, to, parsed.subject, receivedHeaders, body].filter(Boolean).join("\n");
    const receivedIps = unique(receivedHeaders.match(patterns.IP) ?? []);
    const entities = extractFromText(text);
    return {
      format: "EML",
      rowCount: 1,
      preview: [{
        from,
        to,
        subject: parsed.subject ?? "",
        date: parsed.date?.toISOString() ?? "",
        receivedIps,
        body: body.slice(0, 4000),
      }],
      headers: ["from", "to", "subject", "date", "receivedIps", "body"],
      receivedIps,
      entities,
      textSummary: `Email parsed with ${parsed.attachments.length} attachment(s) and ${receivedIps.length} received IP(s)`,
    };
  }

  if (extension === ".txt" || file.mimetype === "text/plain") {
    const text = file.buffer.toString("utf8");
    // Parse WhatsApp-style chat: [HH:MM, DD/MM/YYYY] Contact: message
    const messagePattern = /^\[?\d{1,2}[:\.]\d{2}/m;
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    const messages = lines.filter(l => messagePattern.test(l));
    const entities = extractFromText(text);
    const preview = messages.slice(0, 30).map(m => ({ message: m }));
    return {
      format: "TXT",
      rowCount: messages.length || lines.length,
      preview,
      headers: ["message"],
      receivedIps: unique(text.match(patterns.IP) ?? []),
      entities,
      textSummary: `Chat export with ${messages.length || lines.length} messages parsed`,
    };
  }

  throw new Error("Unsupported evidence type. Upload a .csv, .eml, or .txt file.");
}
