import type { Role } from '../config/roles'

/**
 * Documentation content. Text may use **bold** for button and field names and `code` for exact values.
 */

/** One thing a user can do, with step-by-step instructions. */
export interface DocFunction {
  id: string
  title: string
  steps: string[]
  /** Extra rules, warnings and what happens automatically. */
  notes?: string[]
  /** Who normally does this. Anyone who can open the screen is able to; this says who should. */
  by?: Role[]
}

/** A screen (module) in the app and everything it can do. */
export interface DocModule {
  id: string
  title: string
  /** Sidebar path; access roles are read from the navigation config so they never go out of date. */
  path: string
  summary: string
  functions: DocFunction[]
}
