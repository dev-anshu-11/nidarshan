import { useState, useMemo } from 'react';
import { Entity } from "../../lib/types";
import { EntityRow } from "./EntityRow";
import { Search } from "lucide-react";

export function EntityList({ entities, selectedId, onSelect }: { entities: Entity[], selectedId: string | null, onSelect: (id: string) => void }) {
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filters = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const filtered = useMemo(() => {
    let result = entities;
    if (filter !== 'ALL') {
      result = result.filter(e => e.tier.toUpperCase() === filter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(e => e.value.toLowerCase().includes(s));
    }
    return result.sort((a, b) => b.score - a.score);
  }, [entities, filter, search]);

  return (
    <div className="flex flex-col h-full bg-[#0f1018] border-r border-[#1c1e2e]">
      <div className="flex-shrink-0 p-4 border-b border-[#1c1e2e]">
        <h2 className="font-display text-[13px] text-[#8891aa] tracking-[0.08em] uppercase mb-4">Investigation Entities</h2>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 rounded-full font-display text-[10px] font-medium tracking-wide transition-colors
                ${filter === f ? 'bg-[#7c3aed] text-white' : 'bg-[#141622] text-[#8891aa] hover:bg-[#1c1e2e]'}
              `}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5068]" />
          <input 
            type="text" 
            placeholder="Search phone, UPI, IMEI..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#141622] border border-[#2a2d42] rounded-md py-1.5 pl-9 pr-3 text-[12px] font-sans text-[#f1f3ff] placeholder-[#4a5068] focus:outline-none focus:border-[#7c3aed] transition-colors"
          />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        {filtered.length > 0 ? (
          filtered.map(entity => (
            <EntityRow 
              key={entity.id} 
              entity={entity} 
              isSelected={selectedId === entity.id} 
              onClick={() => onSelect(entity.id)} 
            />
          ))
        ) : (
          <div className="p-8 text-center">
            <span className="text-[#4a5068] font-sans text-[12px]">Not found</span>
          </div>
        )}
      </div>
    </div>
  );
}
