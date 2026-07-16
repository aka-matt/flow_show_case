import '@testing-library/jest-dom/vitest';

declare global {
  interface ResizeObserver {
    observe(): void;
    unobserve(): void;
    disconnect(): void;
  }
}

// Polyfill ResizeObserver for jsdom
const resizeObserverPolyfill = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(globalThis, 'ResizeObserver', {
  value: resizeObserverPolyfill,
  writable: true,
  configurable: true,
});

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
