import { z } from 'zod';

export const PORT_SIDES = ['left', 'right', 'top', 'bottom'] as const;
export const NODE_TYPES = ['service', 'database', 'queue', 'client', 'group', 'generic'] as const;
export const NODE_STATUSES = ['default', 'healthy', 'warning', 'error', 'disabled'] as const;
export const EDGE_TYPES = ['default', 'straight', 'step', 'smoothstep', 'bezier'] as const;
export const EDGE_STATUSES = ['default', 'healthy', 'warning', 'error', 'disabled'] as const;
export const LAYOUT_TYPES = ['manual', 'simple-horizontal', 'simple-vertical'] as const;

export const architecturePortSchema = z.object({
  id: z.string().min(1, 'Port id cannot be empty'),
  type: z.enum(['source', 'target']),
  side: z.enum(PORT_SIDES),
  label: z.string().optional(),
  offset: z.number().min(0).max(100).optional(),
});

export const architectureNodeSchema = z.object({
  id: z.string().min(1, 'Node id cannot be empty'),
  type: z.enum(NODE_TYPES).optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  icon: z.string().optional(),
  status: z.enum(NODE_STATUSES).optional(),
  badges: z.array(z.string()).optional(),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  ports: z.array(architecturePortSchema).optional(),
  className: z.string().optional(),
  style: z.record(z.union([z.string(), z.number()])).optional(),
});

export const architectureEdgeSchema = z.object({
  id: z.string().min(1, 'Edge id cannot be empty'),
  source: z.string().min(1),
  sourcePort: z.string().optional(),
  target: z.string().min(1),
  targetPort: z.string().optional(),
  label: z.string().optional(),
  type: z.enum(EDGE_TYPES).optional(),
  animated: z.boolean().optional(),
  status: z.enum(EDGE_STATUSES).optional(),
  markerEnd: z.enum(['arrow', 'none']).optional(),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export const architectureOptionsSchema = z.object({
  layout: z.enum(LAYOUT_TYPES).optional(),
  fitView: z.boolean().optional(),
  interactive: z.boolean().optional(),
  showControls: z.boolean().optional(),
  showBackground: z.boolean().optional(),
  showMiniMap: z.boolean().optional(),
  edgeAnimation: z.boolean().optional(),
  minZoom: z.number().optional(),
  maxZoom: z.number().optional(),
});

export const architectureDocumentSchema = z
  .object({
    schemaVersion: z.literal('1.0'),
    title: z.string().optional(),
    description: z.string().optional(),
    options: architectureOptionsSchema.optional(),
    nodes: z.array(architectureNodeSchema).min(0),
    edges: z.array(architectureEdgeSchema).min(0),
  })
  .superRefine((data, ctx) => {
    const ids = data.nodes.map((n) => n.id);
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate node id: ${id}`,
          path: ['nodes', ids.indexOf(id), 'id'],
        });
        return;
      }
      seen.add(id);
    }
  });

export type ValidationResult =
  | { success: true; data: import('./architecture-document.js').ArchitectureDocument }
  | { success: false; error: ZodErrorDetails };

export interface ZodErrorDetails {
  code: string;
  message: string;
  path?: string;
}

export function validateArchitectureDocument(raw: unknown): ValidationResult {
  const result = architectureDocumentSchema.safeParse(raw);
  if (result.success) {
    return {
      success: true,
      data: result.data as import('./architecture-document.js').ArchitectureDocument,
    };
  }

  const firstError = result.error.errors[0];
  if (!firstError) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Unknown validation error',
      },
    };
  }
  const pathStr = firstError.path.length > 0 ? `${firstError.path.join('.')}` : undefined;
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: firstError.message,
      ...(pathStr !== undefined && { path: pathStr }),
    },
  };
}
