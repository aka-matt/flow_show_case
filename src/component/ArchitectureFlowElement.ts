import { createRoot, type Root } from 'react-dom/client';
import React from 'react';
import { ArchitectureFlowApp } from '../react/ArchitectureFlowApp.js';
import { COMBINED_CSS } from '../styles/combined-styles.js';
import { createAbortController, type AbortControllerRef } from '../data/abort-controller.js';
import { fetchJson, parseInlineJson } from '../data/load-json.js';
import { validateArchitectureDocument } from '../schema/zod-schema.js';
import { normalize } from '../schema/normalize.js';
import type { ArchitectureDocument } from '../schema/architecture-document.js';
import {
  EVENT_FLOW_LOADING,
  EVENT_FLOW_LOADED,
  EVENT_FLOW_ERROR,
  EVENT_THEME_CHANGE,
  EVENT_NODE_CLICK,
  EVENT_EDGE_CLICK,
  EVENT_VIEWPORT_CHANGE,
  EVENT_DATA_CHANGE,
  EVENT_FLOW_READY,
  emitCustomEvent,
} from './events.js';
import { getPalette, resolveTheme, buildCssVariables } from '../theme/index.js';
import type { PaletteName, ResolvedTheme } from '../theme/index.js';
import { debounce } from '../utils/debounce.js';

export class ArchitectureFlowElement extends HTMLElement {
  private _root: Root | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _abortRef: AbortControllerRef | null = null;
  private _currentSrc: string | null = null;
  private _mediaQuery: MediaQueryList | null = null;
  private _resolvedTheme: 'light' | 'dark' = 'light';
  private _rfInstance: unknown = null;

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
  private _appState: 'loading' | 'loaded' | 'error' | 'empty' = 'loaded';
  private _errorMessage: string = '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _onViewportChange = debounce((x: number, y: number, zoom: number) => {
    emitCustomEvent(this, EVENT_VIEWPORT_CHANGE, { x, y, zoom });
  }, 100);

  constructor() {
    super();
    const pending =
      (this as unknown as { _pendingProperties?: Array<{ name: string; value: unknown }> })
        ._pendingProperties ?? [];
    (this as unknown as { _pendingProperties: typeof pending })._pendingProperties = pending;
  }

  static get observedAttributes(): string[] {
    return [
      'src',
      'height',
      'theme',
      'palette',
      'interactive',
      'fit-view',
      'show-controls',
      'show-background',
      'show-minimap',
      'readonly',
      'loading-text',
      'empty-text',
      'aria-label',
    ];
  }

  // Properties
  get data(): unknown {
    return this._data;
  }
  set data(v: unknown) {
    this._data = v as ArchitectureDocument | null;
    this._onDataSet(v);
  }

  get theme(): 'light' | 'dark' | 'system' {
    return this._theme;
  }
  set theme(v: 'light' | 'dark' | 'system') {
    this._theme = v;
    this._resolveAndApplyTheme();
  }

  get palette(): string {
    return this._palette;
  }
  set palette(v: string) {
    this._palette = v;
    this._applyCssVariables();
  }

  get interactive(): boolean {
    return this._interactive;
  }
  set interactive(v: boolean) {
    this._interactive = v;
    this._renderReact();
  }

  get fitView(): boolean {
    return this._fitView;
  }
  set fitView(v: boolean) {
    this._fitView = v;
    this._renderReact();
  }

  get showControls(): boolean {
    return this._showControls;
  }
  set showControls(v: boolean) {
    this._showControls = v;
    this._renderReact();
  }

  get showBackground(): boolean {
    return this._showBackground;
  }
  set showBackground(v: boolean) {
    this._showBackground = v;
    this._renderReact();
  }

  get showMiniMap(): boolean {
    return this._showMiniMap;
  }
  set showMiniMap(v: boolean) {
    this._showMiniMap = v;
    this._renderReact();
  }

  get readonly(): boolean {
    return this._readonly;
  }
  set readonly(v: boolean) {
    this._readonly = v;
  }

  get loadingText(): string {
    return this._loadingText;
  }
  set loadingText(v: string) {
    this._loadingText = v;
    this._renderReact();
  }

  get emptyText(): string {
    return this._emptyText;
  }
  set emptyText(v: string) {
    this._emptyText = v;
    this._renderReact();
  }

  // Override HTMLElement.ariaLabel
  override get ariaLabel(): string {
    return this._ariaLabel;
  }
  override set ariaLabel(v: string) {
    this._ariaLabel = v;
  }

  // Private fields used in getters/setters but not initialized
  private _readonly: boolean = true;

  // Public methods
  fitViewAsync(options?: { padding?: number; duration?: number }): Promise<void> {
    const padding = options?.padding ?? 0.2;
    if (this._rfInstance) {
      const rf = this._rfInstance as { fitView?: (opts: unknown) => Promise<void> };
      if (typeof rf.fitView === 'function') {
        return rf.fitView({ padding, duration: options?.duration });
      }
    }
    return Promise.resolve();
  }

  reload(): Promise<void> {
    this._data = null;
    this._currentSrc = null;
    return this._loadData();
  }

  resetViewport(): Promise<void> {
    return this.fitViewAsync();
  }

  getData(): unknown {
    return this._data;
  }

  setData(data: unknown): void {
    this.data = data;
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
      case 'palette': {
        const valid = ['blue', 'indigo', 'teal', 'violet', 'slate', 'amber'];
        this._palette = valid.includes(newVal ?? '') ? (newVal ?? 'blue') : 'blue';
        if (!valid.includes(newVal ?? '')) {
          emitCustomEvent(this, EVENT_FLOW_ERROR, {
            code: 'UNKNOWN_PALETTE',
            message: `Unknown palette "${newVal}", falling back to blue`,
          });
        }
        this._applyCssVariables();
        break;
      }
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
    this._setAppState('loading');

    emitCustomEvent(this, EVENT_FLOW_LOADING, { src });

    try {
      const data = await fetchJson(src, this._abortRef.signal);
      this._data = data;
      this._renderGraph(data);
      emitCustomEvent(this, EVENT_FLOW_LOADED, { source: 'src', data });
      this._setAppState('loaded');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      emitCustomEvent(this, EVENT_FLOW_ERROR, {
        code: 'FETCH_ERROR',
        message,
        error: err instanceof Error ? err : undefined,
      });
      this._setAppState('error');
      this._setErrorMessage(message);
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
    emitCustomEvent(this, EVENT_DATA_CHANGE, { data: validated.data });
    this._renderGraph(validated.data);
  }

  private _renderGraph(doc: ArchitectureDocument): void {
    const graph = normalize(doc);
    this._setAppState('loaded');
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
        state: this._appState,
        errorMessage: this._errorMessage,
        loadingText: this._loadingText,
        emptyText: this._emptyText,
        onNodeClick: (_event: MouseEvent, node: unknown) => {
          emitCustomEvent(this, EVENT_NODE_CLICK, { node, originalEvent: _event });
        },
        onEdgeClick: (_event: MouseEvent, edge: unknown) => {
          emitCustomEvent(this, EVENT_EDGE_CLICK, { edge, originalEvent: _event });
        },
        onMoveEnd: (_event: MouseEvent, viewport: { x: number; y: number; zoom: number }) => {
          this._onViewportChange(viewport.x, viewport.y, viewport.zoom);
        },
        onInit: (instance: unknown) => {
          this._rfInstance = instance;
          emitCustomEvent(this, EVENT_FLOW_READY, { instance, data: this._data });
        },
      }),
    );
  }

  private _renderEmpty(): void {
    this._setAppState('empty');
    this._renderReact([], []);
  }

  private _renderError(_message: string): void {
    this._setAppState('error');
    this._renderReact([], []);
  }

  private _setLoading(val: boolean): void {
    this._isLoading = val;
  }

  private _setAppState(state: 'loading' | 'loaded' | 'error' | 'empty'): void {
    this._appState = state;
  }

  private _setErrorMessage(message: string): void {
    this._errorMessage = message;
  }

  private _setupSystemThemeListener(): void {
    this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._mediaQuery.addEventListener('change', this._onSystemThemeChange);
    this._resolveAndApplyTheme();
  }

  private _onSystemThemeChange = (): void => {
    if (this._theme === 'system') {
      this._resolveAndApplyTheme();
      emitCustomEvent(this, EVENT_THEME_CHANGE, {
        requestedTheme: this._theme,
        resolvedTheme: this._resolvedTheme,
        palette: this._palette,
      });
    }
  };

  private _resolveAndApplyTheme(): void {
    const resolved = resolveTheme(this._theme);
    this._resolvedTheme = resolved;
    this.setAttribute('data-resolved-theme', resolved);
    this._applyCssVariables();
  }

  private _applyCssVariables(): void {
    const paletteName = (this._palette as PaletteName) ?? 'blue';
    const palette = getPalette(paletteName);
    const resolved = this._resolvedTheme as ResolvedTheme;
    const tokens =
      this._theme === 'dark'
        ? palette.dark
        : this._theme === 'light'
          ? palette.light
          : window.matchMedia('(prefers-color-scheme: dark)').matches
            ? palette.dark
            : palette.light;

    // Override with host inline styles (CSS variables set on element.style)
    const hostStyle = this.style;
    const css = buildCssVariables(
      {
        ...tokens,
        colorPrimary: String(
          hostStyle.getPropertyValue('--af-color-primary') || tokens.colorPrimary,
        ),
        colorBg: String(hostStyle.getPropertyValue('--af-color-bg') || tokens.colorBg),
        colorSurface: String(
          hostStyle.getPropertyValue('--af-color-surface') || tokens.colorSurface,
        ),
      },
      resolved,
    );

    // Inject/update style tag in shadow root
    let styleEl = this.shadowRoot?.querySelector('#af-tokens') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'af-tokens';
      this.shadowRoot?.appendChild(styleEl);
    }
    styleEl.textContent = `:host { ${css} }`;
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
    const pending =
      (this as unknown as { _pendingProperties?: Array<{ name: string; value: unknown }> })
        ._pendingProperties ?? [];
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
