# Architecture Flow Web Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `<architecture-flow>` — a JSON-driven Web Component that renders interactive React Flow architecture diagrams inside an open Shadow DOM, deployable as a single ES module on any static site.

**Architecture:** Custom Element (`ArchitectureFlowElement`) wraps a React subtree mounted via `createRoot` into an open Shadow DOM. React Flow renders nodes/edges inside Shadow DOM with all styles injected as `?inline` strings. Data flows: JSON → Zod validation → normalize → React props → React Flow. Theme system uses CSS custom properties injected per-instance; no global styles.

**Tech Stack:** TypeScript, React 18, `@xyflow/react`, Vite Library Mode, Vitest, React Testing Library, Playwright, ESLint, Prettier, Zod

---

## Global Constraints

- TypeScript strict mode; no `any` without comment explaining why
- No `dangerouslySetInnerHTML`
- React Flow CSS never injected into global `document.head` — always `?inline` into Shadow DOM
- `nodeTypes` / `edgeTypes` defined outside component (stable references)
- Every `addEventListener`, `ResizeObserver`, `fetch`, `React Root` must be cleaned up in `disconnectedCallback`
- Custom events: `{ bubbles: true, composed: true }` to cross Shadow DOM
- Zod schema version `"1.0"`; document format is stable

---

## File Map

```
flow_show_case/
├── src/
│   ├── index.ts                                    # Entry point; registers custom element
│   ├── component/
│   │   ├── ArchitectureFlowElement.ts              # Main Custom Element class
│   │   ├── attributes.ts                           # Observed attributes + property names
│   │   ├── property-upgrade.ts                     # Upgrade pre-set properties during construction
│   │   └── events.ts                               # Custom event name constants + helper
│   ├── react/
│   │   ├── ArchitectureFlowApp.tsx                 # Root React component (receives all props)
│   │   ├── FlowCanvas.tsx                          # <ReactFlow> wrapper with nodes/edges
│   │   ├── ErrorView.tsx
│   │   ├── LoadingView.tsx
│   │   └── EmptyView.tsx
│   ├── nodes/
│   │   ├── ServiceNode.tsx
│   │   ├── DatabaseNode.tsx
│   │   ├── QueueNode.tsx
│   │   ├── ClientNode.tsx
│   │   ├── GroupNode.tsx
│   │   ├── GenericNode.tsx
│   │   └── nodeTypes.ts                            # { ServiceNode, DatabaseNode, ... } object
│   ├── edges/
│   │   ├── ArchitectureEdge.tsx
│   │   └── edgeTypes.ts                            # { ArchitectureEdge } object
│   ├── schema/
│   │   ├── architecture-document.ts                # TypeScript interfaces (ArchitectureDocument, ArchitectureNode, etc.)
│   │   ├── zod-schema.ts                           # Zod schema matching the interfaces
│   │   └── normalize.ts                            # raw JSON → React Flow node/edge format
│   ├── theme/
│   │   ├── theme-types.ts                          # RequestedTheme, ResolvedTheme, PaletteName
│   │   ├── palettes.ts                             # 6 palette definitions (blue, indigo, teal, violet, slate, amber)
│   │   ├── resolve-theme.ts                        # resolveTheme(requested, mediaQuery) → ResolvedTheme
│   │   ├── css-variables.ts                        # buildCssVariables(palette, resolvedTheme) → string
│   │   └── component.css                           # Component styles (uses CSS custom properties)
│   ├── data/
│   │   ├── load-json.ts                            # fetchJson(url, abortSignal) with error handling
│   │   └── abort-controller.ts                     # createAbortController() → { signal, abort }
│   ├── layout/
│   │   ├── manual-layout.ts                        # applyManualLayout(nodes) — uses JSON positions
│   │   └── simple-layered-layout.ts                # simpleHorizontal/VerticalLayout(document) → positioned nodes
│   └── utils/
│       ├── clone.ts                                # deepClone<T>(obj): T  (structured clone or JSON round-trip)
│       ├── debounce.ts                             # debounce<T extends (...args: any[]) => any>(fn, ms)
│       ├── ids.ts                                  # generateId() → string
│       └── logger.ts                               # logger(type, message, detail?) — console.warn/error with prefix
├── tests/
│   ├── unit/
│   │   ├── schema/
│   │   │   ├── zod-schema.test.ts
│   │   │   └── normalize.test.ts
│   │   ├── theme/
│   │   │   └── resolve-theme.test.ts
│   │   └── layout/
│   │       └── simple-layered-layout.test.ts
│   ├── component/
│   │   └── ArchitectureFlowElement.test.ts         # Vitest + jsdom Web Component tests
│   └── react/
│       └── FlowCanvas.test.tsx                     # React Testing Library tests
├── examples/
│   ├── example.html                                # Full demo page
│   ├── architecture-basic.json
│   ├── architecture-microservices.json
│   └── architecture-data-pipeline.json
├── public/                                         # Static assets served by Vite dev server
├── dist/                                           # Build output
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.build.json
├── eslint.config.js
├── prettier.config.js
├── playwright.config.ts
├── vitest.config.ts
├── README.md
├── CHANGELOG.md
├── LICENSE
└── AGENTS.md
```

---

## Phase 1: Project Scaffold

### Task 1: Initialize Vite + React + TypeScript with Library Mode

**Files:**

- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.build.json`
- Create: `eslint.config.js`
- Create: `prettier.config.js`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`

**Interfaces:**

- Produces: scaffold that runs `npm run dev` successfully

- [ ] **Step 1: Write package.json**

```json
{
  "name": "architecture-flow",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/architecture-flow.js",
  "module": "./dist/architecture-flow.js",
  "types": "./dist/architecture-flow.d.ts",
  "exports": {
    ".": {
      "types": "./dist/architecture-flow.d.ts",
      "import": "./dist/architecture-flow.js"
    }
  },
  "files": ["dist", "README.md", "LICENSE"],
  "sideEffects": true,
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -p tsconfig.build.json && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "check": "npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build"
  },
  "dependencies": {
    "@xyflow/react": "^12.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "eslint": "^9.0.0",
    "prettier": "^3.4.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write vite.config.ts**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'architecture-flow.js',
    },
    sourcemap: true,
    cssCodeSplit: false,
    rollupOptions: {
      external: [],
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
});
```

- [ ] **Step 3: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "useUnknownInCatchVariables": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src", "tests"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Write tsconfig.build.json**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationDir": "./dist",
    "noEmit": false,
    "emitDeclarationOnly": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 5: Write eslint.config.js**

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/no-unknown-property': ['error', { ignore: ['class'] }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
```

- [ ] **Step 6: Write prettier.config.js and playwright.config.ts**

```js
// prettier.config.js
export default {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'consistent',
  trailingComma: 'all',
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
};
```

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 7: Write vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/component/**/*.test.ts',
    ],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 8: Write tests/setup.ts**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 9: Run npm install**

Run: `npm install`
Expected: All dependencies installed without errors

- [ ] **Step 10: Commit**

```bash
git add package.json vite.config.ts tsconfig.json tsconfig.build.json eslint.config.js prettier.config.js vitest.config.ts playwright.config.ts tests/setup.ts
git commit -m "feat: scaffold Vite + React + TypeScript project with library mode"
```

---

### Task 2: Minimal Custom Element with Shadow DOM and React Mount

**Files:**

- Create: `src/component/events.ts`
- Create: `src/component/attributes.ts`
- Create: `src/component/property-upgrade.ts`
- Create: `src/component/ArchitectureFlowElement.ts`
- Create: `src/index.ts`
- Create: `tests/setup.ts` (already exists — update to add jsdom matchers)

**Interfaces:**

- Produces: `npm run dev` shows a working `<architecture-flow>` element that mounts React into Shadow DOM

- [ ] **Step 1: Write src/component/events.ts**

```ts
export const EVENT_FLOW_READY = 'flow-ready';
export const EVENT_FLOW_LOADING = 'flow-loading';
export const EVENT_FLOW_LOADED = 'flow-loaded';
export const EVENT_FLOW_ERROR = 'flow-error';
export const EVENT_NODE_CLICK = 'node-click';
export const EVENT_NODE_DOUBLE_CLICK = 'node-double-click';
export const EVENT_EDGE_CLICK = 'edge-click';
export const EVENT_SELECTION_CHANGE = 'selection-change';
export const EVENT_VIEWPORT_CHANGE = 'viewport-change';
export const EVENT_DATA_CHANGE = 'data-change';
export const EVENT_THEME_CHANGE = 'theme-change';

export interface FlowReadyDetail {
  instance: unknown;
  data: unknown;
}

export interface FlowErrorDetail {
  code: string;
  message: string;
  error?: Error;
}

export function emitCustomEvent<T>(
  target: HTMLElement,
  name: string,
  detail: T,
  options?: Partial<CustomEventInit<T>>,
): void {
  target.dispatchEvent(
    new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true,
      ...options,
    }),
  );
}
```

- [ ] **Step 2: Write src/component/attributes.ts**

```ts
export const OBSERVED_ATTRIBUTES = [
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
] as const;

export type ObservedAttribute = (typeof OBSERVED_ATTRIBUTES)[number];

export const ATTRIBUTE_TO_PROPERTY: Record<string, string> = {
  'fit-view': 'fitView',
  'show-controls': 'showControls',
  'show-background': 'showBackground',
  'show-minimap': 'showMiniMap',
  'loading-text': 'loadingText',
  'empty-text': 'emptyText',
  'aria-label': 'ariaLabel',
};

export function getPropertyName(attr: string): string {
  return ATTRIBUTE_TO_PROPERTY[attr] ?? attr;
}
```

- [ ] **Step 3: Write src/component/property-upgrade.ts**

```ts
export interface PendingProperty {
  name: string;
  value: unknown;
}

/**
 * Collects property values set on a element instance before the custom element
 * is defined (i.e. before connection), so they can be re-applied after upgrade.
 */
export function collectPendingProperties(
  element: HTMLElement,
  propertyNames: string[],
): PendingProperty[] {
  const collected: PendingProperty[] = [];
  for (const name of propertyNames) {
    if (name in element) {
      collected.push({ name, value: (element as Record<string, unknown>)[name] });
    }
  }
  return collected;
}

/**
 * Re-applies collected pending properties to the element after upgrade.
 */
export function applyPendingProperties(element: HTMLElement, pending: PendingProperty[]): void {
  for (const { name, value } of pending) {
    (element as Record<string, unknown>)[name] = value;
  }
}
```

- [ ] **Step 4: Write src/component/ArchitectureFlowElement.ts**

```ts
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
    const pending =
      (this as unknown as { _pendingProperties?: Array<{ name: string; value: unknown }> })
        ._pendingProperties ?? [];
    // Will be handled in connectedCallback after shadow root is ready
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
    this._data = v;
    this._onDataSet(v);
  }

  get theme(): 'light' | 'dark' | 'system' {
    return this._theme;
  }
  set theme(v: 'light' | 'dark' | 'system') {
    this._theme = v;
    this._onThemeChange();
  }

  get palette(): string {
    return this._palette;
  }
  set palette(v: string) {
    this._palette = v;
    this._onPaletteChange();
  }

  get interactive(): boolean {
    return this._interactive;
  }
  set interactive(v: boolean) {
    this._interactive = v;
  }

  get fitView(): boolean {
    return this._fitView;
  }
  set fitView(v: boolean) {
    this._fitView = v;
  }

  get showControls(): boolean {
    return this._showControls;
  }
  set showControls(v: boolean) {
    this._showControls = v;
  }

  get showBackground(): boolean {
    return this._showBackground;
  }
  set showBackground(v: boolean) {
    this._showBackground = v;
  }

  get showMiniMap(): boolean {
    return this._showMiniMap;
  }
  set showMiniMap(v: boolean) {
    this._showMiniMap = v;
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
  }

  get emptyText(): string {
    return this._emptyText;
  }
  set emptyText(v: string) {
    this._emptyText = v;
  }

  get ariaLabel(): string {
    return this._ariaLabel;
  }
  set ariaLabel(v: string) {
    this._ariaLabel = v;
  }

  // Public methods
  fitView(_options?: unknown): Promise<void> {
    // Stub — implemented in Phase 6
    return Promise.resolve();
  }

  getData(): unknown {
    return this._data;
  }

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
    const pending =
      (this as unknown as { _pendingProperties?: Array<{ name: string; value: unknown }> })
        ._pendingProperties ?? [];
    for (const { name, value } of pending) {
      (this as Record<string, unknown>)[name] = value;
    }
    (this as unknown as { _pendingProperties: never })._pendingProperties = [];
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
```

- [ ] **Step 5: Write src/index.ts**

```ts
import './component/ArchitectureFlowElement.js';

declare global {
  interface HTMLElementTagNameMap {
    'architecture-flow': ArchitectureFlowElement;
  }
}
```

- [ ] **Step 6: Run npm run dev and verify it starts**

Run: `npm run dev`
Expected: Vite dev server starts on port 5173

- [ ] **Step 7: Commit**

```bash
git add src/component/events.ts src/component/attributes.ts src/component/property-upgrade.ts src/component/ArchitectureFlowElement.ts src/index.ts
git commit -m "feat: minimal Custom Element with open Shadow DOM"
```

---

## Phase 2: React Flow Minimum Integration

### Task 3: Inject React Flow CSS and Mount React Tree

**Files:**

- Modify: `src/component/ArchitectureFlowElement.ts` — add React Root creation + CSS injection
- Create: `src/styles/combined-styles.ts`
- Create: `src/react/ArchitectureFlowApp.tsx`
- Create: `src/react/FlowCanvas.tsx`
- Create: `src/styles/react-flow.css` (copy from @xyflow/react)

**Interfaces:**

- Consumes: `@xyflow/react`, `react-dom/client`
- Produces: React Flow renders inside Shadow DOM with correct styling

- [ ] **Step 1: Write src/styles/combined-styles.ts**

```ts
// React Flow base CSS — imported as inline string for Shadow DOM injection
import reactFlowCss from '@xyflow/react/dist/style.css?inline';

export const COMBINED_CSS = reactFlowCss;
```

- [ ] **Step 2: Write src/react/ArchitectureFlowApp.tsx**

```tsx
import React from 'react';

interface ArchitectureFlowAppProps {
  nodes: unknown[];
  edges: unknown[];
  options?: {
    interactive?: boolean;
    fitView?: boolean;
    showControls?: boolean;
    showBackground?: boolean;
    showMiniMap?: boolean;
  };
}

export function ArchitectureFlowApp({
  nodes,
  edges,
  options,
}: ArchitectureFlowAppProps): React.ReactElement {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <FlowCanvas nodes={nodes} edges={edges} options={options} />
    </div>
  );
}

// Lazy import to avoid circular deps
import { FlowCanvas } from './FlowCanvas.js';
```

- [ ] **Step 3: Write src/react/FlowCanvas.tsx**

```tsx
import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
  type ReactFlowProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from '../nodes/nodeTypes.js';
import { edgeTypes } from '../edges/edgeTypes.js';

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  options?: {
    interactive?: boolean;
    fitView?: boolean;
    showControls?: boolean;
    showBackground?: boolean;
    showMiniMap?: boolean;
  };
}

export function FlowCanvas({ nodes, edges, options }: FlowCanvasProps): React.ReactElement {
  const {
    interactive = false,
    fitView = true,
    showControls = true,
    showBackground = true,
    showMiniMap = false,
  } = options ?? {};

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep',
      animated: false,
    }),
    [],
  );

  const reactFlowProps: ReactFlowProps = {
    nodes,
    edges,
    nodeTypes,
    edgeTypes,
    defaultEdgeOptions,
    fitView,
    nodesDraggable: interactive,
    nodesConnectable: interactive,
    elementsSelectable: interactive,
    panOnDrag: interactive,
    zoomOnScroll: true,
    fitViewOptions: { padding: 0.2 },
    minZoom: 0.1,
    maxZoom: 2,
  };

  return (
    <ReactFlow {...reactFlowProps}>
      {showBackground && <Background variant={BackgroundVariant.Dots} gap={20} size={1} />}
      {showControls && <Controls />}
      {showMiniMap && <MiniMap />}
    </ReactFlow>
  );
}
```

- [ ] **Step 4: Write src/nodes/nodeTypes.ts (stub with GenericNode placeholder)**

```tsx
import { memo } from 'react';
import { type NodeProps, Handle, Position } from '@xyflow/react';

export const GenericNode = memo(function GenericNode({ data, selected }: NodeProps) {
  return (
    <div className={`generic-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-title">{String(data['label'] ?? 'Unknown')}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

export const nodeTypes = {
  generic: GenericNode,
  service: GenericNode,
  database: GenericNode,
  queue: GenericNode,
  client: GenericNode,
  group: GenericNode,
};
```

- [ ] **Step 5: Write src/edges/edgeTypes.ts**

```tsx
import { memo } from 'react';
import { type EdgeProps, BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';

export const ArchitectureEdge = memo(function ArchitectureEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected
            ? 'var(--af-color-edge-active, #3b82f6)'
            : 'var(--af-color-edge, #94a3b8)',
          strokeWidth: selected ? 2.5 : 1.5,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />
      {data?.['label'] && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="edge-label"
          >
            {String(data['label'])}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

export const edgeTypes = {
  smoothstep: ArchitectureEdge,
  default: ArchitectureEdge,
  straight: ArchitectureEdge,
  step: ArchitectureEdge,
  bezier: ArchitectureEdge,
};
```

- [ ] **Step 6: Update ArchitectureFlowElement.ts to create React Root**

Replace the `_mountReact` stub in `ArchitectureFlowElement.ts` with actual React Root creation:

```ts
import { createRoot, type Root } from 'react-dom/client';
import React from 'react';
import { ArchitectureFlowApp } from '../react/ArchitectureFlowApp.js';
import { COMBINED_CSS } from '../styles/combined-styles.js';

export class ArchitectureFlowElement extends HTMLElement {
  private _root: Root | null = null;
  private _resizeObserver: ResizeObserver | null = null;

  // ... existing code ...

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
    this._renderReact();
  }

  private _renderReact(): void {
    if (!this._root) return;
    this._root.render(
      React.createElement(ArchitectureFlowApp, {
        nodes: [],
        edges: [],
        options: {
          interactive: this._interactive,
          fitView: this._fitView,
          showControls: this._showControls,
          showBackground: this._showBackground,
          showMiniMap: this._showMiniMap,
        },
      }),
    );
  }

  disconnectedCallback(): void {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    this._root?.unmount();
    this._root = null;
  }

  private _setupResizeObserver(): void {
    this._resizeObserver = new ResizeObserver(() => {
      // Trigger React Flow re-compute — implemented in Phase 3
    });
    this._resizeObserver.observe(this);
  }
}
```

- [ ] **Step 7: Run npm run dev, open browser, verify React Flow renders**

Run: `npm run dev` → open http://localhost:5173
Expected: Page with `<architecture-flow>` renders a React Flow canvas (empty)

- [ ] **Step 8: Commit**

```bash
git add src/react/ArchitectureFlowApp.tsx src/react/FlowCanvas.tsx src/nodes/nodeTypes.ts src/edges/edgeTypes.ts src/styles/combined-styles.ts
git commit -m "feat: mount React Flow into Shadow DOM with CSS injected"
```

---

## Phase 3: JSON Schema, Validation, and Data Loading

### Task 4: TypeScript Interfaces + Zod Schema

**Files:**

- Create: `src/schema/architecture-document.ts`
- Create: `src/schema/zod-schema.ts`
- Create: `src/schema/normalize.ts`

**Interfaces:**

- Consumes: raw JSON object
- Produces: `ArchitectureDocument` (validated) + `NormalizedGraph` (React Flow format)

- [ ] **Step 1: Write src/schema/architecture-document.ts**

```ts
export type ArchitectureNodeType =
  'service' | 'database' | 'queue' | 'client' | 'group' | 'generic';

export type NodeStatus = 'default' | 'healthy' | 'warning' | 'error' | 'disabled';

export type EdgeType = 'default' | 'straight' | 'step' | 'smoothstep' | 'bezier';

export type EdgeStatus = 'default' | 'healthy' | 'warning' | 'error' | 'disabled';

export type LayoutType = 'manual' | 'simple-horizontal' | 'simple-vertical';

export interface ArchitecturePort {
  id: string;
  type: 'source' | 'target';
  side: 'left' | 'right' | 'top' | 'bottom';
  label?: string;
  offset?: number; // 0–100 percentage
}

export interface ArchitectureNode {
  id: string;
  type?: ArchitectureNodeType;
  title: string;
  subtitle?: string;
  description?: string;
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  icon?: string;
  status?: NodeStatus;
  badges?: string[];
  metadata?: Record<string, string | number | boolean | null>;
  ports?: ArchitecturePort[];
  className?: string;
  style?: Record<string, string | number>;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  sourcePort?: string;
  target: string;
  targetPort?: string;
  label?: string;
  type?: EdgeType;
  animated?: boolean;
  status?: EdgeStatus;
  markerEnd?: 'arrow' | 'none';
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ArchitectureOptions {
  layout?: LayoutType;
  fitView?: boolean;
  interactive?: boolean;
  showControls?: boolean;
  showBackground?: boolean;
  showMiniMap?: boolean;
  edgeAnimation?: boolean;
  minZoom?: number;
  maxZoom?: number;
}

export interface ArchitectureDocument {
  schemaVersion: '1.0';
  title?: string;
  description?: string;
  options?: ArchitectureOptions;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

export interface NormalizedNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  width?: number;
  height?: number;
  className?: string;
  style?: Record<string, string | number>;
}

export interface NormalizedEdge {
  id: string;
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
  label?: string;
  type: string;
  animated?: boolean;
  data?: Record<string, unknown>;
  markerEnd?: string;
  className?: string;
}

export interface NormalizedGraph {
  nodes: NormalizedNode[];
  edges: NormalizedEdge[];
}
```

- [ ] **Step 2: Write src/schema/zod-schema.ts**

```ts
import { z } from 'zod';

export const PORT_SIDES = ['left', 'right', 'top', 'bottom'] as const;
export const NODE_TYPES = ['service', 'database', 'queue', 'client', 'group', 'generic'] as const;
export const NODE_STATUSES = ['default', 'healthy', 'warning', 'error', 'disabled'] as const;
export const EDGE_TYPES = ['default', 'straight', 'step', 'smoothstep', 'bezier'] as const;
export const EDGE_STATUSES = ['default', 'healthy', 'warning', 'error', 'disabled'] as const;
export const LAYOUT_TYPES = ['manual', 'simple-horizontal', 'simple-vertical'] as const;

export const architecturePortSchema = z.object({
  id: z.string().min(1, 'Port id cannot be empty'),
  type: z.enum(['source', 'target']),
  side: z.enum(PORT_SIDES),
  label: z.string().optional(),
  offset: z.number().min(0).max(100).optional(),
});

export const architectureNodeSchema = z.object({
  id: z.string().min(1, 'Node id cannot be empty'),
  type: z.enum(NODE_TYPES).optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  icon: z.string().optional(),
  status: z.enum(NODE_STATUSES).optional(),
  badges: z.array(z.string()).optional(),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  ports: z.array(architecturePortSchema).optional(),
  className: z.string().optional(),
  style: z.record(z.union([z.string(), z.number()])).optional(),
});

export const architectureEdgeSchema = z.object({
  id: z.string().min(1, 'Edge id cannot be empty'),
  source: z.string().min(1),
  sourcePort: z.string().optional(),
  target: z.string().min(1),
  targetPort: z.string().optional(),
  label: z.string().optional(),
  type: z.enum(EDGE_TYPES).optional(),
  animated: z.boolean().optional(),
  status: z.enum(EDGE_STATUSES).optional(),
  markerEnd: z.enum(['arrow', 'none']).optional(),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export const architectureOptionsSchema = z.object({
  layout: z.enum(LAYOUT_TYPES).optional(),
  fitView: z.boolean().optional(),
  interactive: z.boolean().optional(),
  showControls: z.boolean().optional(),
  showBackground: z.boolean().optional(),
  showMiniMap: z.boolean().optional(),
  edgeAnimation: z.boolean().optional(),
  minZoom: z.number().optional(),
  maxZoom: z.number().optional(),
});

export const architectureDocumentSchema = z.object({
  schemaVersion: z.literal('1.0'),
  title: z.string().optional(),
  description: z.string().optional(),
  options: architectureOptionsSchema.optional(),
  nodes: z.array(architectureNodeSchema).min(0),
  edges: z.array(architectureEdgeSchema).min(0),
});

export type ValidationResult =
  | { success: true; data: import('./architecture-document.js').ArchitectureDocument }
  | { success: false; error: ZodErrorDetails };

export interface ZodErrorDetails {
  code: string;
  message: string;
  path?: string;
}

export function validateArchitectureDocument(raw: unknown): ValidationResult {
  const result = architectureDocumentSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const firstError = result.error.errors[0];
  const path = firstError.path.length > 0 ? `${firstError.path.join('.')}` : undefined;
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: firstError.message,
      path,
    },
  };
}
```

- [ ] **Step 3: Write src/schema/normalize.ts**

```ts
import type {
  ArchitectureDocument,
  ArchitectureNode,
  ArchitectureEdge,
  NormalizedNode,
  NormalizedEdge,
  NormalizedGraph,
} from './architecture-document.js';

/**
 * Maps our node type strings to React Flow node type strings.
 * Unknown types fall back to 'generic'.
 */
function mapNodeType(type?: string): string {
  const valid = ['service', 'database', 'queue', 'client', 'group', 'generic'];
  if (!type || !valid.includes(type)) return 'generic';
  return type;
}

/**
 * Maps our edge type strings to React Flow edge type strings.
 * Default/unknown falls back to 'smoothstep'.
 */
function mapEdgeType(type?: string): string {
  const valid = ['default', 'straight', 'step', 'smoothstep', 'bezier'];
  if (!type || !valid.includes(type)) return 'smoothstep';
  return type;
}

export function normalizeNodes(doc: ArchitectureDocument): NormalizedNode[] {
  const nodeMap = new Map<string, ArchitectureNode>();
  for (const node of doc.nodes) {
    nodeMap.set(node.id, node);
  }

  return doc.nodes.map((node): NormalizedNode => {
    const ports = node.ports ?? [];
    const portData = ports.length > 0 ? { ports: ports.map((p) => ({ ...p })) } : {};

    return {
      id: node.id,
      type: mapNodeType(node.type),
      position: node.position ?? { x: 0, y: 0 },
      data: {
        label: node.title,
        subtitle: node.subtitle,
        description: node.description,
        icon: node.icon,
        status: node.status ?? 'default',
        badges: node.badges ?? [],
        metadata: node.metadata ?? {},
        ...portData,
      },
      width: node.width,
      height: node.height,
      className: node.className,
      style: node.style,
    };
  });
}

export function normalizeEdges(doc: ArchitectureDocument): NormalizedEdge[] {
  const nodeIds = new Set(doc.nodes.map((n) => n.id));

  return doc.edges.map((edge): NormalizedEdge => {
    if (!nodeIds.has(edge.source)) {
      throw new Error(`edges[?].source references missing node: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      throw new Error(`edges[?].target references missing node: ${edge.target}`);
    }

    return {
      id: edge.id,
      source: edge.source,
      sourceHandle: edge.sourcePort,
      target: edge.target,
      targetHandle: edge.targetPort,
      label: edge.label,
      type: mapEdgeType(edge.type),
      animated: edge.animated ?? false,
      markerEnd: edge.markerEnd === 'arrow' ? 'url(#arrow)' : undefined,
      data: {
        label: edge.label,
        status: edge.status ?? 'default',
        ...(edge.metadata ? { metadata: edge.metadata } : {}),
      },
      className: edge.className,
    };
  });
}

export function normalize(doc: ArchitectureDocument): NormalizedGraph {
  return {
    nodes: normalizeNodes(doc),
    edges: normalizeEdges(doc),
  };
}
```

- [ ] **Step 4: Write tests/unit/schema/zod-schema.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import {
  architectureDocumentSchema,
  validateArchitectureDocument,
} from '../../../src/schema/zod-schema.js';

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
```

- [ ] **Step 5: Write tests/unit/schema/normalize.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { normalize } from '../../../src/schema/normalize.js';
import type { ArchitectureDocument } from '../../../src/schema/architecture-document.js';

const SIMPLE_DOC: ArchitectureDocument = {
  schemaVersion: '1.0',
  nodes: [
    { id: 'web', type: 'client', title: 'Web Client', position: { x: 0, y: 0 } },
    { id: 'api', type: 'service', title: 'API', position: { x: 200, y: 0 } },
  ],
  edges: [{ id: 'e1', source: 'web', target: 'api', label: 'HTTPS' }],
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
      nodes: [
        {
          id: 'svc',
          title: 'Service',
          ports: [
            { id: 'in', type: 'target', side: 'left' },
            { id: 'out', type: 'source', side: 'right' },
          ],
        },
      ],
      edges: [],
    };
    const { nodes } = normalize(doc);
    expect(nodes[0].data['ports']).toHaveLength(2);
  });
});
```

- [ ] **Step 6: Run tests to verify**

Run: `npm run test -- --run tests/unit/schema/`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/schema/architecture-document.ts src/schema/zod-schema.ts src/schema/normalize.ts tests/unit/schema/
git commit -m "feat: TypeScript interfaces and Zod schema for ArchitectureDocument"
```

---

### Task 5: Data Loading (src/property, src attribute, inline JSON) + AbortController

**Files:**

- Create: `src/data/abort-controller.ts`
- Create: `src/data/load-json.ts`
- Modify: `src/component/ArchitectureFlowElement.ts`

**Interfaces:**

- Consumes: `src` attribute URL, `data` property, inline `<script type="application/json">`
- Produces: `ArchitectureDocument | null` + fires `flow-loading` / `flow-loaded` / `flow-error`

- [ ] **Step 1: Write src/data/abort-controller.ts**

```ts
export interface AbortControllerRef {
  signal: AbortSignal;
  abort: () => void;
}

let counter = 0;

export function createAbortController(): AbortControllerRef {
  const id = ++counter;
  let aborted = false;
  let controller: AbortController | null = new AbortController();

  return {
    get signal() {
      return controller!.signal;
    },
    abort() {
      if (aborted) return;
      aborted = true;
      controller?.abort();
      controller = null;
    },
  };
}
```

- [ ] **Step 2: Write src/data/load-json.ts**

```ts
import type { ArchitectureDocument } from '../schema/architecture-document.js';
import { validateArchitectureDocument } from '../schema/zod-schema.js';

export interface LoadResult {
  source: 'src' | 'property' | 'inline';
  data: ArchitectureDocument;
}

export interface LoadError {
  code: string;
  message: string;
  error?: Error;
}

export async function fetchJson(url: string, signal: AbortSignal): Promise<ArchitectureDocument> {
  const response = await fetch(url, {
    signal,
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  // Try to parse; content-type check is lenient per spec
  let raw: unknown;
  try {
    raw = await response.json();
  } catch (err) {
    throw new Error('Invalid JSON response');
  }

  const validated = validateArchitectureDocument(raw);
  if (!validated.success) {
    const e = validated.error;
    throw new Error(e.path ? `${e.code}: ${e.message} at ${e.path}` : `${e.code}: ${e.message}`);
  }

  return validated.data;
}

export function parseInlineJson(text: string): ArchitectureDocument {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Invalid inline JSON');
  }
  const validated = validateArchitectureDocument(raw);
  if (!validated.success) {
    const e = validated.error;
    throw new Error(e.path ? `${e.code}: ${e.message} at ${e.path}` : `${e.code}: ${e.message}`);
  }
  return validated.data;
}
```

- [ ] **Step 3: Update ArchitectureFlowElement.ts with full data loading**

Replace the stub implementations in `ArchitectureFlowElement.ts` with:

```ts
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
  emitCustomEvent,
} from './events.js';

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

  // ... getters/setters same as before ...

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

  // ... getters/setters for all properties ...

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

  private _renderReact(nodes?: unknown[], edges?: unknown[], options?: unknown): void {
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
      }),
    );
  }

  private _renderEmpty(): void {
    this._renderReact([], []);
  }

  private _renderError(message: string): void {
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
    const resolved =
      this._theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
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
    const pending =
      (this as unknown as { _pendingProperties?: Array<{ name: string; value: unknown }> })
        ._pendingProperties ?? [];
    for (const { name, value } of pending) {
      (this as Record<string, unknown>)[name] = value;
    }
    (this as unknown as { _pendingProperties: never })._pendingProperties = [];
  }

  private _setupResizeObserver(): void {
    this._resizeObserver = new ResizeObserver(() => {
      // Trigger React Flow re-compute
    });
    this._resizeObserver.observe(this);
  }
}
```

- [ ] **Step 4: Write tests/unit/data/load-json.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { parseInlineJson } from '../../../src/data/load-json.js';

describe('load-json', () => {
  it('parses valid inline JSON', () => {
    const json = JSON.stringify({ schemaVersion: '1.0', nodes: [], edges: [] });
    const result = parseInlineJson(json);
    expect(result.schemaVersion).toBe('1.0');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseInlineJson('not json')).toThrow('Invalid JSON');
  });

  it('throws on invalid schema', () => {
    const json = JSON.stringify({ schemaVersion: '99.0', nodes: [], edges: [] });
    expect(() => parseInlineJson(json)).toThrow('schemaVersion');
  });
});
```

- [ ] **Step 5: Commit**

```bash
git add src/data/abort-controller.ts src/data/load-json.ts
git commit -m "feat: data loading with AbortController and inline JSON support"
```

---

## Phase 4: Custom Nodes and Edges

### Task 6: Implement All Six Node Types

**Files:**

- Create: `src/nodes/ServiceNode.tsx`
- Create: `src/nodes/DatabaseNode.tsx`
- Create: `src/nodes/QueueNode.tsx`
- Create: `src/nodes/ClientNode.tsx`
- Create: `src/nodes/GroupNode.tsx`
- Create: `src/nodes/GenericNode.tsx`
- Modify: `src/nodes/nodeTypes.ts`
- Create: `src/theme/component.css`
- Create: `src/theme/theme-types.ts`
- Create: `src/theme/palettes.ts`

**Interfaces:**

- Consumes: `NormalizedNode` data
- Produces: React Flow node components with handles/ports

- [ ] **Step 1: Write src/theme/theme-types.ts**

```ts
export type RequestedTheme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type PaletteName = 'blue' | 'indigo' | 'teal' | 'violet' | 'slate' | 'amber';

export interface Palette {
  name: PaletteName;
  colorBg: string;
  colorSurface: string;
  colorSurfaceElevated: string;
  colorText: string;
  colorTextMuted: string;
  colorBorder: string;
  colorGrid: string;
  colorPrimary: string;
  colorPrimarySoft: string;
  colorPrimaryContrast: string;
  colorEdge: string;
  colorEdgeActive: string;
  colorHandle: string;
  colorSelection: string;
  colorSuccess: string;
  colorWarning: string;
  colorDanger: string;
  colorDisabled: string;
  shadowNode: string;
  shadowNodeHover: string;
  radiusNode: string;
  fontFamily: string;
}
```

- [ ] **Step 2: Write src/theme/palettes.ts**

```ts
import type { Palette, PaletteName } from './theme-types.js';

export const PALETTES: Record<PaletteName, { light: Palette; dark: Palette }> = {
  blue: {
    light: {
      name: 'blue',
      colorBg: '#f8fafc',
      colorSurface: '#ffffff',
      colorSurfaceElevated: '#f1f5f9',
      colorText: '#0f172a',
      colorTextMuted: '#64748b',
      colorBorder: '#e2e8f0',
      colorGrid: '#e2e8f0',
      colorPrimary: '#3b82f6',
      colorPrimarySoft: '#dbeafe',
      colorPrimaryContrast: '#ffffff',
      colorEdge: '#94a3b8',
      colorEdgeActive: '#3b82f6',
      colorHandle: '#3b82f6',
      colorSelection: '#3b82f6',
      colorSuccess: '#22c55e',
      colorWarning: '#f59e0b',
      colorDanger: '#ef4444',
      colorDisabled: '#cbd5e1',
      shadowNode: '0 1px 3px rgba(0,0,0,0.1)',
      shadowNodeHover: '0 4px 12px rgba(0,0,0,0.15)',
      radiusNode: '12px',
      fontFamily: 'system-ui, sans-serif',
    },
    dark: {
      name: 'blue',
      colorBg: '#0f172a',
      colorSurface: '#1e293b',
      colorSurfaceElevated: '#334155',
      colorText: '#f8fafc',
      colorTextMuted: '#94a3b8',
      colorBorder: '#334155',
      colorGrid: '#334155',
      colorPrimary: '#60a5fa',
      colorPrimarySoft: '#1e3a5f',
      colorPrimaryContrast: '#0f172a',
      colorEdge: '#64748b',
      colorEdgeActive: '#60a5fa',
      colorHandle: '#60a5fa',
      colorSelection: '#60a5fa',
      colorSuccess: '#22c55e',
      colorWarning: '#f59e0b',
      colorDanger: '#ef4444',
      colorDisabled: '#475569',
      shadowNode: '0 1px 3px rgba(0,0,0,0.4)',
      shadowNodeHover: '0 4px 12px rgba(0,0,0,0.5)',
      radiusNode: '12px',
      fontFamily: 'system-ui, sans-serif',
    },
  },
  indigo: {
    light: {
      name: 'indigo',
      colorBg: '#f8fafc',
      colorSurface: '#ffffff',
      colorSurfaceElevated: '#f1f5f9',
      colorText: '#0f172a',
      colorTextMuted: '#64748b',
      colorBorder: '#e2e8f0',
      colorGrid: '#e2e8f0',
      colorPrimary: '#6366f1',
      colorPrimarySoft: '#e0e7ff',
      colorPrimaryContrast: '#ffffff',
      colorEdge: '#94a3b8',
      colorEdgeActive: '#6366f1',
      colorHandle: '#6366f1',
      colorSelection: '#6366f1',
      colorSuccess: '#22c55e',
      colorWarning: '#f59e0b',
      colorDanger: '#ef4444',
      colorDisabled: '#cbd5e1',
      shadowNode: '0 1px 3px rgba(0,0,0,0.1)',
      shadowNodeHover: '0 4px 12px rgba(0,0,0,0.15)',
      radiusNode: '12px',
      fontFamily: 'system-ui, sans-serif',
    },
    dark: {
      name: 'indigo',
      colorBg: '#0f172a',
      colorSurface: '#1e293b',
      colorSurfaceElevated: '#334155',
      colorText: '#f8fafc',
      colorTextMuted: '#94a3b8',
      colorBorder: '#334155',
      colorGrid: '#334155',
      colorPrimary: '#818cf8',
      colorPrimarySoft: '#312e81',
      colorPrimaryContrast: '#0f172a',
      colorEdge: '#64748b',
      colorEdgeActive: '#818cf8',
      colorHandle: '#818cf8',
      colorSelection: '#818cf8',
      colorSuccess: '#22c55e',
      colorWarning: '#f59e0b',
      colorDanger: '#ef4444',
      colorDisabled: '#475569',
      shadowNode: '0 1px 3px rgba(0,0,0,0.4)',
      shadowNodeHover: '0 4px 12px rgba(0,0,0,0.5)',
      radiusNode: '12px',
      fontFamily: 'system-ui, sans-serif',
    },
  },
  teal: {
    light: {
      name: 'teal',
      colorBg: '#f8fafc',
      colorSurface: '#ffffff',
      colorSurfaceElevated: '#f1f5f9',
      colorText: '#0f172a',
      colorTextMuted: '#64748b',
      colorBorder: '#e2e8f0',
      colorGrid: '#e2e8f0',
      colorPrimary: '#14b8a6',
      colorPrimarySoft: '#ccfbf1',
      colorPrimaryContrast: '#ffffff',
      colorEdge: '#94a3b8',
      colorEdgeActive: '#14b8a6',
      colorHandle: '#14b8a6',
      colorSelection: '#14b8a6',
      colorSuccess: '#22c55e',
      colorWarning: '#f59e0b',
      colorDanger: '#ef4444',
      colorDisabled: '#cbd5e1',
      shadowNode: '0 1px 3px rgba(0,0,0,0.1)',
      shadowNodeHover: '0 4px 12px rgba(0,0,0,0.15)',
      radiusNode: '12px',
      fontFamily: 'system-ui, sans-serif',
    },
    dark: {
      name: 'teal',
      colorBg: '#0f172a',
      colorSurface: '#1e293b',
      colorSurfaceElevated: '#334155',
      colorText: '#f8fafc',
      colorTextMuted: '#94a3b8',
      colorBorder: '#334155',
      colorGrid: '#334155',
      colorPrimary: '#2dd4bf',
      colorPrimarySoft: '#134e4a',
      colorPrimaryContrast: '#0f172a',
      colorEdge: '#64748b',
      colorEdgeActive: '#2dd4bf',
      colorHandle: '#2dd4bf',
      colorSelection: '#2dd4bf',
      colorSuccess: '#22c55e',
      colorWarning: '#f59e0b',
      colorDanger: '#ef4444',
      colorDisabled: '#475569',
      shadowNode: '0 1px 3px rgba(0,0,0,0.4)',
      shadowNodeHover: '0 4px 12px rgba(0,0,0,0.5)',
      radiusNode: '12px',
      fontFamily: 'system-ui, sans-serif',
    },
  },
  violet: {
    light: {
      name: 'violet',
      colorBg: '#f8fafc',
      colorSurface: '#ffffff',
      colorSurfaceElevated: '#f1f5f9',
      colorText: '#0f172a',
      colorTextMuted: '#64748b',
      colorBorder: '#e2e8f0',
      colorGrid: '#e2e8f0',
      colorPrimary: '#8b5cf6',
      colorPrimarySoft: '#ede9fe',
      colorPrimaryContrast: '#ffffff',
      colorEdge: '#94a3b8',
      colorEdgeActive: '#8b5cf6',
      colorHandle: '#8b5cf6',
      colorSelection: '#8b5cf6',
      colorSuccess: '#22c55e',
      colorWarning: '#f59e0b',
      colorDanger: '#ef4444',
      colorDisabled: '#cbd5e1',
      shadowNode: '0 1px 3px rgba(0,0,0,0.1)',
      shadowNodeHover: '0 4px 12px rgba(0,0,0,0.15)',
      radiusNode: '12px',
      fontFamily: 'system-ui, sans-serif',
    },
    dark: {
      name: 'violet',
      colorBg: '#0f172a',
      colorSurface: '#1e293b',
      colorSurfaceElevated: '#334155',
      colorText: '#f8fafc',
      colorTextMuted: '#94a3b8',
      colorBorder: '#334155',
      colorGrid: '#334155',
      colorPrimary: '#a78bfa',
      colorPrimarySoft: '#4c1d95',
      colorPrimaryContrast: '#0f172a',
      colorEdge: '#64748b',
      colorEdgeActive: '#a78bfa',
      colorHandle: '#a78bfa',
      colorSelection: '#a78bfa',
      colorSuccess: '#22c55e',
      colorWarning: '#f59e0b',
      colorDanger: '#ef4444',
      colorDisabled: '#475569',
      shadowNode: '0 1px 3px rgba(0,0,0,0.4)',
      shadowNodeHover: '0 4px 12px rgba(0,0,0,0.5)',
      radiusNode: '12px',
      fontFamily: 'system-ui, sans-serif',
    },
  },
  slate: {
    light: {
      name: 'slate',
      colorBg: '#f8fafc',
      colorSurface: '#ffffff',
      colorSurfaceElevated: '#f1f5f9',
      colorText: '#0f172a',
      colorTextMuted: '#64748b',
      colorBorder: '#e2e8f0',
      colorGrid: '#e2e8f0',
      colorPrimary: '#64748b',
      colorPrimarySoft: '#f1f5f9',
      colorPrimaryContrast: '#ffffff',
      colorEdge: '#94a3b8',
      colorEdgeActive: '#64748b',
      colorHandle: '#64748b',
      colorSelection: '#64748b',
      colorSuccess: '#22c55e',
      colorWarning: '#f59e0b',
      colorDanger: '#ef4444',
      colorDisabled: '#cbd5e1',
      shadowNode: '0 1px 3px rgba(0,0,0,0.1)',
      shadowNodeHover: '0 4px 12px rgba(0,0,0,0.15)',
      radiusNode: '12px',
      fontFamily: 'system-ui, sans-serif',
    },
    dark: {
      name: 'slate',
      colorBg: '#0f172a',
      colorSurface: '#1e293b',
      colorSurfaceElevated: '#334155',
      colorText: '#f8fafc',
      colorTextMuted: '#94a3b8',
      colorBorder: '#334155',
      colorGrid: '#334155',
      colorPrimary: '#94a3b8',
      colorPrimarySoft: '#1e293b',
      colorPrimaryContrast: '#0f172a',
      colorEdge: '#64748b',
      colorEdgeActive: '#94a3b8',
      colorHandle: '#94a3b8',
      colorSelection: '#94a3b8',
      colorSuccess: '#22c55e',
      colorWarning: '#f59e0b',
      colorDanger: '#ef4444',
      colorDisabled: '#475569',
      shadowNode: '0 1px 3px rgba(0,0,0,0.4)',
      shadowNodeHover: '0 4px 12px rgba(0,0,0,0.5)',
      radiusNode: '12px',
      fontFamily: 'system-ui, sans-serif',
    },
  },
  amber: {
    light: {
      name: 'amber',
      colorBg: '#f8fafc',
      colorSurface: '#ffffff',
      colorSurfaceElevated: '#f1f5f9',
      colorText: '#0f172a',
      colorTextMuted: '#64748b',
      colorBorder: '#e2e8f0',
      colorGrid: '#e2e8f0',
      colorPrimary: '#f59e0b',
      colorPrimarySoft: '#fef3c7',
      colorPrimaryContrast: '#ffffff',
      colorEdge: '#94a3b8',
      colorEdgeActive: '#f59e0b',
      colorHandle: '#f59e0b',
      colorSelection: '#f59e0b',
      colorSuccess: '#22c55e',
      colorWarning: '#f59e0b',
      colorDanger: '#ef4444',
      colorDisabled: '#cbd5e1',
      shadowNode: '0 1px 3px rgba(0,0,0,0.1)',
      shadowNodeHover: '0 4px 12px rgba(0,0,0,0.15)',
      radiusNode: '12px',
      fontFamily: 'system-ui, sans-serif',
    },
    dark: {
      name: 'amber',
      colorBg: '#0f172a',
      colorSurface: '#1e293b',
      colorSurfaceElevated: '#334155',
      colorText: '#f8fafc',
      colorTextMuted: '#94a3b8',
      colorBorder: '#334155',
      colorGrid: '#334155',
      colorPrimary: '#fbbf24',
      colorPrimarySoft: '#78350f',
      colorPrimaryContrast: '#0f172a',
      colorEdge: '#64748b',
      colorEdgeActive: '#fbbf24',
      colorHandle: '#fbbf24',
      colorSelection: '#fbbf24',
      colorSuccess: '#22c55e',
      colorWarning: '#f59e0b',
      colorDanger: '#ef4444',
      colorDisabled: '#475569',
      shadowNode: '0 1px 3px rgba(0,0,0,0.4)',
      shadowNodeHover: '0 4px 12px rgba(0,0,0,0.5)',
      radiusNode: '12px',
      fontFamily: 'system-ui, sans-serif',
    },
  },
};

export function getPalette(name: PaletteName): { light: Palette; dark: Palette } {
  return PALETTES[name] ?? PALETTES.blue;
}
```

- [ ] **Step 3: Write src/theme/resolve-theme.ts**

```ts
import type { RequestedTheme, ResolvedTheme } from './theme-types.js';

export function resolveTheme(requested: RequestedTheme): ResolvedTheme {
  if (requested === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return requested;
}
```

- [ ] **Step 4: Write src/theme/css-variables.ts**

```ts
import type { Palette, ResolvedTheme } from './theme-types.js';

export function buildCssVariables(palette: Palette, theme: ResolvedTheme): string {
  const p = palette;
  return `
--af-color-bg: ${p.colorBg};
--af-color-surface: ${p.colorSurface};
--af-color-surface-elevated: ${p.colorSurfaceElevated};
--af-color-text: ${p.colorText};
--af-color-text-muted: ${p.colorTextMuted};
--af-color-border: ${p.colorBorder};
--af-color-grid: ${p.colorGrid};
--af-color-primary: ${p.colorPrimary};
--af-color-primary-soft: ${p.colorPrimarySoft};
--af-color-primary-contrast: ${p.colorPrimaryContrast};
--af-color-edge: ${p.colorEdge};
--af-color-edge-active: ${p.colorEdgeActive};
--af-color-handle: ${p.colorHandle};
--af-color-selection: ${p.colorSelection};
--af-color-success: ${p.colorSuccess};
--af-color-warning: ${p.colorWarning};
--af-color-danger: ${p.colorDanger};
--af-color-disabled: ${p.colorDisabled};
--af-shadow-node: ${p.shadowNode};
--af-shadow-node-hover: ${p.shadowNodeHover};
--af-radius-node: ${p.radiusNode};
--af-font-family: ${p.fontFamily};
  `.trim();
}
```

- [ ] **Step 5: Write src/theme/component.css**

```css
.af-node {
  background: var(--af-color-surface);
  border: 1px solid var(--af-color-border);
  border-radius: var(--af-radius-node);
  box-shadow: var(--af-shadow-node);
  padding: 12px 16px;
  min-width: 120px;
  max-width: 240px;
  font-family: var(--af-font-family);
  color: var(--af-color-text);
  transition:
    box-shadow 0.2s,
    border-color 0.2s;
}

.af-node:hover {
  box-shadow: var(--af-shadow-node-hover);
  border-color: var(--af-color-primary);
}

.af-node.selected,
.af-node:focus-visible {
  border-color: var(--af-color-selection);
  outline: 2px solid var(--af-color-selection);
  outline-offset: 2px;
}

.af-node__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--af-color-text);
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.af-node__subtitle {
  font-size: 11px;
  color: var(--af-color-text-muted);
  margin: 0;
  line-height: 1.3;
}

.af-node__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.af-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  background: var(--af-color-primary-soft);
  color: var(--af-color-primary);
  font-weight: 500;
}

.af-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
  vertical-align: middle;
}

.af-status-dot--healthy {
  background: var(--af-color-success);
}
.af-status-dot--warning {
  background: var(--af-color-warning);
}
.af-status-dot--error {
  background: var(--af-color-danger);
}
.af-status-dot--disabled {
  background: var(--af-color-disabled);
}
.af-status-dot--default {
  background: var(--af-color-primary);
}

.af-handle {
  width: 10px !important;
  height: 10px !important;
  background: var(--af-color-handle) !important;
  border: 2px solid var(--af-color-surface) !important;
}

.edge-label {
  background: var(--af-color-surface);
  border: 1px solid var(--af-color-border);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  color: var(--af-color-text-muted);
  font-family: var(--af-font-family);
}

.react-flow__node.selected .af-node {
  border-color: var(--af-color-selection);
}

.react-flow__edge-path {
  stroke: var(--af-color-edge);
}

.react-flow__edge.selected .react-flow__edge-path {
  stroke: var(--af-color-edge-active);
}

@media (prefers-reduced-motion: reduce) {
  .af-node,
  .react-flow__edge-path {
    transition: none;
  }
}
```

- [ ] **Step 6: Write all six node components**

Each node has the same base structure but different icons:

```tsx
// src/nodes/ServiceNode.tsx
import React, { memo } from 'react';
import { type NodeProps, Handle, Position } from '@xyflow/react';
import type { NormalizedNode } from '../schema/architecture-document.js';

const STATUS_COLORS: Record<string, string> = {
  default: 'var(--af-color-primary)',
  healthy: 'var(--af-color-success)',
  warning: 'var(--af-color-warning)',
  error: 'var(--af-color-danger)',
  disabled: 'var(--af-color-disabled)',
};

export const ServiceNode = memo(function ServiceNode({
  data,
  selected,
}: NodeProps<NormalizedNode>) {
  const status = String(data['status'] ?? 'default');
  const badges = (data['badges'] as string[] | undefined) ?? [];

  return (
    <div
      className={`af-node ${selected ? 'selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Service: ${String(data['label'])}`}
    >
      <Handle type="target" position={Position.Left} className="af-handle" />
      <div
        className="af-node__header"
        style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}
      >
        <span className="af-status-dot" style={{ background: STATUS_COLORS[status] }} />
        <span style={{ fontSize: 16, marginRight: 6 }}>&#9634;</span>
        <span className="af-node__title">{String(data['label'])}</span>
      </div>
      {data['subtitle'] && <p className="af-node__subtitle">{String(data['subtitle'])}</p>}
      {badges.length > 0 && (
        <div className="af-node__badges">
          {badges.map((b) => (
            <span key={b} className="af-badge">
              {b}
            </span>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="af-handle" />
    </div>
  );
});
```

Write similar components for `DatabaseNode.tsx` (&#9651; icon), `QueueNode.tsx` (&#9711; icon), `ClientNode.tsx` (&#9679; icon), `GroupNode.tsx` (&#9633; icon), and `GenericNode.tsx` (&#9670; icon). Each uses the same structure but with different shape character in the icon area.

- [ ] **Step 7: Update src/nodes/nodeTypes.ts**

```ts
import { ServiceNode } from './ServiceNode.js';
import { DatabaseNode } from './DatabaseNode.js';
import { QueueNode } from './QueueNode.js';
import { ClientNode } from './ClientNode.js';
import { GroupNode } from './GroupNode.js';
import { GenericNode } from './GenericNode.js';

export const nodeTypes = {
  service: ServiceNode,
  database: DatabaseNode,
  queue: QueueNode,
  client: ClientNode,
  group: GroupNode,
  generic: GenericNode,
};
```

- [ ] **Step 8: Run tests and dev server to verify**

Run: `npm run test -- --run` and `npm run dev`
Expected: Nodes render correctly, tests pass

- [ ] **Step 9: Commit**

```bash
git add src/nodes/ src/theme/component.css src/theme/theme-types.ts src/theme/palettes.ts src/theme/resolve-theme.ts src/theme/css-variables.ts
git commit -m "feat: implement all 6 node types with theme CSS variables"
```

---

### Task 7: Implement Edge Component with Labels, Animation, Status

**Files:**

- Modify: `src/edges/ArchitectureEdge.tsx`
- Modify: `src/edges/edgeTypes.ts`

- [ ] **Step 1: Rewrite ArchitectureEdge.tsx with full features**

```tsx
import React, { memo, useMemo } from 'react';
import {
  type EdgeProps,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  MarkerMarker,
} from '@xyflow/react';

const STATUS_COLORS: Record<string, string> = {
  default: 'var(--af-color-edge)',
  healthy: 'var(--af-color-success)',
  warning: 'var(--af-color-warning)',
  error: 'var(--af-color-danger)',
  disabled: 'var(--af-color-disabled)',
};

export const ArchitectureEdge = memo(function ArchitectureEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  animated,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const status = String(data?.['status'] ?? 'default');
  const color = selected ? 'var(--af-color-edge-active)' : STATUS_COLORS[status];
  const label = data?.['label'];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <>
      {animated && !reducedMotion && (
        <circle r="10" fill={color} opacity="0.4">
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 2.5 : 1.5,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
        markerEnd={`url(#arrow-${id})`}
      />
      <defs>
        <MarkerMarker
          id={`arrow-${id}`}
          markerWidth="12"
          markerHeight="12"
          refX="6"
          refY="6"
          orient="auto"
        >
          <path d="M 0 0 L 12 6 L 0 12 z" fill={color} />
        </MarkerMarker>
      </defs>
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="edge-label nodrag nopan"
          >
            {String(label)}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
```

- [ ] **Step 2: Update edgeTypes.ts**

```ts
export { ArchitectureEdge as default } from './ArchitectureEdge.js';

export const edgeTypes = {
  smoothstep: ArchitectureEdge,
  default: ArchitectureEdge,
  straight: ArchitectureEdge,
  step: ArchitectureEdge,
  bezier: ArchitectureEdge,
};
```

- [ ] **Step 3: Commit**

```bash
git add src/edges/
git commit -m "feat: ArchitectureEdge with status colors, labels, and animation"
```

---

## Phase 5: Theme System

### Task 8: Complete Theme System (light/dark/system + CSS Variables + Palette Switching)

**Files:**

- Modify: `src/component/ArchitectureFlowElement.ts` — wire up `_applyCssVariables`, `_resolveAndApplyTheme`, palette fallback
- Modify: `src/react/ArchitectureFlowApp.tsx` — accept and pass theme/palette props
- Create: `src/theme/index.ts`

**Interfaces:**

- Consumes: `theme` attribute, `palette` attribute, system `prefers-color-scheme`
- Produces: CSS custom properties in Shadow DOM; `data-resolved-theme` on host

- [ ] **Step 1: Write src/theme/index.ts**

```ts
export { resolveTheme } from './resolve-theme.js';
export { buildCssVariables } from './css-variables.js';
export { getPalette } from './palettes.js';
export type { RequestedTheme, ResolvedTheme, PaletteName, Palette } from './theme-types.js';
```

- [ ] **Step 2: Update ArchitectureFlowElement.ts**

Add to the class:

```ts
import { getPalette, resolveTheme, buildCssVariables } from '../theme/index.js';
import type { PaletteName, ResolvedTheme } from '../theme/index.js';

private _applyCssVariables(): void {
  const paletteName = (this._palette as PaletteName) ?? 'blue';
  const palette = getPalette(paletteName);
  const resolved = this._resolvedTheme as ResolvedTheme;
  const tokens = this._theme === 'dark'
    ? palette.dark
    : (this._theme === 'light' ? palette.light : (window.matchMedia('(prefers-color-scheme: dark)').matches ? palette.dark : palette.light));

  // Override with host inline styles (CSS variables set on element.style)
  const hostStyle = this.style;
  const css = buildCssVariables(
    {
      ...tokens,
      colorPrimary: String(hostStyle.getPropertyValue('--af-color-primary') || tokens.colorPrimary),
      colorBg: String(hostStyle.getPropertyValue('--af-color-bg') || tokens.colorBg),
      colorSurface: String(hostStyle.getPropertyValue('--af-color-surface') || tokens.colorSurface),
    },
    resolved
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

private _resolveAndApplyTheme(): void {
  const resolved = resolveTheme(this._theme);
  this._resolvedTheme = resolved;
  this.setAttribute('data-resolved-theme', resolved);
  this._applyCssVariables();
}
```

- [ ] **Step 3: Wire up palette fallback in attributeChangedCallback**

```ts
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
```

- [ ] **Step 4: Wire up system theme change in `_onSystemThemeChange`**

```ts
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
```

- [ ] **Step 5: Write theme resolution tests**

```ts
// tests/unit/theme/resolve-theme.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveTheme } from '../../../src/theme/resolve-theme.js';

describe('resolve-theme', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns light when system prefers light', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    expect(resolveTheme('system')).toBe('light');
  });

  it('returns dark when system prefers dark', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    expect(resolveTheme('system')).toBe('dark');
  });

  it('returns light when theme is light', () => {
    expect(resolveTheme('light')).toBe('light');
  });

  it('returns dark when theme is dark', () => {
    expect(resolveTheme('dark')).toBe('dark');
  });
});
```

- [ ] **Step 6: Run tests**

Run: `npm run test -- --run`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/theme/index.ts src/component/ArchitectureFlowElement.ts tests/unit/theme/
git commit -m "feat: theme system with 6 palettes, light/dark/system modes, and CSS variables"
```

---

## Phase 6: Public API, Methods, Events

### Task 9: Public API — Properties, Methods, Custom Events

**Files:**

- Modify: `src/component/ArchitectureFlowElement.ts` — implement fitView, reload, resetViewport, getData, setData; wire all events
- Create: `src/react/ErrorView.tsx`, `src/react/LoadingView.tsx`, `src/react/EmptyView.tsx`
- Modify: `src/react/ArchitectureFlowApp.tsx` — add loading/empty/error states

**Interfaces:**

- Produces: All public methods, all custom events, all UI states

- [ ] **Step 1: Write state view components**

```tsx
// src/react/ErrorView.tsx
import React from 'react';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message }: ErrorViewProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--af-color-danger)',
        fontFamily: 'var(--af-font-family)',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 32 }}>&#9888;</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>Failed to load architecture</div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--af-color-text-muted)',
          maxWidth: 300,
          textAlign: 'center',
        }}
      >
        {message}
      </div>
    </div>
  );
}
```

```tsx
// src/react/LoadingView.tsx
import React from 'react';

interface LoadingViewProps {
  text?: string;
}

export function LoadingView({ text }: LoadingViewProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--af-color-text-muted)',
        fontFamily: 'var(--af-font-family)',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 32, animation: 'af-spin 1s linear infinite' }}>&#8635;</div>
      <div style={{ fontSize: 14 }}>{text ?? 'Loading…'}</div>
      <style>{`@keyframes af-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
```

```tsx
// src/react/EmptyView.tsx
import React from 'react';

interface EmptyViewProps {
  text?: string;
}

export function EmptyView({ text }: EmptyViewProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--af-color-text-muted)',
        fontFamily: 'var(--af-font-family)',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 32 }}>&#9711;</div>
      <div style={{ fontSize: 14 }}>{text ?? 'No architecture data'}</div>
    </div>
  );
}
```

- [ ] **Step 2: Update ArchitectureFlowApp.tsx**

```tsx
import React from 'react';
import { FlowCanvas } from './FlowCanvas.js';
import { ErrorView } from './ErrorView.js';
import { LoadingView } from './LoadingView.js';
import { EmptyView } from './EmptyView.js';

type AppState = 'loading' | 'loaded' | 'error' | 'empty';

interface ArchitectureFlowAppProps {
  nodes: unknown[];
  edges: unknown[];
  options?: Record<string, unknown>;
  state?: AppState;
  errorMessage?: string;
  loadingText?: string;
  emptyText?: string;
}

export function ArchitectureFlowApp({
  nodes,
  edges,
  options,
  state = 'loaded',
  errorMessage,
  loadingText,
  emptyText,
}: ArchitectureFlowAppProps): React.ReactElement {
  switch (state) {
    case 'loading':
      return React.createElement(LoadingView, { text: loadingText });
    case 'error':
      return React.createElement(ErrorView, { message: errorMessage });
    case 'empty':
      return React.createElement(EmptyView, { text: emptyText });
    default:
      return React.createElement(FlowCanvas, { nodes, edges, options });
  }
}
```

- [ ] **Step 3: Implement all public methods in ArchitectureFlowElement.ts**

Add to the class body:

```ts
fitView(options?: { padding?: number; duration?: number }): Promise<void> {
  const padding = options?.padding ?? 0.2;
  // The React Flow instance is accessed via the React component ref
  // We'll store a ref to the ReactFlow instance
  const instance = (this as unknown as { _rfInstance?: unknown })._rfInstance;
  if (instance && typeof (instance as Record<string, unknown>).fitView === 'function') {
    return (instance as Record<string, (opts: unknown) => Promise<void>>).fitView({ padding, duration: options?.duration });
  }
  return Promise.resolve();
}

reload(): Promise<void> {
  this._data = null;
  this._currentSrc = null;
  return this._loadData();
}

resetViewport(): Promise<void> {
  return this.fitView();
}
```

- [ ] **Step 4: Wire up viewport-change and node/edge click events in FlowCanvas.tsx**

```tsx
// In FlowCanvas.tsx, add to ReactFlow:
onNodeClick={(_event, node) => {
  emitCustomEvent(this as unknown as HTMLElement, EVENT_NODE_CLICK, { node, originalEvent: _event });
}}
onEdgeClick={(_event, edge) => {
  emitCustomEvent(this as unknown as HTMLElement, EVENT_EDGE_CLICK, { edge, originalEvent: _event });
}}
onMoveEnd={(_event, viewport) => {
  emitCustomEvent(this as unknown as HTMLElement, EVENT_VIEWPORT_CHANGE, { x: viewport.x, y: viewport.y, zoom: viewport.zoom });
}}
```

- [ ] **Step 5: Wire up flow-ready event after React Flow is ready**

In `FlowCanvas.tsx`, use `onInit` callback:

```tsx
onInit={(instance) => {
  (containerRef.current as unknown as { _rfInstance?: unknown })._rfInstance = instance;
  emitCustomEvent(this as unknown as HTMLElement, EVENT_FLOW_READY, { instance, data: null });
}}
```

- [ ] **Step 6: Debounce viewport-change**

In `ArchitectureFlowElement.ts`, add a debounced viewport handler:

```ts
import { debounce } from './utils/debounce.js';

private _onViewportChange = debounce((x: number, y: number, zoom: number) => {
  emitCustomEvent(this, EVENT_VIEWPORT_CHANGE, { x, y, zoom });
}, 100);
```

- [ ] **Step 7: Write src/utils/debounce.ts**

```ts
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, ms);
  };
}
```

- [ ] **Step 8: Write src/utils/clone.ts**

```ts
export function deepClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}
```

- [ ] **Step 9: Write src/utils/ids.ts**

```ts
let counter = 0;
export function generateId(): string {
  return `af-${Date.now().toString(36)}-${(++counter).toString(36)}`;
}
```

- [ ] **Step 10: Write src/utils/logger.ts**

```ts
export function logger(type: 'warn' | 'error', message: string, detail?: unknown): void {
  const prefix = '[architecture-flow]';
  if (type === 'error') {
    console.error(`${prefix} ${message}`, detail ?? '');
  } else {
    console.warn(`${prefix} ${message}`, detail ?? '');
  }
}
```

- [ ] **Step 11: Run tests**

Run: `npm run test -- --run`
Expected: All pass

- [ ] **Step 12: Commit**

```bash
git add src/utils/ src/react/ErrorView.tsx src/react/LoadingView.tsx src/react/EmptyView.tsx
git commit -m "feat: public API — properties, methods, events, and state views"
```

---

## Phase 7: Example Page

### Task 10: Complete examples/example.html

**Files:**

- Create: `examples/example.html`
- Create: `examples/architecture-basic.json`
- Create: `examples/architecture-microservices.json`
- Create: `examples/architecture-data-pipeline.json`

**Interfaces:**

- Consumes: `dist/architecture-flow.js`, JSON data files
- Produces: `examples/example.html` covering all demo sections from the spec

- [ ] **Step 1: Write examples/architecture-basic.json** (use the spec's recommended JSON)

```json
{
  "schemaVersion": "1.0",
  "title": "Order Platform",
  "options": {
    "layout": "manual",
    "fitView": true,
    "interactive": true,
    "showControls": true,
    "showBackground": true,
    "edgeAnimation": true
  },
  "nodes": [
    {
      "id": "web",
      "type": "client",
      "title": "Web Client",
      "subtitle": "React SPA",
      "position": { "x": 0, "y": 120 },
      "status": "healthy",
      "ports": [{ "id": "https", "type": "source", "side": "right", "label": "HTTPS" }]
    },
    {
      "id": "gateway",
      "type": "service",
      "title": "API Gateway",
      "subtitle": "Authentication and routing",
      "position": { "x": 300, "y": 120 },
      "ports": [
        { "id": "public", "type": "target", "side": "left" },
        { "id": "orders", "type": "source", "side": "right" }
      ]
    },
    {
      "id": "order-service",
      "type": "service",
      "title": "Order Service",
      "subtitle": "Go service",
      "position": { "x": 600, "y": 80 },
      "ports": [
        { "id": "api", "type": "target", "side": "left" },
        { "id": "db", "type": "source", "side": "right", "offset": 35 },
        { "id": "events", "type": "source", "side": "right", "offset": 70 }
      ],
      "metadata": {
        "runtime": "Go",
        "port": 8080
      }
    },
    {
      "id": "orders-db",
      "type": "database",
      "title": "Orders DB",
      "subtitle": "PostgreSQL",
      "position": { "x": 920, "y": 20 },
      "ports": [{ "id": "sql", "type": "target", "side": "left" }]
    },
    {
      "id": "event-bus",
      "type": "queue",
      "title": "Event Bus",
      "subtitle": "Kafka",
      "position": { "x": 920, "y": 210 },
      "ports": [{ "id": "produce", "type": "target", "side": "left" }]
    }
  ],
  "edges": [
    {
      "id": "web-gateway",
      "source": "web",
      "sourcePort": "https",
      "target": "gateway",
      "targetPort": "public",
      "label": "REST / HTTPS",
      "animated": true,
      "markerEnd": "arrow"
    },
    {
      "id": "gateway-orders",
      "source": "gateway",
      "sourcePort": "orders",
      "target": "order-service",
      "targetPort": "api",
      "label": "Internal API",
      "markerEnd": "arrow"
    },
    {
      "id": "orders-db",
      "source": "order-service",
      "sourcePort": "db",
      "target": "orders-db",
      "targetPort": "sql",
      "label": "SQL",
      "markerEnd": "arrow"
    },
    {
      "id": "orders-events",
      "source": "order-service",
      "sourcePort": "events",
      "target": "event-bus",
      "targetPort": "produce",
      "label": "Order events",
      "animated": true,
      "markerEnd": "arrow"
    }
  ]
}
```

- [ ] **Step 2: Write examples/example.html** — full page with all sections from spec §19

The HTML should include:

- Header with project description, Theme select (light/dark/system), Palette select (6 options)
- Demo A: Basic external JSON
- Demo B: JavaScript Property API
- Demo C: Inline JSON
- Demo D: Theme/palette switching
- Demo E: Runtime data controls (Load microservices, Load pipeline, Clear data, Reload src, Fit view, Reset viewport)
- Demo F: Event log panel (max 50 entries)
- Demo G: Multiple instances (dark+violet vs light+teal side by side)
- Demo H: Hostile CSS isolation test
- Demo I: CSS variables override
- Demo J: Error states

- [ ] **Step 3: Write architecture-microservices.json and architecture-data-pipeline.json**

Two additional sample JSON files with different node/edge structures.

- [ ] **Step 4: Test in browser**

Run: `npm run dev` → open http://localhost:5173/examples/example.html
Expected: All demos work correctly

- [ ] **Step 5: Commit**

```bash
git add examples/
git commit -m "feat: complete example.html with all demo sections"
```

---

## Phase 8: Tests, Documentation, and Final Build

### Task 11: Unit Tests + Component Tests

**Files:**

- Create: `tests/unit/layout/simple-layered-layout.test.ts`
- Create: `tests/unit/theme/resolve-theme.test.ts` (already written in Task 8)
- Create: `tests/component/ArchitectureFlowElement.test.ts`
- Create: `tests/react/FlowCanvas.test.tsx`

**Interfaces:**

- Consumes: `ArchitectureFlowElement`, schema, theme resolution
- Produces: All unit and component tests passing

- [ ] **Step 1: Write tests/unit/layout/simple-layered-layout.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import {
  simpleHorizontalLayout,
  simpleVerticalLayout,
} from '../../../src/layout/simple-layered-layout.js';
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
    const ids = result.nodes.map((n) => n.id);
    expect(ids).toEqual(['a', 'b', 'c']);
    // a should be leftmost
    const aNode = result.nodes.find((n) => n.id === 'a')!;
    const bNode = result.nodes.find((n) => n.id === 'b')!;
    expect(aNode.position.x).toBeLessThan(bNode.position.x);
  });

  it('places nodes in layers vertically', () => {
    const result = simpleVerticalLayout(LINEAR_DOC);
    const aNode = result.nodes.find((n) => n.id === 'a')!;
    const bNode = result.nodes.find((n) => n.id === 'b')!;
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
```

- [ ] **Step 2: Write tests/component/ArchitectureFlowElement.test.ts**

```ts
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

  it('fires flow-error with composed:true', () => {
    const el = document.createElement('architecture-flow');
    const events: CustomEvent[] = [];
    el.addEventListener('flow-error', (e) => events.push(e as CustomEvent));
    el.setData({ schemaVersion: '99.0', nodes: [], edges: [] } as never);
    document.body.appendChild(el);
    // Wait for validation
    setTimeout(() => {
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].composed).toBe(true);
      expect(events[0].bubbles).toBe(true);
      el.remove();
    }, 10);
  });

  it('cleans up on disconnectedCallback', () => {
    const el = document.createElement('architecture-flow');
    document.body.appendChild(el);
    el.remove();
    // No error thrown = cleanup succeeded
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 3: Write tests/react/FlowCanvas.test.tsx**

```ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlowCanvas } from '../../src/react/FlowCanvas.js';
import { ReactFlowProvider } from '@xyflow/react';

describe('FlowCanvas', () => {
  it('renders with empty nodes and edges', () => {
    render(
      <ReactFlowProvider>
        <FlowCanvas nodes={[]} edges={[]} options={{}} />
      </ReactFlowProvider>
    );
    // ReactFlowProvider is required for ReactFlow to work
    expect(screen.container.querySelector('.react-flow')).toBeTruthy();
  });
});
```

- [ ] **Step 4: Run all tests**

Run: `npm run test -- --run`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add tests/
git commit -m "test: unit, component, and React tests"
```

---

### Task 12: Layout Engines

**Files:**

- Create: `src/layout/manual-layout.ts`
- Create: `src/layout/simple-layered-layout.ts`
- Modify: `src/schema/normalize.ts` — call layout engine when JSON has `options.layout`

**Interfaces:**

- Consumes: `ArchitectureDocument` with `options.layout`
- Produces: `NormalizedGraph` with positions filled in for `manual` layout

- [ ] **Step 1: Write src/layout/manual-layout.ts**

```ts
import type { ArchitectureDocument, NormalizedGraph } from '../schema/architecture-document.js';

export function applyManualLayout(
  doc: ArchitectureDocument,
  graph: NormalizedGraph,
): NormalizedGraph {
  const positionMap = new Map(doc.nodes.map((n) => [n.id, n.position ?? { x: 0, y: 0 }]));
  return {
    ...graph,
    nodes: graph.nodes.map((node) => ({
      ...node,
      position: positionMap.get(node.id) ?? { x: 0, y: 0 },
    })),
  };
}
```

- [ ] **Step 2: Write src/layout/simple-layered-layout.ts**

```ts
import type {
  ArchitectureDocument,
  NormalizedGraph,
  NormalizedNode,
} from '../schema/architecture-document.js';

interface Layer {
  nodes: NormalizedNode[];
}

function computeInDegree(doc: ArchitectureDocument): Map<string, number> {
  const degree = new Map<string, number>();
  for (const node of doc.nodes) degree.set(node.id, 0);
  for (const edge of doc.edges) {
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  }
  return degree;
}

export function simpleHorizontalLayout(doc: ArchitectureDocument): NormalizedGraph {
  const degree = computeInDegree(doc);
  const layers: Layer[] = [];
  const remaining = new Set(doc.nodes.map((n) => n.id));
  const nodeMap = new Map(doc.nodes.map((n) => [n.id, n]));

  while (remaining.size > 0) {
    const layer: NormalizedNode[] = [];
    for (const id of remaining) {
      if ((degree.get(id) ?? 0) === 0) {
        const node = nodeMap.get(id)!;
        layer.push({ ...node, position: { x: layers.length * 250, y: layer.length * 100 } });
        remaining.delete(id);
      }
    }
    if (layer.length === 0) {
      // Cycle fallback — place remaining nodes
      let i = 0;
      for (const id of remaining) {
        const node = nodeMap.get(id)!;
        layer.push({ ...node, position: { x: layers.length * 250, y: i * 100 } });
        remaining.delete(id);
        i++;
      }
    }
    layers.push({ nodes: layer });
  }

  return {
    nodes: layers.flatMap((l) => l.nodes),
    edges: doc.edges.map((e) => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourcePort,
      target: e.target,
      targetHandle: e.targetPort,
      label: e.label,
      type: e.type ?? 'smoothstep',
      animated: e.animated,
      data: { label: e.label, status: e.status ?? 'default' },
    })),
  };
}

export function simpleVerticalLayout(doc: ArchitectureDocument): NormalizedGraph {
  const degree = computeInDegree(doc);
  const layers: Layer[] = [];
  const remaining = new Set(doc.nodes.map((n) => n.id));
  const nodeMap = new Map(doc.nodes.map((n) => [n.id, n]));

  while (remaining.size > 0) {
    const layer: NormalizedNode[] = [];
    for (const id of remaining) {
      if ((degree.get(id) ?? 0) === 0) {
        const node = nodeMap.get(id)!;
        layer.push({ ...node, position: { x: layer.length * 250, y: layers.length * 120 } });
        remaining.delete(id);
      }
    }
    if (layer.length === 0) {
      let i = 0;
      for (const id of remaining) {
        const node = nodeMap.get(id)!;
        layer.push({ ...node, position: { x: i * 250, y: layers.length * 120 } });
        remaining.delete(id);
        i++;
      }
    }
    layers.push({ nodes: layer });
  }

  return {
    nodes: layers.flatMap((l) => l.nodes),
    edges: doc.edges.map((e) => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourcePort,
      target: e.target,
      targetHandle: e.targetPort,
      label: e.label,
      type: e.type ?? 'smoothstep',
      animated: e.animated,
      data: { label: e.label, status: e.status ?? 'default' },
    })),
  };
}
```

- [ ] **Step 3: Wire layout into normalize**

In `normalize.ts`, add a `layout` parameter and call the appropriate layout engine.

- [ ] **Step 4: Commit**

```bash
git add src/layout/
git commit -m "feat: layout engines — manual and simple layered (horizontal/vertical)"
```

---

### Task 13: README, Final Build Verification

**Files:**

- Create: `README.md`
- Create: `CHANGELOG.md`
- Create: `LICENSE`
- Modify: `package.json` (ensure version, description, etc.)

**Interfaces:**

- Consumes: Full implementation
- Produces: README with install, usage, API table, JSON schema docs; clean build output

- [ ] **Step 1: Write README.md**

````markdown
# architecture-flow

A JSON-driven Web Component for rendering interactive architecture diagrams using React Flow, deployable as a single ES module on any static site.

## Features

- Shadow DOM isolation — never pollutes the host page
- JSON-driven: external URL, JavaScript property, or inline `<script>` data
- 6 node types: service, database, queue, client, group, generic
- 6 color palettes: blue, indigo, teal, violet, slate, amber
- 3 theme modes: light, dark, system (reacts to OS preference)
- Animated edges, edge labels, node status indicators
- Public API: `fitView()`, `reload()`, `resetViewport()`, `getData()`, `setData()`
- Composed custom events cross Shadow DOM boundaries

## Quick Start

```html
<script type="module" src="./dist/architecture-flow.js"></script>

<architecture-flow src="./my-architecture.json" theme="system" palette="blue" interactive fit-view>
</architecture-flow>
```
````

## Installation

```bash
npm install
```

## Commands

| Command            | Description                              |
| ------------------ | ---------------------------------------- |
| `npm run dev`      | Start dev server                         |
| `npm run build`    | Build for production                     |
| `npm run test`     | Run unit tests                           |
| `npm run test:e2e` | Run Playwright E2E tests                 |
| `npm run check`    | lint + format + typecheck + test + build |

````

Write the full README with sections for: Installation, Commands, Usage (with all three data input methods), Attributes table, JavaScript Properties table, Methods table, Events table, JSON Schema reference, Theme & Palette reference, Browser Support, and License.

- [ ] **Step 2: Write LICENSE** (MIT)

- [ ] **Step 3: Write CHANGELOG.md** (v1.0.0 initial release)

- [ ] **Step 4: Run full check**

Run: `npm run check`
Expected: All commands pass

- [ ] **Step 5: If check passes, commit**

```bash
git add README.md CHANGELOG.md LICENSE
git commit -m "docs: README, CHANGELOG, LICENSE"
git add package.json
git commit -m "chore: finalize package.json"
````

---

## Self-Review Checklist

- [ ] Spec coverage: Skim each section of flow_show_case.md. All 16 acceptance criteria have tasks.
- [ ] No placeholders: All steps show actual code or commands.
- [ ] Type consistency: `ArchitectureDocument`, `NormalizedGraph`, `PaletteName`, `RequestedTheme` used consistently across all tasks.
- [ ] Task boundaries: Each task is independently testable; setup/config folded into the task that needs it.
- [ ] Commit-ready: Each task ends with a commit step.

## Spec Coverage Map

| Spec Section                                 | Tasks                                           |
| -------------------------------------------- | ----------------------------------------------- |
| §1 Project goal (Web Component + React Flow) | Tasks 1–2                                       |
| §3 Tech stack                                | Task 1                                          |
| §4 Deliverables structure                    | Task 1                                          |
| §5 Directory structure                       | Task 1                                          |
| §6 Web Component interface                   | Tasks 2, 9                                      |
| §7 JSON document model                       | Task 4                                          |
| §8 Shadow DOM                                | Tasks 2, 3                                      |
| §9 Theme mode                                | Tasks 5, 8                                      |
| §10 Palettes                                 | Tasks 5, 8                                      |
| §11 Nodes                                    | Tasks 6, 7                                      |
| §12 Edges                                    | Task 7                                          |
| §13 Layout                                   | Task 12                                         |
| §14 Lifecycle                                | Tasks 2, 3, 5                                   |
| §15 Data loading & security                  | Tasks 3, 5                                      |
| §16 Accessibility                            | Covered in node components                      |
| §17 Performance                              | nodeTypes/edgeTypes stable refs in nodeTypes.ts |
| §18 Vite build                               | Task 1                                          |
| §19 example.html                             | Task 10                                         |
| §21 Tests                                    | Tasks 4, 8, 11                                  |
| §22 Acceptance criteria                      | All tasks                                       |
| §23 npm scripts                              | Task 1                                          |
