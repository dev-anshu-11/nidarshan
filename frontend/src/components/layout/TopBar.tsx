import { Activity, ShieldAlert, Zap, FileJson } from "lucide-react";
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
            className="px-3 py-1.5 border border-[#dc2626] text-white font-display text-[11px] font-medium rounded hover:bg-[#dc2626] transition-colors tracking-wide uppercase"
          >
            Golden Hour
          </button>
        </div>
      </header>

      {isGoldenHourOpen && <GoldenHourOverlay onClose={() => setIsGoldenHourOpen(false)} />}
    </>
  );
}
