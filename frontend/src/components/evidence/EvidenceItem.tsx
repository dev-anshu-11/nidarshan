import { CheckCircle2, Circle } from 'lucide-react';
import { EvidenceReason } from '../../lib/types';

export function EvidenceItem({ reason }: { reason: EvidenceReason }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        {reason.found ? (
          <CheckCircle2 size={14} className="text-[#10b981]" />
        ) : (
          <Circle size={14} className="text-[#4a5068]" />
        )}
        <span className={`font-sans text-[12px] ${reason.found ? 'text-[#f1f3ff]' : 'text-[#8891aa]'}`}>
          {reason.description}
        </span>
      </div>
      <span className={`font-mono text-[12px] ${reason.found ? 'text-[#f59e0b]' : 'text-[#4a5068]'}`}>
        {reason.found ? `+${reason.points}pts` : 'not found'}
      </span>
    </div>
  );
}
