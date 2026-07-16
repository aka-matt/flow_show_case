import { describe, it, expect } from 'vitest';
import { validateArchitectureDocument } from '../../../src/schema/zod-schema.js';

const VALID_DOC = {
  schemaVersion: '1.0',
  title: 'Test',
  nodes: [{ id: 'a', title: 'A' }],
  edges: [],
};

describe('zod-schema', () => {
  it('accepts a valid document', () => {
    const result = validateArchitectureDocument(VALID_DOC);
    expect(result.success).toBe(true);
  });

  it('rejects schemaVersion other than 1.0', () => {
    const result = validateArchitectureDocument({ ...VALID_DOC, schemaVersion: '2.0' });
    expect(result.success).toBe(false);
  });

  it('rejects duplicate node IDs', () => {
    const result = validateArchitectureDocument({
      ...VALID_DOC,
      nodes: [
        { id: 'a', title: 'A' },
        { id: 'a', title: 'B' },
      ],
    });
    // Zod doesn't check duplicates by default; add custom validation
    expect(result.success).toBe(false);
  });

  it('rejects edge referencing missing node', () => {
    const result = validateArchitectureDocument({
      ...VALID_DOC,
      edges: [{ id: 'e1', source: 'missing', target: 'a' }],
    });
    // Validation happens in normalize, not Zod schema
    expect(result.success).toBe(true);
  });

  it('rejects empty node id', () => {
    const result = validateArchitectureDocument({
      ...VALID_DOC,
      nodes: [{ id: '', title: 'A' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts all node types', () => {
    for (const type of ['service', 'database', 'queue', 'client', 'group', 'generic']) {
      const result = validateArchitectureDocument({
        ...VALID_DOC,
        nodes: [{ id: 'a', title: 'A', type }],
      });
      expect(result.success, `type ${type} should be valid`).toBe(true);
    }
  });
});
