import { AlertTriangle, Download, X } from "lucide-react";
import { useEffect, useState } from "react";

export function GoldenHourOverlay({ onClose }: { onClose: () => void }) {
  const [timeLeft, setTimeLeft] = useState(58 * 60 + 14); // 58:14 in seconds

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-[#08090f]/95 backdrop-blur-sm z-[100] flex flex-col p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 rounded-full bg-[#dc2626] animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.8)]" />
          <h1 className="font-display text-[22px] font-bold text-[#f1f3ff] tracking-wider">GOLDEN HOUR TRIAGE</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 border border-[#2a2d42] bg-[#141622] rounded-md text-[#8891aa] hover:text-white hover:border-[#8891aa] transition-colors"
          >
            <X size={16} /> Close
          </button>
          <span className="font-mono text-[14px] text-[#dc2626]">{formatTime(timeLeft)} remaining</span>
        </div>
      </div>

      {/* Section 1: Immediate Actions */}
      <div className="flex gap-6 mb-12">
        <ActionCard account="mule2@gpay" amount="₹43,000" via="1930 portal" />
        <ActionCard account="cashout.mule1@paytm" amount="₹48,500" via="bank nodal" />
        <ActionCard account="final.hop3@ybl" amount="₹46,000" via="1930 portal" />
      </div>

      {/* Section 2: Money Flow Chain */}
      <div className="flex flex-col gap-4 mb-12 bg-[#0f1018] p-8 rounded-xl border border-[#1c1e2e]">
        <h2 className="font-display text-[15px] font-semibold text-[#8891aa]">MONEY FLOW CHAIN</h2>
        <div className="flex items-center justify-between pt-6">
          <FlowNode label="VICTIM" type="victim" />
          <FlowArrow amount="₹50,000" time="10:02" />
          <FlowNode label="MULE 1" type="mule" />
          <FlowArrow amount="₹48,000" time="10:07" gap="5m" />
          <FlowNode label="MULE 2" type="mule" />
          <FlowArrow amount="₹45,000" time="10:11" gap="4m" />
          <FlowNode label="MULE 3" type="mule" />
          <FlowArrow amount="₹43,000" time="10:19" gap="8m" />
          <FlowNode label="CASH-OUT" type="cashout" />
        </div>
      </div>

      {/* Section 3: Top Suspects */}
      <div className="flex flex-col gap-4 mb-12">
        <h2 className="font-display text-[15px] font-semibold text-[#8891aa]">TOP SUSPECTS</h2>
        <div className="flex flex-col gap-2">
          <SuspectRow rank={1} value="9811234567" score="96" reason="Spoofed call to victim + shared IMEI with Mule 1" />
          <SuspectRow rank={2} value="358234091674523" score="90" reason="SIM swap device used by Suspect and Mule 1" />
          <SuspectRow rank={3} value="103.45.67.89" score="85" reason="Shared IP between Suspect and Mule 1" />
        </div>
      </div>

      {/* Download Button */}
      <div className="mt-auto self-center">
        <button className="flex items-center justify-center gap-2 px-8 h-12 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-display text-[14px] font-bold rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all">
          <Download size={18} /> Download Brief
        </button>
      </div>
    </div>
  );
}

function ActionCard({ account, amount, via }: any) {
  return (
    <div className="flex-1 h-[160px] bg-[#dc2626] rounded-xl p-5 flex flex-col justify-between shadow-[0_4px_24px_rgba(220,38,38,0.2)]">
      <div className="flex items-center gap-2 text-white/90">
        <AlertTriangle size={16} />
        <span className="font-display text-[12px] font-bold tracking-widest">FREEZE IMMEDIATELY</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[14px] text-white">{account}</span>
        <span className="font-display text-[24px] font-bold text-white">{amount}</span>
        <span className="font-sans text-[12px] text-white/80 mt-1">Via: {via}</span>
      </div>
    </div>
  );
}

function FlowNode({ label, type }: any) {
  const bg = type === 'victim' ? 'bg-[#3b82f6]' : type === 'cashout' ? 'bg-[#dc2626]' : 'bg-[#f97316]';
  return (
    <div className={`px-4 py-2 rounded-md ${bg} text-white font-display text-[12px] font-bold tracking-widest`}>
      {label}
    </div>
  );
}

function FlowArrow({ amount, time, gap }: any) {
  return (
    <div className="flex flex-col items-center flex-1 mx-2 relative group">
      {gap && <span className="absolute -top-6 font-mono text-[10px] text-[#f59e0b]">{gap} gap</span>}
      <div className="w-full h-[2px] bg-[#4a5068] relative">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-[2px] border-r-[2px] border-[#4a5068] rotate-45" />
      </div>
      <div className="flex flex-col items-center mt-2">
        <span className="font-display text-[12px] font-bold text-[#f1f3ff]">{amount}</span>
        <span className="font-mono text-[10px] text-[#8891aa]">{time}</span>
      </div>
    </div>
  );
}

function SuspectRow({ rank, value, score, reason }: any) {
  return (
    <div className="flex items-center gap-4 p-3 bg-[#141622] border border-[#1c1e2e] rounded-lg">
      <div className="w-6 h-6 rounded bg-[#2a2d42] flex items-center justify-center font-display text-[12px] font-bold text-[#f1f3ff]">
        {rank}
      </div>
      <span className="font-display text-[14px] font-semibold text-[#f1f3ff] min-w-[140px]">{value}</span>
      <div className="px-2 h-5 rounded-full bg-[#1f0808] border border-[#dc2626] text-[#dc2626] font-display text-[11px] font-bold flex items-center">
        CR {score}
      </div>
      <span className="font-sans text-[13px] text-[#8891aa] ml-4 truncate">{reason}</span>
    </div>
  );
}
