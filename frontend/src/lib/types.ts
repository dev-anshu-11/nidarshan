export type RiskTier = 'critical' | 'high' | 'medium' | 'low';
export type ConfidenceTier = 'strong' | 'moderate' | 'weak';
export type EntityType = 'victim' | 'mule' | 'cashout' | 'device' | 'ip' | 'unknown';

export interface Entity {
  id: string;
  value: string;
  type: EntityType;
  score: number;
  tier: RiskTier;
  sources: SourceReference[];
  linkedEntityIds: string[];
}

export interface SourceReference {
  filename: string;
  rows: string;
  hash: string;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  confidence: number;
  tier: ConfidenceTier;
  reasons: EvidenceReason[];
}

export interface EvidenceReason {
  description: string;
  points: number;
  found: boolean;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  icon: string;
  description: string;
  tags: string[];
  isRapidSequence?: boolean;
}
