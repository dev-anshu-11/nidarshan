import { useState } from 'react';
import { useLocation } from 'wouter';
import { Signal, CreditCard, MessageSquare, Package, CheckCircle2 } from 'lucide-react';

export function Upload() {
  const [, setLocation] = useLocation();
  const [files, setFiles] = useState<{ zone: number, name: string, size: string }[]>([]);

  const handleDrop = (zone: number) => {
    // Mocking file drop for UI purposes
    const ext = zone === 1 ? 'csv' : zone === 2 ? 'xlsx' : zone === 3 ? 'eml' : 'apk';
    const mockFile = { zone, name: `sample_data_v2.${ext}`, size: '1.2 MB' };
    setFiles(prev => [...prev, mockFile]);
  };

  const hasEnoughFiles = new Set(files.map(f => f.zone)).size >= 2;

  const startInvestigation = () => {
    if (hasEnoughFiles) {
      setLocation('/processing');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8 relative">
      <div className="w-full max-w-[680px] flex flex-col gap-8">
        {/* Case Reference */}
        <div className="flex flex-col gap-2">
          <label className="font-display text-[14px] font-medium text-[#f1f3ff]">Case Reference</label>
          <input 
            type="text" 
            placeholder="Enter case name or FIR number"
            className="w-full bg-[#0f1018] border border-[#1c1e2e] focus:border-[#7c3aed] text-[#f1f3ff] rounded-lg px-4 py-3 font-sans text-[14px] outline-none transition-colors"
          />
        </div>

        {/* Upload Zones */}
        <div className="grid grid-cols-2 gap-4">
          <UploadZone id={1} title="CDR / IPDR" accept=".csv .xlsx .xls" icon={<Signal size={32} />} onDrop={() => handleDrop(1)} activeFiles={files.filter(f => f.zone === 1)} />
          <UploadZone id={2} title="Bank / UPI" accept=".csv .xlsx .xls" icon={<CreditCard size={32} />} onDrop={() => handleDrop(2)} activeFiles={files.filter(f => f.zone === 2)} />
          <UploadZone id={3} title="Chat / Email" accept=".txt .json .eml" icon={<MessageSquare size={32} />} onDrop={() => handleDrop(3)} activeFiles={files.filter(f => f.zone === 3)} />
          <UploadZone id={4} title="APK Files" accept=".apk" icon={<Package size={32} />} onDrop={() => handleDrop(4)} activeFiles={files.filter(f => f.zone === 4)} />
        </div>

        {/* Start Button */}
        <button 
          onClick={startInvestigation}
          disabled={!hasEnoughFiles}
          className={`w-full h-[52px] rounded-lg font-display text-[16px] font-semibold transition-colors flex items-center justify-center gap-2
            ${hasEnoughFiles ? 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white cursor-pointer' : 'bg-[#141622] text-[#4a5068] cursor-not-allowed border border-[#1c1e2e]'}
          `}
        >
          Start Investigation <span>→</span>
        </button>
      </div>
    </div>
  );
}

function UploadZone({ title, accept, icon, onDrop, activeFiles }: any) {
  const isFilled = activeFiles.length > 0;
  
  return (
    <div 
      onClick={onDrop}
      className={`h-[180px] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all border-[1.5px] border-dashed
        ${isFilled ? 'bg-[#1a103a] border-[#7c3aed]' : 'bg-[#0f1018] border-[#2a2d42] hover:border-[#7c3aed]'}
      `}
    >
      {!isFilled ? (
        <>
          <div className="text-[#8891aa] mb-4">{icon}</div>
          <span className="font-display text-[15px] font-semibold text-[#f1f3ff] mb-1">{title}</span>
          <span className="font-sans text-[11px] text-[#4a5068]">{accept}</span>
        </>
      ) : (
        <div className="flex flex-col items-center text-center px-4">
          <CheckCircle2 size={32} className="text-[#10b981] mb-3" />
          <span className="font-mono text-[12px] text-[#f1f3ff] truncate max-w-full mb-1">{activeFiles[0].name}</span>
          <span className="font-sans text-[11px] text-[#8891aa]">{activeFiles[0].size}</span>
          {activeFiles.length > 1 && (
            <span className="font-sans text-[10px] text-[#7c3aed] mt-2">+{activeFiles.length - 1} more file(s)</span>
          )}
        </div>
      )}
    </div>
  );
}
