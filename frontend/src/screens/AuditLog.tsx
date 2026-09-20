import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useCase } from '../lib/CaseContext';
import { FileSearch, AlertCircle, UploadCloud, Clock, User, Hash, FileText } from 'lucide-react';

interface AuditEvent {
  id: number;
  caseNumber: string;
  action: string;
  actor: string;
  detail: string;
  evidenceHash: string | null;
  createdAt: string;
}

export function AuditLog() {
  const caseCtx = useCase();
  const [, setLocation] = useLocation();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseCtx.caseNumber) return;
    setLoading(true);
    fetch(`/api/cases/${caseCtx.caseNumber}/audit`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch audit log');
        return res.json();
      })
      .then(data => { setEvents(data.events ?? []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [caseCtx.caseNumber]);

  const getActionColor = (action: string) => {
    if (action.includes('evidence')) return '#10b981';
    if (action.includes('analysis') || action.includes('analyze')) return '#7c3aed';
    if (action.includes('report')) return '#3b82f6';
    if (action.includes('apk')) return '#f97316';
    if (action.includes('ai')) return '#ec4899';
    if (action.includes('offline')) return '#8b5cf6';
    return '#8891aa';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('evidence')) return <UploadCloud size={14} />;
    if (action.includes('report')) return <FileText size={14} />;
    if (action.includes('analysis') || action.includes('analyze')) return <FileSearch size={14} />;
    return <Clock size={14} />;
  };

  // Empty state
  if (!caseCtx.caseNumber) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="w-16 h-16 rounded-full bg-[#141622] border border-[#2a2d42] flex items-center justify-center">
          <AlertCircle size={28} className="text-[#4a5068]" />
        </div>
        <h2 className="font-display text-[20px] font-semibold text-[#f1f3ff]">No Audit Trail</h2>
        <p className="font-sans text-[14px] text-[#8891aa] text-center max-w-md">
          Start an investigation to begin the audit trail. All actions are logged for Section 65B compliance.
        </p>
        <button onClick={() => setLocation('/upload')} className="flex items-center gap-2 px-6 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-display text-[14px] font-semibold rounded-lg transition-colors">
          <UploadCloud size={18} /> Upload Evidence
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#08090f] p-8 overflow-y-auto">
      <div className="max-w-[900px] mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-[22px] font-bold text-[#f1f3ff] flex items-center gap-3">
              <FileSearch size={22} className="text-[#7c3aed]" /> Audit Log
            </h2>
            <p className="font-sans text-[12px] text-[#8891aa] mt-1">
              Case {caseCtx.caseNumber} · {events.length} event(s) recorded · Section 65B compliance trail
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-[#1f0808] border border-[#dc2626]/30 rounded-lg px-4 py-3">
            <AlertCircle size={16} className="text-[#dc2626]" />
            <span className="font-sans text-[13px] text-[#dc2626]">{error}</span>
          </div>
        )}

        {!loading && events.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="font-sans text-[14px] text-[#4a5068]">No events recorded yet for this case.</p>
          </div>
        )}

        {/* Event List */}
        <div className="flex flex-col gap-3">
          {events.map(event => (
            <div key={event.id} className="bg-[#0f1018] border border-[#1c1e2e] rounded-xl p-5 hover:border-[#2a2d42] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${getActionColor(event.action)}15`, color: getActionColor(event.action) }}>
                    {getActionIcon(event.action)}
                  </div>
                  <div>
                    <span className="font-display text-[13px] font-semibold text-[#f1f3ff] block">{event.action}</span>
                    <span className="font-sans text-[11px] text-[#4a5068]">by {event.actor}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#4a5068]">
                  <Clock size={12} />
                  <span className="font-mono text-[11px]">{new Date(event.createdAt).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <p className="font-sans text-[13px] text-[#8891aa] ml-11">{event.detail}</p>
              {event.evidenceHash && (
                <div className="flex items-center gap-2 ml-11 mt-2">
                  <Hash size={12} className="text-[#4a5068]" />
                  <span className="font-mono text-[10px] text-[#4a5068] truncate">{event.evidenceHash}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
