import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { truncateHash } from '../../lib/formatting';

export function FileHash({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[12px] text-[#a3aed0]">{truncateHash(hash, 16)}</span>
      <button 
        onClick={handleCopy}
        className="text-[#8891aa] hover:text-[#f1f3ff] transition-colors"
        title="Copy Hash"
      >
        {copied ? <Check size={12} className="text-[#10b981]" /> : <Copy size={12} />}
      </button>
      <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" title="Hash verified" />
    </div>
  );
}
