import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { StreakBadge } from '../components/StreakBadge'
import { db } from '../db/db'
import { useHistory } from '../hooks/useHistory'
import { useToday } from '../hooks/useToday'
import { fromKey, toKey } from '../lib/date'
import { currentStreak, longestStreak } from '../lib/streaks'

const GENERAL = 'general'
const GENERAL_COLOR = '#1f2328'
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const LEVEL_MIX = [0, 22, 45, 70, 100] // % del color por nivel de cumplimiento

const monthFmt = new Intl.DateTimeFormat('es-UY', { month: 'long', year: 'numeric' })

interface Props {
  onSelectDay: (date: string) => void
}

export function CalendarScreen({ onSelectDay }: Props) {
  const today = useToday()
  const history = useHistory()
  const meta = useLiveQuery(async () => {
    const [sections, actions] = await Promise.all([db.sections.orderBy('order').toArray(), db.actions.toArray()])
    const visible = sections.filter((s) => !s.hidden && !s.archivedAt)
    const active = actions.filter((a) => !a.archivedAt)
    return {
      sections: visible,
      actionsBySection: new Map(visible.map((s) => [s.id, active.filter((a) => a.sectionId === s.id)])),
      sectionOfAction: new Map(actions.map((a) => [a.id, a.sectionId])),
    }
  })

  const [filter, setFilter] = useState<string>(GENERAL)
  const [month, setMonth] = useState(() => today.slice(0, 7)) // 'YYYY-MM'

  const days = useMemo(() => buildMonth(month), [month])

  if (!history || !meta) return null

  const section = meta.sections.find((s) => s.id === filter)
  const color = section?.color ?? GENERAL_COLOR

  // Proporción cumplida (0..1) de un día según el filtro.
  const ratio = (date: string): number => {
    const done = history.byDate.get(date)
    if (!done) return 0
    if (section) {
      const acts = meta.actionsBySection.get(section.id) ?? []
      if (!acts.length) return 0
      return acts.filter((a) => done.has(a.id)).length / acts.length
    }
    const withActions = meta.sections.filter((s) => (meta.actionsBySection.get(s.id) ?? []).length > 0)
    if (!withActions.length) return 0
    const touched = new Set([...done].map((id) => meta.sectionOfAction.get(id)))
    return withActions.filter((s) => touched.has(s.id)).length / withActions.length
  }

  const streakDates = section ? history.bySection.get(section.id) ?? new Set<string>() : history.general
  const elapsed = days.filter((d) => d && d <= today) as string[]
  const registered = elapsed.filter((d) => ratio(d) > 0).length
  const isCurrentMonth = month === today.slice(0, 7)

  const shiftMonth = (n: number) => {
    const d = fromKey(`${month}-01`)
    d.setMonth(d.getMonth() + n)
    setMonth(toKey(d).slice(0, 7))
  }

  const rawLabel = monthFmt.format(fromKey(`${month}-01`))
  const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)

  return (
    <div className="space-y-4" style={{ '--c': color } as CSSProperties}>
      {/* Filtro por sección */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <FilterChip active={filter === GENERAL} color={GENERAL_COLOR} onClick={() => setFilter(GENERAL)}>
          General
        </FilterChip>
        {meta.sections.map((s) => (
          <FilterChip key={s.id} active={filter === s.id} color={s.color} onClick={() => setFilter(s.id)}>
            {s.name}
          </FilterChip>
        ))}
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" aria-label="Mes anterior" className="nav-btn" onClick={() => shiftMonth(-1)}>
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-neutral-900">{label}</h1>
          <button type="button" aria-label="Mes siguiente" className="nav-btn disabled:opacity-25" disabled={isCurrentMonth} onClick={() => shiftMonth(1)}>
            <ChevronRight size={22} />
          </button>
        </div>

        <div className="mb-1.5 grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-neutral-400">
          {WEEKDAYS.map((w, i) => <div key={i}>{w}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d, i) => {
            if (!d) return <div key={`b${i}`} />
            const future = d > today
            const r = future ? 0 : ratio(d)
            const level = r === 0 ? 0 : Math.max(1, Math.ceil(r * 4))
            const mix = LEVEL_MIX[level]
            return (
              <button
                key={d}
                type="button"
                disabled={future}
                onClick={() => onSelectDay(d)}
                className={`cal-cell ${d === today ? 'cal-cell--today' : ''} disabled:opacity-30`}
                style={{
                  background: level ? `color-mix(in srgb, ${color} ${mix}%, white)` : '#f3f3f1',
                  color: level >= 3 ? 'white' : '#525252',
                }}
              >
                {Number(d.slice(8))}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-neutral-400">
          Menos
          {LEVEL_MIX.map((m, i) => (
            <span key={i} className="h-3.5 w-3.5 rounded" style={{ background: i ? `color-mix(in srgb, ${color} ${m}%, white)` : '#f3f3f1' }} />
          ))}
          Más
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Días con registro" value={`${registered}/${elapsed.length}`} />
        <Stat label="Racha actual">
          <StreakBadge value={currentStreak(streakDates, today, today)} color={section?.color ?? '#F76B15'} size="md" />
          {currentStreak(streakDates, today, today) === 0 && <span className="text-xl font-bold text-neutral-300">0</span>}
        </Stat>
        <Stat label="Récord" value={`${longestStreak(streakDates)} d`} />
      </div>

      <p className="px-1 text-center text-xs text-neutral-400">Tocá un día para verlo o corregirlo.</p>
    </div>
  )
}

/** Días del mes con huecos al inicio para arrancar la semana en lunes. */
function buildMonth(month: string): (string | null)[] {
  const first = fromKey(`${month}-01`)
  const offset = (first.getDay() + 6) % 7 // lunes = 0
  const out: (string | null)[] = Array(offset).fill(null)
  const d = new Date(first)
  while (d.getMonth() === first.getMonth()) {
    out.push(toKey(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

function FilterChip({ active, color, onClick, children }: {
  active: boolean; color: string; onClick: () => void; children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors"
      style={active
        ? { background: color, color: 'white' }
        : { background: `color-mix(in srgb, ${color} 9%, white)`, color }}
    >
      {children}
    </button>
  )
}

function Stat({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 text-center shadow-sm ring-1 ring-black/5">
      <div className="flex h-7 items-center justify-center text-xl font-bold tabular-nums text-neutral-900">
        {value ?? children}
      </div>
      <div className="mt-0.5 text-[11px] font-semibold text-neutral-400">{label}</div>
    </div>
  )
}
