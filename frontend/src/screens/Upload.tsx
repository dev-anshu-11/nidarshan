import React, { useState, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Signal, CreditCard, MessageSquare, Package, CheckCircle2, X, Upload as UploadIcon, AlertCircle, FolderOpen, FileQuestion } from 'lucide-react';
import { useCase } from '../lib/CaseContext';

interface QueuedFile {
  zone: number;
  file: File;
}

// ── Auto-routing logic ──────────────────────────────────────────────────────
function detectZone(file: File): number | null {
  const name = file.name.toLowerCase();
  const ext = name.split('.').pop() ?? '';

  if (ext === 'apk') return 4;
  if (['txt', 'json', 'eml'].includes(ext)) return 3;
  if (['csv', 'xlsx', 'xls'].includes(ext)) {
    if (/upi|bank|txn|payment|statement|account/.test(name)) return 2;
    if (/cdr|ipdr|call|detail|record/.test(name)) return 1;
    // ambiguous CSV — return null so we list it as unrouted
    return null;
  }
  return null;
}

const ZONE_LABELS: Record<number, string> = {
  1: 'CDR / IPDR',
  2: 'Bank / UPI',
  3: 'Chat / Email',
  4: 'APK Files',
};

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

        {/* Smart Folder / Bulk Upload */}
        <SmartFolderUpload onRoutedFiles={(routed) => {
          setFiles(prev => {
            const next = [...prev];
            for (const qf of routed) {
              // avoid exact duplicate (same name + zone)
              if (!next.some(x => x.zone === qf.zone && x.file.name === qf.file.name)) {
                next.push(qf);
              }
            }
            return next;
          });
          setUploadError(null);
        }} />

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

// ── SmartFolderUpload ───────────────────────────────────────────────────────
interface SmartFolderUploadProps {
  onRoutedFiles: (files: QueuedFile[]) => void;
}

function SmartFolderUpload({ onRoutedFiles }: SmartFolderUploadProps) {
  const folderRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<{ routed: QueuedFile[]; unrouted: File[] } | null>(null);

  const processFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const routed: QueuedFile[] = [];
    const unrouted: File[] = [];
    Array.from(fileList).forEach(file => {
      const zone = detectZone(file);
      if (zone !== null) routed.push({ zone, file });
      else unrouted.push(file);
    });
    setPreview({ routed, unrouted });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const confirmRouting = () => {
    if (!preview) return;
    onRoutedFiles(preview.routed);
    setPreview(null);
    // reset inputs so same folder can be re-selected
    if (folderRef.current) folderRef.current.value = '';
    if (filesRef.current) filesRef.current.value = '';
  };

  const dismiss = () => {
    setPreview(null);
    if (folderRef.current) folderRef.current.value = '';
    if (filesRef.current) filesRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-xl border-[1.5px] border-dashed transition-all px-6 py-5 flex flex-col gap-4
          ${isDragOver ? 'bg-[#1a103a] border-[#7c3aed] scale-[1.01]' : 'bg-[#0f1018] border-[#2a2d42]'}
        `}
      >
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-[#7c3aed]" />
            <span className="font-display text-[14px] font-semibold text-[#f1f3ff]">Smart Bulk Upload</span>
          </div>
          <span className="font-sans text-[11px] text-[#4a5068]">
            Auto-routes files to the correct evidence block
          </span>
        </div>

        {/* Routing legend */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { zone: 1, label: 'CDR / IPDR', hint: 'cdr, ipdr, call…', color: '#3b82f6' },
            { zone: 2, label: 'Bank / UPI', hint: 'upi, bank, txn…', color: '#10b981' },
            { zone: 3, label: 'Chat / Email', hint: '.txt .json .eml', color: '#f59e0b' },
            { zone: 4, label: 'APK Files', hint: '.apk', color: '#ec4899' },
          ].map(({ zone, label, hint, color }) => (
            <div key={zone} className="bg-[#141622] rounded-lg px-3 py-2.5 flex flex-col gap-0.5 border border-[#1c1e2e]">
              <span className="font-display text-[11px] font-bold" style={{ color }}>{label}</span>
              <span className="font-sans text-[10px] text-[#4a5068]">{hint}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => folderRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-[#141622] border border-[#1c1e2e] hover:border-[#7c3aed] text-[#f1f3ff] font-display text-[13px] font-medium transition-colors"
          >
            <FolderOpen size={15} className="text-[#7c3aed]" />
            Upload Folder
          </button>
          <button
            onClick={() => filesRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-[#141622] border border-[#1c1e2e] hover:border-[#7c3aed] text-[#f1f3ff] font-display text-[13px] font-medium transition-colors"
          >
            <UploadIcon size={15} className="text-[#7c3aed]" />
            Upload Mixed Files
          </button>
          <p className="self-center font-sans text-[11px] text-[#4a5068] whitespace-nowrap">
            or drag & drop here
          </p>
        </div>

        {/* Hidden inputs */}
        <input
          ref={folderRef}
          type="file"
          // @ts-ignore — webkitdirectory is non-standard but widely supported
          webkitdirectory=""
          multiple
          className="hidden"
          onChange={e => processFiles(e.target.files)}
        />
        <input
          ref={filesRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => processFiles(e.target.files)}
        />
      </div>

      {/* Preview panel */}
      {preview && (
        <div className="bg-[#0f1018] border border-[#1c1e2e] rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-[12px] font-semibold text-[#8891aa] uppercase tracking-wider">
              Routing Preview — {preview.routed.length + preview.unrouted.length} file(s)
            </span>
            <button onClick={dismiss} className="text-[#4a5068] hover:text-[#dc2626] transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Routed files */}
          {preview.routed.length > 0 && (
            <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
              {preview.routed.map((qf, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#141622] rounded-lg px-3 py-2">
                  <CheckCircle2 size={13} className="text-[#10b981] shrink-0" />
                  <span className="font-mono text-[12px] text-[#f1f3ff] truncate flex-1">{qf.file.name}</span>
                  <span className="font-sans text-[11px] text-[#4a5068] shrink-0">{(qf.file.size / 1024).toFixed(1)} KB</span>
                  <span className="font-display text-[10px] font-semibold shrink-0 px-2 py-0.5 rounded-full bg-[#1c1e2e] text-[#7c3aed]">
                    → {ZONE_LABELS[qf.zone]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Unrouted files */}
          {preview.unrouted.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="font-display text-[11px] text-[#f59e0b] uppercase tracking-wider">
                Unrecognised ({preview.unrouted.length}) — will be skipped
              </span>
              {preview.unrouted.map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#141622] rounded-lg px-3 py-2 opacity-50">
                  <FileQuestion size={13} className="text-[#f59e0b] shrink-0" />
                  <span className="font-mono text-[12px] text-[#f1f3ff] truncate flex-1">{f.name}</span>
                  <span className="font-sans text-[11px] text-[#4a5068] shrink-0">{(f.size / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>
          )}

          {/* Confirm / Cancel */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={confirmRouting}
              disabled={preview.routed.length === 0}
              className={`flex-1 h-9 rounded-lg font-display text-[13px] font-semibold transition-all
                ${preview.routed.length > 0
                  ? 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white'
                  : 'bg-[#141622] text-[#4a5068] border border-[#1c1e2e] cursor-not-allowed'}
              `}
            >
              Add {preview.routed.length} File{preview.routed.length !== 1 ? 's' : ''} to Queue
            </button>
            <button
              onClick={dismiss}
              className="px-4 h-9 rounded-lg font-display text-[13px] font-medium text-[#8891aa] bg-[#141622] border border-[#1c1e2e] hover:border-[#dc2626] hover:text-[#dc2626] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
