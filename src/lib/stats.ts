// Cálculos de estadísticas. Funciones puras: reciben datos y devuelven números.
import type { Action, Day, Log, Section } from '../db/types'
import { addDays } from './date'

export interface StatsInput {
  sections: Section[] // visibles, ordenadas
  actions: Action[] // todas (incluye archivadas: su historial cuenta)
  logs: Log[]
  days: Day[]
  today: string
}

/** Lista de fechas desde `from` hasta `to` inclusive. */
export function dateRange(from: string, to: string): string[] {
  const out: string[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d)
  return out
}

/** sectionId -> Set de fechas con al menos 1 acción de esa sección. */
function sectionDays(input: StatsInput): Map<string, Set<string>> {
  const sectionOf = new Map(input.actions.map((a) => [a.id, a.sectionId]))
  const map = new Map<string, Set<string>>()
  for (const l of input.logs) {
    const sid = sectionOf.get(l.actionId)
    if (!sid) continue
    if (!map.has(sid)) map.set(sid, new Set())
    map.get(sid)!.add(l.date)
  }
  return map
}

/**
 * Inicio efectivo del período: no se cuentan días anteriores al primer registro,
 * para no castigar el % con días en que la app no existía.
 */
export function periodStart(input: StatsInput, periodDays: number): string {
  const nominal = addDays(input.today, -(periodDays - 1))
  const first = input.logs.reduce<string | null>((m, l) => (m === null || l.date < m ? l.date : m), null)
  if (!first) return input.today
  return first > nominal ? first : nominal
}

export interface SectionCompletion {
  section: Section
  done: number
  total: number
  pct: number
}

/** % de días del período con la sección cumplida (≥1 acción). */
export function completionBySection(input: StatsInput, periodDays: number): SectionCompletion[] {
  const range = dateRange(periodStart(input, periodDays), input.today)
  const sd = sectionDays(input)
  return input.sections.map((section) => {
    const set = sd.get(section.id) ?? new Set<string>()
    const done = range.filter((d) => set.has(d)).length
    return { section, done, total: range.length, pct: range.length ? done / range.length : 0 }
  })
}

export interface WeekCompare {
  section: Section
  current: number
  previous: number
}

/** Acciones registradas en los últimos 7 días vs los 7 anteriores, por sección. */
export function weekVsPrevious(input: StatsInput): WeekCompare[] {
  const curFrom = addDays(input.today, -6)
  const prevFrom = addDays(input.today, -13)
  const sectionOf = new Map(input.actions.map((a) => [a.id, a.sectionId]))
  const cur = new Map<string, number>()
  const prev = new Map<string, number>()
  for (const l of input.logs) {
    const sid = sectionOf.get(l.actionId)
    if (!sid) continue
    if (l.date >= curFrom && l.date <= input.today) cur.set(sid, (cur.get(sid) ?? 0) + 1)
    else if (l.date >= prevFrom && l.date < curFrom) prev.set(sid, (prev.get(sid) ?? 0) + 1)
  }
  return input.sections.map((section) => ({
    section,
    current: cur.get(section.id) ?? 0,
    previous: prev.get(section.id) ?? 0,
  }))
}

export const MIN_SAMPLE = 3

export interface MoodBySection {
  section: Section
  withAvg: number | null
  withoutAvg: number | null
  withN: number
  withoutN: number
  diff: number | null // con - sin; null si no hay muestra suficiente
}

export interface MoodSummary {
  avg: number | null
  n: number
  bySection: MoodBySection[]
}

/**
 * Correlación básica: ánimo promedio los días que cumpliste la sección vs los que no.
 * Es una asociación, no causa. Requiere al menos MIN_SAMPLE días de cada lado.
 */
export function moodBySection(input: StatsInput, periodDays: number): MoodSummary {
  const from = periodStart(input, periodDays)
  const moodDays = input.days.filter((d) => d.mood != null && d.date >= from && d.date <= input.today)
  const sd = sectionDays(input)
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

  const bySection = input.sections.map((section) => {
    const set = sd.get(section.id) ?? new Set<string>()
    const withM = moodDays.filter((d) => set.has(d.date)).map((d) => d.mood!)
    const withoutM = moodDays.filter((d) => !set.has(d.date)).map((d) => d.mood!)
    const withAvg = avg(withM)
    const withoutAvg = avg(withoutM)
    const enough = withM.length >= MIN_SAMPLE && withoutM.length >= MIN_SAMPLE
    return {
      section, withAvg, withoutAvg, withN: withM.length, withoutN: withoutM.length,
      diff: enough && withAvg != null && withoutAvg != null ? withAvg - withoutAvg : null,
    }
  })
  bySection.sort((a, b) => (b.diff ?? -99) - (a.diff ?? -99))
  return { avg: avg(moodDays.map((d) => d.mood!)), n: moodDays.length, bySection }
}

export interface ValueTotal {
  action: Action
  section: Section
  sum: number
  days: number
}

/** Suma de valores numéricos (min, págs, $) en el período, por acción. */
export function valueTotals(input: StatsInput, periodDays: number): ValueTotal[] {
  const from = periodStart(input, periodDays)
  const sectionById = new Map(input.sections.map((s) => [s.id, s]))
  const out: ValueTotal[] = []
  for (const action of input.actions) {
    const section = sectionById.get(action.sectionId)
    if (!section || !action.hasValue) continue
    const logs = input.logs.filter((l) => l.actionId === action.id && l.date >= from && l.date <= input.today && l.value != null)
    if (!logs.length) continue
    out.push({ action, section, sum: logs.reduce((a, l) => a + (l.value ?? 0), 0), days: logs.length })
  }
  return out
}
