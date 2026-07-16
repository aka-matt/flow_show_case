import type { ArchitectureDocument, NormalizedGraph } from '../schema/architecture-document.js';

/**
 * Applies manual layout by using the positions already specified on each node.
 * If a node has no position, it defaults to { x: 0, y: 0 }.
 */
export function applyManualLayout(
  doc: ArchitectureDocument,
  graph: NormalizedGraph,
): NormalizedGraph {
  const positionMap = new Map(doc.nodes.map((n) => [n.id, n.position ?? { x: 0, y: 0 }]));
  return {
    ...graph,
    nodes: graph.nodes.map((node) => ({
      ...node,
      position: positionMap.get(node.id) ?? { x: 0, y: 0 },
    })),
  };
}
