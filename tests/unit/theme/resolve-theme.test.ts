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
