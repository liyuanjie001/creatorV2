Object.defineProperties(HTMLElement.prototype, {
  clientWidth: {
    configurable: true,
    get() {
      return 800;
    },
  },
  clientHeight: {
    configurable: true,
    get() {
      return 300;
    },
  },
  offsetWidth: {
    configurable: true,
    get() {
      return 800;
    },
  },
  offsetHeight: {
    configurable: true,
    get() {
      return 300;
    },
  },
  scrollTo: { configurable: true, value() {} },
  scrollIntoView: { configurable: true, value() {} },
  hasPointerCapture: {
    configurable: true,
    value() {
      return false;
    },
  },
  setPointerCapture: { configurable: true, value() {} },
  releasePointerCapture: { configurable: true, value() {} },
});
window.scrollTo = () => {};
window.matchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {
    return true;
  },
});

class ResizeObserverForDOMTests implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverForDOMTests;
import { setPlatformAPI } from 'echarts/core';

// jsdom has no layout or canvas. Exercise ECharts' SVG renderer with fixed text metrics.
setPlatformAPI({ measureText: (text) => ({ width: String(text).length * 7 }) });
