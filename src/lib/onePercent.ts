// Índice 1% — inspirado en "Hábitos atómicos": pequeñas mejoras diarias se componen.
//
// Reglas (acordadas en la fase 6):
//  - Arranca en 1,00 el día del primer registro.
//  - Día bueno (≥ 50% de las acciones diarias hechas)  → × 1,01
//  - Día flojo (algo registrado, pero < 50%)            → sin cambio
//  - Día sin registro: el 1º no cambia; desde el 2º seguido → × 0,99 ("nunca fallar dos veces")
//  - Hoy, mientras no sea "bueno", no se penaliza (el día no terminó).
import type { Action, Log } from '../db/types'
import { dateRange } from './stats'

export const GOOD_DAY_RATIO = 0.5

export type DayKind = 'good' | 'weak' | 'miss' | 'miss2' | 'pending'

export interface IndexPoint {
  date: string
  value: number
  kind: DayKind
}

/** Acciones diarias que existían (y no estaban ocultas) en una fecha dada. */
function dailyActionsOn(actions: Action[], date: string): Action[] {
  return actions.filter(
    (a) => a.trackStreak && a.createdAt.slice(0, 10) <= date && (!a.archivedAt || a.archivedAt.slice(0, 10) > date),
  )
}

export function computeIndex(actions: Action[], logs: Log[], today: string): IndexPoint[] {
  if (!logs.length) return []
  const byDate = new Map<string, Set<string>>()
  let first = logs[0].date
  for (const l of logs) {
    if (l.date < first) first = l.date
    if (!byDate.has(l.date)) byDate.set(l.date, new Set())
    byDate.get(l.date)!.add(l.actionId)
  }
  // Las acciones por defecto se crearon "hoy" al instalar: si cargaste días anteriores,
  // se consideran existentes desde el primer registro.
  const adjusted = actions.map((a) => (a.createdAt.slice(0, 10) > first ? { ...a, createdAt: first } : a))

  const out: IndexPoint[] = []
  let value = 1
  let missRun = 0
  for (const date of dateRange(first, today)) {
    const done = byDate.get(date)
    const daily = dailyActionsOn(adjusted, date)
    const ratio = done && daily.length ? daily.filter((a) => done.has(a.id)).length / daily.length : 0
    let kind: DayKind
    if (done && ratio >= GOOD_DAY_RATIO) {
      kind = 'good'
      value *= 1.01
      missRun = 0
    } else if (date === today) {
      kind = 'pending'
    } else if (done) {
      kind = 'weak'
      missRun = 0
    } else {
      missRun++
      if (missRun >= 2) {
        kind = 'miss2'
        value *= 0.99
      } else kind = 'miss'
    }
    out.push({ date, value, kind })
  }
  return out
}

/** Variación de hoy respecto de ayer (en %). */
export function todayDelta(points: IndexPoint[]): number {
  if (points.length < 2) return points.length === 1 && points[0].kind === 'good' ? 1 : 0
  const a = points.at(-2)!.value
  const b = points.at(-1)!.value
  return (b / a - 1) * 100
}

export const formatIndex = (v: number) => `${v.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`

/** Referencias para el gráfico: 1% mejor / 1% peor todos los días. */
export function referenceCurves(n: number) {
  return {
    better: Array.from({ length: n }, (_, i) => 1.01 ** (i + 1)),
    worse: Array.from({ length: n }, (_, i) => 0.99 ** (i + 1)),
  }
}

