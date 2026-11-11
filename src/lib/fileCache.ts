/**
 * Frontend prototype: files are never uploaded or saved. Only their names/sizes are stored (in the app data);
 * the file itself is kept in memory so it can be previewed until the page is reloaded.
 */
interface Cached {
  url: string
  type: string
}

const cache = new Map<string, Cached>()

export const newAttachmentId = () => `att-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export function cacheFile(id: string, file: File) {
  cache.set(id, { url: URL.createObjectURL(file), type: file.type })
}

export const getCachedFile = (id: string) => cache.get(id)

export function dropCachedFile(id: string) {
  const c = cache.get(id)
  if (c) URL.revokeObjectURL(c.url)
  cache.delete(id)
}
