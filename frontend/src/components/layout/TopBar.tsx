import { Activity, ShieldAlert, Zap, FileJson, Clock3 } from "lucide-react";
import { useState } from "react";
import { GoldenHourOverlay } from "../golden-hour/GoldenHourOverlay";
import { useCase } from "../../lib/CaseContext";

export function TopBar() {
  const [isGoldenHourOpen, setIsGoldenHourOpen] = useState(false);
  const caseCtx = useCase();

  const analysis = caseCtx.analysis;
  const entityCount = analysis?.entityCount ?? 0;
  const linkCount = analysis?.linkCount ?? 0;
  const fileCount = analysis?.fileCount ?? 0;
  const criticalCount = analysis?.entities.filter(e => e.tier === 'CRITICAL').length ?? 0;

  const statusLabel = caseCtx.status === 'ready' ? 'Complete' :
    caseCtx.status === 'processing' ? 'Processing' :
    caseCtx.status === 'uploading' ? 'Uploading' :
    caseCtx.status === 'error' ? 'Error' : 'Idle';

  const statusColor = caseCtx.status === 'ready' ? '#10b981' :
    caseCtx.status === 'processing' ? '#f59e0b' :
    caseCtx.status === 'error' ? '#dc2626' : '#8891aa';

  return (
    <>
      <header className="fixed top-0 left-14 right-0 h-14 bg-[#08090f] border-b border-[#1c1e2e] flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-[18px] font-semibold text-[#f1f3ff]">
            {caseCtx.caseName || 'NIDARSHAN'}
          </h1>
          <div
            className="px-2 py-0.5 rounded-full border font-display text-[11px] font-medium uppercase tracking-wider"
            style={{
              backgroundColor: `${statusColor}10`,
              borderColor: statusColor,
              color: statusColor,
            }}
          >
            {statusLabel}
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-[#8891aa]" />
            <div className="flex flex-col">
              <span className="font-display text-[15px] font-semibold text-[#f1f3ff] leading-tight">{entityCount}</span>
              <span className="font-sans text-[11px] text-[#8891aa] leading-tight">Entities Found</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-[#dc2626]" />
            <div className="flex flex-col">
              <span className="font-display text-[15px] font-semibold text-[#dc2626] leading-tight">{criticalCount}</span>
              <span className="font-sans text-[11px] text-[#8891aa] leading-tight">Critical Nodes</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-[#f59e0b]" />
            <div className="flex flex-col">
              <span className="font-display text-[15px] font-semibold text-[#f1f3ff] leading-tight">{linkCount}</span>
              <span className="font-sans text-[11px] text-[#8891aa] leading-tight">Linked Pairs</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileJson size={20} className="text-[#8891aa]" />
            <div className="flex flex-col">
              <span className="font-display text-[15px] font-semibold text-[#f1f3ff] leading-tight">{fileCount}</span>
              <span className="font-sans text-[11px] text-[#8891aa] leading-tight">Files Processed</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsGoldenHourOpen(true)}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl border border-[#ef4444]/70 bg-gradient-to-r from-[#1a0e0e] via-[#2f1212] to-[#1a0e0e] px-3.5 py-2 text-[#fff3f3] shadow-[0_0_0_1px_rgba(239,68,68,0.25),0_10px_25px_rgba(220,38,38,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f87171] hover:shadow-[0_0_0_1px_rgba(248,113,113,0.5),0_14px_30px_rgba(220,38,38,0.28)] focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50 focus:ring-offset-2 focus:ring-offset-[#08090f]"
            aria-label="Open Golden Hour triage"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#ef4444]/0 via-[#f87171]/15 to-[#ef4444]/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-[#ef4444]/15 ring-1 ring-[#fca5a5]/60">
              <Clock3 size={12} className="text-[#fca5a5]" />
            </span>
            <span className="relative font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-[#fee2e2]">
              Golden Hour
            </span>
          </button>
        </div>
      </header>

      {isGoldenHourOpen && <GoldenHourOverlay onClose={() => setIsGoldenHourOpen(false)} />}
    </>
  );
}
