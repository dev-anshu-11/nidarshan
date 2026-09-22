import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { EntityList } from "../components/entities/EntityList";
import { GraphCanvas } from "../components/graph/GraphCanvas";
import { GraphFilterBar } from "../components/graph/GraphFilterBar";
import { EvidenceDrawer } from "../components/evidence/EvidenceDrawer";
import { useCase } from "../lib/CaseContext";
import { Entity, Edge, EntityType, RiskTier } from "../lib/types";
import { buildGraph, detectCommunities } from "../lib/graphUtils";
import { ConfidencePill } from "../components/evidence/ConfidencePill";
import { AlertCircle, UploadCloud } from 'lucide-react';

function mapTier(tier: string): 'critical' | 'high' | 'medium' | 'low' {
  const t = tier.toLowerCase();
  if (t === 'critical') return 'critical';
  if (t === 'high') return 'high';
  if (t === 'medium') return 'medium';
  return 'low';
}

function mapEntityType(type: string): Entity['type'] {
  const t = type.toLowerCase();
  if (t === 'victim') return 'victim';
  if (t === 'mule' || t === 'account') return 'mule';
  if (t === 'cashout') return 'cashout';
  if (t === 'device' || t === 'imei') return 'device';
  if (t === 'ip' || t === 'ip_address') return 'ip';
  return 'unknown';
}

function mapConfidenceTier(weight: number): 'strong' | 'moderate' | 'weak' {
  if (weight >= 70) return 'strong';
  if (weight >= 40) return 'moderate';
  return 'weak';
}

export function Dashboard() {
  const caseCtx = useCase();
  const [, setLocation] = useLocation();
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [edgePopup, setEdgePopup] = useState<{edge: Edge, x: number, y: number} | null>(null);
  const [activeTypes, setActiveTypes] = useState<EntityType[]>([]);
  const [activeTiers, setActiveTiers] = useState<RiskTier[]>([]);

  const analysis = caseCtx.analysis;

  // Map backend entities to frontend Entity type
  const entities: Entity[] = (analysis?.entities ?? []).map(e => ({
    id: e.id,
    value: e.value,
    type: mapEntityType(e.type),
    score: e.score,
    tier: mapTier(e.tier),
    sources: e.sourceFiles.map(f => ({ filename: f, rows: '', hash: '' })),
    linkedEntityIds: (analysis?.links ?? [])
      .filter(l => l.from === e.id || l.to === e.id)
      .map(l => l.from === e.id ? l.to : l.from),
  }));

  // Map backend links to frontend Edge type
  const edges: Edge[] = (analysis?.links ?? []).map(l => ({
    id: l.id,
    source: l.from,
    target: l.to,
    confidence: l.weight,
    tier: mapConfidenceTier(l.weight),
    reasons: l.sources.map(s => ({ description: `Found in ${s}`, points: l.weight, found: true })),
  }));

  // Filter nodes/edges based on active filter pills
  const filteredEntities = useMemo(() => {
    if (activeTypes.length === 0 && activeTiers.length === 0) return entities;
    return entities.filter(e =>
      (activeTypes.length === 0 || activeTypes.includes(e.type)) &&
      (activeTiers.length === 0 || activeTiers.includes(e.tier))
    );
  }, [entities, activeTypes, activeTiers]);

  const filteredEdges = useMemo(() => {
    const visibleIds = new Set(filteredEntities.map(e => e.id));
    return edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
  }, [edges, filteredEntities]);

  // Community detection via Louvain — runs when entity/edge set changes
  const communityMap = useMemo((): Map<string, number> => {
    if (entities.length === 0) return new Map();
    try {
      const graph = buildGraph(entities, edges);
      const result = detectCommunities(graph);
      return new Map(Object.entries(result));
    } catch {
      return new Map();
    }
  }, [entities, edges]);

  const handleTypeToggle = (type: EntityType) =>
    setActiveTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);

  const handleTierToggle = (tier: RiskTier) =>
    setActiveTiers(prev => prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]);

  const selectedEntity = selectedEntityId ? entities.find(e => e.id === selectedEntityId) : null;
  const linkedEntitiesForSelected = selectedEntity
    ? entities.filter(e => selectedEntity.linkedEntityIds.includes(e.id))
    : [];

  const handleNodeClick = (node: Entity) => {
    setSelectedEntityId(node.id);
    setSelectedEdge(null);
    setEdgePopup(null);
  };

  const handleEdgeClick = (edge: Edge, event: MouseEvent) => {
    setEdgePopup({ edge, x: event.clientX, y: event.clientY });
  };

  const handleSeeFullEvidence = (edge: Edge) => {
    setSelectedEntityId(edge.source);
    setSelectedEdge(edge);
    setEdgePopup(null);
  };

  // Empty state
  if (!analysis || entities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="w-16 h-16 rounded-full bg-[#141622] border border-[#2a2d42] flex items-center justify-center">
          <AlertCircle size={28} className="text-[#4a5068]" />
        </div>
        <h2 className="font-display text-[20px] font-semibold text-[#f1f3ff]">No Investigation Data</h2>
        <p className="font-sans text-[14px] text-[#8891aa] text-center max-w-md">
          Upload evidence files to begin the forensic correlation analysis. The investigation dashboard will populate with entities, links, and risk scores.
        </p>
        <button
          onClick={() => setLocation('/upload')}
          className="flex items-center gap-2 px-6 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-display text-[14px] font-semibold rounded-lg transition-colors"
        >
          <UploadCloud size={18} /> Upload Evidence
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* Left Column: Entities List */}
      <div className="w-[280px] h-full flex-shrink-0 z-20">
        <EntityList
          entities={filteredEntities}
          selectedId={selectedEntityId}
          onSelect={(id) => {
            setSelectedEntityId(id);
            setSelectedEdge(null);
            setEdgePopup(null);
          }}
        />
      </div>

      {/* Center Column: Graph Canvas + Filter Bar */}
      <div className="flex-grow h-full relative z-10 flex flex-col">
        <GraphFilterBar
          activeTypes={activeTypes}
          activeTiers={activeTiers}
          onTypeToggle={handleTypeToggle}
          onTierToggle={handleTierToggle}
          onReset={() => { setActiveTypes([]); setActiveTiers([]); }}
          totalNodes={entities.length}
          visibleNodes={filteredEntities.length}
        />
        <div className="flex-1 relative overflow-hidden">
        <GraphCanvas
          nodes={filteredEntities}
          edges={filteredEdges}
          selectedNodeId={selectedEntityId}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          communityMap={communityMap}
          caseNumber={caseCtx.caseNumber ?? undefined}
        />

        {/* Edge Context Popup */}
        {edgePopup && (
          <div
            className="absolute bg-[#141622] border border-[#2a2d42] p-3 rounded-lg shadow-xl z-30 pointer-events-auto flex flex-col gap-2 w-[220px]"
            style={{
              left: edgePopup.x - 280,
              top: edgePopup.y - 120
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-[12px] font-semibold text-white">Connection</span>
              <ConfidencePill percent={edgePopup.edge.confidence} tier={edgePopup.edge.tier} />
            </div>
            <div className="flex flex-col gap-1">
              {edgePopup.edge.reasons.slice(0, 4).map((r, i) => (
                <span key={i} className="font-sans text-[11px] text-[#8891aa] truncate">- {r.description}</span>
              ))}
            </div>
            <button
              onClick={() => handleSeeFullEvidence(edgePopup.edge)}
              className="text-[#7c3aed] hover:text-[#f1f3ff] font-display text-[11px] font-medium mt-1 text-left"
            >
              See full evidence →
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Right Column: Evidence Drawer (Overlay) */}
      {selectedEntity && (
        <EvidenceDrawer
          entity={selectedEntity}
          linkedEdge={selectedEdge}
          linkedEntities={linkedEntitiesForSelected}
          onClose={() => {
            setSelectedEntityId(null);
            setSelectedEdge(null);
          }}
          onNavigateToEntity={(id) => {
            setSelectedEntityId(id);
            setSelectedEdge(null);
          }}
        />
      )}
    </div>
  );
}
