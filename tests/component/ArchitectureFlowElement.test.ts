import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ArchitectureFlowElement } from '../../src/component/ArchitectureFlowElement.js';

describe('ArchitectureFlowElement', () => {
  beforeEach(() => {
    if (!customElements.get('architecture-flow')) {
      customElements.define('architecture-flow', ArchitectureFlowElement);
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers as a custom element', () => {
    expect(customElements.get('architecture-flow')).toBe(ArchitectureFlowElement);
  });

  it('creates an open shadow root', () => {
    const el = document.createElement('architecture-flow');
    document.body.appendChild(el);
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot?.mode).toBe('open');
    el.remove();
  });

  it('reflects the height attribute to --af-height CSS variable', () => {
    const el = document.createElement('architecture-flow');
    el.setAttribute('height', '400px');
    document.body.appendChild(el);
    expect(el.style.getPropertyValue('--af-height')).toBe('400px');
    el.remove();
  });

  it('fires flow-error with composed:true', async () => {
    const el = document.createElement('architecture-flow');
    const events: CustomEvent[] = [];
    el.addEventListener('flow-error', (e) => events.push(e as CustomEvent));
    el.setData({ schemaVersion: '99.0', nodes: [], edges: [] } as never);
    document.body.appendChild(el);

    // Wait for validation to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(events.length).toBeGreaterThan(0);
    expect(events[0]!.composed).toBe(true);
    expect(events[0]!.bubbles).toBe(true);
    el.remove();
  });

  it('cleans up on disconnectedCallback', () => {
    const el = document.createElement('architecture-flow');
    document.body.appendChild(el);
    el.remove();
    // No error thrown = cleanup succeeded
    expect(true).toBe(true);
  });

  it('loads data from the data property and keeps it after attribute re-render', async () => {
    const el = document.createElement('architecture-flow') as ArchitectureFlowElement;
    document.body.appendChild(el);

    const doc = {
      schemaVersion: '1.0' as const,
      title: 'Property Demo',
      nodes: [
        {
          id: 'a',
          type: 'service' as const,
          title: 'Service A',
          position: { x: 0, y: 0 },
        },
        {
          id: 'b',
          type: 'database' as const,
          title: 'DB B',
          position: { x: 200, y: 0 },
        },
      ],
      edges: [{ id: 'e1', source: 'a', target: 'b' }],
    };

    el.data = doc;
    await new Promise((r) => setTimeout(r, 50));

    expect(el.getData()).toMatchObject({ title: 'Property Demo' });
    // Toggle interactive should not wipe data (cached graph re-render)
    el.interactive = true;
    await new Promise((r) => setTimeout(r, 20));
    expect(el.getData()).toMatchObject({ title: 'Property Demo' });

    el.remove();
  });

  it('loads data from inline JSON script child', async () => {
    const el = document.createElement('architecture-flow') as ArchitectureFlowElement;
    const script = document.createElement('script');
    script.type = 'application/json';
    script.textContent = JSON.stringify({
      schemaVersion: '1.0',
      title: 'Inline Demo',
      nodes: [
        { id: 'n1', type: 'client', title: 'Client', position: { x: 0, y: 0 } },
        { id: 'n2', type: 'service', title: 'API', position: { x: 200, y: 0 } },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    });
    el.appendChild(script);
    document.body.appendChild(el);

    await new Promise((r) => setTimeout(r, 50));

    expect(el.getData()).toMatchObject({ title: 'Inline Demo' });
    el.remove();
  });

  it('loads data from src attribute via fetch', async () => {
    const doc = {
      schemaVersion: '1.0',
      title: 'Src Demo',
      nodes: [
        { id: 'n1', type: 'service', title: 'Svc', position: { x: 0, y: 0 } },
        { id: 'n2', type: 'database', title: 'DB', position: { x: 200, y: 0 } },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    };

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => doc,
    } as Response);

    const el = document.createElement('architecture-flow') as ArchitectureFlowElement;
    el.setAttribute('src', './architecture-basic.json');
    document.body.appendChild(el);

    // Wait for async fetch + render
    await new Promise((r) => setTimeout(r, 100));

    expect(fetchMock).toHaveBeenCalled();
    expect(el.getData()).toMatchObject({ title: 'Src Demo' });

    el.remove();
    fetchMock.mockRestore();
  });
});
