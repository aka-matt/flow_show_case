# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Web Component (`<architecture-flow>`) that renders React Flow architecture diagrams inside an open Shadow DOM, isolated from the host page. The component is JSON-driven and targetted at static site deployment.

- **Framework**: React + TypeScript inside a Custom Element
- **Graph library**: `@xyflow/react`
- **Build**: Vite Library Mode (ES module output)
- **No backend required** — everything runs in the browser

## Common Commands

```bash
npm run dev          # Start dev server (0.0.0.0)
npm run build        # TypeScript compile + Vite build → dist/
npm run preview      # Serve dist/ locally
npm run lint         # ESLint
npm run format       # Prettier write
npm run format:check # Prettier check
npm run typecheck    # tsc --noEmit
npm run test         # vitest run (unit + component)
npm run test:watch   # vitest watch mode
npm run test:e2e     # Playwright E2E tests
npm run test:e2e:ui  # Playwright with UI
npm run check        # lint + format:check + typecheck + test + build
```

## Architecture

```
src/
├── component/           # Custom Element (Web Component layer)
│   ├── ArchitectureFlowElement.ts   # Main custom element class
│   ├── attributes.ts    # Observed attributes mapping
│   ├── property-upgrade.ts  # Property upgrade during construction
│   └── events.ts        # Custom event definitions (composed: true)
├── react/               # React subtree mounted into Shadow DOM
│   ├── ArchitectureFlowApp.tsx  # Root React component
│   ├── FlowCanvas.tsx   # <ReactFlow> wrapper
│   ├── ErrorView.tsx / LoadingView.tsx / EmptyView.tsx
├── nodes/               # Custom React Flow node components
│   ├── ServiceNode.tsx / DatabaseNode.tsx / QueueNode.tsx
│   ├── ClientNode.tsx / GroupNode.tsx / GenericNode.tsx
│   └── nodeTypes.ts     # nodeTypes object passed to <ReactFlow>
├── edges/               # Custom edge component
│   ├── ArchitectureEdge.tsx
│   └── edgeTypes.ts
├── schema/              # JSON document types + Zod validation
│   ├── architecture-document.ts  # TypeScript interfaces
│   ├── zod-schema.ts
│   └── normalize.ts     # Transform raw JSON → React Flow format
├── theme/               # Theme system (light/dark/system + palettes)
│   ├── theme-types.ts
│   ├── palettes.ts      # 6 built-in palettes (blue, indigo, teal, violet, slate, amber)
│   ├── resolve-theme.ts # Resolves system/light/dark
│   ├── css-variables.ts # Injects CSS custom properties into Shadow DOM
│   └── component.css
├── data/                # Data loading
│   ├── load-json.ts     # Fetch + AbortController, supports src/property/inline JSON
│   └── abort-controller.ts
├── layout/              # Layout engines (manual + simple layered)
├── utils/               # clone, debounce, ids, logger
├── styles/
│   └── combined-styles.ts  # React Flow CSS + component CSS injected as ?inline
└── index.ts             # Entry point; registers the custom element
```

### Data Loading Priority

1. JavaScript `element.data` property (highest)
2. `src` attribute (external JSON URL)
3. Inline `<script type="application/json">` child element
4. Empty state (lowest)

### Theme System

Three modes: `light`, `dark`, `system` (listens to `prefers-color-scheme`). Resolved theme is set on the host as `data-resolved-theme`. Theme switching does NOT re-create the element, re-load data, or lose viewport — it only updates CSS custom properties.

### CSS Injection

React Flow CSS and component CSS are injected as `?inline` strings into the Shadow Root directly. The host page does NOT need to load any React Flow stylesheets.

### Custom Events

All events are `CustomEvent` with `{ bubbles: true, composed: true }` so they cross the Shadow DOM boundary. Key events: `flow-ready`, `flow-loading`, `flow-loaded`, `flow-error`, `node-click`, `edge-click`, `viewport-change`, `theme-change`, `data-change`.

### JSON Schema

Defined in `schema/architecture-document.ts` and validated at runtime with Zod. The document format is stable — do not break backward compatibility without a version bump.

## Key Constraints

- Never use `dangerouslySetInnerHTML`
- Never inject React Flow CSS into the global `document.head`
- Every listener/Observer/React Root/request must be cleaned up in `disconnectedCallback`
- Do not use `any` without a comment explaining why
- All text is React-escaped; no raw HTML from JSON
- `nodeTypes` and `edgeTypes` must be defined outside the component to maintain stable references
