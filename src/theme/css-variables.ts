import type { Palette, ResolvedTheme } from './theme-types.js';

export function buildCssVariables(palette: Palette, _theme: ResolvedTheme): string {
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
