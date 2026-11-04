import { uid } from './storage';
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => { const request = indexedDB.open('chuhai-studio-media', 1); request.onupgradeneeded = () => request.result.createObjectStore('files'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error('无法打开本地媒体存储')); });
}
export async function saveMedia(owner: string, file: File): Promise<string> {
  const db = await database(); const id = `${owner}:${uid()}`;
  try { await new Promise<void>((resolve, reject) => { const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').put(file, id); tx.oncomplete = () => resolve(); tx.onerror = () => reject(new Error('媒体存储失败，请检查可用空间')); }); return id; } finally { db.close(); }
}
export async function getMedia(owner: string, id: string): Promise<Blob | undefined> {
  if (!id.startsWith(`${owner}:`)) return undefined;
  const db = await database();
  try { return await new Promise((resolve, reject) => { const request = db.transaction('files').objectStore('files').get(id); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error('无法读取媒体')); }); } finally { db.close(); }
}
