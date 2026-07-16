import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { PortHandles, type PortDef } from './PortHandles.js';

const STATUS_COLORS: Record<string, string> = {
  default: 'var(--af-color-primary)',
  healthy: 'var(--af-color-success)',
  warning: 'var(--af-color-warning)',
  error: 'var(--af-color-danger)',
  disabled: 'var(--af-color-disabled)',
};

export const ServiceNode = memo(function ServiceNode({ data, selected }: NodeProps) {
  const status = String(data['status'] ?? 'default');
  const badges = (data['badges'] as string[] | undefined) ?? [];
  const ports = data['ports'] as PortDef[] | undefined;

  return (
    <div
      className={`af-node ${selected ? 'selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Service: ${String(data['label'])}`}
    >
      <PortHandles ports={ports} />
      <div
        className="af-node__header"
        style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}
      >
        <span className="af-status-dot" style={{ background: STATUS_COLORS[status] }} />
        <span style={{ fontSize: 16, marginRight: 6 }}>&#9634;</span>
        <span className="af-node__title">{String(data['label'])}</span>
      </div>
      {!!data['subtitle'] && (
        <p className="af-node__subtitle">{String(data['subtitle'] as string)}</p>
      )}
      {badges.length > 0 && (
        <div className="af-node__badges">
          {badges.map((b) => (
            <span key={b} className="af-badge">
              {b}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});
