import { useLocation } from 'wouter';
import { useCase } from '../lib/CaseContext';
import { Shield, Moon, Info, LogOut, User, FileText } from 'lucide-react';

export function Settings() {
  const [, setLocation] = useLocation();
  const caseCtx = useCase();

  const handleLogout = () => {
    caseCtx.reset();
    setLocation('/login');
  };

  return (
    <div className="flex flex-col h-full bg-[#08090f] p-8 overflow-y-auto">
      <div className="max-w-[700px] mx-auto w-full flex flex-col gap-8">
        <h2 className="font-display text-[22px] font-bold text-[#f1f3ff]">Settings</h2>

        {/* Profile Section */}
        <Section title="Investigator Profile" icon={<User size={16} />}>
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Name" value="Investigating Officer" />
            <InfoField label="Badge / ID" value="IO-2026-KRN" />
            <InfoField label="Unit" value="Cyber Crime Division" />
            <InfoField label="Jurisdiction" value="Karnataka Police" />
          </div>
        </Section>

        {/* Current Case */}
        <Section title="Current Investigation" icon={<FileText size={16} />}>
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Case Number" value={caseCtx.caseNumber || 'No active case'} />
            <InfoField label="Case Name" value={caseCtx.caseName || 'N/A'} />
            <InfoField label="Status" value={caseCtx.status.toUpperCase()} />
            <InfoField label="Files Uploaded" value={String(caseCtx.uploadedFiles.length)} />
          </div>
        </Section>

        {/* Theme */}
        <Section title="Appearance" icon={<Moon size={16} />}>
          <div className="flex items-center justify-between bg-[#141622] rounded-lg px-4 py-3">
            <div>
              <span className="font-display text-[13px] font-medium text-[#f1f3ff]">Dark Mode</span>
              <p className="font-sans text-[11px] text-[#4a5068] mt-0.5">Optimized for low-light investigation environments</p>
            </div>
            <div className="w-10 h-6 bg-[#7c3aed] rounded-full relative">
              <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full" />
            </div>
          </div>
        </Section>

        {/* About */}
        <Section title="About NIDARSHAN" icon={<Info size={16} />}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between bg-[#141622] rounded-lg px-4 py-3">
              <span className="font-sans text-[13px] text-[#8891aa]">Version</span>
              <span className="font-mono text-[13px] text-[#f1f3ff]">1.0.0</span>
            </div>
            <div className="flex items-center justify-between bg-[#141622] rounded-lg px-4 py-3">
              <span className="font-sans text-[13px] text-[#8891aa]">Engine</span>
              <span className="font-mono text-[13px] text-[#f1f3ff]">Forensic Correlation v1</span>
            </div>
            <div className="flex items-center justify-between bg-[#141622] rounded-lg px-4 py-3">
              <span className="font-sans text-[13px] text-[#8891aa]">Report Format</span>
              <span className="font-mono text-[13px] text-[#f1f3ff]">Section 65B Compliant</span>
            </div>
          </div>
        </Section>

        {/* Disclaimer */}
        <div className="bg-[#0a0b10] border border-[#1c1e2e] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield size={16} className="text-[#4a5068] mt-0.5 shrink-0" />
            <p className="font-sans text-[11px] text-[#4a5068] leading-relaxed">
              NIDARSHAN is a forensic correlation engine for investigative assistance only. All findings require human verification and applicable legal authorization before any enforcement action. This system does not establish guilt or innocence.
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-3 bg-[#1f0808] border border-[#dc2626]/30 text-[#dc2626] font-display text-[14px] font-semibold rounded-lg hover:bg-[#dc2626] hover:text-white transition-colors"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#0f1018] border border-[#1c1e2e] rounded-xl p-6">
      <h3 className="font-display text-[14px] font-semibold text-[#f1f3ff] mb-4 flex items-center gap-2">
        <span className="text-[#8891aa]">{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#141622] rounded-lg px-4 py-3">
      <span className="font-sans text-[11px] text-[#4a5068] uppercase tracking-wider block mb-1">{label}</span>
      <span className="font-display text-[14px] font-medium text-[#f1f3ff]">{value}</span>
    </div>
  );
}
