import type {
  ArchitectureDocument,
  ArchitectureNode,
  NormalizedNode,
  NormalizedEdge,
  NormalizedGraph,
} from './architecture-document.js';
import { applyManualLayout } from '../layout/manual-layout.js';
import { simpleHorizontalLayout, simpleVerticalLayout } from '../layout/simple-layered-layout.js';

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
    const portData = ports.length > 0 ? { ports: ports.map((p) => ({ ...p })) } : {};

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
      ...(node.width !== undefined && { width: node.width }),
      ...(node.height !== undefined && { height: node.height }),
      ...(node.className !== undefined && { className: node.className }),
      ...(node.style !== undefined && { style: node.style }),
    };
  });
}

/**
 * Normalizes edges, skipping any that reference missing nodes.
 * Returns [normalized edges, list of warning messages for skipped edges].
 */
export function normalizeEdges(
  doc: ArchitectureDocument,
): { edges: NormalizedEdge[]; warnings: string[] } {
  const nodeIds = new Set(doc.nodes.map((n) => n.id));
  const edges: NormalizedEdge[] = [];
  const warnings: string[] = [];

  for (const edge of doc.edges) {
    if (!nodeIds.has(edge.source)) {
      warnings.push(`edges[?].source references missing node: ${edge.source} (edge "${edge.id}" skipped)`);
      continue;
    }
    if (!nodeIds.has(edge.target)) {
      warnings.push(`edges[?].target references missing node: ${edge.target} (edge "${edge.id}" skipped)`);
      continue;
    }

    edges.push({
      id: edge.id,
      source: edge.source,
      ...(edge.sourcePort !== undefined && { sourceHandle: edge.sourcePort }),
      target: edge.target,
      ...(edge.targetPort !== undefined && { targetHandle: edge.targetPort }),
      ...(edge.label !== undefined && { label: edge.label }),
      type: mapEdgeType(edge.type),
      animated: edge.animated ?? false,
      ...(edge.markerEnd === 'arrow' && { markerEnd: 'url(#arrow)' }),
      data: {
        ...(edge.label !== undefined && { label: edge.label }),
        status: edge.status ?? 'default',
        ...(edge.metadata ? { metadata: edge.metadata } : {}),
      },
    });
  }

  return { edges, warnings };
}

/** Graph result with optional validation warnings. */
export interface NormalizedGraphResult extends NormalizedGraph {
  warnings: string[];
}

export function normalize(doc: ArchitectureDocument): NormalizedGraphResult {
  const layout = doc.options?.layout;

  if (layout === 'simple-horizontal') {
    const g = simpleHorizontalLayout(doc);
    return { ...g, warnings: [] };
  }

  if (layout === 'simple-vertical') {
    const g = simpleVerticalLayout(doc);
    return { ...g, warnings: [] };
  }

  // Default: normalize nodes and edges, then apply manual layout if positions are present
  const nodes = normalizeNodes(doc);
  const { edges, warnings } = normalizeEdges(doc);

  const graph: NormalizedGraph = { nodes, edges };

  if (layout === 'manual') {
    return { ...applyManualLayout(doc, graph), warnings };
  }

  return { ...graph, warnings };
}
