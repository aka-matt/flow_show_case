import type { ArchitectureDocument, NormalizedGraph, NormalizedNode, NormalizedEdge } from '../schema/architecture-document.js';

const DEFAULT_NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 80;
const HORIZONTAL_SPACING = 100;
const VERTICAL_SPACING = 80;

/**
 * Assigns nodes to layers based on their incoming edge count (DAG topological sort).
 * Nodes with no incoming edges are in layer 0.
 */
function assignLayers(doc: ArchitectureDocument): Map<string, number> {
  const layers = new Map<string, number>();
  const inDegree = new Map<string, number>();

  // Initialize in-degree
  for (const node of doc.nodes) {
    inDegree.set(node.id, 0);
  }

  // Count incoming edges
  for (const edge of doc.edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // BFS/queue-based layer assignment
  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) {
      queue.push(id);
      layers.set(id, 0);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLayer = layers.get(current)!;

    // Find all nodes this node points to
    for (const edge of doc.edges) {
      if (edge.source === current) {
        const targetLayer = (layers.get(edge.target) ?? -1);
        const newLayer = currentLayer + 1;
        if (newLayer > targetLayer) {
          layers.set(edge.target, newLayer);
        }
        // Decrement in-degree
        inDegree.set(edge.target, (inDegree.get(edge.target) ?? 1) - 1);
        if (inDegree.get(edge.target) === 0) {
          queue.push(edge.target);
        }
      }
    }
  }

  // Any unvisited nodes get assigned based on original order
  for (const node of doc.nodes) {
    if (!layers.has(node.id)) {
      layers.set(node.id, 0);
    }
  }

  return layers;
}

function normalizeWithLayout(doc: ArchitectureDocument, nodePositions: Map<string, { x: number; y: number }>): NormalizedGraph {
  const nodeMap = new Map<string, ArchitectureDocument['nodes'][0]>();
  for (const node of doc.nodes) {
    nodeMap.set(node.id, node);
  }

  const normalizedNodes: NormalizedNode[] = doc.nodes.map((node) => {
    const pos = nodePositions.get(node.id) ?? { x: 0, y: 0 };
    return {
      id: node.id,
      type: node.type ?? 'generic',
      position: pos,
      data: {
        label: node.title,
        subtitle: node.subtitle,
        description: node.description,
        icon: node.icon,
        status: node.status ?? 'default',
        badges: node.badges ?? [],
        metadata: node.metadata ?? {},
      },
      width: node.width ?? DEFAULT_NODE_WIDTH,
      height: node.height ?? DEFAULT_NODE_HEIGHT,
      className: node.className,
      style: node.style,
    };
  });

  const nodeIds = new Set(doc.nodes.map(n => n.id));
  const normalizedEdges: NormalizedEdge[] = doc.edges.map((edge) => {
    if (!nodeIds.has(edge.source)) {
      throw new Error(`edges[?].source references missing node: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      throw new Error(`edges[?].target references missing node: ${edge.target}`);
    }

    return {
      id: edge.id,
      source: edge.source,
      sourceHandle: edge.sourcePort,
      target: edge.target,
      targetHandle: edge.targetPort,
      label: edge.label,
      type: edge.type ?? 'smoothstep',
      animated: edge.animated ?? false,
      markerEnd: edge.markerEnd === 'arrow' ? 'url(#arrow)' : undefined,
      data: {
        label: edge.label,
        status: edge.status ?? 'default',
        ...(edge.metadata ? { metadata: edge.metadata } : {}),
      },
      className: edge.className,
    };
  });

  return { nodes: normalizedNodes, edges: normalizedEdges };
}

export function simpleHorizontalLayout(doc: ArchitectureDocument): NormalizedGraph {
  const layers = assignLayers(doc);

  // Group nodes by layer
  const layerMap = new Map<number, string[]>();
  for (const [nodeId, layer] of layers) {
    const arr = layerMap.get(layer) ?? [];
    arr.push(nodeId);
    layerMap.set(layer, arr);
  }

  const maxLayer = Math.max(...layerMap.keys(), 0);
  const positions = new Map<string, { x: number; y: number }>();

  // Position nodes: layer determines x, index within layer determines y
  for (const [layer, nodeIds] of layerMap) {
    const x = layer * (DEFAULT_NODE_WIDTH + HORIZONTAL_SPACING);
    nodeIds.forEach((nodeId, idx) => {
      positions.set(nodeId, {
        x,
        y: idx * (DEFAULT_NODE_HEIGHT + VERTICAL_SPACING),
      });
    });
  }

  return normalizeWithLayout(doc, positions);
}

export function simpleVerticalLayout(doc: ArchitectureDocument): NormalizedGraph {
  const layers = assignLayers(doc);

  // Group nodes by layer
  const layerMap = new Map<number, string[]>();
  for (const [nodeId, layer] of layers) {
    const arr = layerMap.get(layer) ?? [];
    arr.push(nodeId);
    layerMap.set(layer, arr);
  }

  const positions = new Map<string, { x: number; y: number }>();

  // Position nodes: layer determines y, index within layer determines x
  for (const [layer, nodeIds] of layerMap) {
    const y = layer * (DEFAULT_NODE_HEIGHT + VERTICAL_SPACING);
    nodeIds.forEach((nodeId, idx) => {
      positions.set(nodeId, {
        x: idx * (DEFAULT_NODE_WIDTH + HORIZONTAL_SPACING),
        y,
      });
    });
  }

  return normalizeWithLayout(doc, positions);
}