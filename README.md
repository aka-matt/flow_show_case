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

## Quick Start

```html
<script type="module" src="./dist/architecture-flow.js"></script>

<architecture-flow src="./my-architecture.json" theme="system" palette="blue" interactive fit-view>
</architecture-flow>
```

## Usage

### Method 1: External JSON via `src` attribute

```html
<architecture-flow src="./architecture.json" theme="system" palette="blue" interactive fit-view>
</architecture-flow>
```

### Method 2: JavaScript Property API

```html
<architecture-flow id="flow"></architecture-flow>

<script type="module">
  const flow = document.querySelector('#flow');
  flow.data = {
    schemaVersion: '1.0',
    nodes: [
      { id: 'client', type: 'client', title: 'Web Browser', position: { x: 0, y: 100 } },
      { id: 'server', type: 'service', title: 'API Server', position: { x: 300, y: 100 } },
      { id: 'db', type: 'database', title: 'Database', position: { x: 600, y: 100 } },
    ],
    edges: [
      { id: 'c-s', source: 'client', target: 'server', label: 'HTTPS' },
      { id: 's-d', source: 'server', target: 'db', label: 'SQL' },
    ],
  };
</script>
```

### Method 3: Inline JSON

```html
<architecture-flow theme="light" palette="teal" interactive fit-view>
  <script type="application/json">
    {
      "schemaVersion": "1.0",
      "nodes": [
        {
          "id": "client",
          "type": "client",
          "title": "Web Browser",
          "position": { "x": 0, "y": 100 }
        },
        {
          "id": "server",
          "type": "service",
          "title": "API Server",
          "position": { "x": 300, "y": 100 }
        }
      ],
      "edges": [{ "id": "c-s", "source": "client", "target": "server", "label": "HTTPS" }]
    }
  </script>
</architecture-flow>
```

## HTML Attributes

| Attribute         | Type    | Default                  | Description                                                                     |
| ----------------- | ------- | ------------------------ | ------------------------------------------------------------------------------- |
| `src`             | string  | —                        | URL to JSON architecture document                                               |
| `theme`           | string  | `"system"`               | Theme mode: `"light"`, `"dark"`, or `"system"`                                  |
| `palette`         | string  | `"blue"`                 | Color palette: `"blue"`, `"indigo"`, `"teal"`, `"violet"`, `"slate"`, `"amber"` |
| `interactive`     | boolean | `false`                  | Enable node dragging and edge editing                                           |
| `fit-view`        | boolean | `true`                   | Automatically fit view on load                                                  |
| `show-controls`   | boolean | `true`                   | Show zoom control buttons                                                       |
| `show-background` | boolean | `true`                   | Show dot background                                                             |
| `show-minimap`    | boolean | `false`                  | Show mini map                                                                   |
| `loading-text`    | string  | `"Loading..."`           | Text shown while loading                                                        |
| `empty-text`      | string  | `"No data"`              | Text shown when no data is loaded                                               |
| `aria-label`      | string  | `"Architecture diagram"` | Accessible label                                                                |
| `height`          | string  | `"600px"`                | CSS height of the component                                                     |

## JavaScript Properties

| Property         | Type    | Description                                   |
| ---------------- | ------- | --------------------------------------------- |
| `data`           | object  | Get or set the architecture document directly |
| `theme`          | string  | Get or set the theme mode                     |
| `palette`        | string  | Get or set the color palette                  |
| `interactive`    | boolean | Get or set interactive mode                   |
| `fitView`        | boolean | Get or set fit-view on load                   |
| `showControls`   | boolean | Get or set controls visibility                |
| `showBackground` | boolean | Get or set background visibility              |
| `showMiniMap`    | boolean | Get or set mini map visibility                |
| `loadingText`    | string  | Get or set loading text                       |
| `emptyText`      | string  | Get or set empty state text                   |

## JavaScript Methods

| Method                   | Returns   | Description                                                                         |
| ------------------------ | --------- | ----------------------------------------------------------------------------------- |
| `fitViewAsync(options?)` | `Promise` | Fit the diagram to the viewport. Options: `{ padding?: number, duration?: number }` |
| `reload()`               | `Promise` | Reload the diagram from the `src` attribute                                         |
| `resetViewport()`        | `Promise` | Reset the viewport to fit the diagram                                               |
| `getData()`              | `object`  | Get the current architecture document                                               |
| `setData(data)`          | `void`    | Set the architecture document programmatically                                      |

## Events

All events are composed and bubble through the Shadow DOM boundary.

| Event              | Detail                                       | Description                              |
| ------------------ | -------------------------------------------- | ---------------------------------------- |
| `flow-ready`       | `{ instance, data }`                         | Fired when React Flow initializes        |
| `flow-loading`     | `{ src }`                                    | Fired when loading begins (external src) |
| `flow-loaded`      | `{ source, data }`                           | Fired when data loads successfully       |
| `flow-error`       | `{ code, message, error? }`                  | Fired on load or validation error        |
| `flow-data-change` | `{ data }`                                   | Fired when data is set programmatically  |
| `node-click`       | `{ node, originalEvent }`                    | Fired when a node is clicked             |
| `edge-click`       | `{ edge, originalEvent }`                    | Fired when an edge is clicked            |
| `theme-change`     | `{ requestedTheme, resolvedTheme, palette }` | Fired when theme changes                 |
| `viewport-change`  | `{ x, y, zoom }`                             | Fired when the viewport changes          |

### Event Example

```javascript
const flow = document.querySelector('architecture-flow');

flow.addEventListener('flow-ready', (e) => {
  console.log('Ready!', e.detail.instance);
});

flow.addEventListener('node-click', (e) => {
  console.log('Node clicked:', e.detail.node.id);
});

flow.addEventListener('theme-change', (e) => {
  console.log('Theme changed to:', e.detail.resolvedTheme);
});
```

## JSON Schema Reference

```typescript
interface ArchitectureDocument {
  schemaVersion: '1.0';
  title?: string;
  description?: string;
  options?: ArchitectureOptions;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

interface ArchitectureNode {
  id: string;
  type?: 'service' | 'database' | 'queue' | 'client' | 'group' | 'generic';
  title: string;
  subtitle?: string;
  description?: string;
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  icon?: string;
  status?: 'default' | 'healthy' | 'warning' | 'error' | 'disabled';
  badges?: string[];
  metadata?: Record<string, string | number | boolean | null>;
  ports?: ArchitecturePort[];
  className?: string;
  style?: Record<string, string | number>;
}

interface ArchitecturePort {
  id: string;
  type: 'source' | 'target';
  side: 'left' | 'right' | 'top' | 'bottom';
  label?: string;
  offset?: number;
}

interface ArchitectureEdge {
  id: string;
  source: string;
  sourcePort?: string;
  target: string;
  targetPort?: string;
  label?: string;
  type?: 'default' | 'straight' | 'step' | 'smoothstep' | 'bezier';
  animated?: boolean;
  status?: 'default' | 'healthy' | 'warning' | 'error' | 'disabled';
  markerEnd?: 'arrow' | 'none';
  metadata?: Record<string, string | number | boolean | null>;
}

interface ArchitectureOptions {
  layout?: 'manual' | 'simple-horizontal' | 'simple-vertical';
  fitView?: boolean;
  interactive?: boolean;
  showControls?: boolean;
  showBackground?: boolean;
  showMiniMap?: boolean;
  edgeAnimation?: boolean;
  minZoom?: number;
  maxZoom?: number;
}
```

### Layout Options

- **`manual`** (default): Use explicit `position` coordinates on each node
- **`simple-horizontal`**: Automatic layered layout arranged horizontally
- **`simple-vertical`**: Automatic layered layout arranged vertically

## Theme Reference

| Theme    | Description                                    |
| -------- | ---------------------------------------------- |
| `light`  | Light mode with light background and dark text |
| `dark`   | Dark mode with dark background and light text  |
| `system` | Follows the operating system's color scheme    |

## Palette Reference

| Palette  | Primary Color | Description   |
| -------- | ------------- | ------------- |
| `blue`   | `#3b82f6`     | Default blue  |
| `indigo` | `#6366f1`     | Indigo/violet |
| `teal`   | `#14b8a6`     | Teal/cyan     |
| `violet` | `#8b5cf6`     | Purple/violet |
| `slate`  | `#64748b`     | Neutral slate |
| `amber`  | `#f59e0b`     | Warm amber    |

## CSS Variables

Override palette tokens via inline styles:

```html
<architecture-flow
  style="--af-color-primary: #e11d48;
         --af-radius-node: 20px;
         --af-shadow-node: 0 8px 24px rgba(0,0,0,0.15);"
  ...
></architecture-flow>
```

| Variable             | Default | Description          |
| -------------------- | ------- | -------------------- |
| `--af-color-primary` | varies  | Primary accent color |
| `--af-color-bg`      | varies  | Background color     |
| `--af-color-surface` | varies  | Surface/card color   |
| `--af-color-text`    | varies  | Primary text color   |
| `--af-radius-node`   | `8px`   | Node border radius   |
| `--af-shadow-node`   | varies  | Node box shadow      |
| `--af-height`        | `600px` | Component height     |

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

Requires support for:

- Custom Elements v1
- Shadow DOM v1
- CSS `color-scheme` (for system theme)

## License

MIT
