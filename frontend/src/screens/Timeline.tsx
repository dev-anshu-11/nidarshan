import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useCase } from '../lib/CaseContext';
import { Phone, CreditCard, LogIn, Monitor, Smartphone, FileText, MessageSquare, UploadCloud, AlertCircle } from 'lucide-react';
import { EntityChip } from "../components/common/EntityChip";

type FilterType = 'ALL' | 'UPI' | 'CDR' | 'IPDR' | 'CHAT' | 'EML';

export function Timeline() {
  const caseCtx = useCase();
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<FilterType>('ALL');

  const timeline = useMemo(() => {
    const items = (caseCtx.analysis?.timeline ?? []).map((t, i) => {
      // Determine event type from file name
      const fileName = t.file.toLowerCase();
      let eventType: FilterType = 'ALL';
      if (fileName.includes('upi') || fileName.includes('bank')) eventType = 'UPI';
      else if (fileName.includes('cdr')) eventType = 'CDR';
      else if (fileName.includes('ipdr')) eventType = 'IPDR';
      else if (fileName.includes('chat') || fileName.includes('.txt')) eventType = 'CHAT';
      else if (fileName.includes('.eml') || fileName.includes('email')) eventType = 'EML';

      return {
        id: `t-${i}`,
        timestamp: t.timestamp,
        timeLabel: new Date(t.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        file: t.file,
        summary: t.summary,
        eventType,
      };
    });

    if (filter === 'ALL') return items;
    return items.filter(t => t.eventType === filter);
  }, [caseCtx.analysis, filter]);

  const getIcon = (eventType: FilterType) => {
    const props = { size: 16 };
    switch (eventType) {
      case 'UPI': return <CreditCard {...props} className="text-[#f97316]" />;
      case 'CDR': return <Phone {...props} className="text-[#3b82f6]" />;
      case 'IPDR': return <Monitor {...props} className="text-[#8b5cf6]" />;
      case 'CHAT': return <MessageSquare {...props} className="text-[#10b981]" />;
      case 'EML': return <FileText {...props} className="text-[#ec4899]" />;
      default: return <LogIn {...props} className="text-[#8891aa]" />;
    }
  };

  // Empty state
  if (!caseCtx.analysis || timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="w-16 h-16 rounded-full bg-[#141622] border border-[#2a2d42] flex items-center justify-center">
          <AlertCircle size={28} className="text-[#4a5068]" />
        </div>
        <h2 className="font-display text-[20px] font-semibold text-[#f1f3ff]">No Timeline Events</h2>
        <p className="font-sans text-[14px] text-[#8891aa] text-center max-w-md">
          Upload and analyze evidence files to generate the event timeline.
        </p>
        <button onClick={() => setLocation('/upload')} className="flex items-center gap-2 px-6 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-display text-[14px] font-semibold rounded-lg transition-colors">
          <UploadCloud size={18} /> Upload Evidence
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#08090f] p-8 overflow-y-auto">
      <div className="max-w-[800px] mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-[20px] font-semibold text-[#f1f3ff]">Event Timeline</h2>
            <p className="font-sans text-[12px] text-[#8891aa] mt-1">{timeline.length} event(s)</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-10">
          {(['ALL', 'UPI', 'CDR', 'IPDR', 'CHAT', 'EML'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full font-display text-[11px] font-medium tracking-wide border transition-colors ${
                filter === f ? 'bg-[#1a103a] text-[#7c3aed] border-[#3b1f80]' : 'bg-[#141622] text-[#8891aa] border-[#2a2d42] hover:border-[#4a5068]'
              }`}
            >
              {f === 'ALL' ? 'ALL EVENTS' : f}
            </button>
          ))}
        </div>

        {/* Timeline Items */}
        <div className="relative border-l-2 border-[#1c1e2e] ml-[80px]">
          {timeline.map((event) => (
            <div key={event.id} className="relative pl-12 py-4 group">
              {/* Timestamp */}
              <div className="absolute left-[-75px] top-5 font-mono text-[13px] text-[#a3aed0] group-hover:text-[#f1f3ff] transition-colors">
                {event.timeLabel}
              </div>

              {/* Icon */}
              <div className="absolute left-[-17px] top-4 w-8 h-8 rounded-full bg-[#141622] border-2 border-[#1c1e2e] flex items-center justify-center z-20 group-hover:border-[#7c3aed] transition-colors">
                {getIcon(event.eventType)}
              </div>

              {/* Content */}
              <div className="flex items-center justify-between bg-[#0f1018] border border-[#1c1e2e] rounded-xl p-4 group-hover:border-[#2a2d42] transition-colors">
                <div className="flex flex-col gap-1 flex-1 mr-4">
                  <span className="font-sans text-[14px] text-[#f1f3ff]">{event.summary}</span>
                  <span className="font-mono text-[11px] text-[#4a5068]">{event.file}</span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <EntityChip type="unknown" value={event.eventType} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
