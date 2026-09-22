import React, { useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Entity, Edge } from "../../lib/types";
import { colors } from "../../lib/colors";
import { Maximize, RefreshCcw, Camera } from "lucide-react";

// 8 distinct community tint colours — chosen to not clash with entity colours
const COMMUNITY_PALETTE = [
  '#06b6d4', // cyan
  '#a78bfa', // violet
  '#34d399', // emerald
  '#fbbf24', // amber
  '#f472b6', // pink
  '#60a5fa', // blue
  '#4ade80', // green
  '#f87171', // red-400
];

interface Props {
  nodes: Entity[];
  edges: Edge[];
  selectedNodeId: string | null;
  onNodeClick: (node: Entity) => void;
  onEdgeClick: (edge: Edge, event: MouseEvent) => void;
  communityMap?: Map<string, number>;
  caseNumber?: string;
}

export function GraphCanvas({ nodes, edges, selectedNodeId, onNodeClick, onEdgeClick, communityMap, caseNumber }: Props) {
  const graphEntityColors: Record<string, string> = {
    victim: '#34d399',
    mule: '#fb7185',
    device: '#fb923c',
    ip: '#fb923c',
    cashout: '#fb7185',
    unknown: '#8b8d98',
  };
  const fgRef = useRef<any>(null);
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
    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `nidarshan-graph${caseNumber ? `-${caseNumber}` : ''}.png`;
    a.click();
  };

  const nodeColor = useCallback((node: any) => graphEntityColors[node.type] || graphEntityColors.unknown, [graphEntityColors]);
  const nodeVal = useCallback((node: any) => Math.max(4, Math.min(12, node.score / 8)), []);
  
  const linkColor = useCallback((link: any) => {
    if (link.tier === 'strong') return colors.confidence.strong;
    if (link.tier === 'moderate') return colors.confidence.moderate;
    return colors.confidence.weak;
  }, []);

  useEffect(() => {
    const charge = fgRef.current?.d3Force('charge');
    const link = fgRef.current?.d3Force('link');
    charge?.strength(-260);
    link?.distance(150);
  }, [nodes.length, edges.length]);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const color = nodeColor(node);
    // Community tint: use palette colour for glow if a community map is provided
    const communityId = communityMap?.get(node.id);
    const glowColor = communityId !== undefined
      ? COMMUNITY_PALETTE[communityId % COMMUNITY_PALETTE.length]
      : color;

    const r = node.type === 'device' || node.type === 'ip' ? 20 / globalScale : 24 / globalScale;
    const labelFontSize = 9 / globalScale;
    const typeFontSize = 7 / globalScale;
    const badgeRadius = 9 / globalScale;
    const typeLabel = node.type === 'cashout' ? 'CASH-OUT' : String(node.type || 'UNKNOWN').toUpperCase();

    ctx.save();
    ctx.globalAlpha = selectedNodeId && node.id !== selectedNodeId ? 0.28 : 0.9;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 9 / globalScale;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r + 5 / globalScale, 0, 2 * Math.PI, false);
    ctx.fillStyle = `${glowColor}14`;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#171a25';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = node.id === selectedNodeId ? 2.5 / globalScale : 1 / globalScale;
    ctx.stroke();

    // Score badge
    const badgeX = node.x + r + 1 / globalScale;
    const badgeY = node.y - r - 5 / globalScale;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#12141d';
    ctx.fill();
    ctx.strokeStyle = '#2b3042';
    ctx.lineWidth = 1 / globalScale;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = `600 ${8 / globalScale}px "DM Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(Math.round(node.score ?? 0)), badgeX, badgeY);

    // Selection ring
    if (node.id === selectedNodeId) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 5 / globalScale, 0, 2 * Math.PI, false);
      ctx.strokeStyle = '#f1f3ff';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }

    // Keep labels inside the node ring like the reference network.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${labelFontSize}px "DM Sans", sans-serif`;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(String(node.value).slice(0, 18), node.x, node.y - 5 / globalScale);
    ctx.font = `500 ${typeFontSize}px "DM Sans", sans-serif`;
    ctx.fillStyle = '#64748b';
    ctx.fillText(typeLabel, node.x, node.y + 9 / globalScale);
    ctx.restore();
  }, [selectedNodeId, nodeVal, nodeColor]);

  const paintLinkLabel = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const source = link.source;
    const target = link.target;
    if (typeof source !== 'object' || typeof target !== 'object') return;
    const x = (source.x + target.x) / 2;
    const y = (source.y + target.y) / 2;
    if (link.tier !== 'strong') return;
    const description = link.reasons?.find((reason: any) => reason.found)?.description;
    if (!description) return;
    ctx.save();
    ctx.font = `${8 / globalScale}px "DM Sans", sans-serif`;
    ctx.fillStyle = 'rgba(100, 108, 132, 0.62)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(String(description).slice(0, 28), x, y - 5 / globalScale);
    ctx.restore();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#08090f] bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:70px_70px]">
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={{ nodes, links: edges }}
        nodeLabel="value"
        nodeColor={nodeColor}
        nodeVal={nodeVal}
        linkColor={linkColor}
        // @ts-ignore - linkOpacity is missing from ForceGraphProps typings but works at runtime
        linkOpacity={(link: any) => link.tier === 'strong' ? 0.62 : link.tier === 'moderate' ? 0.22 : 0.1}
        linkWidth={(link: any) => link.tier === 'strong' ? 1.8 : 1}
        linkLineDash={(link: any) => link.tier === 'weak' ? [6, 6] : link.tier === 'moderate' ? [2, 5] : []}
        linkCurvature={0.12}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={linkColor}
        linkCanvasObject={paintLinkLabel}
        linkCanvasObjectMode={() => 'after'}
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
      <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-[#0f1018]/90 border border-[#1c1e2e] shadow-lg flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{backgroundColor: graphEntityColors.victim}}></span><span className="text-[10px] text-[#8891aa] font-sans">Victim</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{backgroundColor: graphEntityColors.mule}}></span><span className="text-[10px] text-[#8891aa] font-sans">Mule</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{backgroundColor: graphEntityColors.device}}></span><span className="text-[10px] text-[#8891aa] font-sans">Device</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{backgroundColor: graphEntityColors.ip}}></span><span className="text-[10px] text-[#8891aa] font-sans">Shared IP</span></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5"><span className="w-4 h-[2px]" style={{backgroundColor: colors.confidence.strong}}></span><span className="text-[10px] text-[#8891aa] font-sans">Strong link</span></div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-[2px]" style={{backgroundColor: colors.confidence.moderate}}></span><span className="text-[10px] text-[#8891aa] font-sans">Moderate</span></div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-[2px]" style={{backgroundColor: colors.confidence.weak}}></span><span className="text-[10px] text-[#8891aa] font-sans">Weak link</span></div>
        </div>
        {communityMap && communityMap.size > 0 && (
          <div className="flex items-center gap-1.5 pt-0.5 border-t border-[#1c1e2e]">
            <span className="w-2 h-2 rounded-full bg-[#06b6d4]" />
            <span className="text-[10px] text-[#8891aa] font-sans">
              {new Set(communityMap.values()).size} communities detected
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
