import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useCase } from '../lib/CaseContext';
import {
  Phone, CreditCard, Monitor, MessageSquare, FileText,
  UploadCloud, AlertCircle, Zap, Calendar, Clock,
} from 'lucide-react';
import { EntityChip } from '../components/common/EntityChip';
import { EntityType } from '../lib/types';

// ── Types ──────────────────────────────────────────────────────────────────

type SourceType = 'UPI' | 'CDR' | 'IPDR' | 'CHAT' | 'EML' | 'OTHER';
type FilterType = 'ALL' | SourceType;

interface TimelineItem {
  id: string;
  timestamp: Date;
  dateKey: string;        // 'DD MMM YYYY' for grouping
  timeLabel: string;      // 'HH:MM:SS'
  file: string;
  summary: string;
  sourceType: SourceType;
  isRapidSequence: boolean;
  entityTags: { type: EntityType; value: string }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const SOURCE_META: Record<SourceType, { label: string; color: string; icon: React.ReactNode }> = {
  UPI:   { label: 'UPI / Bank', color: '#f97316', icon: <CreditCard  size={14} /> },
  CDR:   { label: 'CDR',        color: '#3b82f6', icon: <Phone       size={14} /> },
  IPDR:  { label: 'IPDR',       color: '#8b5cf6', icon: <Monitor     size={14} /> },
  CHAT:  { label: 'Chat',       color: '#10b981', icon: <MessageSquare size={14} /> },
  EML:   { label: 'Email',      color: '#ec4899', icon: <FileText    size={14} /> },
  OTHER: { label: 'Other',      color: '#8891aa', icon: <FileText    size={14} /> },
};

function detectSourceType(fileName: string, summary: string): SourceType {
  const s = `${fileName} ${summary}`.toLowerCase();
  if (/upi|bank|txn|payment|account/.test(s)) return 'UPI';
  if (/cdr|call.detail|call.record/.test(s))  return 'CDR';
  if (/ipdr|ip.detail/.test(s))               return 'IPDR';
  if (/chat|whatsapp|\.txt/.test(s))          return 'CHAT';
  if (/\.eml|email|mail/.test(s))             return 'EML';
  return 'OTHER';
}

const ENTITY_PATTERNS: { type: EntityType; pattern: RegExp }[] = [
  { type: 'ip',     pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
  { type: 'mule',   pattern: /[\w.\-]+@[a-z]{2,}/gi },           // UPI handles
  { type: 'device', pattern: /\b\d{15}\b/g },                    // IMEI
  { type: 'mule',   pattern: /\b[6-9]\d{9}\b/g },                // phone numbers
];

function extractEntityTags(text: string): { type: EntityType; value: string }[] {
  const seen = new Set<string>();
  const tags: { type: EntityType; value: string }[] = [];
  for (const { type, pattern } of ENTITY_PATTERNS) {
    const matches = text.match(new RegExp(pattern.source, pattern.flags)) ?? [];
    for (const val of matches) {
      if (!seen.has(val)) { seen.add(val); tags.push({ type, value: val }); }
    }
  }
  return tags.slice(0, 6); // cap at 6 chips per event
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// ── Component ──────────────────────────────────────────────────────────────

export function Timeline() {
  const caseCtx = useCase();
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<FilterType>('ALL');

  // Build enriched timeline items from analysis
  const allItems = useMemo<TimelineItem[]>(() => {
    const raw = (caseCtx.analysis?.timeline ?? []).map((t, i) => {
      const ts = new Date(t.timestamp);
      return {
        id: `t-${i}`,
        timestamp: ts,
        dateKey: fmtDate(ts),
        timeLabel: fmtTime(ts),
        file: t.file,
        summary: t.summary ?? '',
        sourceType: detectSourceType(t.file, t.summary ?? ''),
        isRapidSequence: false,
        entityTags: extractEntityTags(`${t.file} ${t.summary ?? ''}`),
      };
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Mark rapid-sequence: events within 60 seconds of the previous one
    for (let i = 1; i < raw.length; i++) {
      const gap = raw[i].timestamp.getTime() - raw[i - 1].timestamp.getTime();
      if (gap >= 0 && gap <= 60_000) {
        raw[i].isRapidSequence = true;
        raw[i - 1].isRapidSequence = true;
      }
    }
    return raw;
  }, [caseCtx.analysis]);

  // Filter by source type
  const items = useMemo(() =>
    filter === 'ALL' ? allItems : allItems.filter(i => i.sourceType === filter),
    [allItems, filter]
  );

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, TimelineItem[]>();
    for (const item of items) {
      if (!map.has(item.dateKey)) map.set(item.dateKey, []);
      map.get(item.dateKey)!.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  const rapidCount = allItems.filter(i => i.isRapidSequence).length;
  const dateRange = allItems.length >= 2
    ? `${allItems[0].dateKey} — ${allItems[allItems.length - 1].dateKey}`
    : allItems[0]?.dateKey ?? '—';

  // ── Empty state ────────────────────────────────────────────────────────
  if (!caseCtx.analysis || allItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="w-16 h-16 rounded-full bg-[#141622] border border-[#2a2d42] flex items-center justify-center">
          <AlertCircle size={28} className="text-[#4a5068]" />
        </div>
        <h2 className="font-display text-[20px] font-semibold text-[#f1f3ff]">No Timeline Events</h2>
        <p className="font-sans text-[14px] text-[#8891aa] text-center max-w-md">
          Upload and analyze evidence files to generate the cross-source event timeline.
        </p>
        <button
          onClick={() => setLocation('/upload')}
          className="flex items-center gap-2 px-6 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-display text-[14px] font-semibold rounded-lg transition-colors"
        >
          <UploadCloud size={18} /> Upload Evidence
        </button>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#08090f] overflow-y-auto">
      <div className="max-w-[860px] mx-auto w-full px-8 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-display text-[20px] font-semibold text-[#f1f3ff]">Event Timeline</h2>
            <p className="font-sans text-[12px] text-[#8891aa] mt-1">
              Cross-source chronological event stitching
            </p>
          </div>
          {/* Stats bar */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-[#4a5068]" />
              <span className="font-mono text-[11px] text-[#8891aa]">{dateRange}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-[#4a5068]" />
              <span className="font-mono text-[11px] text-[#8891aa]">{allItems.length} events</span>
            </div>
            {rapidCount > 0 && (
              <div className="flex items-center gap-1.5 bg-[#1f0808] border border-[#dc2626]/30 rounded-full px-2.5 py-1">
                <Zap size={11} className="text-[#dc2626]" />
                <span className="font-display text-[10px] font-semibold text-[#dc2626]">
                  {rapidCount} rapid-sequence
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Source-type filter pills */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {(['ALL', 'UPI', 'CDR', 'IPDR', 'CHAT', 'EML'] as FilterType[]).map(f => {
            const meta = f !== 'ALL' ? SOURCE_META[f] : null;
            const active = filter === f;
            const count = f === 'ALL' ? allItems.length : allItems.filter(i => i.sourceType === f).length;
            if (count === 0 && f !== 'ALL') return null;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-display text-[11px] font-medium border transition-colors"
                style={{
                  backgroundColor: active ? (meta ? `${meta.color}18` : '#1a103a') : '#141622',
                  borderColor:     active ? (meta ? meta.color : '#7c3aed') : '#2a2d42',
                  color:           active ? (meta ? meta.color : '#7c3aed') : '#8891aa',
                }}
              >
                {meta && <span style={{ color: meta.color }}>{meta.icon}</span>}
                {f === 'ALL' ? 'ALL' : meta!.label}
                <span className="ml-0.5 font-mono opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Grouped timeline */}
        <div className="flex flex-col gap-10">
          {grouped.map(([dateKey, dayItems]) => (
            <div key={dateKey}>
              {/* Day header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="font-display text-[11px] font-bold text-[#4a5068] uppercase tracking-widest">
                  {dateKey}
                </span>
                <div className="flex-1 h-px bg-[#1c1e2e]" />
                <span className="font-mono text-[10px] text-[#4a5068]">{dayItems.length} event{dayItems.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Events for this day */}
              <div className="relative border-l-2 border-[#1c1e2e] ml-[88px]">
                {dayItems.map((event, idx) => {
                  const meta = SOURCE_META[event.sourceType];
                  const isFirst = idx === 0;
                  const prevTs = idx > 0 ? dayItems[idx - 1].timestamp : null;
                  const gapMs = prevTs ? event.timestamp.getTime() - prevTs.getTime() : null;
                  const gapLabel = gapMs !== null && gapMs < 3_600_000
                    ? gapMs < 60_000
                      ? `+${Math.round(gapMs / 1000)}s`
                      : `+${Math.round(gapMs / 60_000)}m`
                    : null;

                  return (
                    <div key={event.id} className="relative pl-10 group">
                      {/* Gap label between events */}
                      {!isFirst && gapLabel && (
                        <div className="absolute left-[-60px] top-0 flex items-center h-6 -translate-y-3">
                          <span
                            className="font-mono text-[9px] px-1.5 py-0.5 rounded border"
                            style={{
                              color:       event.isRapidSequence ? '#dc2626' : '#4a5068',
                              borderColor: event.isRapidSequence ? '#dc262630' : '#1c1e2e',
                              background:  event.isRapidSequence ? '#1f080820' : 'transparent',
                            }}
                          >
                            {gapLabel}
                          </span>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="absolute left-[-82px] top-4 w-[68px] text-right">
                        <span className="font-mono text-[11px] text-[#4a5068] group-hover:text-[#a3aed0] transition-colors leading-none">
                          {event.timeLabel}
                        </span>
                      </div>

                      {/* Timeline dot */}
                      <div
                        className="absolute left-[-9px] top-[14px] w-[17px] h-[17px] rounded-full border-2 flex items-center justify-center z-10 transition-all"
                        style={{
                          backgroundColor: '#0f1018',
                          borderColor: event.isRapidSequence ? '#dc2626' : meta.color,
                          boxShadow: event.isRapidSequence
                            ? '0 0 8px #dc262660'
                            : `0 0 6px ${meta.color}40`,
                        }}
                      >
                        <span style={{ color: event.isRapidSequence ? '#dc2626' : meta.color }}>
                          {event.isRapidSequence
                            ? <Zap size={8} />
                            : <span className="block w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                          }
                        </span>
                      </div>

                      {/* Event card */}
                      <div
                        className="mb-3 bg-[#0f1018] border rounded-xl px-4 py-3 flex flex-col gap-2 group-hover:border-[#2a2d42] transition-colors"
                        style={{
                          borderColor: event.isRapidSequence ? '#dc262630' : '#1c1e2e',
                          borderLeftColor: meta.color,
                          borderLeftWidth: '2px',
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="font-sans text-[13px] text-[#f1f3ff] leading-snug">
                              {event.summary || 'Evidence event recorded'}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] text-[#4a5068] truncate">{event.file}</span>
                            </div>
                          </div>
                          {/* Source badge */}
                          <div
                            className="flex items-center gap-1 shrink-0 px-2 py-1 rounded-md border"
                            style={{
                              color:           meta.color,
                              borderColor:     `${meta.color}30`,
                              backgroundColor: `${meta.color}10`,
                            }}
                          >
                            {meta.icon}
                            <span className="font-display text-[10px] font-semibold">{meta.label}</span>
                          </div>
                        </div>

                        {/* Entity chips */}
                        {event.entityTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#1c1e2e]">
                            {event.entityTags.map((tag, ti) => (
                              <EntityChip key={ti} type={tag.type} value={tag.value} />
                            ))}
                          </div>
                        )}

                        {/* Rapid-sequence warning banner */}
                        {event.isRapidSequence && (
                          <div className="flex items-center gap-1.5 bg-[#1f0808] border border-[#dc2626]/20 rounded-md px-2.5 py-1.5">
                            <Zap size={11} className="text-[#dc2626] shrink-0" />
                            <span className="font-display text-[10px] font-semibold text-[#dc2626]">
                              Rapid sequence — event within 60s of adjacent event
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
