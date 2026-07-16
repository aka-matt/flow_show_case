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
