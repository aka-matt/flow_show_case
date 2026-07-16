import React from 'react';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message }: ErrorViewProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--af-color-danger)',
        fontFamily: 'var(--af-font-family)',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 32 }}>&#9888;</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>Failed to load architecture</div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--af-color-text-muted)',
          maxWidth: 300,
          textAlign: 'center',
        }}
      >
        {message}
      </div>
    </div>
  );
}
