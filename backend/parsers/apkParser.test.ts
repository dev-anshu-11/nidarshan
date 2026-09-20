import { describe, expect, it } from "vitest";
import AdmZip from "adm-zip";
import { analyzeApk } from "./apkParser";

describe("apkParser", () => {
  it("finds dangerous permissions, phishing URLs, and hardcoded IPs", () => {
    const zip = new AdmZip();
    zip.addFile("AndroidManifest.xml", Buffer.from("android.permission.READ_SMS android.permission.SEND_SMS"));
    zip.addFile("assets/config.txt", Buffer.from("https://verify-bank.example/otp 103.21.244.17"));
    const result = analyzeApk(zip.toBuffer());
    expect(result.manifestFound).toBe(true);
    expect(result.permissions).toEqual(expect.arrayContaining(["READ_SMS", "SEND_SMS"]));
    expect(result.urls).toContain("https://verify-bank.example/otp");
    expect(result.ips).toContain("103.21.244.17");
    expect(result.riskFlags.length).toBeGreaterThanOrEqual(3);
  });
});
