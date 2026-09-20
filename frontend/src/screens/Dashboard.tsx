import { useState } from 'react';
import { EntityList } from "../components/entities/EntityList";
import { GraphCanvas } from "../components/graph/GraphCanvas";
import { EvidenceDrawer } from "../components/evidence/EvidenceDrawer";
import { mockEntities, mockEdges } from "../lib/mockData";
import { Entity, Edge } from "../lib/types";
import { ConfidencePill } from "../components/evidence/ConfidencePill";

export function Dashboard() {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  
  // Quick hack to handle edge popup state
  const [edgePopup, setEdgePopup] = useState<{edge: Edge, x: number, y: number} | null>(null);

  const selectedEntity = selectedEntityId ? mockEntities.find(e => e.id === selectedEntityId) : null;
  const linkedEntitiesForSelected = selectedEntity 
    ? mockEntities.filter(e => selectedEntity.linkedEntityIds.includes(e.id))
    : [];

  const handleNodeClick = (node: Entity) => {
    setSelectedEntityId(node.id);
    setSelectedEdge(null);
    setEdgePopup(null);
  };

  const handleEdgeClick = (edge: Edge, event: MouseEvent) => {
    // Show a tiny contextual popup near the cursor for the edge
    setEdgePopup({
      edge,
      x: event.clientX,
      y: event.clientY
    });
  };

  const handleSeeFullEvidence = (edge: Edge) => {
    // Open drawer focusing on the source entity of the edge
    setSelectedEntityId(edge.source);
    setSelectedEdge(edge);
    setEdgePopup(null);
  };

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* Left Column: Entities List */}
      <div className="w-[280px] h-full flex-shrink-0 z-20">
        <EntityList 
          entities={mockEntities} 
          selectedId={selectedEntityId} 
          onSelect={(id) => {
            setSelectedEntityId(id);
            setSelectedEdge(null);
            setEdgePopup(null);
          }} 
        />
      </div>
      
      {/* Center Column: Graph Canvas */}
      <div className="flex-grow h-full relative z-10">
        <GraphCanvas 
          nodes={mockEntities}
          edges={mockEdges}
          selectedNodeId={selectedEntityId}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
        />

        {/* Edge Context Popup */}
        {edgePopup && (
          <div 
            className="absolute bg-[#141622] border border-[#2a2d42] p-3 rounded-lg shadow-xl z-30 pointer-events-auto flex flex-col gap-2 w-[220px]"
            style={{ 
              left: edgePopup.x - 280, // Offset for sidebar and left panel
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
