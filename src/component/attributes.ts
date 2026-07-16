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
