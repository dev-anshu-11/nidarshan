import React, { useState } from 'react';
import { mockEntities } from "../lib/mockData";
import { EntityChip } from "../components/common/EntityChip";
import { RiskBadge } from "../components/entities/RiskBadge";
import { SourceRow } from "../components/evidence/SourceRow";
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import { colors } from '../lib/colors';

export function Entities() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const sortedEntities = [...mockEntities].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col h-full bg-[#08090f] p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-[20px] font-semibold text-[#f1f3ff]">All Entities</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#141622] border border-[#2a2d42] rounded-md text-[#8891aa] hover:text-[#f1f3ff] transition-colors">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="flex-grow overflow-y-auto bg-[#0f1018] border border-[#1c1e2e] rounded-xl shadow-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1c1e2e] bg-[#141622]">
              <th className="px-6 py-4 font-sans text-[12px] text-[#8891aa] font-medium w-16">Rank</th>
              <th className="px-6 py-4 font-sans text-[12px] text-[#8891aa] font-medium">Entity</th>
              <th className="px-6 py-4 font-sans text-[12px] text-[#8891aa] font-medium">Type</th>
              <th className="px-6 py-4 font-sans text-[12px] text-[#8891aa] font-medium">Risk Score</th>
              <th className="px-6 py-4 font-sans text-[12px] text-[#8891aa] font-medium">Source Files</th>
            </tr>
          </thead>
          <tbody>
            {sortedEntities.map((entity, idx) => {
              const isExpanded = expanded.has(entity.id);
              const rank = idx + 1;
              const riskColor = colors.risk[entity.tier].text;
              const riskBg = colors.risk[entity.tier].bg;

              return (
                <React.Fragment key={entity.id}>
                  <tr 
                    onClick={() => toggle(entity.id)}
                    className="border-b border-[#1c1e2e] hover:bg-[#141622] transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-mono text-[13px] text-[#4a5068]">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {rank}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-display text-[14px] font-medium text-[#f1f3ff]">{entity.value}</span>
                    </td>
                    <td className="px-6 py-4">
                      <EntityChip type={entity.type} value={entity.type} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative w-full max-w-[140px] h-8 rounded border border-[#2a2d42] overflow-hidden flex items-center justify-between px-3" style={{ backgroundColor: riskBg }}>
                        <span className="font-display text-[14px] font-bold z-10" style={{ color: riskColor }}>
                          {Math.round(entity.score)}
                        </span>
                        <RiskBadge tier={entity.tier} />
                        <div 
                          className="absolute left-0 top-0 bottom-0 opacity-20"
                          style={{ width: `${entity.score}%`, backgroundColor: riskColor }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-sans text-[12px] text-[#8891aa]">{entity.sources.length} files</span>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr className="bg-[#08090f] border-b border-[#1c1e2e]">
                      <td colSpan={5} className="p-6">
                        <div className="pl-8 border-l-2 border-[#1c1e2e] flex gap-12">
                          {/* Evidence Breakdown */}
                          <div className="flex-1">
                            <h4 className="font-display text-[12px] font-semibold text-[#8891aa] mb-4 uppercase tracking-wider">Evidence Breakdown</h4>
                            {entity.sources.length > 0 ? (
                              <div className="flex flex-col gap-2">
                                {entity.sources.map((src, i) => <SourceRow key={i} source={src} />)}
                              </div>
                            ) : (
                              <span className="font-sans text-[12px] text-[#4a5068]">No direct source mappings available.</span>
                            )}
                          </div>
                          {/* Linked Entities summary */}
                          <div className="flex-1">
                             <h4 className="font-display text-[12px] font-semibold text-[#8891aa] mb-4 uppercase tracking-wider">Linked To</h4>
                             <div className="flex flex-wrap gap-2">
                               {entity.linkedEntityIds.map(id => {
                                 const linked = mockEntities.find(e => e.id === id);
                                 if (!linked) return null;
                                 return <EntityChip key={linked.id} type={linked.type} value={linked.value} />
                               })}
                             </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
