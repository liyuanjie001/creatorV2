export function readJSON<T>(key: string, fallback: () => T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback(); } catch { return fallback(); }
}
export function writeJSON(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export function downloadFile(name: string, data: Blob) {
  const url = URL.createObjectURL(data); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
