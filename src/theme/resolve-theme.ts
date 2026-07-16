import type { RequestedTheme, ResolvedTheme } from './theme-types.js';

export function resolveTheme(requested: RequestedTheme): ResolvedTheme {
  if (requested === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return requested;
}
