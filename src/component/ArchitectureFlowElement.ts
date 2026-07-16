import { createRoot, type Root } from 'react-dom/client';
import React from 'react';
import { ArchitectureFlowApp } from '../react/ArchitectureFlowApp.js';
import { COMBINED_CSS } from '../styles/combined-styles.js';
import { createAbortController, type AbortControllerRef } from '../data/abort-controller.js';
import { fetchJson, parseInlineJson } from '../data/load-json.js';
import { validateArchitectureDocument } from '../schema/zod-schema.js';
import { normalize } from '../schema/normalize.js';
import type { ArchitectureDocument } from '../schema/architecture-document.js';
import { EVENT_FLOW_LOADING, EVENT_FLOW_LOADED, EVENT_FLOW_ERROR, emitCustomEvent } from './events.js';

export class ArchitectureFlowElement extends HTMLElement {
  private _root: Root | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _abortRef: AbortControllerRef | null = null;
  private _currentSrc: string | null = null;
  private _mediaQuery: MediaQueryList | null = null;
  private _resolvedTheme: 'light' | 'dark' = 'light';

  private _data: ArchitectureDocument | null = null;
  private _theme: 'light' | 'dark' | 'system' = 'system';
  private _palette: string = 'blue';
  private _interactive: boolean = false;
  private _fitView: boolean = true;
  private _showControls: boolean = true;
  private _showBackground: boolean = true;
  private _showMiniMap: boolean = false;
  private _loadingText: string = 'Loading architecture diagram…';
  private _emptyText: string = 'No architecture data';
  private _ariaLabel: string = 'Architecture diagram';
  private _isLoading: boolean = false;

  constructor() {
    super();
    const pending = (this as unknown as { _pendingProperties?: Array<{ name: string; value: unknown }> })._pendingProperties ?? [];
    (this as unknown as { _pendingProperties: typeof pending })._pendingProperties = pending;
  }

  static get observedAttributes(): string[] {
    return [
      'src', 'height', 'theme', 'palette', 'interactive', 'fit-view',
      'show-controls', 'show-background', 'show-minimap', 'readonly',
      'loading-text', 'empty-text', 'aria-label',
    ];
  }

  // Properties
  get data(): unknown { return this._data; }
  set data(v: unknown) {
    this._data = v as ArchitectureDocument | null;
    this._onDataSet(v);
  }

  get theme(): 'light' | 'dark' | 'system' { return this._theme; }
  set theme(v: 'light' | 'dark' | 'system') { this._theme = v; this._resolveAndApplyTheme(); }

  get palette(): string { return this._palette; }
  set palette(v: string) { this._palette = v; this._applyCssVariables(); }

  get interactive(): boolean { return this._interactive; }
  set interactive(v: boolean) { this._interactive = v; this._renderReact(); }

  get fitView(): boolean { return this._fitView; }
  set fitView(v: boolean) { this._fitView = v; this._renderReact(); }

  get showControls(): boolean { return this._showControls; }
  set showControls(v: boolean) { this._showControls = v; this._renderReact(); }

  get showBackground(): boolean { return this._showBackground; }
  set showBackground(v: boolean) { this._showBackground = v; this._renderReact(); }

  get showMiniMap(): boolean { return this._showMiniMap; }
  set showMiniMap(v: boolean) { this._showMiniMap = v; this._renderReact(); }

  get readonly(): boolean { return this._readonly; }
  set readonly(v: boolean) { this._readonly = v; }

  get loadingText(): string { return this._loadingText; }
  set loadingText(v: string) { this._loadingText = v; this._renderReact(); }

  get emptyText(): string { return this._emptyText; }
  set emptyText(v: string) { this._emptyText = v; this._renderReact(); }

  // Override HTMLElement.ariaLabel
  override get ariaLabel(): string { return this._ariaLabel; }
  override set ariaLabel(v: string) { this._ariaLabel = v; }

  // Private fields used in getters/setters but not initialized
  private _readonly: boolean = true;

  // Public methods
  fitViewAsync(_options?: unknown): Promise<void> {
    // Stub — implemented in Phase 6
    return Promise.resolve();
  }

  getData(): unknown { return this._data; }

  setData(data: unknown): void {
    this.data = data;
  }

  reload(): Promise<void> {
    this._currentSrc = null;
    return this._loadData();
  }

  resetViewport(): Promise<void> {
    // Stub — implemented in Phase 6
    return Promise.resolve();
  }

  connectedCallback(): void {
    this.attachShadow({ mode: 'open' });
    this._injectStyles();
    this._mountReact();
    this._applyPendingProperties();
    this._setupResizeObserver();
    this._setupSystemThemeListener();
    this._updateHeight();
    this._loadData();
  }

  disconnectedCallback(): void {
    this._abortRef?.abort();
    this._abortRef = null;
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    this._mediaQuery?.removeEventListener('change', this._onSystemThemeChange);
    this._mediaQuery = null;
    this._root?.unmount();
    this._root = null;
  }

  attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null): void {
    if (oldVal === newVal) return;
    switch (name) {
      case 'src':
        this._currentSrc = newVal;
        this._loadData();
        break;
      case 'theme':
        this._theme = (newVal as 'light' | 'dark' | 'system') ?? 'system';
        this._resolveAndApplyTheme();
        break;
      case 'palette':
        this._palette = newVal ?? 'blue';
        this._applyCssVariables();
        break;
      case 'height':
        this._updateHeight();
        break;
      case 'interactive':
        this._interactive = newVal !== null;
        this._renderReact();
        break;
      case 'fit-view':
        this._fitView = newVal !== null;
        this._renderReact();
        break;
      case 'show-controls':
        this._showControls = newVal !== null;
        this._renderReact();
        break;
      case 'show-background':
        this._showBackground = newVal !== null;
        this._renderReact();
        break;
      case 'show-minimap':
        this._showMiniMap = newVal !== null;
        this._renderReact();
        break;
      case 'loading-text':
        this._loadingText = newVal ?? 'Loading architecture diagram…';
        this._renderReact();
        break;
      case 'empty-text':
        this._emptyText = newVal ?? 'No architecture data';
        this._renderReact();
        break;
      case 'aria-label':
        this._ariaLabel = newVal ?? 'Architecture diagram';
        break;
    }
  }

  private async _loadData(): Promise<void> {
    // Priority 1: data property
    if (this._data) {
      this._renderGraph(this._data);
      return;
    }

    // Priority 2: src attribute
    const src = this.getAttribute('src');
    if (src && src !== this._currentSrc) {
      this._currentSrc = src;
      await this._loadFromSrc(src);
      return;
    }

    // Priority 3: inline JSON
    const inline = this._parseInlineJson();
    if (inline) {
      this._renderGraph(inline);
      return;
    }

    // Priority 4: empty state
    this._renderEmpty();
  }

  private async _loadFromSrc(src: string): Promise<void> {
    this._abortRef?.abort();
    this._abortRef = createAbortController();
    this._setLoading(true);

    emitCustomEvent(this, EVENT_FLOW_LOADING, { src });

    try {
      const data = await fetchJson(src, this._abortRef.signal);
      this._data = data;
      this._renderGraph(data);
      emitCustomEvent(this, EVENT_FLOW_LOADED, { source: 'src', data });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      emitCustomEvent(this, EVENT_FLOW_ERROR, {
        code: 'FETCH_ERROR',
        message,
        error: err instanceof Error ? err : undefined,
      });
      this._renderError(message);
    } finally {
      this._setLoading(false);
    }
  }

  private _parseInlineJson(): ArchitectureDocument | null {
    const script = this.querySelector('script[type="application/json"]');
    if (!script) return null;
    try {
      const data = parseInlineJson(script.textContent ?? '');
      this._data = data;
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      emitCustomEvent(this, EVENT_FLOW_ERROR, {
        code: 'INLINE_JSON_ERROR',
        message,
        error: err instanceof Error ? err : undefined,
      });
      return null;
    }
  }

  private _onDataSet(data: unknown): void {
    if (data === null || data === undefined) {
      this._data = null;
      this._loadData();
      return;
    }
    const validated = validateArchitectureDocument(data);
    if (!validated.success) {
      emitCustomEvent(this, EVENT_FLOW_ERROR, {
        code: 'INVALID_DOCUMENT',
        message: validated.error.message,
      });
      this._renderError(validated.error.message);
      return;
    }
    this._data = validated.data;
    this._renderGraph(validated.data);
  }

  private _renderGraph(doc: ArchitectureDocument): void {
    const graph = normalize(doc);
    this._renderReact(graph.nodes, graph.edges, doc.options);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _renderReact(nodes?: any[], edges?: any[], options?: unknown): void {
    if (!this._root) return;
    this._root.render(
      React.createElement(ArchitectureFlowApp, {
        nodes: nodes ?? [],
        edges: edges ?? [],
        options: {
          interactive: this._interactive,
          fitView: this._fitView,
          showControls: this._showControls,
          showBackground: this._showBackground,
          showMiniMap: this._showMiniMap,
          ...(options as Record<string, unknown>),
        },
      })
    );
  }

  private _renderEmpty(): void {
    this._renderReact([], []);
  }

  private _renderError(_message: string): void {
    this._renderReact([], []);
  }

  private _setLoading(val: boolean): void {
    this._isLoading = val;
  }

  private _setupSystemThemeListener(): void {
    this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._mediaQuery.addEventListener('change', this._onSystemThemeChange);
    this._resolveAndApplyTheme();
  }

  private _onSystemThemeChange = (): void => {
    this._resolveAndApplyTheme();
  };

  private _resolveAndApplyTheme(): void {
    const resolved = this._theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : this._theme;
    this._resolvedTheme = resolved;
    this.setAttribute('data-resolved-theme', resolved);
    this._applyCssVariables();
  }

  private _applyCssVariables(): void {
    // Implemented in Phase 5
  }

  private _updateHeight(): void {
    const attr = this.getAttribute('height');
    this.style.setProperty('--af-height', attr ?? '600px');
  }

  private _injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        width: 100%;
        min-width: 0;
        contain: layout style paint;
      }
      .af-host {
        width: 100%;
        height: var(--af-height, 600px);
      }
      ${COMBINED_CSS}
    `;
    this.shadowRoot!.appendChild(style);
  }

  private _mountReact(): void {
    const container = document.createElement('div');
    container.className = 'af-host';
    container.setAttribute('part', 'container');
    this.shadowRoot!.appendChild(container);
    this._root = createRoot(container);
    this._renderReact([], []);
  }

  private _applyPendingProperties(): void {
    const pending = (this as unknown as { _pendingProperties?: Array<{ name: string; value: unknown }> })._pendingProperties ?? [];
    for (const { name, value } of pending) {
      (this as Record<string, unknown>)[name] = value;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any)._pendingProperties = [];
  }

  private _setupResizeObserver(): void {
    this._resizeObserver = new ResizeObserver(() => {
      // Trigger React Flow re-compute
    });
    this._resizeObserver.observe(this);
  }
}
