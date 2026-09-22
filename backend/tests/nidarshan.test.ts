import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { createDemoPayload, DEMO_CASE_NUMBER } from "../services/nidarshanData";
import type { TrpcContext } from "../_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("NIDARSHAN demo investigation", () => {
  it("contains an explainable victim-to-cash-out chain", () => {
    const payload = createDemoPayload();
    const transferPath = payload.edges.filter(edge => edge.amount).map(edge => `${edge.from}->${edge.to}`);

    expect(payload.summary.entities).toBeGreaterThan(0);
    expect(payload.summary.critical).toBe(3);
    expect(transferPath).toEqual(expect.arrayContaining([
      "victim-upi->mule-01",
      "mule-01->mule-02",
      "mule-01->cashout",
      "account-4498->cashout",
    ]));
  });

  it("keeps high-risk entities linked to plain-English reasons and source evidence", () => {
    const payload = createDemoPayload();
    const critical = payload.entities.filter(entity => entity.tier === "CRITICAL");

    expect(critical.length).toBeGreaterThanOrEqual(3);
    expect(critical.every(entity => entity.risk >= 75 && entity.reasons.length > 0)).toBe(true);
    expect(payload.evidence.every(record => record.confidence >= 80 && record.timestamp.length > 0)).toBe(true);
  });

  it("serves the seeded case through the public tRPC contract", async () => {
    const caller = appRouter.createCaller(createContext());
    const snapshot = await caller.cases.demo();

    expect(snapshot.caseNumber).toBe(DEMO_CASE_NUMBER);
    expect(snapshot.payload.timeline.length).toBeGreaterThan(5);
    expect(snapshot.payload.sourceFiles.map(file => file.type)).toEqual(expect.arrayContaining(["UPI ledger", "Call detail record", "IP session log", "Chat export"]));
  });
});
