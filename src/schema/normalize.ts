import type {
  ArchitectureDocument,
  ArchitectureNode,
  ArchitectureEdge,
  NormalizedNode,
  NormalizedEdge,
  NormalizedGraph,
} from './architecture-document.js';

/**
 * Maps our node type strings to React Flow node type strings.
 * Unknown types fall back to 'generic'.
 */
function mapNodeType(type?: string): string {
  const valid = ['service', 'database', 'queue', 'client', 'group', 'generic'];
  if (!type || !valid.includes(type)) return 'generic';
  return type;
}

/**
 * Maps our edge type strings to React Flow edge type strings.
 * Default/unknown falls back to 'smoothstep'.
 */
function mapEdgeType(type?: string): string {
  const valid = ['default', 'straight', 'step', 'smoothstep', 'bezier'];
  if (!type || !valid.includes(type)) return 'smoothstep';
  return type;
}

export function normalizeNodes(doc: ArchitectureDocument): NormalizedNode[] {
  const nodeMap = new Map<string, ArchitectureNode>();
  for (const node of doc.nodes) {
    nodeMap.set(node.id, node);
  }

  return doc.nodes.map((node): NormalizedNode => {
    const ports = node.ports ?? [];
    const portData = ports.length > 0
      ? { ports: ports.map(p => ({ ...p })) }
      : {};

    return {
      id: node.id,
      type: mapNodeType(node.type),
      position: node.position ?? { x: 0, y: 0 },
      data: {
        label: node.title,
        subtitle: node.subtitle,
        description: node.description,
        icon: node.icon,
        status: node.status ?? 'default',
        badges: node.badges ?? [],
        metadata: node.metadata ?? {},
        ...portData,
      },
      width: node.width,
      height: node.height,
      className: node.className,
      style: node.style,
    };
  });
}

export function normalizeEdges(doc: ArchitectureDocument): NormalizedEdge[] {
  const nodeIds = new Set(doc.nodes.map(n => n.id));

  return doc.edges.map((edge): NormalizedEdge => {
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
      type: mapEdgeType(edge.type),
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
}

export function normalize(doc: ArchitectureDocument): NormalizedGraph {
  return {
    nodes: normalizeNodes(doc),
    edges: normalizeEdges(doc),
  };
}
