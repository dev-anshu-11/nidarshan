import { Entity } from "../../lib/types";
import { RiskBadge } from "./RiskBadge";
import { RiskBar } from "./RiskBar";
import { User, CreditCard, Smartphone, Shield, Hash, MapPin } from "lucide-react";
import { colors } from "../../lib/colors";

const TypeIcon = ({ type }: { type: Entity['type'] }) => {
  const props = { size: 14 };
  switch (type) {
    case 'victim': return <User {...props} color={colors.entity.victim} />;
    case 'mule': return <Shield {...props} color={colors.entity.mule} />;
    case 'cashout': return <CreditCard {...props} color={colors.entity.cashout} />;
    case 'device': return <Smartphone {...props} color={colors.entity.device} />;
    case 'ip': return <MapPin {...props} color={colors.entity.ip} />;
    default: return <Hash {...props} color={colors.entity.unknown} />;
  }
};

export function EntityRow({ entity, isSelected, onClick }: { entity: Entity; isSelected: boolean; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`relative h-[52px] flex items-center px-4 gap-3 cursor-pointer border-b border-[#1c1e2e] transition-colors
        ${isSelected ? 'bg-[#1a103a]' : 'hover:bg-[#141622]'}
      `}
    >
      <div className="flex-shrink-0">
        <TypeIcon type={entity.type} />
      </div>
      
      <div className="flex-grow overflow-hidden">
        <div className="font-display text-[13px] font-medium text-[#f1f3ff] truncate">
          {entity.value}
        </div>
      </div>
      
      <div className="flex-shrink-0">
        <RiskBadge tier={entity.tier} />
      </div>
      
      <RiskBar score={entity.score} tier={entity.tier} />
    </div>
  );
}
