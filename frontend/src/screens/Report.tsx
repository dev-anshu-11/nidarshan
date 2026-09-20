import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useCase } from '../lib/CaseContext';
import { Download, FileText, Package, AlertCircle, UploadCloud, Shield, Clock, Hash, ChevronRight } from 'lucide-react';

interface ReportData {
  caseNumber: string;
  generatedAt: string;
  summary: {
    files: number;
    entities: number;
    links: number;
    apkArtifacts: number;
    critical: number;
    analysisDuration: string;
  };
  primeSuspects: {
    value: string;
    type: string;
    score: number;
    tier: string;
    reasons: string[];
  }[];
  timeline: { timestamp: string; file: string; summary: string }[];
  recommendations: string[];
  integrity: { file: string; sha256: string }[];
  disclaimer: string;
}

export function Report() {
  const caseCtx = useCase();
  const [, setLocation] = useLocation();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseCtx.caseNumber) return;
    setLoading(true);
    fetch(`/api/cases/${caseCtx.caseNumber}/report.json`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch report');
        return res.json();
      })
      .then(data => { setReport(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [caseCtx.caseNumber]);

  const downloadPdf = () => {
    if (!caseCtx.caseNumber) return;
    window.open(`/api/cases/${caseCtx.caseNumber}/report.pdf`, '_blank');
  };

  const downloadBundle = async () => {
    if (!caseCtx.caseNumber) return;
    const res = await fetch(`/api/cases/${caseCtx.caseNumber}/offline-bundle`, { credentials: 'include' });
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nidarshan-${caseCtx.caseNumber}-bundle.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Empty state
  if (!caseCtx.caseNumber || (!loading && !report && !error)) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="w-16 h-16 rounded-full bg-[#141622] border border-[#2a2d42] flex items-center justify-center">
          <AlertCircle size={28} className="text-[#4a5068]" />
        </div>
        <h2 className="font-display text-[20px] font-semibold text-[#f1f3ff]">No Report Available</h2>
        <p className="font-sans text-[14px] text-[#8891aa] text-center max-w-md">
          Upload and analyze evidence files to generate an investigative report.
        </p>
        <button onClick={() => setLocation('/upload')} className="flex items-center gap-2 px-6 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-display text-[14px] font-semibold rounded-lg transition-colors">
          <UploadCloud size={18} /> Upload Evidence
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" />
        <span className="font-sans text-[14px] text-[#8891aa]">Generating report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <AlertCircle size={32} className="text-[#dc2626]" />
        <p className="font-sans text-[14px] text-[#dc2626]">{error}</p>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="flex flex-col h-full bg-[#08090f] p-8 overflow-y-auto">
      <div className="max-w-[900px] mx-auto w-full flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-[22px] font-bold text-[#f1f3ff]">Investigative Report</h2>
            <p className="font-sans text-[13px] text-[#8891aa] mt-1">Case {report.caseNumber} · Generated {new Date(report.generatedAt).toLocaleString('en-IN')}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={downloadPdf} className="flex items-center gap-2 px-4 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-display text-[13px] font-semibold rounded-lg transition-colors">
              <Download size={14} /> Download PDF
            </button>
            <button onClick={downloadBundle} className="flex items-center gap-2 px-4 py-2.5 bg-[#141622] border border-[#2a2d42] text-[#8891aa] hover:text-[#f1f3ff] font-display text-[13px] font-medium rounded-lg transition-colors">
              <Package size={14} /> Offline Bundle
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Files Analyzed', value: report.summary.files, icon: FileText },
            { label: 'Entities', value: report.summary.entities, icon: Shield },
            { label: 'Links', value: report.summary.links, icon: ChevronRight },
            { label: 'Critical', value: report.summary.critical, icon: AlertCircle, color: '#dc2626' },
            { label: 'Duration', value: report.summary.analysisDuration, icon: Clock },
          ].map((stat, i) => (
            <div key={i} className="bg-[#0f1018] border border-[#1c1e2e] rounded-xl p-4 flex flex-col gap-2">
              <stat.icon size={16} className={stat.color ? `text-[${stat.color}]` : 'text-[#8891aa]'} />
              <span className="font-display text-[20px] font-bold text-[#f1f3ff]">{stat.value}</span>
              <span className="font-sans text-[11px] text-[#4a5068] uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Prime Suspects */}
        <div className="bg-[#0f1018] border border-[#1c1e2e] rounded-xl p-6">
          <h3 className="font-display text-[14px] font-semibold text-[#f1f3ff] mb-4 flex items-center gap-2">
            <Shield size={16} className="text-[#dc2626]" /> Prime Suspects
          </h3>
          <div className="flex flex-col gap-3">
            {report.primeSuspects.map((suspect, i) => (
              <div key={i} className="flex items-start gap-4 bg-[#141622] rounded-lg p-4">
                <span className="font-display text-[18px] font-bold text-[#4a5068] min-w-[28px]">{i + 1}.</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-display text-[14px] font-semibold text-[#f1f3ff]">{suspect.value}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-display font-bold uppercase tracking-wider
                      ${suspect.tier === 'CRITICAL' ? 'bg-[#1f0808] text-[#dc2626] border border-[#dc2626]/30' :
                        suspect.tier === 'HIGH' ? 'bg-[#1a0f00] text-[#f97316] border border-[#f97316]/30' :
                        'bg-[#141622] text-[#8891aa] border border-[#2a2d42]'}
                    `}>{suspect.tier} · {suspect.score}/100</span>
                  </div>
                  <p className="font-sans text-[12px] text-[#8891aa]">{suspect.reasons[0] ?? 'Source-linked entity'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Integrity */}
        <div className="bg-[#0f1018] border border-[#1c1e2e] rounded-xl p-6">
          <h3 className="font-display text-[14px] font-semibold text-[#f1f3ff] mb-4 flex items-center gap-2">
            <Hash size={16} className="text-[#10b981]" /> Evidence Integrity (SHA-256)
          </h3>
          <div className="flex flex-col gap-2">
            {report.integrity.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-[#141622] rounded-lg px-4 py-3">
                <span className="font-sans text-[13px] text-[#f1f3ff]">{item.file}</span>
                <span className="font-mono text-[11px] text-[#4a5068] truncate max-w-[400px]">{item.sha256}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-[#0f1018] border border-[#1c1e2e] rounded-xl p-6">
          <h3 className="font-display text-[14px] font-semibold text-[#f1f3ff] mb-4">Recommendations</h3>
          <div className="flex flex-col gap-2">
            {report.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] mt-2 shrink-0" />
                <span className="font-sans text-[13px] text-[#8891aa]">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-[#0a0b10] border border-[#1c1e2e] rounded-xl p-4 text-center">
          <p className="font-sans text-[11px] text-[#4a5068] italic">{report.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}
