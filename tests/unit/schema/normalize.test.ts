import { describe, it, expect } from 'vitest';
import { normalize } from '../../../src/schema/normalize.js';
import type { ArchitectureDocument } from '../../../src/schema/architecture-document.js';

const SIMPLE_DOC: ArchitectureDocument = {
  schemaVersion: '1.0',
  nodes: [
    { id: 'web', type: 'client', title: 'Web Client', position: { x: 0, y: 0 } },
    { id: 'api', type: 'service', title: 'API', position: { x: 200, y: 0 } },
  ],
  edges: [
    { id: 'e1', source: 'web', target: 'api', label: 'HTTPS' },
  ],
};

describe('normalize', () => {
  it('maps node types correctly', () => {
    const { nodes } = normalize(SIMPLE_DOC);
    expect(nodes[0].type).toBe('client');
    expect(nodes[1].type).toBe('service');
  });

  it('maps unknown node type to generic', () => {
    const doc: ArchitectureDocument = {
      schemaVersion: '1.0',
      nodes: [{ id: 'x', title: 'X', type: 'unknown' as never }],
      edges: [],
    };
    expect(normalize(doc).nodes[0].type).toBe('generic');
  });

  it('defaults position to {x:0, y:0}', () => {
    const doc: ArchitectureDocument = {
      schemaVersion: '1.0',
      nodes: [{ id: 'x', title: 'X' }],
      edges: [],
    };
    expect(normalize(doc).nodes[0].position).toEqual({ x: 0, y: 0 });
  });

  it('throws when edge source node missing', () => {
    const doc: ArchitectureDocument = {
      schemaVersion: '1.0',
      nodes: [{ id: 'a', title: 'A' }],
      edges: [{ id: 'e1', source: 'missing', target: 'a' }],
    };
    expect(() => normalize(doc)).toThrow('missing node: missing');
  });

  it('throws when edge target node missing', () => {
    const doc: ArchitectureDocument = {
      schemaVersion: '1.0',
      nodes: [{ id: 'a', title: 'A' }],
      edges: [{ id: 'e1', source: 'a', target: 'missing' }],
    };
    expect(() => normalize(doc)).toThrow('missing node: missing');
  });

  it('passes port data through node data', () => {
    const doc: ArchitectureDocument = {
      schemaVersion: '1.0',
      nodes: [{
        id: 'svc',
        title: 'Service',
        ports: [
          { id: 'in', type: 'target', side: 'left' },
          { id: 'out', type: 'source', side: 'right' },
        ],
      }],
      edges: [],
    };
    const { nodes } = normalize(doc);
    expect(nodes[0].data['ports']).toHaveLength(2);
  });
});
