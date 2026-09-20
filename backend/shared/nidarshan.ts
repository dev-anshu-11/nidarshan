export type RiskTier = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type NodeType = "VICTIM" | "MULE" | "CASHOUT" | "DEVICE" | "IP_ADDRESS" | "ACCOUNT" | "PHONE";
export type Tone = "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "slate";

export type EvidenceRecord = {
  id: string;
  source: "UPI" | "CDR" | "IPDR" | "CHAT" | "CSV" | "EML";
  title: string;
  detail: string;
  timestamp: string;
  confidence: number;
  accent: Tone;
};

export type CaseEntity = {
  id: string;
  value: string;
  type: NodeType;
  risk: number;
  tier: RiskTier;
  summary: string;
  reasons: string[];
  sourceCount: number;
  firstSeen: string;
  lastSeen: string;
  tags: string[];
};

export type NetworkNode = {
  id: string;
  label: string;
  type: NodeType;
  risk: number;
  tier: RiskTier;
  x: number;
  y: number;
  subtitle: string;
};

export type NetworkEdge = {
  id: string;
  from: string;
  to: string;
  label: string;
  amount?: number;
  timestamp: string;
  risk: Tone;
  evidenceId: string;
};

export type TimelineEvent = {
  id: string;
  timestamp: string;
  timeLabel: string;
  title: string;
  detail: string;
  tag: string;
  tone: Tone;
  relatedEntity: string;
};

export type CasePayload = {
  summary: {
    files: number;
    entities: number;
    links: number;
    critical: number;
    high: number;
    totalAmount: number;
    analysisDuration: string;
  };
  sourceFiles: { name: string; type: string; rows: number; hash: string; status: string }[];
  entities: CaseEntity[];
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  timeline: TimelineEvent[];
  evidence: EvidenceRecord[];
  alerts: { title: string; detail: string; severity: RiskTier; timestamp: string }[];
  recommendations: string[];
  generatedAt: string;
};

export type CaseSnapshot = {
  id: number;
  caseNumber: string;
  name: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  payload: CasePayload;
};
