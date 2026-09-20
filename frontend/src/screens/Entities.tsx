import React, { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useCase } from '../lib/CaseContext';
import { EntityChip } from "../components/common/EntityChip";
import { RiskBadge } from "../components/entities/RiskBadge";
import { SourceRow } from "../components/evidence/SourceRow";
import { ChevronDown, ChevronRight, Download, UploadCloud, AlertCircle, Search } from 'lucide-react';
import { colors } from '../lib/colors';

type TierKey = 'critical' | 'high' | 'medium' | 'low';

function mapTier(tier: string): TierKey {
  const t = tier.toLowerCase();
  if (t === 'critical') return 'critical';
  if (t === 'high') return 'high';
  if (t === 'medium') return 'medium';
  return 'low';
}

function mapEntityType(type: string): string {
  const t = type.toLowerCase();
  if (t === 'victim') return 'victim';
  if (t === 'mule' || t === 'account') return 'mule';
  if (t === 'cashout') return 'cashout';
  if (t === 'device' || t === 'imei') return 'device';
  if (t === 'ip' || t === 'ip_address') return 'ip';
  return 'unknown';
}

export function Entities() {
  const caseCtx = useCase();
  const [, setLocation] = useLocation();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<string>('ALL');

  const entities = useMemo(() => {
    return (caseCtx.analysis?.entities ?? []).map(e => ({
      ...e,
      mappedTier: mapTier(e.tier),
      mappedType: mapEntityType(e.type),
      linkedIds: (caseCtx.analysis?.links ?? [])
        .filter(l => l.from === e.id || l.to === e.id)
        .map(l => l.from === e.id ? l.to : l.from),
    }));
  }, [caseCtx.analysis]);

  const filteredEntities = useMemo(() => {
    let result = [...entities].sort((a, b) => b.score - a.score);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e => e.value.toLowerCase().includes(q) || e.type.toLowerCase().includes(q));
    }
    if (filterTier !== 'ALL') {
      result = result.filter(e => e.tier === filterTier);
    }
    return result;
  }, [entities, search, filterTier]);

  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const exportCsv = () => {
    const headers = ['Rank', 'Value', 'Type', 'Score', 'Tier', 'Source Files', 'Reasons'];
    const rows = filteredEntities.map((e, i) => [
      i + 1,
      e.value,
      e.type,
      e.score,
      e.tier,
      e.sourceFiles.join('; '),
      e.reasons.join('; '),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nidarshan-entities-${caseCtx.caseNumber || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Empty state
  if (!caseCtx.analysis || entities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="w-16 h-16 rounded-full bg-[#141622] border border-[#2a2d42] flex items-center justify-center">
          <AlertCircle size={28} className="text-[#4a5068]" />
        </div>
        <h2 className="font-display text-[20px] font-semibold text-[#f1f3ff]">No Entities Found</h2>
        <p className="font-sans text-[14px] text-[#8891aa] text-center max-w-md">
          Upload and analyze evidence files to extract entities.
        </p>
        <button onClick={() => setLocation('/upload')} className="flex items-center gap-2 px-6 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-display text-[14px] font-semibold rounded-lg transition-colors">
          <UploadCloud size={18} /> Upload Evidence
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#08090f] p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-[20px] font-semibold text-[#f1f3ff]">All Entities</h2>
          <p className="font-sans text-[12px] text-[#8891aa] mt-1">{filteredEntities.length} of {entities.length} entities</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2 bg-[#141622] border border-[#2a2d42] rounded-md text-[#8891aa] hover:text-[#f1f3ff] transition-colors">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-[300px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5068]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search entities..."
            className="w-full bg-[#0f1018] border border-[#1c1e2e] rounded-md pl-9 pr-4 py-2 text-[13px] text-[#f1f3ff] placeholder:text-[#4a5068] outline-none focus:border-[#7c3aed] transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(t => (
            <button
              key={t}
              onClick={() => setFilterTier(t)}
              className={`px-3 py-1.5 rounded-full font-display text-[11px] font-medium tracking-wide border transition-colors ${
                filterTier === t ? 'bg-[#1a103a] text-[#7c3aed] border-[#3b1f80]' : 'bg-[#141622] text-[#8891aa] border-[#2a2d42] hover:border-[#4a5068]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
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
            {filteredEntities.map((entity, idx) => {
              const isExpanded = expanded.has(entity.id);
              const rank = idx + 1;
              const riskColor = colors.risk[entity.mappedTier].text;
              const riskBg = colors.risk[entity.mappedTier].bg;

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
                      <EntityChip type={entity.mappedType as any} value={entity.type} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative w-full max-w-[140px] h-8 rounded border border-[#2a2d42] overflow-hidden flex items-center justify-between px-3" style={{ backgroundColor: riskBg }}>
                        <span className="font-display text-[14px] font-bold z-10" style={{ color: riskColor }}>
                          {Math.round(entity.score)}
                        </span>
                        <RiskBadge tier={entity.mappedTier} />
                        <div
                          className="absolute left-0 top-0 bottom-0 opacity-20"
                          style={{ width: `${entity.score}%`, backgroundColor: riskColor }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-sans text-[12px] text-[#8891aa]">{entity.sourceFiles.length} file(s)</span>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-[#08090f] border-b border-[#1c1e2e]">
                      <td colSpan={5} className="p-6">
                        <div className="pl-8 border-l-2 border-[#1c1e2e] flex gap-12">
                          {/* Evidence Breakdown */}
                          <div className="flex-1">
                            <h4 className="font-display text-[12px] font-semibold text-[#8891aa] mb-4 uppercase tracking-wider">Evidence Reasons</h4>
                            {entity.reasons.length > 0 ? (
                              <div className="flex flex-col gap-2">
                                {entity.reasons.map((reason, i) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] mt-1.5 shrink-0" />
                                    <span className="font-sans text-[12px] text-[#8891aa]">{reason}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="font-sans text-[12px] text-[#4a5068]">No specific reasons available.</span>
                            )}
                          </div>
                          {/* Source Files */}
                          <div className="flex-1">
                            <h4 className="font-display text-[12px] font-semibold text-[#8891aa] mb-4 uppercase tracking-wider">Source Files</h4>
                            <div className="flex flex-wrap gap-2">
                              {entity.sourceFiles.map((f, i) => (
                                <span key={i} className="px-2.5 py-1 bg-[#141622] border border-[#2a2d42] rounded text-[11px] font-mono text-[#8891aa]">{f}</span>
                              ))}
                            </div>
                          </div>
                          {/* Linked Entities */}
                          <div className="flex-1">
                            <h4 className="font-display text-[12px] font-semibold text-[#8891aa] mb-4 uppercase tracking-wider">Linked To</h4>
                            <div className="flex flex-wrap gap-2">
                              {entity.linkedIds.map(id => {
                                const linked = entities.find(e => e.id === id);
                                if (!linked) return null;
                                return <EntityChip key={linked.id} type={linked.mappedType as any} value={linked.value} />;
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
