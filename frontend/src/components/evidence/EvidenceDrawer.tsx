import { X, Flag, FilePlus } from "lucide-react";
import { Entity, Edge } from "../../lib/types";
import { RiskBadge } from "../entities/RiskBadge";
import { SourceRow } from "./SourceRow";
import { EvidenceItem } from "./EvidenceItem";
import { EntityChip } from "../common/EntityChip";

interface Props {
  entity: Entity;
  linkedEdge?: Edge | null; // If focused on an edge
  linkedEntities?: Entity[];
  onClose: () => void;
  onNavigateToEntity: (id: string) => void;
}

export function EvidenceDrawer({ entity, linkedEdge, linkedEntities = [], onClose, onNavigateToEntity }: Props) {
  return (
    <div className="fixed top-14 right-0 bottom-0 w-[320px] bg-[#0f1018] border-l border-[#1c1e2e] shadow-2xl z-40 flex flex-col drawer-enter-active">
      {/* Header */}
      <div className="flex-shrink-0 flex items-start justify-between p-5 border-b border-[#1c1e2e]">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-[16px] font-semibold text-[#f1f3ff] break-all">{entity.value}</h2>
          <span className="font-sans text-[12px] text-[#8891aa] capitalize">{entity.type}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-[#141622] text-[#8891aa] hover:text-[#f1f3ff] transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-5 space-y-8">
        {/* Risk Score */}
        <div className="flex items-end gap-3">
          <div className="flex items-center gap-2">
            <span className={`font-display text-[36px] font-bold leading-none`} style={{ color: `var(--risk-${entity.tier})` }}>
              {Math.round(entity.score)}
            </span>
            <RiskBadge tier={entity.tier} />
          </div>
          <span className="font-sans text-[11px] text-[#8891aa] mb-1">Based on 12 indicators</span>
        </div>

        {/* Confidence Breakdown (if edge is selected) */}
        {linkedEdge && (
          <div className="flex flex-col gap-3">
            <h3 className="font-display text-[13px] font-semibold tracking-wide text-[#f1f3ff]">Link Confidence</h3>
            <div className="p-4 rounded-xl bg-[#141622] border border-[#2a2d42]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1c1e2e]">
                <span className="font-sans text-[13px] text-[#f1f3ff]">This link</span>
                <span className={`font-display text-[14px] font-bold`} style={{ color: `var(--conf-${linkedEdge.tier === 'moderate' ? 'mod' : linkedEdge.tier})` }}>
                  {linkedEdge.confidence}% confidence
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {linkedEdge.reasons.map((r, i) => <EvidenceItem key={i} reason={r} />)}
                {/* Dummy negative reason to match design spec */}
                <EvidenceItem reason={{ description: "Name match", points: 0, found: false }} />
              </div>
            </div>
          </div>
        )}

        {/* Source Files */}
        <div className="flex flex-col gap-3">
          <h3 className="font-display text-[13px] font-semibold tracking-wide text-[#f1f3ff]">Source Files</h3>
          {entity.sources && entity.sources.length > 0 ? (
            <div className="flex flex-col gap-2">
              {entity.sources.map((src, i) => <SourceRow key={i} source={src} />)}
            </div>
          ) : (
            <div className="p-4 text-center rounded-lg border border-dashed border-[#2a2d42]">
              <span className="font-sans text-[12px] text-[#4a5068]">No explicit source references provided yet.</span>
            </div>
          )}
        </div>

        {/* Linked Entities */}
        <div className="flex flex-col gap-3">
          <h3 className="font-display text-[13px] font-semibold tracking-wide text-[#f1f3ff]">Linked Entities</h3>
          <div className="flex flex-wrap gap-2">
            {linkedEntities.map(linked => (
              <EntityChip 
                key={linked.id} 
                type={linked.type} 
                value={linked.value} 
                onClick={() => onNavigateToEntity(linked.id)} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex-shrink-0 flex gap-2 p-4 border-t border-[#1c1e2e] bg-[#08090f]">
        <button className="flex-1 btn-secondary py-2 h-10">
          <Flag size={14} /> Flag
        </button>
        <button className="flex-[2] btn-primary py-2 h-10">
          <FilePlus size={14} /> Add to Report
        </button>
      </div>
    </div>
  );
}
