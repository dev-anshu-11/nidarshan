import { FileText } from 'lucide-react';
import { FileHash } from './FileHash';
import { SourceReference } from '../../lib/types';

export function SourceRow({ source }: { source: SourceReference }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[#141622] border border-[#1c1e2e]">
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-[#8891aa]" />
        <span className="font-mono text-[12px] text-[#f1f3ff] truncate">{source.filename}</span>
      </div>
      <div className="flex items-center justify-between pl-5">
        <span className="font-sans text-[11px] text-[#8891aa]">Rows {source.rows}</span>
        <FileHash hash={source.hash} />
      </div>
    </div>
  );
}
