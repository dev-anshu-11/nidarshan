import React, { useState, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Signal, CreditCard, MessageSquare, Package, CheckCircle2, X, Upload as UploadIcon, AlertCircle } from 'lucide-react';
import { useCase } from '../lib/CaseContext';

interface QueuedFile {
  zone: number;
  file: File;
}

export function Upload() {
  const [, setLocation] = useLocation();
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [caseRef, setCaseRef] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const caseCtx = useCase();

  const addFiles = (zone: number, fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: QueuedFile[] = Array.from(fileList).map(f => ({ zone, file: f }));
    setFiles(prev => [...prev, ...newFiles]);
    setUploadError(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const hasEnoughFiles = new Set(files.map(f => f.zone)).size >= 1 && files.length >= 1;

  const startInvestigation = async () => {
    if (!hasEnoughFiles) return;

    const caseName = caseRef.trim() || `CASE-${Date.now()}`;
    setIsUploading(true);
    setUploadError(null);
    caseCtx.setCaseName(caseName);
    caseCtx.setStatus('uploading');

    try {
      // Step 1: Create case
      const caseNumber = `KRN-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      caseCtx.setCaseNumber(caseNumber);

      // Step 2: Upload files
      const formData = new FormData();
      for (const qf of files) {
        formData.append('files', qf.file);
      }

      const uploadRes = await fetch(`/api/cases/${caseNumber}/evidence`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(err.message || `Upload failed (${uploadRes.status})`);
      }

      const uploadData = await uploadRes.json();
      caseCtx.setUploadedFiles(uploadData.uploads || []);
      caseCtx.setStatus('processing');
      setLocation('/processing');
    } catch (err: any) {
      setUploadError(err.message || 'Something went wrong during upload');
      caseCtx.setStatus('error');
      caseCtx.setError(err.message);
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8 relative">
      <div className="w-full max-w-[720px] flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-[22px] font-bold text-[#f1f3ff]">New Investigation</h2>
          <p className="font-sans text-[13px] text-[#8891aa]">
            Upload evidence files to begin forensic correlation analysis.
          </p>
        </div>

        {/* Case Reference */}
        <div className="flex flex-col gap-2">
          <label className="font-display text-[12px] font-medium text-[#8891aa] uppercase tracking-wider">Case Reference / FIR Number</label>
          <input
            type="text"
            value={caseRef}
            onChange={e => setCaseRef(e.target.value)}
            placeholder="e.g. FIR-2026/KRN-001 or Operation DarkNet"
            className="w-full bg-[#0f1018] border border-[#1c1e2e] focus:border-[#7c3aed] text-[#f1f3ff] rounded-lg px-4 py-3 font-sans text-[14px] outline-none transition-colors"
          />
        </div>

        {/* Upload Zones */}
        <div className="grid grid-cols-2 gap-4">
          <UploadZone id={1} title="CDR / IPDR" accept=".csv,.xlsx,.xls" icon={<Signal size={28} />} onFilesSelected={f => addFiles(1, f)} fileCount={files.filter(f => f.zone === 1).length} />
          <UploadZone id={2} title="Bank / UPI" accept=".csv,.xlsx,.xls" icon={<CreditCard size={28} />} onFilesSelected={f => addFiles(2, f)} fileCount={files.filter(f => f.zone === 2).length} />
          <UploadZone id={3} title="Chat / Email" accept=".txt,.json,.eml" icon={<MessageSquare size={28} />} onFilesSelected={f => addFiles(3, f)} fileCount={files.filter(f => f.zone === 3).length} />
          <UploadZone id={4} title="APK Files" accept=".apk" icon={<Package size={28} />} onFilesSelected={f => addFiles(4, f)} fileCount={files.filter(f => f.zone === 4).length} />
        </div>

        {/* Queued Files List */}
        {files.length > 0 && (
          <div className="bg-[#0f1018] border border-[#1c1e2e] rounded-xl p-4">
            <h3 className="font-display text-[12px] font-semibold text-[#8891aa] uppercase tracking-wider mb-3">
              Queued Files ({files.length})
            </h3>
            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
              {files.map((qf, idx) => (
                <div key={idx} className="flex items-center justify-between bg-[#141622] rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={14} className="text-[#10b981]" />
                    <span className="font-mono text-[12px] text-[#f1f3ff] truncate max-w-[300px]">{qf.file.name}</span>
                    <span className="font-sans text-[11px] text-[#4a5068]">{(qf.file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button onClick={() => removeFile(idx)} className="text-[#4a5068] hover:text-[#dc2626] transition-colors p-1">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {uploadError && (
          <div className="flex items-center gap-3 bg-[#1f0808] border border-[#dc2626]/30 rounded-lg px-4 py-3">
            <AlertCircle size={16} className="text-[#dc2626] shrink-0" />
            <span className="font-sans text-[13px] text-[#dc2626]">{uploadError}</span>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={startInvestigation}
          disabled={!hasEnoughFiles || isUploading}
          className={`w-full h-[52px] rounded-lg font-display text-[16px] font-semibold transition-all flex items-center justify-center gap-2
            ${hasEnoughFiles && !isUploading
              ? 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white cursor-pointer shadow-[0_0_30px_rgba(124,58,237,0.25)]'
              : 'bg-[#141622] text-[#4a5068] cursor-not-allowed border border-[#1c1e2e]'}
          `}
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Uploading Evidence...
            </>
          ) : (
            <>
              <UploadIcon size={18} />
              Start Investigation <span>→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function UploadZone({ title, accept, icon, onFilesSelected, fileCount }: {
  id: number;
  title: string;
  accept: string;
  icon: React.ReactNode;
  onFilesSelected: (files: FileList | null) => void;
  fileCount: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onFilesSelected(e.dataTransfer.files);
  }, [onFilesSelected]);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`h-[160px] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all border-[1.5px] border-dashed relative
        ${isDragOver ? 'bg-[#1a103a] border-[#7c3aed] scale-[1.02]' :
          fileCount > 0 ? 'bg-[#0a1a12] border-[#10b981]' :
          'bg-[#0f1018] border-[#2a2d42] hover:border-[#7c3aed] hover:bg-[#0f1018]'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={e => onFilesSelected(e.target.files)}
        className="hidden"
      />
      <div className={`mb-3 ${fileCount > 0 ? 'text-[#10b981]' : 'text-[#8891aa]'}`}>
        {fileCount > 0 ? <CheckCircle2 size={28} /> : icon}
      </div>
      <span className="font-display text-[14px] font-semibold text-[#f1f3ff] mb-0.5">{title}</span>
      <span className="font-sans text-[11px] text-[#4a5068]">{accept}</span>
      {fileCount > 0 && (
        <span className="absolute top-2 right-3 bg-[#10b981] text-white font-display text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{fileCount}</span>
      )}
    </div>
  );
}
