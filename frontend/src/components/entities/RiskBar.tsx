import { RiskTier } from "../../lib/types";
import { colors } from "../../lib/colors";

export function RiskBar({ score, tier }: { score: number; tier: RiskTier }) {
  const color = colors.risk[tier].text;
  
  return (
    <div className="absolute bottom-0 left-0 h-[2px] bg-[#1c1e2e] w-full">
      <div 
        className="h-full transition-all duration-500 ease-out" 
        style={{ width: `${score}%`, backgroundColor: color }}
      />
    </div>
  );
}
