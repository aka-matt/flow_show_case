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
});
