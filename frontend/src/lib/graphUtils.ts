import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';

export function buildGraph(nodes: any[], edges: any[]): Graph {
  const graph = new Graph();
  nodes.forEach(node => {
    if (!graph.hasNode(node.id)) {
      graph.addNode(node.id, { ...node });
    }
  });
  edges.forEach(edge => {
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      graph.addEdge(edge.source, edge.target, { ...edge });
    }
  });
  return graph;
}

export function detectCommunities(graph: Graph) {
  if (graph.order === 0) return {};
  return louvain(graph);
}
