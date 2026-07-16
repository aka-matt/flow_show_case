import { describe, it, expect } from 'vitest';
import { parseInlineJson } from '../../../src/data/load-json.js';

describe('load-json', () => {
  it('parses valid inline JSON', () => {
    const json = JSON.stringify({ schemaVersion: '1.0', nodes: [], edges: [] });
    const result = parseInlineJson(json);
    expect(result.schemaVersion).toBe('1.0');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseInlineJson('not json')).toThrow('Invalid inline JSON');
  });

  it('throws on invalid schema', () => {
    const json = JSON.stringify({ schemaVersion: '99.0', nodes: [], edges: [] });
    expect(() => parseInlineJson(json)).toThrow('schemaVersion');
  });
});
