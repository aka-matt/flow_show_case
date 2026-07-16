import { describe, it, expect } from 'vitest';
import { simpleHorizontalLayout, simpleVerticalLayout } from '../../../src/layout/simple-layered-layout.js';
import type { ArchitectureDocument } from '../../../src/schema/architecture-document.js';

const LINEAR_DOC: ArchitectureDocument = {
  schemaVersion: '1.0',
  nodes: [
    { id: 'a', title: 'A' },
    { id: 'b', title: 'B' },
    { id: 'c', title: 'C' },
  ],
  edges: [
    { id: 'e1', source: 'a', target: 'b' },
    { id: 'e2', source: 'b', target: 'c' },
  ],
};

describe('simple-layered-layout', () => {
  it('places nodes in layers horizontally', () => {
    const result = simpleHorizontalLayout(LINEAR_DOC);
    const ids = result.nodes.map(n => n.id);
    expect(ids).toEqual(['a', 'b', 'c']);
    // a should be leftmost
    const aNode = result.nodes.find(n => n.id === 'a')!;
    const bNode = result.nodes.find(n => n.id === 'b')!;
    expect(aNode.position.x).toBeLessThan(bNode.position.x);
  });

  it('places nodes in layers vertically', () => {
    const result = simpleVerticalLayout(LINEAR_DOC);
    const aNode = result.nodes.find(n => n.id === 'a')!;
    const bNode = result.nodes.find(n => n.id === 'b')!;
    expect(aNode.position.y).toBeLessThan(bNode.position.y);
  });

  it('handles nodes with no edges', () => {
    const doc: ArchitectureDocument = {
      schemaVersion: '1.0',
      nodes: [{ id: 'x', title: 'X' }],
      edges: [],
    };
    const result = simpleHorizontalLayout(doc);
    expect(result.nodes).toHaveLength(1);
  });
});