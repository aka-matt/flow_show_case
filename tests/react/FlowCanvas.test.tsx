import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FlowCanvas } from '../../src/react/FlowCanvas.js';
import { ReactFlowProvider } from '@xyflow/react';

describe('FlowCanvas', () => {
  it('renders with empty nodes and edges', () => {
    const { container } = render(
      <ReactFlowProvider>
        <FlowCanvas nodes={[]} edges={[]} options={{}} />
      </ReactFlowProvider>,
    );
    // ReactFlowProvider is required for ReactFlow to work
    expect(container.querySelector('.react-flow')).toBeTruthy();
  });
});
