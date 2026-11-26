export function readJSON<T>(key: string, fallback: () => T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback(); } catch { return fallback(); }
}
export function writeJSON(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
export type StorageUpdate = { key: string; value: unknown };
export function writeJSONBatch(updates: StorageUpdate[]) {
  const previous = updates.map(update => ({ key: update.key, value: localStorage.getItem(update.key) }));
  const written: typeof previous = [];
  try {
    for (const [index, update] of updates.entries()) {
      localStorage.setItem(update.key, JSON.stringify(update.value));
      written.push(previous[index]!);
    }
  } catch {
    let restored = true;
    for (const item of written.reverse()) {
      try {
        if (item.value === null) localStorage.removeItem(item.key);
        else localStorage.setItem(item.key, item.value);
      } catch { restored = false; }
    }
    throw new Error(restored ? '保存失败，修改已撤销，请重试' : '保存失败，部分数据未能恢复，请检查浏览器存储后刷新核对');
  }
}
export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export function downloadFile(name: string, data: Blob) {
  const url = URL.createObjectURL(data); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
