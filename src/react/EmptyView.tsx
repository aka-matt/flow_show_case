import React from 'react';

interface EmptyViewProps {
  text?: string;
}

export function EmptyView({ text }: EmptyViewProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--af-color-text-muted)',
        fontFamily: 'var(--af-font-family)',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 32 }}>&#9711;</div>
      <div style={{ fontSize: 14 }}>{text ?? 'No architecture data'}</div>
    </div>
  );
}
