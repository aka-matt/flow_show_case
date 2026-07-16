# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-01

### Added

- Initial release
- Shadow DOM isolation for complete CSS/JS encapsulation
- JSON-driven architecture diagram rendering via custom element
- Three data input methods: external URL, JavaScript property, inline JSON
- Six node types: service, database, queue, client, group, generic
- Six color palettes: blue, indigo, teal, violet, slate, amber
- Three theme modes: light, dark, system (OS preference detection)
- Automatic layout algorithms: manual, simple-horizontal, simple-vertical
- Animated edges with configurable edge types
- Node status indicators (default, healthy, warning, error, disabled)
- Edge labels and arrow markers
- Node ports for connection points
- Public API methods: fitViewAsync, reload, resetViewport, getData, setData
- Custom events: flow-ready, flow-loading, flow-loaded, flow-error, flow-data-change, node-click, edge-click, theme-change, viewport-change
- CSS variable overrides for theme customization
- Comprehensive test suite with Vitest
- Production build with Vite
