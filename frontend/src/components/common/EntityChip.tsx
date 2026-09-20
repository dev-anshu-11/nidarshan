import { EntityType } from "../../lib/types";
import { colors } from "../../lib/colors";

export function EntityChip({ type, value, onClick }: { type: EntityType, value: string, onClick?: () => void }) {
  const color = colors.entity[type] || colors.entity.unknown;
  
  return (
    <button 
      onClick={onClick}
      className="flex items-center px-3 h-6 rounded-full border border-opacity-20 hover:border-opacity-100 transition-colors bg-[#141622]"
      style={{ borderColor: color }}
    >
      <span className="font-mono text-[11px] truncate max-w-[120px]" style={{ color }}>{value}</span>
    </button>
  );
}
