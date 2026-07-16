export type ArchitectureNodeType =
  'service' | 'database' | 'queue' | 'client' | 'group' | 'generic';

export type NodeStatus = 'default' | 'healthy' | 'warning' | 'error' | 'disabled';

export type EdgeType = 'default' | 'straight' | 'step' | 'smoothstep' | 'bezier';

export type EdgeStatus = 'default' | 'healthy' | 'warning' | 'error' | 'disabled';

export type LayoutType = 'manual' | 'simple-horizontal' | 'simple-vertical';

export interface ArchitecturePort {
  id: string;
  type: 'source' | 'target';
  side: 'left' | 'right' | 'top' | 'bottom';
  label?: string;
  offset?: number; // 0–100 percentage
}

export interface ArchitectureNode {
  id: string;
  type?: ArchitectureNodeType;
  title: string;
  subtitle?: string;
  description?: string;
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  icon?: string;
  status?: NodeStatus;
  badges?: string[];
  metadata?: Record<string, string | number | boolean | null>;
  ports?: ArchitecturePort[];
  className?: string;
  style?: Record<string, string | number>;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  sourcePort?: string;
  target: string;
  targetPort?: string;
  label?: string;
  type?: EdgeType;
  animated?: boolean;
  status?: EdgeStatus;
  markerEnd?: 'arrow' | 'none';
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ArchitectureOptions {
  layout?: LayoutType;
  fitView?: boolean;
  interactive?: boolean;
  showControls?: boolean;
  showBackground?: boolean;
  showMiniMap?: boolean;
  edgeAnimation?: boolean;
  minZoom?: number;
  maxZoom?: number;
}

export interface ArchitectureDocument {
  schemaVersion: '1.0';
  title?: string;
  description?: string;
  options?: ArchitectureOptions;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

export interface NormalizedNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  width?: number;
  height?: number;
  className?: string;
  style?: Record<string, string | number>;
}

export interface NormalizedEdge {
  id: string;
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
  label?: string;
  type: string;
  animated?: boolean;
  data?: Record<string, unknown>;
  markerEnd?: string;
  className?: string;
}

export interface NormalizedGraph {
  nodes: NormalizedNode[];
  edges: NormalizedEdge[];
}
