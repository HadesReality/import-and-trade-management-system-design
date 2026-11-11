import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, ChevronsDownUp, ChevronsUpDown, Printer, Search, X } from 'lucide-react'
import { Badge, Button, Card, CardBody, Input } from '../../components/ui'
import { NAV_ITEMS } from '../../config/navigation'
import { ROLES, roleLabel, type Role } from '../../config/roles'
import { AUTOMATIC, BASICS, FAQ, GLOSSARY, ROLE_GUIDES, WORKFLOW } from '../../docs/general'
import { DOC_MODULES } from '../../docs/modules'
import type { DocFunction, DocModule } from '../../docs/types'
import { cn } from '../../lib/cn'
import { useUiStore } from '../../store/uiStore'
import { DocSection, FunctionCard, RoleChips, Rich } from './DocParts'

type View = Role | 'ALL'

/** Who can open a screen — taken from the navigation config, so the docs can't drift from the app. */
const accessFor = (path: string): Role[] => NAV_ITEMS.find((n) => n.path === path)?.roles ?? []
const canOpen = (view: View, path: string) => view === 'ALL' || view === 'OWNER' || accessFor(path).includes(view)

const fnText = (fn: DocFunction) => [fn.title, ...fn.steps, ...(fn.notes ?? [])].join(' ').toLowerCase()

export function DocsPage() {
  const currentRole = useUiStore((s) => s.role)
  const [params, setParams] = useSearchParams()
  const paramRole = params.get('role')
  const view: View = paramRole === 'ALL' || ROLES.some((r) => r.id === paramRole) ? (paramRole as View) : currentRole
  const [query, setQuery] = useState('')
  const [expand, setExpand] = useState({ open: false, version: 0 })

  const setView = (v: View) => setParams(v === currentRole ? {} : { role: v }, { replace: true })
  const q = query.trim().toLowerCase()
  const searching = q.length > 1

  const modules: DocModule[] = useMemo(() => DOC_MODULES.filter((m) => canOpen(view, m.path)), [view])
  const shownModules = modules
    .map((m) => ({ ...m, functions: searching ? m.functions.filter((f) => fnText(f).includes(q)) : m.functions }))
    .filter((m) => m.functions.length > 0)
  const shownBasics = searching ? BASICS.filter((f) => fnText(f).includes(q)) : BASICS
  const shownGlossary = searching ? GLOSSARY.filter(([t, d]) => `${t} ${d}`.toLowerCase().includes(q)) : GLOSSARY
  const shownFaq = searching ? FAQ.filter(([qq, a]) => `${qq} ${a}`.toLowerCase().includes(q)) : FAQ
  const totalFunctions = modules.reduce((s, m) => s + m.functions.length, 0)
  const resultCount = shownBasics.length + shownModules.reduce((s, m) => s + m.functions.length, 0) + shownGlossary.length + shownFaq.length

  const effectiveExpand = searching ? { open: true, version: expand.version + 1000 + q.length } : expand
  const highlight = view === 'ALL' || view === 'OWNER' ? undefined : view

  const toc = [
    { id: 'start', label: 'Start here', show: shownBasics.length > 0 },
    { id: 'your-role', label: view === 'ALL' ? 'Roles & access' : 'Your role', show: !searching },
    { id: 'workflow', label: 'The full process', show: !searching },
    ...shownModules.map((m) => ({ id: `screen-${m.id}`, label: m.title, show: true, indent: true })),
    { id: 'automatic', label: 'What happens automatically', show: !searching },
    { id: 'glossary', label: 'Glossary', show: shownGlossary.length > 0 },
    { id: 'faq', label: 'Questions & problems', show: shownFaq.length > 0 },
  ].filter((t) => t.show)

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const printAll = () => {
    setExpand((e) => ({ open: true, version: e.version + 1 }))
    setTimeout(() => window.print(), 150)
  }

  return (
    <div>
      {/* Header and controls */}
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">Help & Documentation</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          How to use every function in the system, step by step. Choose a role to see only what that person can do.
        </p>
      </div>

      <Card className="mb-6 print:hidden">
        <CardBody className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Show the guide for</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Show the guide for">
              {[...ROLES.map((r) => ({ id: r.id as View, label: r.label })), { id: 'ALL' as View, label: 'All roles' }].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setView(r.id)}
                  aria-pressed={view === r.id}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition',
                    view === r.id ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                  )}
                >
                  {view === r.id && <Check size={14} />}
                  {r.label}
                  {r.id === currentRole && view !== r.id && <span className="text-xs text-slate-400">(you)</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[14rem] flex-1 sm:max-w-sm">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the guide, e.g. “cheque” or “LC”" className="pl-9 pr-8" aria-label="Search the guide" />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700" aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
            </div>
            <Button size="sm" variant="secondary" onClick={() => setExpand((e) => ({ open: true, version: e.version + 1 }))}>
              <ChevronsUpDown size={14} /> Expand all
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setExpand((e) => ({ open: false, version: e.version + 1 }))}>
              <ChevronsDownUp size={14} /> Collapse all
            </Button>
            <Button size="sm" variant="secondary" onClick={printAll}>
              <Printer size={14} /> Print guide
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            {searching
              ? `${resultCount} result(s) for “${query.trim()}”.`
              : view === 'ALL'
                ? `${totalFunctions} functions across ${modules.length} screens, plus ${BASICS.length} basics.`
                : `${roleLabel(view)} can open ${modules.length} screens with ${totalFunctions} functions, plus ${BASICS.length} basics everyone uses.`}
          </p>
        </CardBody>
      </Card>

      <div className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
        {/* Contents */}
        <nav aria-label="Contents" className="print:hidden">
          <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Contents</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm lg:block lg:space-y-1">
              {toc.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    onClick={(e) => (e.preventDefault(), jump(t.id))}
                    className={cn('block rounded px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900', 'indent' in t && t.indent && 'lg:pl-5')}
                  >
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="min-w-0 space-y-10">
          {searching && resultCount === 0 && (
            <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Nothing matches “{query.trim()}”{view !== 'ALL' && ' for this role'}. {view !== 'ALL' && (
                <button onClick={() => setView('ALL')} className="font-medium text-brand-600 hover:underline">
                  Search all roles
                </button>
              )}
            </p>
          )}

          {/* Basics */}
          {shownBasics.length > 0 && (
            <DocSection id="start" title="Start here" intro="The basics everyone uses, whatever their role.">
              <div className="grid items-start gap-2 2xl:grid-cols-2">
                {shownBasics.map((fn) => (
                  <FunctionCard key={fn.id} anchor={`basics-${fn.id}`} fn={fn} expand={effectiveExpand} />
                ))}
              </div>
            </DocSection>
          )}

          {/* Role guide or access matrix */}
          {!searching && (
            <DocSection id="your-role" title={view === 'ALL' ? 'Roles & access' : `Your role: ${roleLabel(view)}`}>
              {view === 'ALL' ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Screen</th>
                          {ROLES.map((r) => (
                            <th key={r.id} className="px-2 py-2 text-center font-medium">
                              {r.label.split(' ')[0]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {NAV_ITEMS.map((n) => (
                          <tr key={n.path}>
                            <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-800">{n.label}</td>
                            {ROLES.map((r) => (
                              <td key={r.id} className="px-2 py-2 text-center">
                                {n.roles.includes(r.id) ? <Check size={16} className="mx-auto text-green-600" aria-label="Yes" /> : <span className="text-slate-300" aria-label="No">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ROLES.map((r) => (
                      <button key={r.id} onClick={() => setView(r.id)} className="rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-brand-500">
                        <p className="font-semibold text-slate-900">{r.label}</p>
                        <p className="mt-1 text-sm text-slate-600">{ROLE_GUIDES[r.id].purpose}</p>
                        <p className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                          Show this role’s guide <ArrowRight size={14} />
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardBody>
                      <p className="text-sm text-slate-700">{ROLE_GUIDES[view].purpose}</p>
                      <p className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Usual routine</p>
                      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
                        {ROLE_GUIDES[view].routine.map((s, i) => (
                          <li key={i}>
                            <Rich text={s} />
                          </li>
                        ))}
                      </ol>
                      {ROLE_GUIDES[view].cannot && <p className="mt-4 text-xs text-slate-500">{ROLE_GUIDES[view].cannot}</p>}
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Screens you can open</p>
                      <ul className="divide-y divide-slate-100">
                        {modules.map((m) => {
                          const nav = NAV_ITEMS.find((n) => n.path === m.path)
                          return (
                            <li key={m.id} className="flex items-center gap-3 py-2">
                              {nav && <nav.icon size={16} className="shrink-0 text-slate-500" />}
                              <a href={`#screen-${m.id}`} onClick={(e) => (e.preventDefault(), jump(`screen-${m.id}`))} className="flex-1 text-sm font-medium text-slate-800 hover:text-brand-600">
                                {m.title}
                              </a>
                              <span className="text-xs text-slate-500">{m.functions.length} functions</span>
                              <Link to={m.path} className="text-xs font-medium text-brand-600 hover:underline">
                                Open
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </CardBody>
                  </Card>
                </div>
              )}
            </DocSection>
          )}

          {/* Workflow */}
          {!searching && (
            <DocSection
              id="workflow"
              title="The full process, start to finish"
              intro={view === 'ALL' || view === 'OWNER' ? 'Who does each step of one shipment.' : `Steps for ${roleLabel(view)} are highlighted.`}
            >
              <ol className="space-y-2">
                {WORKFLOW.map((w, i) => {
                  const mine = highlight ? w.who.includes(highlight) : false
                  return (
                    <li key={i} className={cn('flex flex-wrap items-start gap-3 rounded-lg border p-3 text-sm', mine ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white')}>
                      <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold', mine ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600')}>{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">{w.step}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {canOpen(view, w.path) ? (
                            <Link to={w.path} className="hover:text-brand-600 hover:underline">
                              {w.where}
                            </Link>
                          ) : (
                            w.where
                          )}
                        </p>
                      </div>
                      <RoleChips roles={w.who} highlight={highlight} />
                    </li>
                  )
                })}
              </ol>
            </DocSection>
          )}

          {/* Screens and functions */}
          {shownModules.map((m) => {
            const nav = NAV_ITEMS.find((n) => n.path === m.path)
            return (
              <DocSection
                key={m.id}
                id={`screen-${m.id}`}
                title={m.title}
                intro={
                  <div className="space-y-2">
                    <p>{m.summary}</p>
                    <p className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>Where: sidebar → {nav?.group} → {m.title}.</span>
                      <span>Who can open it:</span>
                      <RoleChips roles={accessFor(m.path)} highlight={highlight} />
                      <Link to={m.path} className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline print:hidden">
                        Open screen <ArrowRight size={12} />
                      </Link>
                    </p>
                  </div>
                }
              >
                <div className="grid items-start gap-2 2xl:grid-cols-2">
                  {m.functions.map((fn) => (
                    <FunctionCard key={fn.id} anchor={`fn-${m.id}-${fn.id}`} fn={fn} expand={effectiveExpand} highlight={highlight} />
                  ))}
                </div>
              </DocSection>
            )
          })}

          {/* Automatic updates */}
          {!searching && (
            <DocSection id="automatic" title="What happens automatically" intro="The system keeps related records in step, so nobody has to update the same fact twice.">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">When…</th>
                      <th className="px-4 py-2 font-medium">…the system</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {AUTOMATIC.map((a) => (
                      <tr key={a.when}>
                        <td className="px-4 py-2 align-top text-slate-800">{a.when}</td>
                        <td className="px-4 py-2 align-top text-slate-600">{a.then}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DocSection>
          )}

          {/* Glossary */}
          {shownGlossary.length > 0 && (
            <DocSection id="glossary" title="Glossary" intro="Trade, banking and Sri Lankan customs terms used in the system.">
              <dl className="grid gap-x-6 gap-y-3 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
                {shownGlossary.map(([term, def]) => (
                  <div key={term}>
                    <dt className="font-semibold text-slate-900">{term}</dt>
                    <dd className="text-slate-600">{def}</dd>
                  </div>
                ))}
              </dl>
            </DocSection>
          )}

          {/* FAQ */}
          {shownFaq.length > 0 && (
            <DocSection id="faq" title="Questions & problems">
              <div className="grid items-start gap-2 2xl:grid-cols-2">
                {shownFaq.map(([question, answer]) => (
                  <details key={question} open={searching || undefined} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
                    <summary className="cursor-pointer font-medium text-slate-900">{question}</summary>
                    <p className="mt-2 text-slate-600">{answer}</p>
                  </details>
                ))}
              </div>
            </DocSection>
          )}

          <p className="border-t border-slate-200 pt-4 text-xs text-slate-500">
            This is a prototype: data stays in this browser, files are not uploaded, and nothing connects to Customs, banks or messaging. <Badge tone="amber">Demo</Badge>
          </p>
        </div>
      </div>
    </div>
  )
}
