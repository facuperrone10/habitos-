import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { db } from '../db/db'
import { useToday } from '../hooks/useToday'
import {
  completionBySection, MIN_SAMPLE, moodBySection, valueTotals, weekVsPrevious, type StatsInput,
} from '../lib/stats'

const PERIODS = [7, 30, 90] as const
type Period = (typeof PERIODS)[number]

const num = (v: number, digits = 1) => v.toLocaleString('es-UY', { maximumFractionDigits: digits })

export function StatsScreen() {
  const today = useToday()
  const [period, setPeriod] = useState<Period>(30)

  const input = useLiveQuery<StatsInput>(async () => {
    const [sections, actions, logs, days] = await Promise.all([
      db.sections.orderBy('order').toArray(),
      db.actions.toArray(),
      db.logs.toArray(),
      db.days.toArray(),
    ])
    return { sections: sections.filter((s) => !s.hidden && !s.archivedAt), actions, logs, days, today }
  }, [today])

  if (!input) return null

  const header = (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Estadísticas</h1>
      <div className="flex rounded-full bg-neutral-200/70 p-1" role="tablist" aria-label="Período">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={period === p}
            onClick={() => setPeriod(p)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${period === p ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}
          >
            {p} d
          </button>
        ))}
      </div>
    </div>
  )

  if (!input.logs.length) {
    return (
      <div className="space-y-4">
        {header}
        <Card title="Todavía no hay datos">
          <p className="text-sm text-neutral-500">Registrá algunos días (podés completar días anteriores) y acá vas a ver tu progreso.</p>
        </Card>
      </div>
    )
  }

  const completion = completionBySection(input, period)
  const week = weekVsPrevious(input)
  const mood = moodBySection(input, period)
  const totals = valueTotals(input, period)
  const daysInPeriod = completion[0]?.total ?? 0

  return (
    <div className="space-y-4">
      {header}

      {/* 1. Cumplimiento por sección */}
      <Card title="Días cumplidos por sección" subtitle={`Últimos ${daysInPeriod} días con la app`}>
        <div className="space-y-3">
          {completion.map(({ section, done, total, pct }) => (
            <div key={section.id}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-semibold text-neutral-800">{section.name}</span>
                <span className="tabular-nums text-neutral-500">
                  <span className="font-bold text-neutral-900">{Math.round(pct * 100)}%</span> · {done}/{total} d
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="stat-bar h-full rounded-full"
                  style={{ width: `${pct * 100}%`, background: section.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 2. Semana vs semana anterior */}
      <Card title="Esta semana vs la anterior" subtitle="Acciones registradas: últimos 7 días vs los 7 previos">
        <div className="divide-y divide-neutral-100">
          {week.map(({ section, current, previous }) => {
            const delta = current - previous
            const Icon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus
            const tone = delta > 0 ? 'text-emerald-700 bg-emerald-50' : delta < 0 ? 'text-red-700 bg-red-50' : 'text-neutral-500 bg-neutral-100'
            return (
              <div key={section.id} className="flex items-center gap-3 py-2.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: section.color }} />
                <span className="flex-1 text-sm font-semibold text-neutral-800">{section.name}</span>
                <span className="text-sm tabular-nums text-neutral-500">
                  {previous} → <span className="font-bold text-neutral-900">{current}</span>
                </span>
                <span className={`inline-flex min-w-14 items-center justify-center gap-0.5 rounded-full px-2 py-1 text-xs font-bold tabular-nums ${tone}`}>
                  <Icon size={14} strokeWidth={2.6} />
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 3. Ánimo y secciones */}
      <Card title="Ánimo y secciones" subtitle="Ánimo promedio los días que cumpliste la sección vs los que no">
        {mood.n === 0 ? (
          <p className="text-sm text-neutral-500">Registrá tu ánimo (las caritas en "Hoy") para ver esta relación.</p>
        ) : (
          <>
            <div className="mb-3 flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums text-neutral-900">{num(mood.avg!)}</span>
              <span className="text-sm text-neutral-500">/ 5 promedio · {mood.n} días con ánimo</span>
            </div>
            <div className="divide-y divide-neutral-100">
              {mood.bySection.map((m) => (
                <div key={m.section.id} className="flex items-center gap-3 py-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: m.section.color }} />
                  <span className="flex-1 text-sm font-semibold text-neutral-800">{m.section.name}</span>
                  {m.diff == null ? (
                    <span className="text-xs text-neutral-400">Faltan datos</span>
                  ) : (
                    <>
                      <span className="text-xs tabular-nums text-neutral-500">
                        con {num(m.withAvg!)} · sin {num(m.withoutAvg!)}
                      </span>
                      <span className={`min-w-12 text-right text-sm font-bold tabular-nums ${m.diff > 0.05 ? 'text-emerald-700' : m.diff < -0.05 ? 'text-red-700' : 'text-neutral-500'}`}>
                        {m.diff > 0 ? '+' : ''}{num(m.diff)}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-neutral-400">
              Se necesitan al menos {MIN_SAMPLE} días con ánimo de cada lado. Muestra una relación, no una causa.
            </p>
          </>
        )}
      </Card>

      {/* 4. Totales de acciones con valor */}
      {totals.length > 0 && (
        <Card title="Totales del período" subtitle="Acciones con valor numérico">
          <div className="divide-y divide-neutral-100">
            {totals.map((t) => (
              <div key={t.action.id} className="flex items-center gap-3 py-2.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.section.color }} />
                <span className="flex-1 text-sm font-semibold text-neutral-800">{t.action.name}</span>
                <span className="text-sm tabular-nums text-neutral-500">
                  <span className="font-bold text-neutral-900">{num(t.sum, 2)} {t.action.unit}</span> · {t.days} d
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <h2 className="text-[15px] font-bold text-neutral-900">{title}</h2>
      {subtitle && <p className="mb-3 text-xs text-neutral-400">{subtitle}</p>}
      {!subtitle && <div className="mb-2" />}
      {children}
    </section>
  )
}
