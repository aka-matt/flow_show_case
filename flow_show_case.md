# React Flow 架构图 Web Component（第一版）实施方案

> 目标读者：编程 Agent / AI Coding Agent / 工程实施人员  
> 名称： Flow Show Case
> 工程实施语言：英语 （请用英语实现所有注释，说明，提示，和用户交互）  
> 目标产物：一个可嵌入静态网页、使用 Shadow DOM 隔离样式、由 JSON 驱动的 React Flow 架构图 Web Component。

---

## 1. 项目目标

实现一个名为 `<architecture-flow>` 的标准 Web Component。组件内部使用 React、TypeScript 和 `@xyflow/react`，并通过开放式 Shadow DOM 隔离宿主页面样式。

第一版聚焦“只读或轻交互的架构图展示”，不实现完整流程编辑器。

核心能力：

1. 通过外部 JSON URL、JavaScript Property、内嵌 JSON 三种方式加载图数据。
2. 渲染自定义架构节点、多个端口、标签边、动画边。
3. 支持拖动画布、缩放、节点拖动、适配视图。
4. 支持 `light`、`dark`、`system` 三种色彩模式。
5. 支持多套配色方案，并允许宿主页面通过属性或 CSS Variables 覆盖。
6. 使用 Shadow DOM，避免 React Flow 样式及组件样式污染宿主页面。
7. 提供组件事件、公开方法、错误和加载状态。
8. 提供完整 `example.html`，覆盖各种用法、主题、配色和数据加载方式。
9. 使用 Vite Library Mode 构建为可直接部署到静态网站的 ES Module。
10. 提供单元测试、组件测试、端到端测试和示例验收脚本。

---

## 2. 非目标

第一版明确不包含：

- 用户创建或删除节点、边。
- 通过拖拽端口连接新边。
- 完整撤销/重做历史。
- 服务端存储。
- 多人协作。
- 实时监控数据源。
- 通用低代码数据流执行引擎。
- ELK 等复杂自动布局引擎的完整集成。
- PNG、SVG、PDF 导出。
- React Flow Pro 功能。

可以预留接口，但不得因为预留功能显著扩大第一版范围。

---

## 3. 技术栈

- TypeScript
- React
- React DOM `createRoot`
- `@xyflow/react`
- 原生 Custom Elements API
- Open Shadow DOM
- Vite Library Mode
- Vitest
- React Testing Library
- Playwright
- ESLint
- Prettier
- Zod，用于运行时 JSON 校验

原则：

- 构建结果对宿主页面只暴露一个自定义元素和可选 TypeScript 类型。
- 宿主页面不需要安装 React。
- React、React DOM、React Flow 默认打包进组件 bundle，确保静态页面开箱即用。
- 不依赖后端服务。

---

## 4. 最终交付物 （建议）

```text
architecture-flow/
├── src/
├── examples/
├── public/
├── tests/
├── dist/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
├── playwright.config.ts
├── README.md
├── CHANGELOG.md
├── LICENSE
└── AGENTS.md
```

构建后至少生成：

```text
dist/
├── architecture-flow.js
├── architecture-flow.js.map
├── architecture-flow.d.ts
└── assets/                 # 仅在确有需要时生成
```

优先把组件 CSS 注入 Shadow Root，避免要求宿主页面额外加载 CSS。

---

## 5. 建议目录结构

```text
src/
├── component/
│   ├── ArchitectureFlowElement.ts
│   ├── attributes.ts
│   ├── property-upgrade.ts
│   └── events.ts
├── react/
│   ├── ArchitectureFlowApp.tsx
│   ├── FlowCanvas.tsx
│   ├── ErrorView.tsx
│   ├── LoadingView.tsx
│   └── EmptyView.tsx
├── nodes/
│   ├── ServiceNode.tsx
│   ├── DatabaseNode.tsx
│   ├── QueueNode.tsx
│   ├── ClientNode.tsx
│   ├── GroupNode.tsx
│   ├── GenericNode.tsx
│   └── nodeTypes.ts
├── edges/
│   ├── ArchitectureEdge.tsx
│   └── edgeTypes.ts
├── schema/
│   ├── architecture-document.ts
│   ├── zod-schema.ts
│   └── normalize.ts
├── theme/
│   ├── theme-types.ts
│   ├── palettes.ts
│   ├── resolve-theme.ts
│   ├── css-variables.ts
│   └── component.css
├── data/
│   ├── load-json.ts
│   └── abort-controller.ts
├── layout/
│   ├── manual-layout.ts
│   └── simple-layered-layout.ts
├── utils/
│   ├── clone.ts
│   ├── debounce.ts
│   ├── ids.ts
│   └── logger.ts
├── styles/
│   ├── react-flow.css
│   └── combined-styles.ts
├── types/
│   └── public.ts
└── index.ts
```

示例：

```text
examples/
├── example.html
├── architecture-basic.json
├── architecture-microservices.json
├── architecture-data-pipeline.json
└── example-host.css
```

---

## 6. Web Component 公共接口

### 6.1 标签名

```html
<architecture-flow></architecture-flow>
```

注册时必须避免重复定义：

```ts
if (!customElements.get('architecture-flow')) {
  customElements.define('architecture-flow', ArchitectureFlowElement);
}
```

### 6.2 HTML Attributes

| 属性              | 类型                  |                 默认值 | 说明                                |
| ----------------- | --------------------- | ---------------------: | ----------------------------------- |
| `src`             | string                |                     无 | 外部 JSON URL                       |
| `height`          | CSS length            |                `600px` | 组件高度                            |
| `theme`           | `light\|dark\|system` |               `system` | 色彩模式                            |
| `palette`         | string                |                 `blue` | 配色方案                            |
| `interactive`     | boolean attribute     |                  false | 启用节点拖动、画布平移和缩放        |
| `fit-view`        | boolean attribute     |                   true | 首次加载后自动适配视图              |
| `show-controls`   | boolean attribute     |                   true | 显示缩放控制器                      |
| `show-background` | boolean attribute     |                   true | 显示网格背景                        |
| `show-minimap`    | boolean attribute     |                  false | 显示小地图                          |
| `readonly`        | boolean attribute     |                   true | 禁止图结构修改；第一版始终视为 true |
| `loading-text`    | string                |      `正在加载架构图…` | 加载提示                            |
| `empty-text`      | string                |         `暂无架构数据` | 空状态提示                          |
| `aria-label`      | string                | `Architecture diagram` | 可访问性名称                        |

布尔属性采用 HTML 标准语义：出现即为 true，缺失即为 false。

### 6.3 JavaScript Properties

```ts
interface ArchitectureFlowElement extends HTMLElement {
  data: ArchitectureDocument | null;
  theme: 'light' | 'dark' | 'system';
  palette: PaletteName;
  interactive: boolean;
  fitView(options?: FitViewOptions): Promise<void>;
  getData(): ArchitectureDocument | null;
  setData(data: ArchitectureDocument): void;
  reload(): Promise<void>;
  resetViewport(): Promise<void>;
}
```

`data` Property 必须接受对象，不要求调用者序列化为 attribute 字符串。

### 6.4 数据加载优先级

采用以下明确优先级：

1. JavaScript `element.data` Property。
2. `src` 属性指向的外部 JSON。
3. 子元素 `<script type="application/json">`。
4. 无数据时显示 Empty State。

当 Property 被重新赋值后，应中止进行中的 `src` 请求，避免旧请求覆盖新数据。

### 6.5 自定义事件

所有事件均使用：

```ts
new CustomEvent(name, {
  detail,
  bubbles: true,
  composed: true,
});
```

`composed: true` 确保事件可以穿过 Shadow DOM 边界。

| 事件名              | detail                                       |
| ------------------- | -------------------------------------------- |
| `flow-ready`        | `{ instance, data }`                         |
| `flow-loading`      | `{ src }`                                    |
| `flow-loaded`       | `{ source, data }`                           |
| `flow-error`        | `{ code, message, error? }`                  |
| `node-click`        | `{ node, originalEvent }`                    |
| `node-double-click` | `{ node, originalEvent }`                    |
| `edge-click`        | `{ edge, originalEvent }`                    |
| `selection-change`  | `{ nodes, edges }`                           |
| `viewport-change`   | `{ x, y, zoom }`                             |
| `data-change`       | `{ data, reason }`                           |
| `theme-change`      | `{ requestedTheme, resolvedTheme, palette }` |

事件 detail 不应泄露 React SyntheticEvent；应转换为浏览器原生事件或精简对象。

---

## 7. JSON 文档模型

### 7.1 顶层结构

```ts
interface ArchitectureDocument {
  schemaVersion: '1.0';
  title?: string;
  description?: string;
  options?: ArchitectureOptions;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}
```

### 7.2 Options

```ts
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

组件 attribute 的优先级高于 JSON `options`，便于宿主页面覆盖。

### 7.3 Node

```ts
type ArchitectureNodeType = 'service' | 'database' | 'queue' | 'client' | 'group' | 'generic';

interface ArchitectureNode {
  id: string;
  type?: ArchitectureNodeType;
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
```

### 7.4 Port

```ts
interface ArchitecturePort {
  id: string;
  type: 'source' | 'target';
  side: 'left' | 'right' | 'top' | 'bottom';
  label?: string;
  offset?: number;
}
```

`offset` 统一定义为百分比 0–100。未提供时，组件按同一边上的端口数量均匀排布。

### 7.5 Edge

```ts
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
```

### 7.6 Schema 校验规则

必须通过 Zod 实现运行时校验，并输出可读错误路径。

最低校验：

- `schemaVersion` 必须为 `1.0`。
- Node ID 全局唯一。
- Edge ID 全局唯一。
- Edge 的 source/target 节点必须存在。
- 指定的 sourcePort/targetPort 必须存在。
- Position 必须是有限数字。
- ID 不允许空字符串。
- 不允许函数、DOM Node 或循环对象。
- 限制节点和边数量，默认建议最大 2,000 nodes / 5,000 edges，可配置。

错误示例：

```json
{
  "code": "INVALID_DOCUMENT",
  "message": "edges[2].target references missing node: order-db"
}
```

---

## 8. Shadow DOM 实施要求

### 8.1 Shadow Root

```ts
const shadowRoot = this.attachShadow({ mode: 'open' });
```

使用 open 模式，便于测试、调试和高级宿主集成。

### 8.2 DOM 结构

```html
<architecture-flow>
  #shadow-root
  <style>
    ...
  </style>
  <div part="container" class="af-host">
    <div part="canvas" class="af-canvas"></div>
    <div part="status" class="af-status"></div>
  </div>
</architecture-flow>
```

React Root 只挂载到 `.af-canvas`。

### 8.3 CSS 注入

React Flow 的基础 CSS 和组件 CSS 必须进入 Shadow Root。不得只在 document `<head>` 中注入，否则 Shadow DOM 内部无法正常使用相关样式。

建议构建时把 CSS 转成字符串：

```ts
import reactFlowCss from '@xyflow/react/dist/style.css?inline';
import componentCss from './theme/component.css?inline';
```

然后：

```ts
style.textContent = `${reactFlowCss}\n${componentCss}`;
```

也可以使用 `CSSStyleSheet.replaceSync()` 和 `adoptedStyleSheets`，但必须提供不支持 Constructable Stylesheets 时的 `<style>` fallback。

### 8.4 Host 尺寸

`:host` 必须设置：

```css
:host {
  display: block;
  width: 100%;
  min-width: 0;
  contain: layout style paint;
}
```

高度解析优先级：

1. 宿主页面显式 CSS `height`。
2. `height` attribute。
3. 默认 `600px`。

组件必须使用 ResizeObserver 监听 host 尺寸变化，并在需要时触发 React Flow 更新。

### 8.5 外部样式扩展

支持 CSS Parts：

- `container`
- `canvas`
- `status`
- `loading`
- `error`
- `empty`

节点内部主要通过 CSS Variables 定制，不要求第一版暴露每个节点的 `part`。

---

## 9. 主题模式

### 9.1 三种模式

- `light`：强制浅色。
- `dark`：强制深色。
- `system`：监听 `prefers-color-scheme: dark`。

`system` 模式必须使用：

```ts
window.matchMedia('(prefers-color-scheme: dark)');
```

并监听 `change` 事件。组件销毁时移除监听。

组件内部维护：

```ts
type RequestedTheme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';
```

在 Shadow Host 上设置：

```html
<architecture-flow data-resolved-theme="dark"></architecture-flow>
```

### 9.2 主题优先级

1. `theme` attribute / Property。
2. JSON `options.theme`，如未来加入。
3. 默认 `system`。

### 9.3 主题切换要求

- 不重新创建 Custom Element。
- 不丢失 viewport。
- 不丢失节点位置。
- 不重复加载 JSON。
- 颜色切换使用 CSS Variables。
- 动画时长建议 150–250ms。
- 尊重 `prefers-reduced-motion`。

---

## 10. 配色方案

第一版内置以下 Palette：

1. `blue`：默认，适合通用技术文档。
2. `indigo`：偏产品化、现代界面。
3. `teal`：适合数据和平台架构。
4. `violet`：适合 AI、自动化、创意工具。
5. `slate`：低饱和、偏企业文档。
6. `amber`：暖色强调，适合操作流程和警告较多的图。

每套 Palette 必须同时定义 light 和 dark token，而不是只替换一个主色。

### 10.1 Token 设计

至少提供：

```css
--af-color-bg;
--af-color-surface;
--af-color-surface-elevated;
--af-color-text;
--af-color-text-muted;
--af-color-border;
--af-color-grid;
--af-color-primary;
--af-color-primary-soft;
--af-color-primary-contrast;
--af-color-edge;
--af-color-edge-active;
--af-color-handle;
--af-color-selection;
--af-color-success;
--af-color-warning;
--af-color-danger;
--af-color-disabled;
--af-shadow-node;
--af-shadow-node-hover;
--af-radius-node;
--af-font-family;
```

### 10.2 Palette 选择

```html
<architecture-flow palette="teal"></architecture-flow>
```

无效 palette：

- 回退到 `blue`。
- 发出一次 `flow-error`，错误代码 `UNKNOWN_PALETTE`。
- 不让组件崩溃。

### 10.3 宿主覆盖

允许宿主直接覆盖 CSS Variables：

```html
<architecture-flow style="--af-color-primary:#e11d48;--af-radius-node:18px"> </architecture-flow>
```

宿主自定义变量的优先级高于内置 Palette。

---

## 11. 节点设计

### 11.1 通用视觉规范

- 圆角卡片。
- 标题、可选副标题、状态指示、metadata。
- 节点背景使用 surface token。
- Hover、selected、focus-visible 状态清晰。
- 每类节点有轻微语义差异，但保持统一布局。
- 不在节点中直接嵌入危险 HTML。
- 所有文本都通过 React 转义。

### 11.2 节点类型

#### ServiceNode

用于 API、微服务、后台服务。

#### DatabaseNode

用于 SQL、NoSQL、数据仓库。

#### QueueNode

用于消息队列、事件总线、流系统。

#### ClientNode

用于 Web、Mobile、Desktop、第三方调用方。

#### GroupNode

用于视觉分组。第一版可使用 React Flow parent/sub-flow，或仅使用背景容器节点。必须避免复杂嵌套编辑。

#### GenericNode

未知 node type 的 fallback。

### 11.3 Handles

React Flow Handles 映射规则：

```text
sourcePort -> sourceHandle
targetPort -> targetHandle
left/right/top/bottom -> Position.Left/Right/Top/Bottom
```

Handle 必须：

- 可访问。
- 在 readonly 模式不可用于创建连接。
- 保留视觉端口表达。
- 端口标签不遮挡节点内容。

---

## 12. Edge 设计

- 默认使用 `smoothstep`。
- `animated` 使用 React Flow 原生动画样式。
- label 使用半透明 surface 背景。
- markerEnd 使用箭头。
- Edge 颜色由状态和 palette token 决定。
- 交互命中区域宽度大于可见线宽。
- 选中边提供 focus/selection 样式。

状态映射：

```text
default  -> --af-color-edge
healthy  -> --af-color-success
warning  -> --af-color-warning
error    -> --af-color-danger
disabled -> --af-color-disabled
```

在 `prefers-reduced-motion: reduce` 时关闭边动画。

---

## 13. 布局策略

### 13.1 manual

使用 JSON 中的 position。

如果某节点没有 position：

- 自动放入简单网格。
- 发出非致命 warning。

### 13.2 simple-horizontal

第一版实现简单拓扑分层：

1. 计算入度。
2. 从入度为 0 的节点作为起点。
3. 使用 BFS 分层。
4. 每层横向或纵向排布。
5. 对环路使用稳定 fallback 层。
6. 保持输入数组顺序，确保结果可预测。

不追求 ELK 级别的最优避让。

### 13.3 simple-vertical

同上，但层级沿 Y 轴。

### 13.4 未来扩展

预留：

```ts
interface LayoutEngine {
  layout(document: ArchitectureDocument): Promise<PositionedDocument>;
}
```

未来可加入 ELK.js，不应影响公共 JSON 格式。

---

## 14. 组件生命周期

### connectedCallback

1. 升级构造前被赋值的 properties。
2. 创建或复用 Shadow Root。
3. 注入样式。
4. 创建 mount 节点。
5. 创建 React Root。
6. 设置 ResizeObserver。
7. 设置 system theme listener。
8. 解析内嵌 JSON。
9. 根据数据优先级加载数据。
10. 首次渲染。

### attributeChangedCallback

只处理相关变化：

- `src`：中止旧请求并重新加载。
- `theme`：解析主题。
- `palette`：更新 tokens。
- `height`：更新尺寸。
- 交互和显示属性：更新 React props。

### disconnectedCallback

- Abort fetch。
- Disconnect ResizeObserver。
- 移除 media query listener。
- 清除 debounce/timer。
- React Root unmount。

组件重新连接时必须可再次工作。

---

## 15. 数据加载与安全

### 15.1 fetch

- 使用 `AbortController`。
- 默认 `credentials: 'same-origin'`。
- 检查 HTTP status。
- 检查响应 content-type，但允许常见静态服务器错误配置时继续尝试 JSON parse。
- parse 错误必须转成 `flow-error`。

### 15.2 静态网站限制

示例文档必须说明：通过 `file://` 双击打开时，外部 JSON fetch 可能受浏览器限制。推荐：

```bash
npm run dev
```

或：

```bash
python -m http.server 8080
```

### 15.3 XSS

- 禁止 `dangerouslySetInnerHTML`。
- JSON 中的 title、description、metadata 仅作为文本渲染。
- 第一版不允许 JSON 注入任意 SVG、HTML 或脚本。
- icon 使用内置 icon key 映射，不接受原始 SVG 字符串。
- `className` 建议限制格式；不要允许通过它逃逸 Shadow DOM，但仍需避免滥用。

---

## 16. 可访问性

- Host 支持 `aria-label`。
- 节点可键盘聚焦。
- 使用清晰 `focus-visible` 样式。
- 节点 aria-label 至少包含 title 和 type。
- Edge label 对屏幕阅读器可读。
- Controls 保持 React Flow 原生可访问能力。
- 颜色不是唯一状态表达；状态同时显示文字、图标或 badge。
- Light/Dark 对比度以 WCAG AA 为目标。
- 尊重 `prefers-reduced-motion`。

---

## 17. 性能要求

第一版目标：

- 100 nodes / 200 edges：首次交互流畅。
- 500 nodes / 1,000 edges：可查看，允许首次渲染较慢。
- 多实例页面中，每个组件独立工作。

优化：

- `nodeTypes` 和 `edgeTypes` 定义在组件外，保持引用稳定。
- 自定义节点使用 `React.memo`。
- 数据 normalize 只在输入变化时运行。
- viewport change 事件节流到 100ms 左右。
- ResizeObserver 回调 debounce。
- 避免在每次 render 创建大型 style 对象。

---

## 18. Vite 构建配置

采用 Vite Library Mode，入口为 `src/index.ts`。

核心要求：

```ts
build: {
  lib: {
    entry: 'src/index.ts',
    formats: ['es'],
    fileName: () => 'architecture-flow.js'
  },
  sourcemap: true,
  cssCodeSplit: false
}
```

由于 CSS 使用 `?inline` 注入 Shadow DOM，构建后应尽量只需一个 JS 文件。

package.json 参考：

```json
{
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
  "sideEffects": true
}
```

`sideEffects: true` 是因为导入入口会注册 Custom Element。

可额外提供无副作用入口：

```ts
export { ArchitectureFlowElement, defineArchitectureFlow };
```

其中：

```ts
defineArchitectureFlow('architecture-flow');
```

默认入口可以自动注册；高级入口允许调用者自定义标签名，作为后续增强。

---

## 19. example.html 要求

`examples/example.html` 必须是完整可运行的静态演示页，不依赖框架。

页面至少包含以下区域。

### 示例 A：外部 JSON

```html
<architecture-flow
  src="./architecture-basic.json"
  theme="system"
  palette="blue"
  interactive
  fit-view
  show-controls
>
</architecture-flow>
```

### 示例 B：JavaScript Property

```html
<architecture-flow id="property-demo"></architecture-flow>
<script type="module">
  const flow = document.querySelector('#property-demo');
  flow.data = {...};
</script>
```

### 示例 C：内嵌 JSON

```html
<architecture-flow theme="light" palette="teal">
  <script type="application/json">
    { ... }
  </script>
</architecture-flow>
```

### 示例 D：主题切换

提供按钮或 select：

```text
Theme: light / dark / system
Palette: blue / indigo / teal / violet / slate / amber
```

操作控件应动态设置 attribute，证明无需重新加载组件。

### 示例 E：运行时更新数据

按钮：

- `Load microservices`
- `Load data pipeline`
- `Clear data`
- `Reload src`
- `Fit view`
- `Reset viewport`

### 示例 F：事件日志

页面显示事件日志面板，监听：

- flow-ready
- flow-loaded
- flow-error
- node-click
- edge-click
- theme-change

日志应限制最多 50 条，避免无限增长。

### 示例 G：多实例隔离

同一页面并排显示两个组件：

- 一个 dark + violet。
- 一个 light + teal。

用于证明 Shadow DOM 和主题互不污染。

### 示例 H：宿主 CSS 污染测试

宿主页面故意设置：

```css
* {
  box-sizing: content-box;
}
button {
  font-size: 40px;
  border: 8px solid red;
}
svg {
  fill: hotpink;
}
```

组件内部仍应正常显示。这些污染规则可放在专门测试容器中，避免整个示例不可用。

### 示例 I：CSS Variables 覆盖

```html
<architecture-flow style="--af-color-primary:#e11d48;--af-radius-node:20px"> </architecture-flow>
```

### 示例 J：错误处理

展示：

- 无效 JSON URL。
- 引用不存在节点的 edge。
- 无效 palette。

错误应显示友好 UI，并记录到事件面板，不能导致整页脚本中断。

---

## 20. example.html 页面布局

建议布局：

```text
Header
├── 项目说明
├── Theme 控件
└── Palette 控件

Main
├── Basic external JSON
├── Property API
├── Inline JSON
├── Runtime controls
├── Multiple instances
├── Hostile CSS isolation
├── Custom variables
└── Error states

Aside / Bottom
└── Event log
```

示例页自身支持响应式设计：

- 宽屏两列。
- 小屏单列。
- 每个 Demo 卡片包含说明、代码片段和真实组件。

代码片段应为静态转义文本，不使用大型代码高亮依赖。

---

## 21. 测试计划

### 21.1 单元测试

覆盖：

- Zod schema。
- normalize。
- data priority。
- theme resolution。
- palette fallback。
- port position mapping。
- simple layout。
- duplicate IDs。
- missing source/target。
- property upgrade。

### 21.2 Web Component 测试

使用 Vitest + jsdom 或 happy-dom：

- 自定义元素注册。
- connected/disconnected 生命周期。
- observed attributes。
- Shadow Root 创建。
- CSS 注入。
- data Property 更新。
- 内嵌 JSON 解析。
- `flow-error` composed/bubbles。
- system theme listener 清理。
- ResizeObserver mock。

### 21.3 React 组件测试

- 各 node type 渲染。
- status badge。
- metadata。
- ports。
- empty/loading/error UI。
- reduced-motion class。

### 21.4 Playwright E2E

在真实 Chromium、Firefox、WebKit 中验证：

1. `example.html` 可加载。
2. 外部 JSON 成功渲染。
3. 节点可见。
4. Shadow DOM 内 React Flow CSS 生效。
5. light/dark/system 切换。
6. palette 切换。
7. 多实例主题互不影响。
8. fitView 方法可调用。
9. node-click 事件穿过 Shadow DOM。
10. 宿主恶意 CSS 不破坏组件。
11. 无效 JSON 显示错误状态。
12. 重新连接元素后可恢复。

### 21.5 Visual Regression

可选但推荐：

- light + blue。
- dark + blue。
- light + teal。
- dark + violet。
- loading/error/empty。

截图允许小范围抗锯齿差异。

---

## 22. 验收标准

以下条件全部满足才算第一版完成：

1. 一个 JS bundle 可在普通静态 HTML 中加载。
2. `<architecture-flow>` 自动注册并成功显示。
3. Shadow DOM 内样式完整，宿主页面无需加载 React Flow CSS。
4. 支持 external src、Property、inline JSON。
5. 支持至少六套 palette。
6. 支持 light、dark、system，且 system 实时响应系统变化。
7. 支持节点、多个 ports、edges、label、animated edge。
8. 支持 interactive 和 readonly 展示模式。
9. 支持公开方法 `fitView`、`reload`、`resetViewport`、`getData`、`setData`。
10. 自定义事件可穿越 Shadow DOM。
11. `example.html` 覆盖本文第 19 节所有演示。
12. 错误 JSON 不会造成页面崩溃。
13. 多实例互相隔离。
14. Chrome、Firefox、Safari 当前主流版本通过 E2E。
15. `npm run lint`、`npm run typecheck`、`npm run test`、`npm run test:e2e`、`npm run build` 全部通过。
16. README 包含安装、静态网页使用、属性、方法、事件和 JSON Schema 说明。

---

## 23. 推荐 npm scripts

```json
{
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
  }
}
```

---

## 24. 实施阶段

### 阶段 1：项目骨架

- 初始化 Vite + React + TypeScript。
- 配置 library mode。
- 建立 lint、format、typecheck、test。
- 创建最小 Custom Element。
- 在 Shadow Root 中挂载 React。

完成定义：静态页面能显示最小 React 文本。

### 阶段 2：React Flow 最小集成

- 注入 React Flow CSS 到 Shadow Root。
- 渲染静态 nodes/edges。
- 验证容器尺寸和 fitView。
- 加入 ResizeObserver。

完成定义：最小架构图可显示、缩放和平移。

### 阶段 3：JSON Schema 与数据加载

- 定义类型和 Zod schema。
- 实现 normalize。
- 实现 src/property/inline JSON。
- 实现 AbortController 和错误状态。

完成定义：三种数据输入方式工作。

### 阶段 4：自定义节点和边

- 完成六类节点。
- 完成多个 ports。
- 完成 edge label/status/animation。
- 完成 generic fallback。

完成定义：样例架构完整显示。

### 阶段 5：主题和 Palette

- 设计 token。
- 完成 light/dark/system。
- 完成六套 palette。
- 完成 CSS Variables override。
- 完成 reduced motion。

完成定义：运行时切换不重新加载数据。

### 阶段 6：公共 API 与事件

- 属性映射。
- methods。
- composed custom events。
- viewport 事件节流。

完成定义：example 页可以通过原生 JS 控制组件。

### 阶段 7：示例页

- 完成所有演示区域。
- 添加外部 JSON 示例。
- 添加事件日志。
- 添加多实例和 hostile CSS 场景。

完成定义：`examples/example.html` 成为完整验收页面。

### 阶段 8：测试、文档和发布

- 单元测试。
- E2E。
- README。
- API 表。
- 构建结果检查。
- bundle size 报告。

完成定义：所有验收命令通过。

---

## 25. 编程 Agent 执行约束

请编程 Agent 遵守：

1. 先写测试，再实现核心行为。
2. 每一阶段单独提交，提交信息描述行为变化。
3. 不引入未经需求证明的大型依赖。
4. 不使用 `any` 规避类型问题；确需使用时注明原因。
5. 不使用 `dangerouslySetInnerHTML`。
6. 不把 React Flow CSS 注入全局 document。
7. 不通过全局单例共享不同组件实例的状态。
8. 所有监听器、Observer、React Root 和请求必须在断开时清理。
9. 错误必须显示可恢复 UI，同时发送事件。
10. 在声称完成前，必须运行完整 `npm run check` 和 Playwright。
11. 修改公共 API 时同步更新 README、类型、测试和 example.html。
12. 输出实现摘要、已知限制和测试结果。

---

## 26. 推荐初始 JSON 示例

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

---

## 27. 官方参考资料

- React Flow：<https://reactflow.dev/>
- React Flow `<ReactFlow />` API：<https://reactflow.dev/api-reference/react-flow>
- React Flow Custom Nodes：<https://reactflow.dev/learn/customization/custom-nodes>
- React Flow Handles：<https://reactflow.dev/learn/customization/handles>
- React `createRoot`：<https://react.dev/reference/react-dom/client/createRoot>
- Vite Production Build / Library Mode：<https://vite.dev/guide/build>
- Vite Build Options：<https://vite.dev/config/build-options>

---

## 28. 最终给编程 Agent 的任务摘要

请根据本文实现一个生产可用的第一版 `<architecture-flow>` Web Component：内部使用 React Flow，运行于开放式 Shadow DOM，通过 JSON 驱动节点和边，支持三种主题模式、六套配色方案、三种数据输入方式、公开方法、跨 Shadow DOM 自定义事件、加载/空/错误状态，并提供覆盖所有能力的 `examples/example.html`。完成后运行完整 lint、typecheck、unit、E2E 和 build，提交测试证据与已知限制。
