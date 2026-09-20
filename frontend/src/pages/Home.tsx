import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Command,
  Cpu,
  Database,
  Download,
  Eye,
  FileText,
  FolderOpen,
  Globe2,
  Landmark,
  Link2,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Network,
  Plus,
  Radar,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  SlidersHorizontal,
  Upload,
  UserRound,
  Users,
  Wifi,
  X,
} from "lucide-react";
import type { CaseEntity, CasePayload, CaseSnapshot, EvidenceRecord, NetworkEdge, NetworkNode, RiskTier, Tone } from "@shared/kronos";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const toneStyles: Record<Tone, { text: string; bg: string; border: string; dot: string }> = {
  red: { text: "text-rose-300", bg: "bg-rose-500/10", border: "border-rose-400/25", dot: "bg-rose-400" },
  orange: { text: "text-orange-300", bg: "bg-orange-400/10", border: "border-orange-300/25", dot: "bg-orange-300" },
  yellow: { text: "text-amber-300", bg: "bg-amber-300/10", border: "border-amber-300/25", dot: "bg-amber-300" },
  green: { text: "text-emerald-300", bg: "bg-emerald-400/10", border: "border-emerald-300/25", dot: "bg-emerald-300" },
  blue: { text: "text-sky-300", bg: "bg-sky-400/10", border: "border-sky-300/25", dot: "bg-sky-300" },
  purple: { text: "text-violet-300", bg: "bg-violet-400/10", border: "border-violet-300/25", dot: "bg-violet-300" },
  slate: { text: "text-slate-300", bg: "bg-slate-400/10", border: "border-slate-300/25", dot: "bg-slate-300" },
};

const tierTone: Record<RiskTier, Tone> = {
  CRITICAL: "red",
  HIGH: "orange",
  MEDIUM: "yellow",
  LOW: "green",
};

const navItems = [
  { id: "overview", label: "Overview", icon: Radar, section: "Workspace" },
  { id: "network", label: "Network graph", icon: Network, section: "Workspace" },
  { id: "evidence", label: "Evidence review", icon: BookOpenCheck, section: "Workspace" },
  { id: "brief", label: "Investigative brief", icon: FileText, section: "Workspace" },
];

type ApkTriage = { id: number | string; originalName: string; sha256: string; entryCount: number; permissions: string[]; urls: string[]; ips: string[]; riskFlags: string[]; manifestFound: boolean; };

type LiveAnalysis = { entityCount: number; linkCount: number; fileCount: number; };

type UploadedEvidence = {
  id: number | string;
  originalName: string;
  format: "CSV" | "EML";
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  storageUrl: string;
  rowCount: number;
  headers: string[];
  preview: unknown[];
  receivedIps: string[];
  entities: { type: string; value: string; confidence: number }[];
  textSummary: string;
  createdAt: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function downloadBrief(payload: CasePayload) {
  const lines = [
    "KRONOS INVESTIGATIVE BRIEF",
    `Generated: ${payload.generatedAt}`,
    `Entities: ${payload.summary.entities} | Links: ${payload.summary.links} | Critical: ${payload.summary.critical}`,
    "",
    "PRIORITY ENTITIES",
    ...payload.entities.filter(entity => entity.tier === "CRITICAL").map((entity, index) => `${index + 1}. ${entity.value} — ${entity.tier} ${entity.risk}/100\n   ${entity.reasons.join("\n   ")}`),
    "",
    "RECOMMENDED NEXT STEPS",
    ...payload.recommendations.map((item, index) => `${index + 1}. ${item}`),
    "",
    "For investigative assistance only. Findings require human verification and applicable authorization.",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "kronos-investigative-brief.txt";
  anchor.click();
  URL.revokeObjectURL(url);
  toast.success("Investigative brief downloaded");
}

function EntityIcon({ type, size = 16 }: { type: CaseEntity["type"]; size?: number }) {
  if (type === "DEVICE") return <Smartphone size={size} />;
  if (type === "IP_ADDRESS") return <Globe2 size={size} />;
  if (type === "MULE" || type === "CASHOUT") return <Landmark size={size} />;
  if (type === "VICTIM") return <UserRound size={size} />;
  if (type === "PHONE") return <Smartphone size={size} />;
  return <CircleDollarSign size={size} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{children}</div>;
}

function RiskBadge({ tier }: { tier: RiskTier }) {
  const tone = toneStyles[tierTone[tier]];
  return <span className={`rounded-md border px-2 py-1 text-[10px] font-semibold tracking-[0.12em] ${tone.bg} ${tone.border} ${tone.text}`}>{tier}</span>;
}

function MiniBar({ value, tone }: { value: number; tone: Tone }) {
  return <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]"><div className={`h-full rounded-full ${toneStyles[tone].dot}`} style={{ width: `${value}%` }} /></div>;
}

function AppHeader({ caseData, onMenu, onNotify }: { caseData: CaseSnapshot; onMenu: () => void; onNotify: () => void }) {
  return (
    <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0b0c12]/90 px-5 backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-3 lg:gap-5">
        <button className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white lg:hidden" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/30"><ShieldCheck size={19} /></div>
          <div>
            <div className="flex items-center gap-2"><span className="font-display text-[17px] font-semibold tracking-[0.22em] text-white">KRONOS</span><span className="rounded bg-violet-400/10 px-1.5 py-0.5 text-[9px] font-medium tracking-[0.15em] text-violet-300">BETA</span></div>
            <div className="mt-0.5 text-[10px] tracking-[0.13em] text-slate-500">CYBER-FRAUD INTELLIGENCE</div>
          </div>
        </div>
        <div className="hidden h-7 w-px bg-white/10 lg:block" />
        <div className="hidden items-center gap-2 text-sm text-slate-400 md:flex"><FolderOpen size={14} className="text-violet-300" /><span>{caseData.caseNumber}</span><ChevronRight size={13} className="text-slate-600" /><span className="max-w-[220px] truncate text-slate-300">{caseData.name}</span></div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[11px] text-emerald-300 sm:flex"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />Analysis synced</div>
        <button onClick={onNotify} className="relative rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white" aria-label="Notifications"><Bell size={17} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-400" /></button>
        <div className="flex items-center gap-2 border-l border-white/10 pl-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700/80 text-xs font-semibold text-slate-200">AS</div><div className="hidden leading-tight sm:block"><div className="text-xs font-medium text-slate-200">A. Singh</div><div className="text-[10px] text-slate-500">Investigator</div></div></div>
      </div>
    </header>
  );
}

function Sidebar({ activeView, setActiveView, open, close, onAction }: { activeView: string; setActiveView: (id: string) => void; open: boolean; close: () => void; onAction: (label: string) => void }) {
  return <aside className={`fixed inset-y-0 left-0 z-30 flex w-[248px] flex-col border-r border-white/[0.08] bg-[#0b0c12] px-4 py-5 transition-transform duration-200 lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
    <div className="mb-9 flex items-center justify-between px-2 lg:hidden"><span className="font-display text-xs tracking-[0.2em] text-slate-400">NAVIGATION</span><button onClick={close} className="rounded-md p-1.5 text-slate-500 hover:text-white"><X size={16} /></button></div>
    <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">Workspace</div>
    <nav className="space-y-1">
      {navItems.map(item => { const Icon = item.icon; const active = activeView === item.id; return <button key={item.id} onClick={() => { setActiveView(item.id); close(); }} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${active ? "bg-violet-400/10 text-violet-200 shadow-[inset_3px_0_0_#a78bfa]" : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"}`}><Icon size={17} className={active ? "text-violet-300" : "text-slate-500 group-hover:text-slate-300"} /><span>{item.label}</span>{item.id === "evidence" && <span className="ml-auto rounded-full bg-rose-400/15 px-1.5 py-0.5 text-[9px] text-rose-300">5</span>}</button>; })}
    </nav>
    <div className="my-7 h-px bg-white/[0.07]" />
    <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">Case tools</div>
    <nav className="space-y-1">
      {[{ label: "Case files", icon: FolderOpen }, { label: "Data sources", icon: Database }, { label: "Saved queries", icon: Command }].map(({ label, icon: Icon }) => <button key={label} onClick={() => onAction(label)} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-500 transition hover:bg-white/[0.05] hover:text-slate-200"><Icon size={17} className="text-slate-600 group-hover:text-slate-300" /><span>{label}</span></button>)}
    </nav>
    <div className="mt-auto">
      <div className="mb-4 rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-500/[0.12] to-sky-400/[0.04] p-4"><div className="mb-2 flex items-center gap-2 text-violet-200"><SparkleIcon /><span className="text-xs font-semibold">Signal assist</span></div><p className="text-[11px] leading-5 text-slate-400">Ask KRONOS to surface relationships across the current case.</p><button onClick={() => onAction("Signal assist")} className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-violet-300 hover:text-violet-200">Open assistant <ArrowUpRight size={13} /></button></div>
      <button onClick={() => onAction("Settings")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"><Settings2 size={17} /><span>Settings</span></button>
      <div className="mt-4 px-2 text-[10px] leading-4 text-slate-600">KRONOS v0.8.2<br />Evidence-first intelligence</div>
    </div>
  </aside>;
}

function SparkleIcon() { return <span className="relative flex h-5 w-5 items-center justify-center"><span className="absolute h-2 w-2 rotate-45 rounded-[2px] bg-violet-300" /><span className="absolute -right-0.5 top-0 h-1.5 w-1.5 rounded-full bg-sky-300" /></span>; }

function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300"><span className="h-1 w-1 rounded-full bg-violet-300" />{eyebrow}</div><h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-white md:text-[28px]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p></div>{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}</div>;
}

function StatCard({ label, value, detail, icon: Icon, tone, trend }: { label: string; value: string; detail: string; icon: React.ComponentType<{ size?: number; className?: string }>; tone: Tone; trend?: "up" | "down" }) {
  const style = toneStyles[tone];
  return <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11131c] p-4 transition hover:border-white/[0.14]"><div className={`absolute -right-10 -top-10 h-24 w-24 rounded-full blur-3xl ${style.dot} opacity-[0.12]`} /><div className="relative flex items-start justify-between"><div><div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div><div className="font-display text-2xl font-semibold tracking-tight text-white">{value}</div><div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">{trend && (trend === "up" ? <ArrowUpRight size={13} className="text-emerald-300" /> : <ArrowDownRight size={13} className="text-rose-300" />)}<span>{detail}</span></div></div><div className={`rounded-xl border p-2.5 ${style.bg} ${style.border} ${style.text}`}><Icon size={18} /></div></div></div>;
}

function RiskQueue({ payload, selectedId, onSelect }: { payload: CasePayload; selectedId: string; onSelect: (id: string) => void }) {
  const [filter, setFilter] = useState<"ALL" | RiskTier>("ALL");
  const [expanded, setExpanded] = useState<string | null>(selectedId);
  const items = useMemo(() => payload.entities.filter(entity => filter === "ALL" || entity.tier === filter).sort((a, b) => b.risk - a.risk), [payload.entities, filter]);
  return <div className="rounded-2xl border border-white/[0.08] bg-[#11131c]">
    <div className="flex flex-col justify-between gap-3 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><h2 className="font-display text-sm font-semibold text-white">Priority entities</h2><span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-slate-400">{items.length}</span></div><p className="mt-1 text-xs text-slate-500">Ranked by explainable investigative risk</p></div><div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-white/[0.02] p-1">{["ALL", "CRITICAL", "HIGH", "MEDIUM"].map(item => <button key={item} onClick={() => setFilter(item as "ALL" | RiskTier)} className={`rounded-md px-2 py-1.5 text-[9px] font-semibold tracking-[0.08em] transition ${filter === item ? "bg-violet-400/15 text-violet-200" : "text-slate-600 hover:text-slate-300"}`}>{item === "ALL" ? "ALL" : item.slice(0, 3)}</button>)}</div></div>
    <div className="divide-y divide-white/[0.06]">{items.map(entity => { const tone = tierTone[entity.tier]; const isOpen = expanded === entity.id; return <div key={entity.id} className={`transition ${selectedId === entity.id ? "bg-violet-400/[0.045]" : ""}`}><button onClick={() => { onSelect(entity.id); setExpanded(isOpen ? null : entity.id); }} className="flex w-full items-center gap-3 p-4 text-left hover:bg-white/[0.03]"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneStyles[tone].bg} ${toneStyles[tone].text}`}><EntityIcon type={entity.type} size={15} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-medium text-slate-200">{entity.value}</span><RiskBadge tier={entity.tier} /></div><div className="mt-2 flex items-center gap-2"><MiniBar value={entity.risk} tone={tone} /><span className={`w-7 text-right font-display text-sm font-semibold ${toneStyles[tone].text}`}>{entity.risk}</span></div></div><ChevronRight size={16} className={`shrink-0 text-slate-600 transition ${isOpen ? "rotate-90 text-violet-300" : ""}`} /></button>{isOpen && <div className="border-t border-white/[0.05] px-4 pb-4 pl-[60px]"><div className="mb-3 text-xs text-slate-400">{entity.summary}</div><div className="space-y-2">{entity.reasons.map(reason => <div key={reason} className="flex gap-2 text-[11px] leading-5 text-slate-500"><span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${toneStyles[tone].dot}`} />{reason}</div>)}</div><div className="mt-3 flex flex-wrap gap-1.5">{entity.tags.map(tag => <span key={tag} className="rounded bg-white/[0.05] px-2 py-1 text-[9px] text-slate-500">{tag}</span>)}</div></div>}</div>; })}</div>
  </div>;
}

function Timeline({ events, onSelect }: { events: CasePayload["timeline"]; onSelect: (id: string) => void }) {
  return <div className="rounded-2xl border border-white/[0.08] bg-[#11131c] p-5"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-sm font-semibold text-white">Evidence timeline</h2><p className="mt-1 text-xs text-slate-500">The sequence that shaped the lead</p></div><button onClick={() => toast.info("Timeline is already showing the full analysis window.")} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-white" aria-label="Timeline options"><MoreHorizontal size={17} /></button></div><div className="relative space-y-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-white/[0.09]">{events.map(event => { const style = toneStyles[event.tone]; return <button key={event.id} onClick={() => onSelect(event.relatedEntity)} className="group relative flex w-full gap-3 text-left"><span className={`relative z-10 mt-1.5 h-2 w-2 shrink-0 rounded-full ring-4 ring-[#11131c] ${style.dot}`} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-slate-300 group-hover:text-white">{event.title}</span><span className="shrink-0 font-display text-[10px] text-slate-600">{event.timeLabel}</span></div><p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">{event.detail}</p><span className={`mt-2 inline-flex rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.12em] ${style.bg} ${style.text}`}>{event.tag}</span></div></button>; })}</div></div>;
}

function NetworkSvg({ payload, selectedId, onSelect, compact = false }: { payload: CasePayload; selectedId?: string; onSelect: (id: string) => void; compact?: boolean }) {
  const nodeMap = useMemo(() => Object.fromEntries(payload.nodes.map(node => [node.id, node])), [payload.nodes]);
  const width = 900;
  const height = 540;
  return <div className={`network-grid relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0e15] ${compact ? "h-[360px]" : "h-[540px]"}`}><svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label="Fraud relationship network">
    <defs>
      {Object.entries(toneStyles).map(([key, style]) => <marker key={key} id={`arrow-${key}`} markerWidth="8" markerHeight="8" refX="7" refY="3.5" orient="auto"><path d="M0,0 L0,7 L8,3.5 z" fill={key === "red" ? "#fb7185" : key === "orange" ? "#fb923c" : key === "purple" ? "#c084fc" : key === "blue" ? "#38bdf8" : "#facc15"} opacity="0.85" /></marker>)}
      <filter id="softGlow"><feGaussianBlur stdDeviation="5" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
    </defs>
    <g opacity="0.33">{Array.from({ length: 14 }).map((_, index) => <line key={`v-${index}`} x1={index * 70} x2={index * 70} y1="0" y2={height} stroke="#ffffff" strokeOpacity="0.04" />)}{Array.from({ length: 9 }).map((_, index) => <line key={`h-${index}`} x1="0" x2={width} y1={index * 70} y2={index * 70} stroke="#ffffff" strokeOpacity="0.04" />)}</g>
    <g>{payload.edges.map(edge => { const from = nodeMap[edge.from]; const to = nodeMap[edge.to]; if (!from || !to) return null; const color = edge.risk === "red" ? "#fb7185" : edge.risk === "orange" ? "#fb923c" : edge.risk === "purple" ? "#c084fc" : "#38bdf8"; const related = selectedId === edge.from || selectedId === edge.to; const dashed = edge.label === "uses" || edge.label === "linked to" || edge.label === "session" || edge.label === "observed"; return <g key={edge.id} opacity={selectedId && !related ? 0.28 : 0.9}><line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth={related ? 2.4 : 1.4} strokeDasharray={dashed ? "6 5" : undefined} markerEnd={`url(#arrow-${edge.risk})`} /><text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 8} textAnchor="middle" className="fill-slate-500 text-[9px]" style={{ fontSize: compact ? 8 : 9 }}>{edge.label}</text></g>; })}</g>
    <g>{payload.nodes.map(node => { const tone = tierTone[node.tier]; const selected = selectedId === node.id; const radius = node.type === "DEVICE" || node.type === "IP_ADDRESS" ? 24 : 30; return <g key={node.id} onClick={() => onSelect(node.id)} className="cursor-pointer" opacity={selectedId && !selected ? 0.42 : 1}><circle cx={node.x} cy={node.y} r={radius + 8} fill={toneStyles[tone].dot} opacity={selected ? 0.18 : 0.07} filter={selected ? "url(#softGlow)" : undefined} /><circle cx={node.x} cy={node.y} r={radius} fill="#171a25" stroke={tone === "red" ? "#fb7185" : tone === "orange" ? "#fb923c" : tone === "yellow" ? "#facc15" : tone === "green" ? "#34d399" : tone === "purple" ? "#c084fc" : "#38bdf8"} strokeWidth={selected ? 3 : 1.5} /><text x={node.x} y={node.y - 2} textAnchor="middle" className="fill-slate-200 text-[10px] font-semibold" style={{ fontSize: compact ? 9 : 10 }}>{node.label}</text><text x={node.x} y={node.y + 12} textAnchor="middle" className="fill-slate-500 text-[8px]" style={{ fontSize: compact ? 7 : 8 }}>{node.type}</text><g transform={`translate(${node.x + radius - 4}, ${node.y - radius - 5})`}><circle r="9" fill="#12141d" stroke="#2b3042" /><text y="3" textAnchor="middle" className={`text-[8px] font-semibold ${toneStyles[tone].text.replace("text-", "fill-")}`} style={{ fontSize: 8 }}>{node.risk}</text></g></g>; })}</g>
  </svg><div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-lg border border-white/[0.07] bg-[#10121b]/90 px-3 py-2 text-[10px] text-slate-500 backdrop-blur"><Network size={13} className="text-violet-300" /> Relationship view <span className="text-slate-700">·</span> {payload.nodes.length} nodes</div><div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap gap-3 rounded-lg border border-white/[0.07] bg-[#10121b]/90 px-3 py-2 backdrop-blur">{[{ label: "Victim", tone: "green" as Tone }, { label: "Mule", tone: "red" as Tone }, { label: "Device", tone: "blue" as Tone }, { label: "Shared IP", tone: "purple" as Tone }].map(item => <span key={item.label} className="flex items-center gap-1.5 text-[9px] text-slate-500"><span className={`h-1.5 w-1.5 rounded-full ${toneStyles[item.tone].dot}`} />{item.label}</span>)}</div></div>;
}

function Overview({ payload, selectedId, onSelect, goTo }: { payload: CasePayload; selectedId: string; onSelect: (id: string) => void; goTo: (view: string) => void }) {
  return <div><PageHeader eyebrow="Live case workspace" title="The signal inside the evidence" description="A single view of the money trail, shared infrastructure, and communication patterns shaping this investigation." actions={<><button onClick={() => goTo("evidence")} className="btn-secondary"><BookOpenCheck size={14} />Review evidence</button><button onClick={() => goTo("brief")} className="btn-primary"><Download size={14} />Export brief</button></>} /><div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Entities extracted" value={String(payload.summary.entities)} detail="across 4 evidence files" icon={Users} tone="purple" trend="up" /><StatCard label="Critical nodes" value={String(payload.summary.critical)} detail="priority human review" icon={AlertTriangle} tone="red" trend="up" /><StatCard label="Money in motion" value={formatCurrency(payload.summary.totalAmount)} detail="15 transaction records" icon={CircleDollarSign} tone="orange" /><StatCard label="Cross-source links" value={String(payload.summary.links)} detail="+12 since last scan" icon={Link2} tone="blue" trend="up" /></div><div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]"><div className="space-y-5"><RiskQueue payload={payload} selectedId={selectedId} onSelect={onSelect} /><div className="rounded-2xl border border-white/[0.08] bg-[#11131c] p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-sm font-semibold text-white">Network snapshot</h2><p className="mt-1 text-xs text-slate-500">The shortest path from victim to cash-out</p></div><button onClick={() => goTo("network")} className="flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200">Open graph <ArrowUpRight size={14} /></button></div><NetworkSvg payload={payload} selectedId={selectedId} onSelect={onSelect} compact /></div></div><div className="space-y-5"><Timeline events={payload.timeline} onSelect={onSelect} /><div className="rounded-2xl border border-orange-300/15 bg-gradient-to-br from-orange-300/[0.09] to-rose-400/[0.03] p-5"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2 text-orange-200"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-300/10"><AlertTriangle size={15} /></span><span className="text-sm font-semibold">Active signals</span></div><span className="text-[10px] font-semibold tracking-[0.15em] text-orange-300">{payload.alerts.length} OPEN</span></div><div className="space-y-4">{payload.alerts.map(alert => <div key={alert.title} className="border-l border-orange-300/30 pl-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-slate-200">{alert.title}</span><span className="font-display text-[10px] text-slate-600">{alert.timestamp}</span></div><p className="mt-1 text-[11px] leading-5 text-slate-500">{alert.detail}</p></div>)}</div><button onClick={() => goTo("evidence")} className="mt-5 flex items-center gap-1 text-xs text-orange-200 hover:text-orange-100">Inspect signal evidence <ChevronRight size={14} /></button></div></div></div></div>;
}

function NetworkView({ payload, selectedId, onSelect, goTo, onAction, caseNumber }: { payload: CasePayload; selectedId: string; onSelect: (id: string) => void; goTo: (view: string) => void; onAction: (label: string) => void; caseNumber: string }) {
  const selected = payload.entities.find(entity => entity.id === selectedId);
  const [live, setLive] = useState<LiveAnalysis | null>(null);
  const refreshLive = async () => {
    try {
      const response = await fetch(`/api/cases/${encodeURIComponent(caseNumber)}/analysis`);
      if (!response.ok) throw new Error("Unable to refresh live analysis");
      const result = await response.json();
      setLive({ entityCount: result.entityCount, linkCount: result.linkCount, fileCount: result.fileCount });
      toast.success(`Live graph refreshed from ${result.fileCount} uploaded file${result.fileCount === 1 ? "" : "s"}`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to refresh live analysis"); }
  };
  useEffect(() => { refreshLive(); }, [caseNumber]);
  return <div><PageHeader eyebrow="Relationship intelligence" title="Map the money-and-device network" description="Follow the shortest path from the reported transfer to downstream accounts, reused devices, and shared infrastructure." actions={<><button onClick={() => { refreshLive(); }} className="btn-secondary"><Radar size={14} />Refresh live</button><button onClick={() => onAction("Graph filters")} className="btn-secondary"><SlidersHorizontal size={14} />Filters</button><button onClick={() => goTo("brief")} className="btn-primary"><FileText size={14} />Create brief</button></>} /><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"><div><NetworkSvg payload={payload} selectedId={selectedId} onSelect={onSelect} /><div className="mt-3 grid grid-cols-3 gap-3"><div className="metric-strip"><span>Live entities</span><strong>{live?.entityCount ?? payload.nodes.length}</strong></div><div className="metric-strip"><span>Live links</span><strong>{live?.linkCount ?? payload.edges.length}</strong></div><div className="metric-strip"><span>Critical</span><strong className="text-rose-300">{payload.summary.critical}</strong></div></div></div><div className="rounded-2xl border border-white/[0.08] bg-[#11131c] p-5"><SectionLabel>Selected entity</SectionLabel>{selected ? <><div className="mb-4 flex items-start gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneStyles[tierTone[selected.tier]].bg} ${toneStyles[tierTone[selected.tier]].text}`}><EntityIcon type={selected.type} /></div><div className="min-w-0"><div className="break-words text-sm font-semibold text-slate-100">{selected.value}</div><div className="mt-1 flex items-center gap-2"><RiskBadge tier={selected.tier} /><span className="font-display text-xs text-slate-500">{selected.risk}/100</span></div></div></div><p className="mb-5 text-xs leading-5 text-slate-500">{selected.summary}</p><div className="space-y-4 border-t border-white/[0.07] pt-4"><div><div className="mb-2 flex justify-between text-[10px] uppercase tracking-[0.13em] text-slate-600"><span>Risk signal</span><span className="text-slate-400">{selected.risk}%</span></div><MiniBar value={selected.risk} tone={tierTone[selected.tier]} /></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/[0.035] p-3"><div className="text-[10px] text-slate-600">Sources</div><div className="mt-1 font-display text-lg text-slate-200">{selected.sourceCount}</div></div><div className="rounded-xl bg-white/[0.035] p-3"><div className="text-[10px] text-slate-600">Tags</div><div className="mt-1 font-display text-lg text-slate-200">{selected.tags.length}</div></div></div></div><button onClick={() => goTo("evidence")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300/20 bg-violet-300/10 px-3 py-2.5 text-xs font-medium text-violet-200 hover:bg-violet-300/15">View supporting evidence <ArrowUpRight size={14} /></button></> : <div className="py-10 text-center text-xs text-slate-600">Select a node to inspect its evidence trail.</div>}</div></div></div>;
}

function EvidenceView({ payload, selectedId, onSelect, onAction, caseNumber }: { payload: CasePayload; selectedId: string; onSelect: (id: string) => void; onAction: (label: string) => void; caseNumber: string }) {
  const [source, setSource] = useState<"ALL" | CasePayload["evidence"][number]["source"]>("ALL");
  const [uploaded, setUploaded] = useState<UploadedEvidence[]>([]);
  const [uploading, setUploading] = useState(false);
  const [apkUploading, setApkUploading] = useState(false);
  const [apkUploaded, setApkUploaded] = useState<ApkTriage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const apkInputRef = useRef<HTMLInputElement>(null);
  const selected = payload.entities.find(entity => entity.id === selectedId);

  useEffect(() => {
    fetch(`/api/cases/${encodeURIComponent(caseNumber)}/evidence`)
      .then(response => response.ok ? response.json() : Promise.reject(new Error("Unable to load uploaded evidence")))
      .then(result => setUploaded(result.files ?? []))
      .catch(() => undefined);
  }, [caseNumber]);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const form = new FormData();
    Array.from(files).forEach(file => form.append("files", file));
    try {
      const response = await fetch(`/api/cases/${encodeURIComponent(caseNumber)}/evidence`, { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Upload failed");
      setUploaded(previous => [...result.uploads, ...previous]);
      toast.success(`${result.uploads.length} evidence file${result.uploads.length === 1 ? "" : "s"} parsed and stored`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Evidence upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const uploadApk = async (files: FileList | null) => {
    if (!files?.length) return;
    setApkUploading(true);
    const form = new FormData();
    Array.from(files).forEach(file => form.append("files", file));
    try {
      const response = await fetch(`/api/cases/${encodeURIComponent(caseNumber)}/apk`, { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "APK triage failed");
      setApkUploaded(previous => [...result.artifacts, ...previous]);
      toast.success(`${result.artifacts.length} APK artifact${result.artifacts.length === 1 ? "" : "s"} triaged`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "APK triage failed");
    } finally {
      setApkUploading(false);
      if (apkInputRef.current) apkInputRef.current.value = "";
    }
  };

  const uploadedEvidence: EvidenceRecord[] = uploaded.map(file => ({
    id: `upload-${file.id}`,
    source: file.format,
    title: `${file.format} parsed · ${file.originalName}`,
    detail: `${file.textSummary}${file.receivedIps.length ? ` · IPs: ${file.receivedIps.join(", ")}` : ""}`,
    timestamp: new Date(file.createdAt).toLocaleString(),
    confidence: 100,
    accent: file.format === "EML" ? "orange" : "blue",
  }));
  const evidence = [...uploadedEvidence, ...payload.evidence].filter(item => source === "ALL" || item.source === source);
  const sourceFiles = [...uploaded.map(file => ({ name: file.originalName, type: `${file.format} · ${file.textSummary}`, rows: file.rowCount, hash: `${file.sha256.slice(0, 8)}…${file.sha256.slice(-4)}`, status: "verified" })), ...payload.sourceFiles];

  return <div><input ref={inputRef} type="file" accept=".csv,.eml,text/csv,message/rfc822" multiple className="hidden" onChange={event => uploadFiles(event.target.files)} /><input ref={apkInputRef} type="file" accept=".apk,application/vnd.android.package-archive" multiple className="hidden" onChange={event => uploadApk(event.target.files)} /><PageHeader eyebrow="Evidence review" title="Make every lead traceable" description="Upload CSV or EML evidence. KRONOS parses records server-side, hashes the original bytes, extracts entities, and stores the source reference for review." actions={<div className="flex flex-wrap gap-2"><button onClick={() => inputRef.current?.click()} className="btn-primary" disabled={uploading}><Upload size={14} />{uploading ? "Parsing…" : "Add evidence"}</button><button onClick={() => apkInputRef.current?.click()} className="btn-secondary" disabled={apkUploading}><Smartphone size={14} />{apkUploading ? "Triaging…" : "Analyze APK"}</button></div>} /><div className="mb-5 flex flex-wrap items-center gap-2"><div className="flex items-center gap-2 text-xs text-slate-500"><Database size={14} className="text-violet-300" />{sourceFiles.length} source files</div><span className="h-4 w-px bg-white/10" /><div className="text-xs text-slate-500">SHA-256 integrity checked</div><div className="ml-auto flex items-center gap-1 rounded-lg border border-white/[0.07] bg-white/[0.02] p-1">{["ALL", "CSV", "EML", "UPI", "CDR", "IPDR", "CHAT"].map(item => <button key={item} onClick={() => setSource(item as typeof source)} className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${source === item ? "bg-violet-400/15 text-violet-200" : "text-slate-600 hover:text-slate-300"}`}>{item}</button>)}</div></div><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"><div className="rounded-2xl border border-white/[0.08] bg-[#11131c] p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-sm font-semibold text-white">Supporting records</h2><p className="mt-1 text-xs text-slate-500">{evidence.length} records match this view</p></div><button onClick={() => onAction("Evidence record options")} className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.06] hover:text-white" aria-label="Evidence record options"><MoreHorizontal size={17} /></button></div><div className="space-y-2">{evidence.map(item => { const style = toneStyles[item.accent]; return <button key={item.id} onClick={() => { const related = payload.edges.find(edge => edge.evidenceId === item.id); if (related) onSelect(related.from); else toast.info("Parsed upload is stored and ready for entity correlation."); }} className="flex w-full items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5 text-left transition hover:border-violet-300/20 hover:bg-violet-300/[0.04]"><div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.bg} ${style.text}`}>{item.source === "UPI" || item.source === "CSV" ? <CircleDollarSign size={15} /> : item.source === "CDR" ? <Activity size={15} /> : item.source === "IPDR" ? <Wifi size={15} /> : <MessageSquareText size={15} />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-slate-200">{item.title}</span><span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.1em] ${style.bg} ${style.text}`}>{item.source}</span></div><p className="mt-1 text-[11px] leading-5 text-slate-500">{item.detail}</p><div className="mt-2 flex items-center gap-3 text-[10px] text-slate-600"><span className="flex items-center gap-1"><Clock3 size={11} />{item.timestamp}</span><span className="flex items-center gap-1 text-emerald-300/70"><CheckCircle2 size={11} />{item.confidence}% confidence</span></div></div><ChevronRight size={15} className="mt-2 shrink-0 text-slate-600" /></button>; })}</div></div><div className="space-y-5"><div className="rounded-2xl border border-white/[0.08] bg-[#11131c] p-5"><SectionLabel>Source files</SectionLabel><div className="space-y-3">{sourceFiles.map(file => <div key={`${file.name}-${file.hash}`} className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-slate-400"><FileText size={14} /></div><div className="min-w-0 flex-1"><div className="truncate text-xs font-medium text-slate-300">{file.name}</div><div className="mt-1 truncate text-[10px] text-slate-600">{file.rows} records · {file.type}</div><div className="mt-1 font-mono text-[9px] text-slate-700">{file.hash}</div></div><CheckCircle2 size={14} className="text-emerald-300/70" /></div>)}</div></div><div className="rounded-2xl border border-orange-300/15 bg-orange-300/[0.04] p-5"><div className="mb-3 flex items-center justify-between"><SectionLabel>APK triage</SectionLabel><span className="text-[10px] text-orange-200">{apkUploaded.length} analyzed</span></div>{apkUploaded.length ? <div className="space-y-3">{apkUploaded.slice(0, 2).map(apk => <div key={apk.id}><div className="truncate text-xs font-medium text-slate-300">{apk.originalName}</div><div className="mt-1 text-[10px] text-slate-500">{apk.entryCount} archive entries · {apk.permissions.length} permissions · {apk.urls.length} URLs</div><div className="mt-2 flex flex-wrap gap-1">{apk.riskFlags.slice(0, 3).map(flag => <span key={flag} className="rounded bg-orange-300/10 px-1.5 py-0.5 text-[9px] text-orange-200">{flag}</span>)}</div></div>)}</div> : <p className="text-xs leading-5 text-slate-600">Upload an APK to inspect permissions, hardcoded URLs, IPs, and phishing indicators.</p>}</div><div className="rounded-2xl border border-violet-300/15 bg-violet-300/[0.05] p-5"><SectionLabel>Selected lead</SectionLabel>{selected ? <><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-300/10 text-violet-300"><EntityIcon type={selected.type} size={15} /></div><span className="truncate text-xs font-semibold text-slate-200">{selected.value}</span></div><p className="mt-3 text-[11px] leading-5 text-slate-500">{selected.reasons[0]}</p><button onClick={() => onSelect(selected.id)} className="mt-3 flex items-center gap-1 text-xs text-violet-300">Keep in focus <Eye size={13} /></button></> : <p className="text-xs text-slate-600">Select an entity to connect it to its evidence.</p>}</div></div></div></div>;
}

function BriefView({ payload, caseNumber }: { payload: CasePayload; caseNumber: string }) {
  const top = payload.entities.filter(entity => entity.tier === "CRITICAL").slice(0, 5);
  const [narrative, setNarrative] = useState<{ narrative: string; observedSignals: string[]; hypotheses: string[]; recommendedActions: string[]; disclaimer: string } | null>(null);
  const [working, setWorking] = useState(false);
  const runAnalysis = async () => {
    setWorking(true);
    try {
      const response = await fetch(`/api/cases/${encodeURIComponent(caseNumber)}/analyze`, { method: "POST" });
      if (!response.ok) throw new Error("Live analysis failed");
      toast.success("Live correlation and risk scoring completed");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Live analysis failed"); } finally { setWorking(false); }
  };
  const generateNarrative = async () => {
    setWorking(true);
    try {
      const response = await fetch(`/api/cases/${encodeURIComponent(caseNumber)}/narrative`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "AI narrative failed");
      setNarrative(result.narrative);
      toast.success("Evidence-grounded AI narrative generated");
    } catch (error) { toast.error(error instanceof Error ? error.message : "AI narrative failed"); } finally { setWorking(false); }
  };
  const downloadJson = () => { window.open(`/api/cases/${encodeURIComponent(caseNumber)}/report.json`, "_blank"); };
  const downloadPdf = () => { window.open(`/api/cases/${encodeURIComponent(caseNumber)}/report.pdf`, "_blank"); };
  return <div><PageHeader eyebrow="Case output" title="Investigative brief" description="A concise, evidence-linked handoff for the next investigator. Export-ready, but written for human review rather than automatic adjudication." actions={<div className="flex flex-wrap gap-2"><button onClick={runAnalysis} className="btn-secondary" disabled={working}><Radar size={14} />{working ? "Analyzing…" : "Analyze live"}</button><button onClick={generateNarrative} className="btn-secondary" disabled={working}><Cpu size={14} />AI narrative</button><button onClick={downloadJson} className="btn-secondary"><Download size={14} />JSON</button><button onClick={downloadPdf} className="btn-primary"><Download size={14} />PDF brief</button></div>} />{narrative && <div className="mb-5 rounded-2xl border border-violet-300/15 bg-violet-300/[0.05] p-5"><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-200"><Cpu size={15} />Evidence-grounded AI narrative</div><p className="text-sm leading-6 text-slate-300">{narrative.narrative}</p><div className="mt-4 grid gap-3 md:grid-cols-3"><div><div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Observed signals</div><ul className="mt-2 space-y-1 text-xs text-slate-400">{narrative.observedSignals.slice(0, 3).map(item => <li key={item}>• {item}</li>)}</ul></div><div><div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Hypotheses</div><ul className="mt-2 space-y-1 text-xs text-slate-400">{narrative.hypotheses.slice(0, 3).map(item => <li key={item}>• {item}</li>)}</ul></div><div><div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Next actions</div><ul className="mt-2 space-y-1 text-xs text-slate-400">{narrative.recommendedActions.slice(0, 3).map(item => <li key={item}>• {item}</li>)}</ul></div></div><p className="mt-4 text-[10px] text-slate-600">{narrative.disclaimer}</p></div>}<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]"><div className="space-y-5"><div className="rounded-2xl border border-white/[0.08] bg-[#11131c] p-6"><div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-start"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300"><ShieldCheck size={13} />KRONOS INVESTIGATIVE BRIEF</div><h2 className="font-display text-xl font-semibold text-white">{payload.summary.files} source files · {payload.summary.entities} entities · {payload.summary.links} links</h2><p className="mt-2 text-xs text-slate-500">Case {DEMO_CASE_NUMBER} · Generated {payload.generatedAt}</p></div><div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-2 text-right"><div className="text-[9px] uppercase tracking-[0.15em] text-emerald-300">Integrity status</div><div className="mt-1 flex items-center gap-1.5 text-xs text-slate-300"><CheckCircle2 size={13} className="text-emerald-300" />Verified</div></div></div><div className="mb-6"><SectionLabel>Case narrative</SectionLabel><p className="max-w-3xl text-sm leading-7 text-slate-300">The reported <span className="font-semibold text-orange-200">₹50,000</span> transfer moved from the victim account into a primary mule handle at 14:03, then split across three downstream accounts within eight minutes. The highest-confidence links are reinforced by a reused device identity, a shared IP address, and chat messages indicating account recruitment and OTP urgency.</p></div><div><div className="mb-3 flex items-center justify-between"><SectionLabel>Priority entities</SectionLabel><span className="text-[10px] text-slate-600">Top 5 by risk</span></div><div className="overflow-hidden rounded-xl border border-white/[0.07]"><div className="grid grid-cols-[38px_minmax(0,1fr)_86px_80px] gap-3 bg-white/[0.03] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-600"><span>#</span><span>Entity</span><span>Type</span><span className="text-right">Risk</span></div>{top.map((entity, index) => <div key={entity.id} className="grid grid-cols-[38px_minmax(0,1fr)_86px_80px] items-center gap-3 border-t border-white/[0.06] px-3 py-3"><span className="font-display text-xs text-slate-600">0{index + 1}</span><div className="flex min-w-0 items-center gap-2"><div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${toneStyles[tierTone[entity.tier]].bg} ${toneStyles[tierTone[entity.tier]].text}`}><EntityIcon type={entity.type} size={13} /></div><span className="truncate text-xs text-slate-300">{entity.value}</span></div><span className="text-[10px] text-slate-500">{entity.type}</span><div className="flex items-center justify-end gap-2"><span className={`font-display text-sm font-semibold ${toneStyles[tierTone[entity.tier]].text}`}>{entity.risk}</span><RiskBadge tier={entity.tier} /></div></div>)}</div></div></div></div><div className="rounded-2xl border border-white/[0.08] bg-[#11131c] p-6"><SectionLabel>Recommended next steps</SectionLabel><div className="grid gap-3 md:grid-cols-2">{payload.recommendations.map((recommendation, index) => <div key={recommendation} className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><span className="font-display text-sm text-violet-300/70">0{index + 1}</span><p className="text-xs leading-5 text-slate-400">{recommendation}</p></div>)}</div><p className="mt-5 text-[10px] leading-4 text-slate-600">For investigative assistance only. Findings require human verification and applicable authorization.</p></div></div><div className="space-y-5"><div className="rounded-2xl border border-rose-300/15 bg-gradient-to-br from-rose-300/[0.09] to-orange-300/[0.03] p-5"><div className="mb-5 flex items-center gap-2 text-rose-200"><AlertTriangle size={16} /><span className="text-sm font-semibold">Risk posture</span></div><div className="font-display text-4xl font-semibold text-white">CRITICAL</div><p className="mt-2 text-xs leading-5 text-slate-500">3 entities require priority review before the next case handoff.</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[86%] rounded-full bg-gradient-to-r from-orange-300 to-rose-400" /></div><div className="mt-2 flex justify-between text-[10px] text-slate-600"><span>LOW</span><span>HIGH</span><span>CRITICAL</span></div></div><div className="rounded-2xl border border-white/[0.08] bg-[#11131c] p-5"><SectionLabel>Report contents</SectionLabel><div className="space-y-3">{["Case summary", "Prime suspects", "Transaction timeline", "Evidence provenance", "Review recommendations"].map((item, index) => <div key={item} className="flex items-center gap-3 text-xs text-slate-400"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.06] font-display text-[10px] text-slate-500">{index + 1}</span>{item}<CheckCircle2 size={13} className="ml-auto text-emerald-300/60" /></div>)}</div></div><div className="rounded-2xl border border-sky-300/15 bg-sky-300/[0.04] p-5"><div className="mb-3 flex items-center gap-2 text-sky-200"><Clock3 size={15} /><span className="text-sm font-semibold">Analysis duration</span></div><div className="font-display text-2xl text-white">{payload.summary.analysisDuration}</div><p className="mt-2 text-[11px] leading-5 text-slate-500">Ingestion → extraction → graph → scoring → brief</p></div></div></div>;
}

function CreateCaseBanner({ onCreated }: { onCreated: (snapshot: CaseSnapshot) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const createCase = trpc.cases.create.useMutation({ onSuccess: snapshot => { onCreated(snapshot); setOpen(false); setName(""); } });
  return <div className="mb-6 rounded-2xl border border-violet-300/15 bg-gradient-to-r from-violet-400/[0.08] via-sky-300/[0.035] to-transparent p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-300/10 text-violet-300"><Plus size={17} /></div><div><div className="text-sm font-semibold text-slate-200">Open a new investigation</div><p className="mt-1 text-xs leading-5 text-slate-500">Start with a case workspace, then add CDR, UPI, IPDR, or chat evidence.</p></div></div><button onClick={() => setOpen(value => !value)} className="btn-secondary shrink-0"><Plus size={14} />New case</button></div>{open && <form onSubmit={event => { event.preventDefault(); if (name.trim()) createCase.mutate({ name: name.trim() }); }} className="mt-4 flex flex-col gap-2 border-t border-white/[0.08] pt-4 sm:flex-row"><input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="Case name, e.g. UPI fraud · Mumbai" className="input-dark flex-1" /><button disabled={createCase.isPending || !name.trim()} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">{createCase.isPending ? "Creating…" : "Create workspace"}</button></form>}</div>;
}

const DEMO_CASE_NUMBER = "KRN-261014-001";

export default function Home() {
  const { data, isLoading, error } = trpc.cases.demo.useQuery();
  const [localCase, setLocalCase] = useState<CaseSnapshot | null>(null);
  const [activeView, setActiveView] = useState("overview");
  const [selectedId, setSelectedId] = useState("mule-01");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const caseData = localCase ?? data;

  if (isLoading || !caseData) return <div className="flex min-h-screen items-center justify-center bg-[#08090e] text-slate-400"><div className="flex items-center gap-3 text-sm"><span className="h-2 w-2 animate-pulse rounded-full bg-violet-300" />Loading case intelligence…</div></div>;
  if (error) return <div className="flex min-h-screen items-center justify-center bg-[#08090e] p-6 text-center"><div><div className="mb-2 text-sm font-semibold text-rose-300">Unable to load the case workspace</div><p className="text-xs text-slate-500">{error.message}</p></div></div>;
  const payload = caseData.payload;
  const view = activeView === "overview" ? <Overview payload={payload} selectedId={selectedId} onSelect={setSelectedId} goTo={setActiveView} /> : activeView === "network" ? <NetworkView payload={payload} caseNumber={caseData.caseNumber} selectedId={selectedId} onSelect={setSelectedId} goTo={setActiveView} onAction={label => { toast.info(`${label} are available in the next analysis pass.`); }} /> : activeView === "evidence" ? <EvidenceView payload={payload} caseNumber={caseData.caseNumber} selectedId={selectedId} onSelect={setSelectedId} onAction={label => { toast.info(`${label} is ready for the next workflow step.`); }} /> : <BriefView payload={payload} caseNumber={caseData.caseNumber} />;
  return <div className="min-h-screen bg-[#08090e] text-slate-200"><div className="flex min-h-screen"><Sidebar activeView={activeView} setActiveView={setActiveView} open={sidebarOpen} close={() => setSidebarOpen(false)} onAction={label => toast.info(`${label} is ready for the next workflow step.`)} />{sidebarOpen && <button aria-label="Close navigation" className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} /> }<div className="flex min-w-0 flex-1 flex-col"><AppHeader caseData={caseData} onMenu={() => setSidebarOpen(true)} onNotify={() => toast.info("No new notifications. All signals are acknowledged.")} /><main className="flex-1 overflow-auto"><div className="mx-auto max-w-[1500px] p-5 lg:p-8"><CreateCaseBanner onCreated={snapshot => { setLocalCase(snapshot); setSelectedId("mule-01"); setActiveView("overview"); }} />{view}</div></main></div></div></div>;
}
