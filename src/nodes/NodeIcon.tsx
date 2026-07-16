import React from 'react';

export type NodeIconType = 'service' | 'database' | 'queue' | 'client' | 'group' | 'generic';

interface NodeIconProps {
  type: NodeIconType | string;
  /** CSS color; defaults to currentColor so it inherits text color */
  color?: string;
  size?: number;
}

const svgProps = (size: number, color: string) =>
  ({
    'width': size,
    'height': size,
    'viewBox': '0 0 24 24',
    'fill': 'none',
    'stroke': color,
    'strokeWidth': 1.75,
    'strokeLinecap': 'round' as const,
    'strokeLinejoin': 'round' as const,
    'className': 'af-node__icon',
    'aria-hidden': true,
    'focusable': false,
  }) as const;

/** Client / end-user device (monitor) */
function ClientIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg {...svgProps(size, color)}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

/** Backend service (server rack) */
function ServiceIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg {...svgProps(size, color)}>
      <rect x="3" y="3" width="18" height="7" rx="1.5" />
      <rect x="3" y="14" width="18" height="7" rx="1.5" />
      <circle cx="7" cy="6.5" r="1" fill={color} stroke="none" />
      <circle cx="7" cy="17.5" r="1" fill={color} stroke="none" />
    </svg>
  );
}

/** Database (cylinder) */
function DatabaseIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg {...svgProps(size, color)}>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </svg>
  );
}

/** Message queue / broker (stacked messages + flow arrow) */
function QueueIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg {...svgProps(size, color)}>
      <rect x="2" y="4" width="14" height="4" rx="1" />
      <rect x="2" y="10" width="14" height="4" rx="1" />
      <rect x="2" y="16" width="14" height="4" rx="1" />
      <path d="M18 6l4 6-4 6" />
    </svg>
  );
}

/** Group / container (stacked frames) */
function GroupIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg {...svgProps(size, color)}>
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M7 21h12a2 2 0 0 0 2-2V7" />
    </svg>
  );
}

/** Generic / unknown (hexagon) */
function GenericIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg {...svgProps(size, color)}>
      <path d="M12 2l8 4.5v11L12 22l-8-4.5v-11L12 2z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

const ICONS: Record<NodeIconType, React.FC<{ size: number; color: string }>> = {
  client: ClientIcon,
  service: ServiceIcon,
  database: DatabaseIcon,
  queue: QueueIcon,
  group: GroupIcon,
  generic: GenericIcon,
};

/**
 * Semantic SVG icon for an architecture node type.
 * Replaces the previous Unicode glyph prefix on node titles.
 */
export function NodeIcon({
  type,
  color = 'currentColor',
  size = 16,
}: NodeIconProps): React.ReactElement {
  const key = (type in ICONS ? type : 'generic') as NodeIconType;
  const Icon = ICONS[key];
  return <Icon size={size} color={color} />;
}
