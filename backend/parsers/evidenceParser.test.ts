import { describe, expect, it } from "vitest";
import { parseEvidenceFile, sha256 } from "./evidenceParser";

describe("evidenceParser", () => {
  it("parses CSV headers and rows while extracting fraud entities", async () => {
    const csv = [
      "caller_phone,receiver_upi,amount,ip_address",
      "9876543210,9876543210@paytm,\"â‚¹50,000\",103.21.244.17",
      "9820477108,receiver@okaxis,INR 5000,103.21.244.18",
    ].join("\n");
    const result = await parseEvidenceFile({ originalname: "sample.csv", mimetype: "text/csv", buffer: Buffer.from(csv) });

    expect(result.format).toBe("CSV");
    expect(result.headers).toEqual(["caller_phone", "receiver_upi", "amount", "ip_address"]);
    expect(result.rowCount).toBe(2);
    expect(result.preview[0]).toMatchObject({ caller_phone: "9876543210", receiver_upi: "9876543210@paytm" });
    expect(result.receivedIps).toEqual(["103.21.244.17", "103.21.244.18"]);
    expect(result.entities).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "PHONE", value: "9876543210" }),
      expect.objectContaining({ type: "UPI", value: "9876543210@paytm" }),
      expect.objectContaining({ type: "IP", value: "103.21.244.17" }),
    ]));
  });

  it("parses EML headers, body text, and Received IP addresses", async () => {
    const eml = [
      "From: recruiter@example.com",
      "To: victim@example.com",
      "Subject: Urgent account request",
      "Date: Mon, 12 Oct 2026 14:00:00 +0530",
      "Received: from relay.example (103.21.244.17) by mx.example; Mon, 12 Oct 2026 14:00:00 +0530",
      "Content-Type: text/plain; charset=utf-8",
      "",
      "OTP bhej do jaldi. Transfer â‚¹50,000 to 9876543210@paytm.",
    ].join("\r\n");
    const result = await parseEvidenceFile({ originalname: "message.eml", mimetype: "message/rfc822", buffer: Buffer.from(eml) });

    expect(result.format).toBe("EML");
    expect(result.rowCount).toBe(1);
    expect(result.receivedIps).toContain("103.21.244.17");
    expect(result.preview[0]).toMatchObject({ from: "recruiter@example.com", to: "victim@example.com" });
    expect(result.entities).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "UPI", value: "9876543210@paytm" }),
      expect.objectContaining({ type: "IP", value: "103.21.244.17" }),
    ]));
  });

  it("computes a stable SHA-256 file hash", () => {
    expect(sha256(Buffer.from("nidarshan"))).toBe("cd0ac9f79373244e46dab87e9cb099bffcdea20f2aca0a98461f1777a7001dbc");
  });
});
