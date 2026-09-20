import React, { useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Entity, Edge } from "../../lib/types";
import { colors } from "../../lib/colors";
import { Maximize, RefreshCcw, Camera } from "lucide-react";

interface Props {
  nodes: Entity[];
  edges: Edge[];
  selectedNodeId: string | null;
  onNodeClick: (node: Entity) => void;
  onEdgeClick: (edge: Edge, event: MouseEvent) => void;
}

export function GraphCanvas({ nodes, edges, selectedNodeId, onNodeClick, onEdgeClick }: Props) {
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize observer for responsive canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Pan to selected node
  useEffect(() => {
    if (selectedNodeId && fgRef.current) {
      const node = nodes.find(n => n.id === selectedNodeId);
      if (node && (node as any).x && (node as any).y) {
        fgRef.current.centerAt((node as any).x, (node as any).y, 1000);
        fgRef.current.zoom(2.5, 1000);
      }
    }
  }, [selectedNodeId, nodes]);

  const handleFit = () => fgRef.current?.zoomToFit(400);
  const handleReset = () => {
    fgRef.current?.d3ReheatSimulation();
    fgRef.current?.centerAt(0, 0, 400);
    fgRef.current?.zoom(1, 400);
  };
  const handleScreenshot = () => {
    // Simple screenshot implementation (would use canvas.toDataURL in reality)
    console.log("Screenshot requested");
  };

  const nodeColor = useCallback((node: any) => colors.entity[node.type as keyof typeof colors.entity] || colors.entity.unknown, []);
  const nodeVal = useCallback((node: any) => Math.max(1, Math.min(8, node.score / 12)), []);
  
  const linkColor = useCallback((link: any) => {
    if (link.tier === 'strong') return colors.confidence.strong;
    if (link.tier === 'moderate') return colors.confidence.moderate;
    return colors.confidence.weak;
  }, []);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.value;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

    // Draw node circle with glow
    const r = Math.sqrt(Math.max(0, nodeVal(node))) * 3;
    
    ctx.shadowColor = nodeColor(node);
    ctx.shadowBlur = 15 / globalScale;
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
    ctx.fillStyle = nodeColor(node);
    ctx.fill();
    
    // Reset shadow for other drawings
    ctx.shadowBlur = 0;

    // Draw selection ring
    if (node.id === selectedNodeId) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 5/globalScale, 0, 2 * Math.PI, false);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }

    // Draw label with dark pill background for readability
    const labelY = node.y + r + 4/globalScale;
    ctx.fillStyle = 'rgba(8, 9, 15, 0.85)';
    ctx.beginPath();
    ctx.roundRect(node.x - bckgDimensions[0] / 2, labelY, bckgDimensions[0], bckgDimensions[1], 4/globalScale);
    ctx.fill();
    
    // Draw label text
    ctx.fillStyle = 'rgba(241, 243, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, node.x, labelY + bckgDimensions[1]/2);
  }, [selectedNodeId, nodeVal, nodeColor]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#08090f] overflow-hidden">
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={{ nodes, links: edges }}
        nodeLabel="value"
        nodeColor={nodeColor}
        nodeVal={nodeVal}
        linkColor={linkColor}
        linkWidth={(link: any) => link.tier === 'strong' ? 2 : 1}
        linkCurvature={0.2}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleColor={linkColor}
        nodeCanvasObject={paintNode}
        onNodeClick={onNodeClick}
        onLinkClick={(link, event) => onEdgeClick(link as any, event as any)}
        d3VelocityDecay={0.3}
        warmupTicks={100}
        cooldownTicks={100}
      />
      
      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button onClick={handleFit} className="p-2 rounded-md bg-[#141622] border border-[#2a2d42] text-[#8891aa] hover:text-white transition-colors" title="Fit to screen">
          <Maximize size={16} />
        </button>
        <button onClick={handleReset} className="p-2 rounded-md bg-[#141622] border border-[#2a2d42] text-[#8891aa] hover:text-white transition-colors" title="Reset layout">
          <RefreshCcw size={16} />
        </button>
        <button onClick={handleScreenshot} className="p-2 rounded-md bg-[#141622] border border-[#2a2d42] text-[#8891aa] hover:text-white transition-colors" title="Screenshot graph">
          <Camera size={16} />
        </button>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-[#0f1018] border border-[#1c1e2e] shadow-lg flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{backgroundColor: colors.entity.victim}}></span><span className="text-[10px] text-[#8891aa] font-sans">Victim</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{backgroundColor: colors.entity.mule}}></span><span className="text-[10px] text-[#8891aa] font-sans">Mule</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{backgroundColor: colors.entity.cashout}}></span><span className="text-[10px] text-[#8891aa] font-sans">Cash-out</span></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5"><span className="w-4 h-[2px]" style={{backgroundColor: colors.confidence.strong}}></span><span className="text-[10px] text-[#8891aa] font-sans">Strong link</span></div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-[2px]" style={{backgroundColor: colors.confidence.moderate}}></span><span className="text-[10px] text-[#8891aa] font-sans">Moderate</span></div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-[2px]" style={{backgroundColor: colors.confidence.weak}}></span><span className="text-[10px] text-[#8891aa] font-sans">Weak link</span></div>
        </div>
      </div>
    </div>
  );
}
