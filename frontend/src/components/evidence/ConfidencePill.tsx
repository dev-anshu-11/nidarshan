import { ConfidenceTier } from "../../lib/types";
import { AlertTriangle } from "lucide-react";

export function ConfidencePill({ percent, tier }: { percent: number; tier: ConfidenceTier }) {
  const isWeak = percent < 35;
  const colors = {
    strong: 'bg-[#10b981] text-black',
    moderate: 'bg-[#f59e0b] text-black',
    weak: 'bg-[#ef4444] text-white',
  };

  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${colors[tier]} shadow-md`}>
      {isWeak && <AlertTriangle size={10} />}
      <span className="font-display text-[10px] font-bold tracking-wide">{percent}%</span>
    </div>
  );
}
