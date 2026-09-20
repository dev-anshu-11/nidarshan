import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useCase } from '../lib/CaseContext';

const STAGES = ["Ingesting", "Extracting", "Graphing", "Scoring", "Complete"];

export function Processing() {
  const [, setLocation] = useLocation();
  const caseCtx = useCase();
  const [activeStage, setActiveStage] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    if (!caseCtx.caseNumber) {
      setError('No case number found. Please upload evidence first.');
      return;
    }

    const runPipeline = async () => {
      try {
        // Stage 0: Ingesting
        addLog(`[${new Date().toLocaleTimeString()}] Initializing ingestion pipeline for case ${caseCtx.caseNumber}...`);
        addLog(`[${new Date().toLocaleTimeString()}] ${caseCtx.uploadedFiles.length} evidence file(s) received and hashed.`);
        
        await delay(800);
        setActiveStage(1);

        // Stage 1: Extracting
        addLog(`[${new Date().toLocaleTimeString()}] Extracting entities from uploaded evidence...`);
        
        // Trigger analysis
        const analyzeRes = await fetch(`/api/cases/${caseCtx.caseNumber}/analyze`, {
          method: 'POST',
          credentials: 'include',
        });
        
        if (!analyzeRes.ok) {
          const err = await analyzeRes.json().catch(() => ({ message: 'Analysis failed' }));
          throw new Error(err.message || 'Analysis endpoint returned an error');
        }

        const analyzeData = await analyzeRes.json();
        addLog(`[${new Date().toLocaleTimeString()}] Extracted ${analyzeData.entityCount ?? 0} entities across ${analyzeData.fileCount ?? 0} file(s).`);

        await delay(600);
        setActiveStage(2);

        // Stage 2: Graphing
        addLog(`[${new Date().toLocaleTimeString()}] Building fraud network — ${analyzeData.entityCount ?? 0} nodes, ${analyzeData.linkCount ?? 0} edges...`);
        addLog(`[${new Date().toLocaleTimeString()}] Computing entity cross-correlations...`);

        await delay(700);
        setActiveStage(3);

        // Stage 3: Scoring
        addLog(`[${new Date().toLocaleTimeString()}] Scoring entities against behavioral indicators...`);
        
        // Fetch full analysis data
        const analysisRes = await fetch(`/api/cases/${caseCtx.caseNumber}/analysis`, {
          credentials: 'include',
        });

        if (!analysisRes.ok) {
          throw new Error('Failed to fetch analysis results');
        }

        const analysis = await analysisRes.json();
        const criticalCount = analysis.entities?.filter((e: any) => e.tier === 'CRITICAL').length ?? 0;
        addLog(`[${new Date().toLocaleTimeString()}] Identified ${criticalCount} critical and ${analysis.entityCount - criticalCount} supporting entities.`);

        await delay(600);
        setActiveStage(4);

        // Stage 4: Complete
        addLog(`[${new Date().toLocaleTimeString()}] Pipeline complete. Redirecting to investigation dashboard...`);

        caseCtx.setAnalysis({
          entities: analysis.entities ?? [],
          links: analysis.links ?? [],
          timeline: analysis.timeline ?? [],
          fileCount: analysis.fileCount ?? 0,
          entityCount: analysis.entityCount ?? 0,
          linkCount: analysis.linkCount ?? 0,
        });

        await delay(1200);
        setLocation('/dashboard');
      } catch (err: any) {
        setError(err.message || 'Pipeline failed');
        addLog(`[${new Date().toLocaleTimeString()}] ❌ ERROR: ${err.message}`);
        caseCtx.setError(err.message);
      }
    };

    runPipeline();
  }, []);

  return (
    <div className="fixed inset-0 bg-[#08090f] z-50 flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="absolute top-12 font-display text-[24px] font-bold tracking-widest text-[#f1f3ff]">
        NIDARSHAN
      </div>

      <div className="w-full max-w-[800px] flex flex-col gap-12">
        {/* Pipeline Nodes */}
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#1c1e2e] -z-10" />
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

        {/* Case Info */}
        <div className="text-center">
          <span className="font-sans text-[14px] text-[#8891aa]">
            {error ? `Error: ${error}` : logs[logs.length - 1] || 'Preparing pipeline...'}
          </span>
        </div>

        {/* Live Log Feed */}
        <div className="h-[180px] bg-[#0f1018] border border-[#1c1e2e] rounded-lg p-4 overflow-y-auto flex flex-col gap-1 shadow-inner">
          {logs.map((log, i) => (
            <div key={i} className="font-mono text-[11px] text-[#8891aa] opacity-80">
              <span className="text-[#4a5068] mr-2">{'>'}</span>{log}
            </div>
          ))}
          {activeStage < 4 && !error && (
            <div className="font-mono text-[11px] text-[#8891aa] animate-pulse">
              <span className="text-[#4a5068] mr-2">{'>'}</span>_
            </div>
          )}
        </div>

        {/* Error retry */}
        {error && (
          <button
            onClick={() => setLocation('/upload')}
            className="mx-auto px-6 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-display text-[14px] font-semibold rounded-lg transition-colors"
          >
            ← Back to Upload
          </button>
        )}
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
