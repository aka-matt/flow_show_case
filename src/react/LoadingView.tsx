import React from 'react';

interface LoadingViewProps {
  text?: string;
}

export function LoadingView({ text }: LoadingViewProps): React.ReactElement {
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
        gap: 12,
      }}
    >
      <div style={{ fontSize: 32, animation: 'af-spin 1s linear infinite' }}>&#8635;</div>
      <div style={{ fontSize: 14 }}>{text ?? 'Loading…'}</div>
      <style>{`@keyframes af-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
