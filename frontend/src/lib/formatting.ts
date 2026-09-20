export function formatScore(score: number): string {
  return Math.round(score).toString();
}

export function truncateHash(hash: string, length = 12): string {
  if (!hash) return '';
  return hash.substring(0, length) + '...';
}

export function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return isoString;
  }
}

export function getRiskTier(score: number): import('./types').RiskTier {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

export function getConfidenceTier(percent: number): import('./types').ConfidenceTier {
  if (percent >= 70) return 'strong';
  if (percent >= 35) return 'moderate';
  return 'weak';
}
