import { TimelineEvent } from "../lib/types";
import { Phone, CreditCard, LogIn, Monitor, Smartphone } from "lucide-react";
import { EntityChip } from "../components/common/EntityChip";

const mockTimeline: TimelineEvent[] = [
  { id: "t1", timestamp: "10:02:33", icon: "upi", description: "Victim → Mule 1", tags: ["ramesh.sharma99@okaxis", "cashout.mule1@paytm"] },
  { id: "t2", timestamp: "10:08:47", icon: "upi", description: "Mule 1 → Mule 2", tags: ["cashout.mule1@paytm", "transfer.m2@gpay"], isRapidSequence: true },
  { id: "t3", timestamp: "10:12:19", icon: "upi", description: "Mule 2 → Mule 3", tags: ["transfer.m2@gpay", "final.hop3@ybl"], isRapidSequence: true },
  { id: "t4", timestamp: "10:21:04", icon: "atm", description: "ATM Withdrawal", tags: ["final.hop3@ybl", "Delhi-Rohini-07"] },
  { id: "t5", timestamp: "10:23:15", icon: "device", description: "Mule 1 phone offline", tags: ["9900112233", "358234091674523"] },
  { id: "t6", timestamp: "10:24:02", icon: "device", description: "Suspect IMEI re-registers", tags: ["358234091674523", "9944556677"] }
];

export function Timeline() {
  const getIcon = (iconName: string) => {
    const props = { size: 16 };
    switch (iconName) {
      case 'upi': return <CreditCard {...props} className="text-[#f97316]" />;
      case 'atm': return <Monitor {...props} className="text-[#dc2626]" />;
      case 'device': return <Smartphone {...props} className="text-[#8b5cf6]" />;
      case 'call': return <Phone {...props} className="text-[#3b82f6]" />;
      default: return <LogIn {...props} className="text-[#8891aa]" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#08090f] p-8 overflow-y-auto">
      <div className="max-w-[800px] mx-auto w-full">
        <h2 className="font-display text-[20px] font-semibold text-[#f1f3ff] mb-6">Event Timeline</h2>
        
        {/* Filters */}
        <div className="flex gap-2 mb-10">
          {["ALL EVENTS", "TRANSACTIONS", "CALLS", "LOGINS", "WITHDRAWALS"].map(f => (
             <button key={f} className={`px-3 py-1.5 rounded-full font-display text-[11px] font-medium tracking-wide border transition-colors ${f === "ALL EVENTS" ? 'bg-[#1a103a] text-[#7c3aed] border-[#3b1f80]' : 'bg-[#141622] text-[#8891aa] border-[#2a2d42] hover:border-[#4a5068]'}`}>
               {f}
             </button>
          ))}
        </div>

        {/* Timeline Items */}
        <div className="relative border-l-2 border-[#1c1e2e] ml-[80px]">
          {mockTimeline.map((event, idx) => (
            <div key={event.id} className="relative pl-12 py-4 group">
              {/* Connector line for rapid sequence */}
              {event.isRapidSequence && (
                <div className="absolute left-[-2px] top-[-30px] bottom-[30px] w-0 border-l-[3px] border-[#dc2626] z-10" />
              )}
              {event.isRapidSequence && idx > 0 && mockTimeline[idx-1].isRapidSequence && (
                 <div className="absolute left-[-40px] top-1/2 -translate-y-1/2 bg-[#1f0808] border border-[#dc2626] text-[#dc2626] font-display text-[9px] px-1.5 py-0.5 rounded tracking-wide uppercase rotate-[-90deg] origin-center -translate-x-full">
                   Rapid
                 </div>
              )}

              {/* Timestamp */}
              <div className="absolute left-[-75px] top-5 font-mono text-[13px] text-[#a3aed0] group-hover:text-[#f1f3ff] transition-colors">
                {event.timestamp}
              </div>

              {/* Icon */}
              <div className="absolute left-[-17px] top-4 w-8 h-8 rounded-full bg-[#141622] border-2 border-[#1c1e2e] flex items-center justify-center z-20 group-hover:border-[#7c3aed] transition-colors">
                {getIcon(event.icon)}
              </div>

              {/* Content */}
              <div className="flex items-center justify-between bg-[#0f1018] border border-[#1c1e2e] rounded-xl p-4 group-hover:border-[#2a2d42] transition-colors">
                <span className="font-sans text-[14px] text-[#f1f3ff]">{event.description}</span>
                <div className="flex gap-2">
                  {event.tags.map(t => (
                    <EntityChip key={t} type="unknown" value={t} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
