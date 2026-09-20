import { Entity, Edge } from "./types";

export const mockEntities: Entity[] = [
  { id: "e1", value: "9876543210", type: "victim", score: 10, tier: "low", sources: [], linkedEntityIds: ["e2", "e3"] },
  { id: "e2", value: "9811234567", type: "mule", score: 85, tier: "critical", sources: [], linkedEntityIds: ["e1", "e4", "e5"] },
  { id: "e3", value: "ramesh.sharma99@okaxis", type: "victim", score: 5, tier: "low", sources: [], linkedEntityIds: ["e1"] },
  { id: "e4", value: "358234091674523", type: "device", score: 90, tier: "critical", sources: [], linkedEntityIds: ["e2", "e6"] },
  { id: "e5", value: "103.45.67.89", type: "ip", score: 65, tier: "high", sources: [], linkedEntityIds: ["e2", "e6"] },
  { id: "e6", value: "9900112233", type: "mule", score: 82, tier: "critical", sources: [], linkedEntityIds: ["e4", "e5", "e7"] },
  { id: "e7", value: "cashout.mule1@paytm", type: "mule", score: 70, tier: "high", sources: [], linkedEntityIds: ["e6", "e8"] },
  { id: "e8", value: "9811223344", type: "mule", score: 60, tier: "high", sources: [], linkedEntityIds: ["e7", "e9"] },
  { id: "e9", value: "182.72.114.56", type: "ip", score: 40, tier: "medium", sources: [], linkedEntityIds: ["e8", "e10"] },
  { id: "e10", value: "9922334455", type: "cashout", score: 88, tier: "critical", sources: [], linkedEntityIds: ["e9", "e11"] },
  { id: "e11", value: "final.hop3@ybl", type: "cashout", score: 92, tier: "critical", sources: [], linkedEntityIds: ["e10"] },
];

export const mockEdges: Edge[] = [
  { id: "edge1", source: "e2", target: "e1", confidence: 95, tier: "strong", reasons: [{description: "Spoofed call CDR match", points: 40, found: true}] },
  { id: "edge2", source: "e2", target: "e4", confidence: 99, tier: "strong", reasons: [] },
  { id: "edge3", source: "e6", target: "e4", confidence: 99, tier: "strong", reasons: [{description: "Shared IMEI", points: 80, found: true}] },
  { id: "edge4", source: "e2", target: "e5", confidence: 60, tier: "moderate", reasons: [] },
  { id: "edge5", source: "e6", target: "e5", confidence: 60, tier: "moderate", reasons: [{description: "Shared IP", points: 30, found: true}] },
  { id: "edge6", source: "e1", target: "e3", confidence: 100, tier: "strong", reasons: [] },
  { id: "edge7", source: "e6", target: "e7", confidence: 100, tier: "strong", reasons: [] },
  { id: "edge8", source: "e3", target: "e7", confidence: 90, tier: "strong", reasons: [{description: "UPI transfer found", points: 50, found: true}] },
  { id: "edge9", source: "e7", target: "e8", confidence: 85, tier: "strong", reasons: [{description: "UPI rapid forward", points: 45, found: true}] },
  { id: "edge10", source: "e8", target: "e9", confidence: 70, tier: "strong", reasons: [] },
  { id: "edge11", source: "e10", target: "e9", confidence: 70, tier: "strong", reasons: [{description: "Shared IP hotspot", points: 25, found: true}] },
  { id: "edge12", source: "e8", target: "e10", confidence: 85, tier: "strong", reasons: [{description: "UPI rapid forward", points: 45, found: true}] },
  { id: "edge13", source: "e10", target: "e11", confidence: 100, tier: "strong", reasons: [] },
];
