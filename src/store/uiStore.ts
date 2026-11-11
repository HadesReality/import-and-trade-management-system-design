import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Role } from '../config/roles'
import { safeStorage } from '../lib/storage'

interface UiState {
  role: Role
  setRole: (role: Role) => void
}

/** UI preferences kept in the browser (no login in the prototype). */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      role: 'OWNER',
      setRole: (role) => set({ role }),
    }),
    {
      name: 'importflow-ui',
      storage: createJSONStorage(() => safeStorage()),
    },
  ),
)
