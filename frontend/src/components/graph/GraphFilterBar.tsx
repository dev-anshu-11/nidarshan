import { X } from 'lucide-react';
import { EntityType, RiskTier } from '../../lib/types';
import { colors } from '../../lib/colors';

interface Props {
  activeTypes: EntityType[];
  activeTiers: RiskTier[];
  onTypeToggle: (type: EntityType) => void;
  onTierToggle: (tier: RiskTier) => void;
  onReset: () => void;
  totalNodes: number;
  visibleNodes: number;
}

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'victim',  label: 'Victim'   },
  { value: 'mule',    label: 'Mule'     },
  { value: 'cashout', label: 'Cash-Out' },
  { value: 'device',  label: 'Device'   },
  { value: 'ip',      label: 'IP'       },
  { value: 'unknown', label: 'Unknown'  },
];

const RISK_TIERS: { value: RiskTier; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high',     label: 'High'     },
  { value: 'medium',   label: 'Medium'   },
  { value: 'low',      label: 'Low'      },
];

export function GraphFilterBar({
  activeTypes,
  activeTiers,
  onTypeToggle,
  onTierToggle,
  onReset,
  totalNodes,
  visibleNodes,
}: Props) {
  const isFiltered = activeTypes.length > 0 || activeTiers.length > 0;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-[#0f1018] border-b border-[#1c1e2e] flex-wrap">
      {/* Entity type pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-display text-[10px] font-semibold text-[#4a5068] uppercase tracking-wider mr-1">
          Type
        </span>
        {ENTITY_TYPES.map(({ value, label }) => {
          const active = activeTypes.includes(value);
          const col = colors.entity[value] ?? '#4a5068';
          return (
            <button
              key={value}
              onClick={() => onTypeToggle(value)}
              className="h-6 px-2.5 rounded-full font-display text-[10px] font-semibold transition-all border"
              style={{
                backgroundColor: active ? `${col}22` : 'transparent',
                borderColor: active ? col : '#2a2d42',
                color: active ? col : '#4a5068',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-[#2a2d42]" />

      {/* Risk tier pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-display text-[10px] font-semibold text-[#4a5068] uppercase tracking-wider mr-1">
          Risk
        </span>
        {RISK_TIERS.map(({ value, label }) => {
          const active = activeTiers.includes(value);
          const col = colors.risk[value].text;
          return (
            <button
              key={value}
              onClick={() => onTierToggle(value)}
              className="h-6 px-2.5 rounded-full font-display text-[10px] font-semibold transition-all border"
              style={{
                backgroundColor: active ? colors.risk[value].bg : 'transparent',
                borderColor: active ? col : '#2a2d42',
                color: active ? col : '#4a5068',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-[#2a2d42]" />

      {/* Node count + reset */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="font-mono text-[11px] text-[#4a5068]">
          {isFiltered ? (
            <><span className="text-[#f1f3ff]">{visibleNodes}</span> / {totalNodes} nodes</>
          ) : (
            <>{totalNodes} nodes</>
          )}
        </span>
        {isFiltered && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 h-6 px-2 rounded-full border border-[#2a2d42] text-[#8891aa] hover:text-[#f1f3ff] hover:border-[#4a5068] transition-colors font-display text-[10px]"
          >
            <X size={10} /> Reset
          </button>
        )}
      </div>
    </div>
  );
}
