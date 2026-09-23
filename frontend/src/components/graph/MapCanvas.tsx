import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Entity, Edge } from '../../lib/types';

// Fix for default Leaflet marker icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
  nodes: Entity[];
  edges: Edge[];
  selectedNodeId: string | null;
  onNodeClick: (node: Entity) => void;
}

// Simple hash function for stable mock coordinates
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return hash;
}

export function MapCanvas({ nodes, edges, selectedNodeId, onNodeClick }: Props) {
  // Base coordinates (Center of India)
  const baseLat = 22.5937;
  const baseLng = 78.9629;

  const geoNodes = useMemo(() => {
    // We only want to plot IPs, Devices, or Cashouts on the map.
    // If you want to plot everything, we just map all nodes. Let's map all high-risk nodes.
    return nodes.map(node => {
      const hash = hashString(node.id);
      // Generate deterministic mock offset within roughly 1000km
      const latOffset = ((hash % 100) - 50) * 0.15;
      const lngOffset = (((hash >> 4) % 100) - 50) * 0.15;
      
      return {
        ...node,
        lat: baseLat + latOffset,
        lng: baseLng + lngOffset,
      };
    });
  }, [nodes]);

  const geoEdges = useMemo(() => {
    // Create a lookup map for node coordinates
    const nodeCoords = new Map(geoNodes.map(n => [n.id, [n.lat, n.lng] as [number, number]]));
    
    // Only return edges where both source and target exist in geoNodes
    return edges
      .map(edge => {
        const source = nodeCoords.get(edge.source);
        const target = nodeCoords.get(edge.target);
        if (source && target) {
          return { id: edge.id, positions: [source, target] as [[number, number], [number, number]], confidence: edge.confidence };
        }
        return null;
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }, [edges, geoNodes]);

  const getEntityColor = (type: string) => {
    switch(type) {
      case 'victim': return '#34d399';
      case 'mule': return '#fb7185';
      case 'cashout': return '#fb7185';
      case 'device': return '#fb923c';
      case 'ip': return '#06b6d4';
      default: return '#8b8d98';
    }
  };

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={[baseLat, baseLng]} 
        zoom={5} 
        style={{ width: '100%', height: '100%', backgroundColor: '#0f1018' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Draw the network edges as polylines */}
        {geoEdges.map((edge) => (
          <Polyline
            key={edge.id}
            positions={edge.positions}
            pathOptions={{
              color: '#8b5cf6',
              weight: edge.confidence > 70 ? 2 : 1,
              opacity: edge.confidence > 70 ? 0.6 : 0.3,
              dashArray: edge.confidence < 50 ? '4, 8' : undefined
            }}
          />
        ))}
        
        {/* Draw the nodes on top of edges */}
        {geoNodes.map((node) => {
          const color = getEntityColor(node.type);
          const isSelected = selectedNodeId === node.id;
          
          return (
            <CircleMarker
              key={node.id}
              center={[node.lat, node.lng]}
              radius={isSelected ? 10 : node.score > 80 ? 8 : 5}
              pathOptions={{
                fillColor: color,
                fillOpacity: isSelected ? 0.9 : 0.6,
                color: isSelected ? '#ffffff' : color,
                weight: isSelected ? 2 : 1,
              }}
              eventHandlers={{
                click: () => onNodeClick(node),
              }}
            >
              <Popup>
                <div className="font-display font-semibold text-[13px]">{node.value}</div>
                <div className="text-[11px] text-[#8891aa] capitalize">{node.type}</div>
                <div className="text-[11px] font-bold mt-1" style={{ color }}>Score: {node.score}</div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
