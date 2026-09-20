import { Activity, ShieldAlert, Zap, FileJson } from "lucide-react";
import { useState } from "react";
import { GoldenHourOverlay } from "../golden-hour/GoldenHourOverlay";

export function TopBar() {
  const [isGoldenHourOpen, setIsGoldenHourOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-14 right-0 h-14 bg-[#08090f] border-b border-[#1c1e2e] flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-[18px] font-semibold text-[#f1f3ff]">Operation DarkNet</h1>
          <div className="px-2 py-0.5 rounded-full bg-[#051a10] border border-[#10b981] text-[#10b981] font-display text-[11px] font-medium uppercase tracking-wider">
            Complete
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
             <Activity size={20} className="text-[#8891aa]" />
             <div className="flex flex-col">
               <span className="font-display text-[15px] font-semibold text-[#f1f3ff] leading-tight">312</span>
               <span className="font-sans text-[11px] text-[#8891aa] leading-tight">Entities Found</span>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <ShieldAlert size={20} className="text-[#dc2626]" />
             <div className="flex flex-col">
               <span className="font-display text-[15px] font-semibold text-[#dc2626] leading-tight">14</span>
               <span className="font-sans text-[11px] text-[#8891aa] leading-tight">Critical Nodes</span>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <Zap size={20} className="text-[#f59e0b]" />
             <div className="flex flex-col">
               <span className="font-display text-[15px] font-semibold text-[#f1f3ff] leading-tight">1,204</span>
               <span className="font-sans text-[11px] text-[#8891aa] leading-tight">Linked Pairs</span>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <FileJson size={20} className="text-[#8891aa]" />
             <div className="flex flex-col">
               <span className="font-display text-[15px] font-semibold text-[#f1f3ff] leading-tight">6</span>
               <span className="font-sans text-[11px] text-[#8891aa] leading-tight">Files Processed</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
             <span className="font-display text-[20px] font-bold text-[#10b981] leading-none">58:14</span>
             <button 
               onClick={() => setIsGoldenHourOpen(true)}
               className="mt-1 px-2 py-0.5 border border-[#dc2626] text-white font-sans text-[10px] rounded hover:bg-[#dc2626] transition-colors"
             >
               Golden Hour Mode
             </button>
          </div>
        </div>
      </header>

      {isGoldenHourOpen && <GoldenHourOverlay onClose={() => setIsGoldenHourOpen(false)} />}
    </>
  );
}
