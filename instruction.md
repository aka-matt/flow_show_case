# `<architecture-flow>` 组件使用说明

## 目录

1. [快速开始](#1-快速开始)
2. [HTML 属性与特性](#2-html-属性与特性)
3. [JavaScript 属性与方法](#3-javascript-属性与方法)
4. [自定义事件](#4-自定义事件)
5. [数据加载优先级](#5-数据加载优先级)
6. [主题与配色方案](#6-主题与配色方案)
7. [JSON 数据格式](#7-json-数据格式)
8. [CSS 变量覆盖](#8-css-变量覆盖)
9. [完整示例](#9-完整示例)

---

## 1. 快速开始

### 引入组件

在页面 `<head>` 中加载打包好的 ES 模块：

```html
<script type="module" src="path/to/architecture-flow.js"></script>
```

### 基本用法

通过 `src` 属性加载外部 JSON 文件：

```html
<architecture-flow
  src="./architecture.json"
  theme="system"
  palette="blue"
  interactive
  fit-view
></architecture-flow>
```

或通过 `data` 属性直接传入 JavaScript 对象：

```html
<architecture-flow id="flow"></architecture-flow>
<script>
  document.querySelector('#flow').data = {
    schemaVersion: '1.0',
    title: '我的架构图',
    nodes: [
      { id: 'client', type: 'client', title: 'Web 浏览器', position: { x: 0, y: 100 } },
      { id: 'api', type: 'service', title: 'API 服务', position: { x: 300, y: 100 } }
    ],
    edges: [
      { id: 'c-a', source: 'client', target: 'api', label: 'HTTPS' }
    ]
  };
</script>
```

---

## 2. HTML 属性与特性

### 布尔属性

布尔属性在标签上**出现即表示 `true`**，省略或值为 `"false"` 表示 `false`。

| 属性 | 效果 | 默认值 |
|------|------|--------|
| `interactive` | 允许拖拽节点、选择元素、创建连线 | `false` |
| `fit-view` | 组件加载完成后自动将视图缩放适应画布 | `true` |
| `show-controls` | 显示缩放/重置工具栏按钮 | `true` |
| `show-background` | 显示背景网格点阵 | `true` |
| `show-minimap` | 显示右下角小地图 | `false` |
| `readonly` | （保留属性，功能同 `interactive: false`） | `true` |

```html
<!-- interactive: false（默认）——只能查看，不能操作 -->
<architecture-flow src="./diagram.json"></architecture-flow>

<!-- interactive: true ——可以拖拽节点、选择、连线 -->
<architecture-flow src="./diagram.json" interactive></architecture-flow>
```

### 字符串属性

| 属性 | 说明 | 示例 |
|------|------|------|
| `src` | 外部 JSON 文件 URL，优先级仅次于 `data` 属性 | `src="./arch.json"` |
| `theme` | 主题模式：`light`（浅色）、`dark`（深色）、`system`（跟随系统） | `theme="dark"` |
| `palette` | 配色方案：`blue` / `indigo` / `teal` / `violet` / `slate` / `amber` | `palette="violet"` |
| `height` | 组件高度，默认 `600px` | `height="400px"` |
| `loading-text` | 加载中显示的文案 | `loading-text="加载中…"` |
| `empty-text` | 无数据时显示的文案 | `empty-text="暂无数据"` |
| `aria-label` | 无障碍标签 | `aria-label="订单系统架构图"` |

```html
<architecture-flow
  src="./arch.json"
  theme="system"
  palette="indigo"
  height="500px"
  loading-text="正在加载架构图…"
  empty-text="未找到架构数据"
  aria-label="订单微服务架构"
></architecture-flow>
```

### kebab-case ↔ camelCase 属性映射

HTML 属性名使用 kebab-case（短横线分隔），JavaScript DOM 属性使用 camelCase（驼峰命名）：

| HTML 属性 | JS 属性 |
|----------|--------|
| `fit-view` | `fitView` |
| `show-controls` | `showControls` |
| `show-background` | `showBackground` |
| `show-minimap` | `showMiniMap` |
| `loading-text` | `loadingText` |
| `empty-text` | `emptyText` |
| `aria-label` | `ariaLabel` |

---

## 3. JavaScript 属性与方法

### 属性

在 JavaScript 中可以直接读写以下属性：

```js
const el = document.querySelector('architecture-flow');

// 读写 data（最高优先级）
el.data = { schemaVersion: '1.0', nodes: [...], edges: [...] };
console.log(el.data);

// 主题与配色
el.theme = 'dark';
el.palette = 'violet';

// 交互开关
el.interactive = true;
el.fitView = false;
el.showControls = true;
el.showBackground = false;
el.showMiniMap = true;

// 文案
el.loadingText = '加载中…';
el.emptyText = '暂无数据';
```

### 方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `fitViewAsync(options?)` | 以编程方式将视图缩放适应画布 | `Promise<void>` |
| `resetViewport()` | 重置视口到初始状态（等同于调用 `fitViewAsync`） | `Promise<void>` |
| `reload()` | 重新加载数据（清除缓存后按优先级加载） | `Promise<void>` |
| `setData(data)` | 设置新的架构数据（等同于 `data = data`） | `void` |
| `getData()` | 获取当前架构数据对象 | `ArchitectureDocument` |

```js
const el = document.querySelector('architecture-flow');

// 手动适应视图
await el.fitViewAsync({ padding: 0.3, duration: 500 });

// 重置视口
await el.resetViewport();

// 重新加载
await el.reload();

// 获取数据
const data = el.getData();
```

---

## 4. 自定义事件

所有事件均为 `CustomEvent`，带有 `{ bubbles: true, composed: true }`，可以跨越 Shadow DOM 边界向上传播。

```js
const el = document.querySelector('architecture-flow');

el.addEventListener('flow-ready',        (e) => console.log('就绪', e.detail));
el.addEventListener('flow-loading',      (e) => console.log('加载中', e.detail));
el.addEventListener('flow-loaded',        (e) => console.log('已加载', e.detail));
el.addEventListener('flow-error',         (e) => console.log('错误', e.detail));
el.addEventListener('node-click',         (e) => console.log('点击节点', e.detail));
el.addEventListener('edge-click',        (e) => console.log('点击连线', e.detail));
el.addEventListener('viewport-change',   (e) => console.log('视口变化', e.detail));
el.addEventListener('data-change',       (e) => console.log('数据变更', e.detail));
el.addEventListener('theme-change',      (e) => console.log('主题变化', e.detail));
```

### 事件详情

| 事件 | detail 字段 | 说明 |
|------|------------|------|
| `flow-ready` | `instance`, `data` | 组件初始化完成，React Flow 实例已就绪 |
| `flow-loading` | `src` | 开始从 URL 加载数据 |
| `flow-loaded` | `source`（`'src'`/`'property'`/`'inline'`）, `data` | 数据加载成功 |
| `flow-error` | `code`, `message`, `error?` | 发生错误；`code` 可为 `FETCH_ERROR`、`INVALID_DOCUMENT`、`VALIDATION_WARNING` 等 |
| `node-click` | `node`, `originalEvent` | 点击节点；`node` 为完整节点对象 |
| `edge-click` | `edge`, `originalEvent` | 点击连线；`edge` 为完整连线对象 |
| `viewport-change` | `x`, `y`, `zoom` | 视口缩放或平移时触发（防抖 100ms） |
| `data-change` | `data` | 通过 `setData` / `data=` 赋值后触发 |
| `theme-change` | `requestedTheme`, `resolvedTheme`, `palette` | 主题或配色变更后触发 |

---

## 5. 数据加载优先级

组件按以下优先级确定数据来源（高优先级覆盖低优先级）：

1. **JavaScript `data` 属性**（最高）
   ```js
   el.data = { schemaVersion: '1.0', nodes: [...], edges: [...] };
   ```
2. **`src` 属性**（外部 JSON 文件 URL）
   ```html
   <architecture-flow src="./arch.json"></architecture-flow>
   ```
3. **内联 `<script type="application/json">` 子元素**
   ```html
   <architecture-flow>
     <script type="application/json">
       { "schemaVersion": "1.0", "nodes": [...], "edges": [...] }
     </script>
   </architecture-flow>
   ```
4. **空状态**（最低）——显示 `empty-text` 文案

---

## 6. 主题与配色方案

### 主题模式（`theme`）

| 值 | 说明 |
|----|------|
| `light` | 始终使用浅色主题 |
| `dark` | 始终使用深色主题 |
| `system`（默认） | 跟随浏览器 `prefers-color-scheme` 媒体查询 |

### 配色方案（`palette`）

提供 6 种内置配色，均有浅色和深色两个版本，由 `theme` 决定使用哪一个：

| palette | 主色调 | 适用场景 |
|---------|--------|---------|
| `blue` | 蓝色 | 通用技术架构 |
| `indigo` | 靛蓝 | 金融、数据系统 |
| `teal` | 青色 | 云原生、DevOps |
| `violet` | 紫罗兰 | 机器学习、AI 系统 |
| `slate` | 蓝灰 | 中性、监控面板 |
| `amber` | 琥珀 | 能源、工业系统 |

### CSS 变量覆盖

可以在宿主元素上通过 `style` 属性覆盖任意 CSS 变量：

```html
<architecture-flow
  theme="light"
  palette="blue"
  style="
    --af-color-primary: #e11d48;
    --af-radius-node: 20px;
    --af-shadow-node: 0 8px 24px rgba(0,0,0,0.15);
    --af-color-bg: transparent;
  "
></architecture-flow>
```

---

## 7. JSON 数据格式

完整字段参考 `schemaVersion: '1.0'`。

### 顶层结构

```json
{
  "schemaVersion": "1.0",
  "title": "系统标题（可选）",
  "description": "描述文本（可选）",
  "options": { ... },
  "nodes": [ ... ],
  "edges": [ ... ]
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `schemaVersion` | **是** | 必须为 `"1.0"` |
| `title` | 否 | 架构图标题，仅用于元数据 |
| `description` | 否 | 描述文本 |
| `options` | 否 | 全局布局和显示选项 |
| `nodes` | **是** | 节点数组，不能为空 |
| `edges` | 否 | 连线数组，可为空数组 |

---

### options（全局选项）

```json
{
  "options": {
    "layout": "manual",
    "fitView": true,
    "interactive": true,
    "showControls": true,
    "showBackground": true,
    "showMiniMap": false,
    "edgeAnimation": false,
    "minZoom": 0.1,
    "maxZoom": 2.0
  }
}
```

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `layout` | `manual` \| `simple-horizontal` \| `simple-vertical` | `manual` | 布局引擎。`manual` 使用 `position` 精确坐标；其余自动排布 |
| `fitView` | boolean | `true` | 加载后自动适应视图 |
| `interactive` | boolean | `false` | 是否允许拖拽交互 |
| `showControls` | boolean | `true` | 显示控制工具栏 |
| `showBackground` | boolean | `true` | 显示背景网格 |
| `showMiniMap` | boolean | `false` | 显示小地图 |
| `edgeAnimation` | boolean | `false` | 连线动画（`animated: true` 的边） |
| `minZoom` | number | `0.1` | 最小缩放倍数 |
| `maxZoom` | number | `2.0` | 最大缩放倍数 |

> **注意**：`options` 中的交互属性为文档级默认；HTML 属性（如 `interactive`）拥有更高的优先级，会覆盖 `options` 中的对应值。

---

### nodes（节点）

#### 完整字段

```json
{
  "id": "unique-node-id",
  "type": "service",
  "title": "API Gateway",
  "subtitle": "认证与路由",
  "description": "详细的描述文本（可选）",
  "position": { "x": 300, "y": 120 },
  "width": 200,
  "height": 80,
  "icon": "cloud",
  "status": "healthy",
  "badges": ["Go", "v2.0"],
  "metadata": {
    "runtime": "Go",
    "port": 8080
  },
  "ports": [
    { "id": "in", "type": "target", "side": "left" },
    { "id": "out", "type": "source", "side": "right" }
  ],
  "className": "custom-css-class",
  "style": { "borderColor": "red" }
}
```

#### 字段说明

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `id` | **是** | string | 节点唯一标识，edges 通过它引用节点 |
| `type` | 否 | `service` \| `database` \| `queue` \| `client` \| `group` \| `generic` | 节点类型，决定图标样式；默认 `generic` |
| `title` | **是** | string | 节点标题，显示在节点卡片上 |
| `subtitle` | 否 | string | 副标题，显示在标题下方，字号较小 |
| `description` | 否 | string | 详细描述（目前渲染为 `aria-label`） |
| `position` | 否 | `{ x: number, y: number }` | 节点在画布上的像素坐标；`layout: manual` 时生效 |
| `width` | 否 | number | 节点宽度（像素） |
| `height` | 否 | number | 节点高度（像素） |
| `icon` | 否 | string | 自定义图标名称（预留字段） |
| `status` | 否 | `default` \| `healthy` \| `warning` \| `error` \| `disabled` | 节点状态，影响状态指示点颜色 |
| `badges` | 否 | string[] | 标签数组，渲染在节点底部（如 `["Go", "v2.0"]`） |
| `metadata` | 否 | `Record<string, string \| number \| boolean \| null>` | 任意附加数据，会传递到节点 data 对象 |
| `ports` | 否 | `ArchitecturePort[]` | 端口定义，控制 Handle 数量和位置 |
| `className` | 否 | string | 附加 CSS 类名 |
| `style` | 否 | `Record<string, string \| number>` | 内联样式对象 |

#### type 与图标

| type | 图标 | 说明 |
|------|------|------|
| `client` | 🖥 显示器 | 终端用户、浏览器、客户端应用 |
| `service` | 🖥 服务器机架 | 后端微服务、API、计算节点 |
| `database` | 🗄 圆柱 | 数据库、存储服务 |
| `queue` | 📬 消息队列 | 消息队列、事件总线、Kafka |
| `group` | 📦 叠放框 | 分组、命名空间、逻辑区域 |
| `generic` | ⬡ 六边形 | 通用节点类型 |

#### status 与颜色

| status | 状态点颜色 | 说明 |
|--------|-----------|------|
| `default` | 主题主色（primary） | 默认状态 |
| `healthy` | 绿色 `#22c55e` | 健康、运行中 |
| `warning` | 橙色 `#f59e0b` | 警告、降级 |
| `error` | 红色 `#ef4444` | 错误、不可用 |
| `disabled` | 灰色 `#475569` | 禁用、未配置 |

---

### ports（端口）

定义节点上的连接点（Handle），让连线精确连接到特定端口。

```json
{
  "id": "api",
  "type": "service",
  "title": "API Service",
  "ports": [
    { "id": "in", "type": "target", "side": "left" },
    { "id": "out-1", "type": "source", "side": "right", "offset": 30 },
    { "id": "out-2", "type": "source", "side": "right", "offset": 70 }
  ]
}
```

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `id` | **是** | string | 端口唯一标识，edges 通过 `sourcePort`/`targetPort` 引用 |
| `type` | **是** | `source` \| `target` | `source`：出边（连线的起点）；`target`：入边（连线的终点） |
| `side` | 否 | `left` \| `right` \| `top` \| `bottom` | 端口所在边；默认 `target` → `left`，`source` → `right` |
| `label` | 否 | string | 端口标签（目前渲染为 SVG `title`） |
| `offset` | 否 | number（0–100） | 沿所在边的偏移百分比 |

#### 多端口示例

```
           out-1 (offset=30)
out ──────────────────────────→ [API Service]
           out-2 (offset=70)

←──────────────────────────── in
```

---

### edges（连线）

#### 完整字段

```json
{
  "id": "unique-edge-id",
  "source": "client-node-id",
  "sourcePort": "https-out",
  "target": "gateway-node-id",
  "targetPort": "public-in",
  "label": "REST / HTTPS",
  "type": "smoothstep",
  "animated": true,
  "status": "healthy",
  "markerEnd": "arrow",
  "metadata": {
    "throughput": "1000 req/s"
  }
}
```

#### 字段说明

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `id` | **是** | string | 连线唯一标识 |
| `source` | **是** | string | 起点节点 ID（必须在 `nodes` 中存在） |
| `sourcePort` | 否 | string | 起点端口 ID（与节点 `ports[].id` 对应） |
| `target` | **是** | string | 终点节点 ID（必须在 `nodes` 中存在） |
| `targetPort` | 否 | string | 终点端口 ID |
| `label` | 否 | string | 连线标签文字，显示在连线中点 |
| `type` | 否 | `default` \| `straight` \| `step` \| `smoothstep` \| `bezier` | 连线形状；默认 `smoothstep`（圆角折线） |
| `animated` | 否 | boolean | 是否显示流动动画（CSS `animateMotion`） |
| `status` | 否 | `default` \| `healthy` \| `warning` \| `error` \| `disabled` | 连线状态，影响颜色 |
| `markerEnd` | 否 | `arrow` \| `none` | 终点箭头；默认 `arrow` |

#### 连线类型

| type | 形状 | 适用场景 |
|------|------|---------|
| `smoothstep`（默认） | 圆角折线 | 通用推荐 |
| `step` | 直角折线 | 层次清晰的数据流 |
| `straight` | 直线 | 简单的双向关系 |
| `bezier` | 贝塞尔曲线 | 复杂的组织结构 |
| `default` | 等同于 `smoothstep` | — |

#### sourcePort / targetPort 用法

连线两端如果连接到具名端口，需要同时指定节点 ID 和端口 ID：

```json
{
  "nodes": [
    {
      "id": "client",
      "type": "client",
      "title": "Web Client",
      "ports": [{ "id": "https", "type": "source", "side": "right", "label": "HTTPS" }]
    },
    {
      "id": "gateway",
      "type": "service",
      "title": "API Gateway",
      "ports": [
        { "id": "public", "type": "target", "side": "left", "label": "Public" },
        { "id": "orders", "type": "source", "side": "right", "label": "Orders API" }
      ]
    }
  ],
  "edges": [
    {
      "id": "web-gw",
      "source": "client",
      "sourcePort": "https",
      "target": "gateway",
      "targetPort": "public",
      "label": "HTTPS"
    }
  ]
}
```

如果不指定 `sourcePort`/`targetPort`，连线会自动连接到节点左侧（target）或右侧（source）的默认 Handle。

---

## 8. CSS 变量覆盖

组件暴露以下 CSS 变量，可在宿主元素 `style` 中覆盖任意一项：

| 变量 | 说明 | 默认值（blue/light） |
|------|------|---------------------|
| `--af-color-bg` | 画布背景色 | `#f8fafc` |
| `--af-color-surface` | 节点背景色 | `#ffffff` |
| `--af-color-surface-elevated` | 悬停/高亮背景 | `#f1f5f9` |
| `--af-color-text` | 主文字色 | `#0f172a` |
| `--af-color-text-muted` | 次要文字色 | `#64748b` |
| `--af-color-border` | 边框色 | `#e2e8f0` |
| `--af-color-primary` | 主题主色 | `#3b82f6` |
| `--af-color-primary-soft` | 主色浅色背景 | `#dbeafe` |
| `--af-color-edge` | 连线默认颜色 | `#94a8b8` |
| `--af-color-edge-active` | 连线高亮颜色 | `#3b82f6` |
| `--af-color-success` | 成功/healthy 状态色 | `#22c55e` |
| `--af-color-warning` | 警告/warning 状态色 | `#f59e0b` |
| `--af-color-danger` | 错误/error 状态色 | `#ef4444` |
| `--af-color-disabled` | 禁用状态色 | `#cbd5e1` |
| `--af-radius-node` | 节点圆角 | `12px` |
| `--af-shadow-node` | 节点阴影 | `0 1px 3px rgba(0,0,0,0.1)` |
| `--af-shadow-node-hover` | 节点悬停阴影 | `0 4px 12px rgba(0,0,0,0.15)` |
| `--af-height` | 组件高度（仅通过属性 `height` 设置） | `600px` |

### 透明背景示例（透出宿主渐变）

```html
<div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 16px;">
  <architecture-flow
    style="--af-color-bg: transparent"
    src="./arch.json"
    theme="light"
    palette="teal"
  ></architecture-flow>
</div>
```

---

## 9. 完整示例

### 最简示例

```json
{
  "schemaVersion": "1.0",
  "title": "最小示例",
  "nodes": [
    { "id": "a", "type": "client", "title": "浏览器", "position": { "x": 0, "y": 100 } },
    { "id": "b", "type": "service", "title": "API", "position": { "x": 300, "y": 100 } }
  ],
  "edges": [
    { "id": "e1", "source": "a", "target": "b", "label": "HTTPS" }
  ]
}
```

### 完整微服务示例

```json
{
  "schemaVersion": "1.0",
  "title": "订单微服务平台",
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
      "title": "Web 客户端",
      "subtitle": "React SPA",
      "position": { "x": 0, "y": 120 },
      "status": "healthy",
      "ports": [{ "id": "https", "type": "source", "side": "right", "label": "HTTPS" }]
    },
    {
      "id": "gateway",
      "type": "service",
      "title": "API Gateway",
      "subtitle": "认证与路由",
      "position": { "x": 300, "y": 120 },
      "status": "healthy",
      "ports": [
        { "id": "in", "type": "target", "side": "left", "label": "Public" },
        { "id": "orders", "type": "source", "side": "right", "label": "Orders" },
        { "id": "auth", "type": "source", "side": "right", "offset": 50, "label": "Auth" }
      ],
      "badges": ["Kong", "v3.0"]
    },
    {
      "id": "order-svc",
      "type": "service",
      "title": "Order Service",
      "subtitle": "Go 服务",
      "position": { "x": 600, "y": 80 },
      "status": "warning",
      "ports": [
        { "id": "api", "type": "target", "side": "left" },
        { "id": "db", "type": "source", "side": "right", "offset": 30 },
        { "id": "events", "type": "source", "side": "right", "offset": 70 }
      ],
      "metadata": { "runtime": "Go 1.21", "port": 8080 },
      "badges": ["Go", "v2.1"]
    },
    {
      "id": "orders-db",
      "type": "database",
      "title": "Orders DB",
      "subtitle": "PostgreSQL",
      "position": { "x": 920, "y": 40 },
      "status": "healthy",
      "ports": [{ "id": "sql", "type": "target", "side": "left", "label": "SQL" }]
    },
    {
      "id": "event-bus",
      "type": "queue",
      "title": "Event Bus",
      "subtitle": "Kafka",
      "position": { "x": 920, "y": 220 },
      "status": "healthy",
      "ports": [{ "id": "in", "type": "target", "side": "left", "label": "Events" }]
    }
  ],
  "edges": [
    {
      "id": "web-gw",
      "source": "web",
      "sourcePort": "https",
      "target": "gateway",
      "targetPort": "in",
      "label": "REST / HTTPS",
      "animated": true,
      "markerEnd": "arrow"
    },
    {
      "id": "gw-order",
      "source": "gateway",
      "sourcePort": "orders",
      "target": "order-svc",
      "targetPort": "api",
      "label": "gRPC",
      "animated": true,
      "markerEnd": "arrow"
    },
    {
      "id": "order-db",
      "source": "order-svc",
      "sourcePort": "db",
      "target": "orders-db",
      "targetPort": "sql",
      "label": "SQL",
      "markerEnd": "arrow"
    },
    {
      "id": "order-events",
      "source": "order-svc",
      "sourcePort": "events",
      "target": "event-bus",
      "targetPort": "in",
      "label": "事件流",
      "animated": true,
      "markerEnd": "arrow"
    }
  ]
}
```

### HTML 中内联使用

```html
<architecture-flow
  id="my-diagram"
  theme="dark"
  palette="violet"
  interactive
  fit-view
  show-controls
  show-background
  style="
    --af-color-primary: #a78bfa;
    --af-radius-node: 16px;
  "
>
  <script type="application/json">
    {
      "schemaVersion": "1.0",
      "title": "内联示例",
      "nodes": [
        { "id": "a", "type": "client", "title": "用户", "position": { "x": 0, "y": 150 } },
        { "id": "b", "type": "service", "title": "服务", "position": { "x": 300, "y": 150 } },
        { "id": "c", "type": "database", "title": "数据库", "position": { "x": 600, "y": 150 } }
      ],
      "edges": [
        { "id": "ab", "source": "a", "target": "b", "label": "请求" },
        { "id": "bc", "source": "b", "target": "c", "label": "查询" }
      ]
    }
  </script>
</architecture-flow>
```

### JavaScript API 动态更新

```js
const el = document.querySelector('#my-diagram');

// 监听事件
el.addEventListener('flow-ready', ({ detail }) => {
  console.log('Ready with instance', detail.instance);
});

el.addEventListener('node-click', ({ detail }) => {
  console.log('Clicked node:', detail.node.id);
});

// 动态切换主题
el.theme = 'dark';
el.palette = 'teal';

// 动态更新数据
el.setData({
  schemaVersion: '1.0',
  nodes: [
    { id: 'new-node', type: 'service', title: '新服务', position: { x: 100, y: 100 } }
  ],
  edges: []
});

// 手动适应视图
el.fitViewAsync({ padding: 0.3 });
```
