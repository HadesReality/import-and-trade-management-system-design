/** Chart colours. Chosen to stay distinguishable side by side and readable on a white card. */
export const CHART_COLORS = {
  goods: '#2563eb',
  bank: '#7c3aed',
  clearance: '#f59e0b',
  duties: '#dc2626',
  port: '#0d9488',
  transport: '#64748b',
  agent: '#db2777',
  other: '#94a3b8',
} as const

/** `12,345,678` → `12.3M`, `45,000` → `45K`. For axis labels. */
export function compactLkr(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
  if (abs >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(Math.round(n))
}
