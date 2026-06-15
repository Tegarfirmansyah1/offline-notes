import '@testing-library/jest-dom';

// Memalsukan ResizeObserver karena jsdom tidak mendukungnya (dibutuhkan oleh React Flow)
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};