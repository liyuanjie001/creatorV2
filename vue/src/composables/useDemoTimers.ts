import { onBeforeUnmount } from 'vue';

export function useDemoTimers() {
  const timeouts = new Set<ReturnType<typeof setTimeout>>();
  const intervals = new Set<ReturnType<typeof setInterval>>();
  function delay(callback: () => void, milliseconds: number) {
    const timer = setTimeout(() => {
      timeouts.delete(timer);
      callback();
    }, milliseconds);
    timeouts.add(timer);
    return timer;
  }
  function repeat(callback: () => void, milliseconds: number) {
    const timer = setInterval(callback, milliseconds);
    intervals.add(timer);
    return timer;
  }
  function cancelRepeat(timer: ReturnType<typeof setInterval>) {
    clearInterval(timer);
    intervals.delete(timer);
  }
  onBeforeUnmount(() => {
    timeouts.forEach(clearTimeout);
    intervals.forEach(clearInterval);
  });
  return { delay, repeat, cancelRepeat };
}
