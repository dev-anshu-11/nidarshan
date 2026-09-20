import { RiskTier } from "../../lib/types";

export function RiskBadge({ tier }: { tier: RiskTier }) {
  const badgeConfig = {
    critical: { label: "CR", dot: "bg-[#dc2626]", text: "text-[#dc2626]" },
    high: { label: "HI", dot: "bg-[#f97316]", text: "text-[#f97316]" },
    medium: { label: "MD", dot: "bg-[#eab308]", text: "text-[#eab308]" },
    low: { label: "LO", dot: "bg-[#10b981]", text: "text-[#10b981]" },
  };

  const config = badgeConfig[tier];

  return (
    <div className="flex items-center gap-1.5 h-5 px-2 rounded-full border border-[#2a2d42] bg-[#141622]">
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot} ${tier === 'critical' ? 'animate-pulse' : ''}`} />
      <span className={`font-display text-[11px] font-medium tracking-widest ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}
