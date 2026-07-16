import { expect, it, describe, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom';

expect.extend(matchers);

// Polyfill ResizeObserver for jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Polyfill matchMedia for jsdom - must be set as a direct property before component initialization
const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
});
if (!window.matchMedia) {
  window.matchMedia = mockMatchMedia;
}
