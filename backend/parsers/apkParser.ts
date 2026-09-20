import AdmZip from "adm-zip";
import { sha256 } from "./evidenceParser";

export type ApkAnalysis = {
  sha256: string;
  sizeBytes: number;
  entryCount: number;
  permissions: string[];
  urls: string[];
  ips: string[];
  riskFlags: string[];
  manifestFound: boolean;
};

const permissionPattern = /android\.permission\.([A-Z0-9_]+)/g;
const urlPattern = /https?:\/\/[^\s"'<>]+/gi;
const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const riskyPermissions = new Set(["READ_SMS", "RECEIVE_SMS", "SEND_SMS", "READ_CONTACTS", "ACCESS_FINE_LOCATION", "RECORD_AUDIO", "SYSTEM_ALERT_WINDOW", "REQUEST_INSTALL_PACKAGES"]);

function unique(values: string[]) { return Array.from(new Set(values)); }

export function analyzeApk(buffer: Buffer): ApkAnalysis {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  let text = "";
  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const name = entry.entryName.toLowerCase();
    if (name.includes("manifest") || name.endsWith(".xml") || name.endsWith(".json") || name.endsWith(".txt") || name.endsWith(".js") || name.endsWith(".smali")) {
      try { text += `\n${entry.getData().subarray(0, 1024 * 1024).toString("utf8")}`; } catch { /* ignore unreadable binary entry */ }
    }
  }
  const permissions = unique(Array.from(text.matchAll(permissionPattern), match => match[1]));
  const urls = unique(text.match(urlPattern) ?? []);
  const ips = unique(text.match(ipPattern) ?? []);
  const riskFlags = permissions.filter(permission => riskyPermissions.has(permission)).map(permission => `Dangerous permission: ${permission}`);
  if (urls.some(url => /login|verify|otp|bank|upi|wallet/i.test(url))) riskFlags.push("Potential phishing or credential-collection URL");
  if (ips.length) riskFlags.push(`${ips.length} hardcoded IP address${ips.length === 1 ? "" : "es"} found in package contents`);
  if (!entries.some(entry => entry.entryName.toLowerCase() === "androidmanifest.xml")) riskFlags.push("AndroidManifest.xml not found or unreadable");
  return { sha256: sha256(buffer), sizeBytes: buffer.length, entryCount: entries.length, permissions, urls, ips, riskFlags, manifestFound: entries.some(entry => entry.entryName.toLowerCase() === "androidmanifest.xml") };
}
