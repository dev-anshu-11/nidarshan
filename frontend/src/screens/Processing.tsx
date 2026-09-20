import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

const STAGES = [
  "Ingesting",
  "Extracting",
  "Graphing",
  "Scoring",
  "Generating"
];

const LOGS = [
  "Initializing ingestion pipeline...",
  "Hashing and parsing CDR_Airtel_Oct2026.csv...",
  "Extracted 847 entities across 3 files...",
  "Building fraud network — 312 nodes, 1,204 edges...",
  "Computing Louvain community detection...",
  "Scoring 47 entities against 12 behavioral indicators...",
  "Generating Section 65B report...",
  "Pipeline complete. Redirecting..."
];

export function Processing() {
  const [, setLocation] = useLocation();
  const [activeStage, setActiveStage] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Simulate pipeline progress
    let logIdx = 0;
    const logInterval = setInterval(() => {
      setLogs(prev => [...prev, LOGS[logIdx]]);
      logIdx++;
      
      if (logIdx === 2) setActiveStage(1);
      if (logIdx === 4) setActiveStage(2);
      if (logIdx === 5) setActiveStage(3);
      if (logIdx === 6) setActiveStage(4);

      if (logIdx >= LOGS.length) {
        clearInterval(logInterval);
        setTimeout(() => setLocation('/dashboard'), 1500);
      }
    }, 800);

    return () => clearInterval(logInterval);
  }, [setLocation]);

  return (
    <div className="fixed inset-0 bg-[#08090f] z-50 flex flex-col items-center justify-center">
      {/* Logo Placeholder */}
      <div className="absolute top-12 font-display text-[24px] font-bold tracking-widest text-[#f1f3ff]">
        NIDARSHAN
      </div>

      <div className="w-full max-w-[800px] flex flex-col gap-12">
        {/* Pipeline Nodes */}
        <div className="flex items-center justify-between relative">
          {/* Background line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#1c1e2e] -z-10" />
          {/* Progress line */}
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#10b981] -z-10 transition-all duration-500 ease-out" 
            style={{ width: `${(activeStage / (STAGES.length - 1)) * 100}%` }}
          />

          {STAGES.map((stage, idx) => {
            const isCompleted = idx < activeStage;
            const isActive = idx === activeStage;
            
            return (
              <div key={stage} className="flex flex-col items-center gap-3 bg-[#08090f] px-2">
                <div className={`w-4 h-4 rounded-full border-2 transition-colors duration-300
                  ${isCompleted ? 'bg-[#10b981] border-[#10b981]' : 
                    isActive ? 'bg-[#7c3aed] border-[#7c3aed] animate-pulse shadow-[0_0_15px_rgba(124,58,237,0.6)]' : 
                    'bg-[#141622] border-[#2a2d42]'}
                `} />
                <span className={`font-display text-[12px] font-medium uppercase tracking-widest
                  ${isCompleted ? 'text-[#10b981]' : isActive ? 'text-[#f1f3ff]' : 'text-[#4a5068]'}
                `}>
                  {stage}
                </span>
              </div>
            );
          })}
        </div>

        {/* Current Status Label */}
        <div className="text-center">
          <span className="font-sans text-[14px] text-[#8891aa]">
            {logs[logs.length - 1] || "Preparing pipeline..."}
          </span>
        </div>

        {/* Live Log Feed */}
        <div className="h-[120px] bg-[#0f1018] border border-[#1c1e2e] rounded-lg p-4 overflow-y-auto flex flex-col gap-1 shadow-inner">
          {logs.map((log, i) => (
            <div key={i} className="font-mono text-[11px] text-[#8891aa] opacity-80 animate-fade-in">
              <span className="text-[#4a5068] mr-2">{'>'}</span>{log}
            </div>
          ))}
          {activeStage < 4 && (
            <div className="font-mono text-[11px] text-[#8891aa] animate-pulse">
              <span className="text-[#4a5068] mr-2">{'>'}</span>_
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
