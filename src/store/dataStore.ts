import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createSeedData } from '../data/seed'
import { safeStorage } from '../lib/storage'
import type { AppData, CollectionKey, EntityOf, Settings } from '../types'

interface DataActions {
  add: <K extends CollectionKey>(key: K, item: Omit<EntityOf<K>, 'id'>) => EntityOf<K>
  update: <K extends CollectionKey>(key: K, id: string, patch: Partial<EntityOf<K>>) => void
  remove: <K extends CollectionKey>(key: K, id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  /** Replace everything with the original demo data. */
  resetData: () => void
}

export type DataState = AppData & DataActions

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/**
 * All app data lives here and is saved to the browser (localStorage).
 * Screens only call add / update / remove, so swapping in a real API later means changing this file only.
 */
export const useDataStore = create<DataState>()(
  persist<DataState, [], [], AppData>(
    (set) => ({
      ...createSeedData(),

      add: (key, item) => {
        const entity = { ...item, id: newId(key) } as unknown as EntityOf<typeof key>
        set((s) => ({ [key]: [...(s[key] as unknown[]), entity] }) as Partial<DataState>)
        return entity
      },

      update: (key, id, patch) =>
        set(
          (s) =>
            ({
              [key]: (s[key] as { id: string }[]).map((e) => (e.id === id ? { ...e, ...patch } : e)),
            }) as Partial<DataState>,
        ),

      remove: (key, id) =>
        set((s) => ({ [key]: (s[key] as { id: string }[]).filter((e) => e.id !== id) }) as Partial<DataState>),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      resetData: () => set(createSeedData()),
    }),
    {
      name: 'importflow-data',
      // Bump when the data shape changes; older saved demo data is replaced with fresh seed data.
      version: 3,
      migrate: () => createSeedData(),
      storage: createJSONStorage(() => safeStorage()),
      partialize: (s) => {
        const { add, update, remove, updateSettings, resetData, ...data } = s
        return data
      },
    },
  ),
)
