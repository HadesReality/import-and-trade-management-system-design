import type { StateStorage } from 'zustand/middleware'

const memory = new Map<string, string>()

const memoryStorage: StateStorage = {
  getItem: (name) => memory.get(name) ?? null,
  setItem: (name, value) => void memory.set(name, value),
  removeItem: (name) => void memory.delete(name),
}

/** localStorage when it works (private mode / blocked storage can throw), otherwise an in-memory fallback. */
export function safeStorage(): StateStorage {
  try {
    const probe = '__importflow_probe__'
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return localStorage
  } catch {
    return memoryStorage
  }
}
