import { EVENT_FLOW_ERROR, FlowErrorDetail, emitCustomEvent } from './events.js';

const DEFAULT_HEIGHT = '600px';
const DEFAULT_THEME = 'system';
const DEFAULT_PALETTE = 'blue';

export class ArchitectureFlowElement extends HTMLElement {
  private _data: unknown = null;
  private _theme: 'light' | 'dark' | 'system' = DEFAULT_THEME as 'light' | 'dark' | 'system';
  private _palette: string = DEFAULT_PALETTE;
  private _interactive: boolean = false;
  private _fitView: boolean = true;
  private _showControls: boolean = true;
  private _showBackground: boolean = true;
  private _showMiniMap: boolean = false;
  private _readonly: boolean = true;
  private _loadingText: string = 'Loading architecture diagram…';
  private _emptyText: string = 'No architecture data';
  private _ariaLabel: string = 'Architecture diagram';

  constructor() {
    super();
    // Collect pre-upgrade properties
    const pending = (this as unknown as { _pendingProperties?: Array<{ name: string; value: unknown }> })._pendingProperties ?? [];
    // Will be handled in connectedCallback after shadow root is ready
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
    this._data = v;
    this._onDataSet(v);
  }

  get theme(): 'light' | 'dark' | 'system' { return this._theme; }
  set theme(v: 'light' | 'dark' | 'system') { this._theme = v; this._onThemeChange(); }

  get palette(): string { return this._palette; }
  set palette(v: string) { this._palette = v; this._onPaletteChange(); }

  get interactive(): boolean { return this._interactive; }
  set interactive(v: boolean) { this._interactive = v; }

  get fitView(): boolean { return this._fitView; }
  set fitView(v: boolean) { this._fitView = v; }

  get showControls(): boolean { return this._showControls; }
  set showControls(v: boolean) { this._showControls = v; }

  get showBackground(): boolean { return this._showBackground; }
  set showBackground(v: boolean) { this._showBackground = v; }

  get showMiniMap(): boolean { return this._showMiniMap; }
  set showMiniMap(v: boolean) { this._showMiniMap = v; }

  get readonly(): boolean { return this._readonly; }
  set readonly(v: boolean) { this._readonly = v; }

  get loadingText(): string { return this._loadingText; }
  set loadingText(v: string) { this._loadingText = v; }

  get emptyText(): string { return this._emptyText; }
  set emptyText(v: string) { this._emptyText = v; }

  // Override HTMLElement.ariaLabel
  override get ariaLabel(): string { return this._ariaLabel; }
  override set ariaLabel(v: string) { this._ariaLabel = v; }

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
    // Stub — implemented in Phase 3
    return Promise.resolve();
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
  }

  disconnectedCallback(): void {
    // Cleanup implemented in Phase 3 (fetch) and Phase 6 (full)
  }

  attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null): void {
    if (oldVal === newVal) return;
    switch (name) {
      case 'theme':
        this._theme = (newVal as 'light' | 'dark' | 'system') ?? DEFAULT_THEME;
        this._onThemeChange();
        break;
      case 'palette':
        this._palette = newVal ?? DEFAULT_PALETTE;
        this._onPaletteChange();
        break;
      case 'height':
        this._updateHeight();
        break;
    }
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
        height: 100%;
      }
    `;
    this.shadowRoot!.appendChild(style);
  }

  private _mountReact(): void {
    const container = document.createElement('div');
    container.className = 'af-host';
    container.setAttribute('part', 'container');
    this.shadowRoot!.appendChild(container);
    // React mount point — actual React Root created in Phase 2
  }

  private _applyPendingProperties(): void {
    const pending = (this as unknown as { _pendingProperties?: Array<{ name: string; value: unknown }> })._pendingProperties ?? [];
    for (const { name, value } of pending) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)[name] = value;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any)._pendingProperties = [];
  }

  private _setupResizeObserver(): void {
    // Implemented in Phase 2
  }

  private _updateHeight(): void {
    const attr = this.getAttribute('height');
    const height = attr ?? DEFAULT_HEIGHT;
    this.style.setProperty('--af-height', height);
  }

  private _onDataSet(data: unknown): void {
    // Implemented in Phase 3
  }

  private _onThemeChange(): void {
    // Implemented in Phase 5
  }

  private _onPaletteChange(): void {
    // Implemented in Phase 5
  }
}
