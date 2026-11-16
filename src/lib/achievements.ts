// Centro de logros. Todo se calcula a partir de los registros (no se guarda nada salvo
// qué logros ya "viste", para festejar solo los nuevos).
import type { Action, Log, Section } from '../db/types'
import type { IndexPoint } from './onePercent'
import { longestStreak } from './streaks'

export type Tier = 0 | 1 | 2 | 3 | 4 // bronce, plata, oro, platino, diamante

export interface AchievementLevel {
  id: string // estable: se usa para saber si ya se festejó
  threshold: number
  unlockedOn: string | null // fecha en que se cruzó el umbral
  tier: Tier
}

export interface AchievementFamily {
  id: string
  sectionId: string | null // null = generales
  title: string // "Leí"
  metric: string // "páginas", "veces", "días seguidos"
  unit: string // para mostrar números: "págs", "min", "veces"...
  current: number
  levels: AchievementLevel[]
}

const VALUE_TIERS: Record<string, number[]> = {
  min: [300, 1000, 3000, 10000, 30000],
  'págs': [100, 500, 1000, 5000, 10000],
  km: [10, 50, 100, 500, 1000],
  '$': [1000, 10000, 50000, 100000, 500000],
}
const DEFAULT_VALUE_TIERS = [10, 100, 1000, 10000]
const COUNT_TIERS = [10, 50, 100, 365]
const STREAK_TIERS = [7, 30, 100, 365]
const DAYS_TIERS = [30, 100, 365, 1000]
const INDEX_TIERS = [1.1, 1.5, 2, 5]

/** Recorre eventos (fecha, cantidad) ordenados y devuelve la fecha en que el acumulado cruza cada umbral. */
function crossings(events: { date: string; amount: number }[], thresholds: number[]): (string | null)[] {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))
  const out: (string | null)[] = thresholds.map(() => null)
  let acc = 0
  for (const e of sorted) {
    acc += e.amount
    thresholds.forEach((t, i) => {
      if (out[i] === null && acc >= t) out[i] = e.date
    })
  }
  return out
}

/** Fecha en que la racha de un conjunto de fechas alcanzó cada umbral por primera vez. */
function streakCrossings(dates: Set<string>, thresholds: number[]): (string | null)[] {
  const sorted = [...dates].sort()
  const out: (string | null)[] = thresholds.map(() => null)
  let run = 0
  let prev: string | null = null
  for (const d of sorted) {
    const p = new Date(d + 'T12:00:00')
    p.setDate(p.getDate() - 1)
    const yesterday = `${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, '0')}-${String(p.getDate()).padStart(2, '0')}`
    run = prev === yesterday ? run + 1 : 1
    prev = d
    thresholds.forEach((t, i) => {
      if (out[i] === null && run >= t) out[i] = d
    })
  }
  return out
}

function levels(familyId: string, thresholds: number[], dates: (string | null)[]): AchievementLevel[] {
  return thresholds.map((threshold, i) => ({
    id: `${familyId}:${threshold}`,
    threshold,
    unlockedOn: dates[i],
    tier: Math.min(i, 4) as Tier,
  }))
}

export function computeAchievements(sections: Section[], actions: Action[], logs: Log[], index: IndexPoint[]): AchievementFamily[] {
  const families: AchievementFamily[] = []
  const logsByAction = new Map<string, Log[]>()
  for (const l of logs) {
    if (!logsByAction.has(l.actionId)) logsByAction.set(l.actionId, [])
    logsByAction.get(l.actionId)!.push(l)
  }
  const visible = new Set(sections.map((s) => s.id))

  for (const a of actions) {
    if (!visible.has(a.sectionId)) continue
    const ls = logsByAction.get(a.id) ?? []
    if (a.archivedAt && !ls.length) continue

    // Acumulado de valor (páginas, minutos, $...)
    if (a.hasValue && a.unit) {
      const thresholds = VALUE_TIERS[a.unit] ?? DEFAULT_VALUE_TIERS
      const events = ls.filter((l) => l.value != null).map((l) => ({ date: l.date, amount: l.value! }))
      const id = `value:${a.id}`
      families.push({
        id, sectionId: a.sectionId, title: a.name, metric: `${a.unit} acumulados`, unit: a.unit,
        current: events.reduce((s, e) => s + e.amount, 0),
        levels: levels(id, thresholds, crossings(events, thresholds)),
      })
    }
    // Repeticiones
    const id = `count:${a.id}`
    families.push({
      id, sectionId: a.sectionId, title: a.name, metric: 'veces', unit: 'veces',
      current: ls.length,
      levels: levels(id, COUNT_TIERS, crossings(ls.map((l) => ({ date: l.date, amount: 1 })), COUNT_TIERS)),
    })
  }

  // Racha por sección (días seguidos con ≥1 acción diaria)
  for (const s of sections) {
    const daily = new Set(actions.filter((a) => a.sectionId === s.id && a.trackStreak).map((a) => a.id))
    const dates = new Set(logs.filter((l) => daily.has(l.actionId)).map((l) => l.date))
    if (!daily.size) continue
    const id = `streak:${s.id}`
    families.push({
      id, sectionId: s.id, title: `Racha de ${s.name}`, metric: 'días seguidos', unit: 'días',
      current: longestStreak(dates),
      levels: levels(id, STREAK_TIERS, streakCrossings(dates, STREAK_TIERS)),
    })
  }

  // Generales
  const allDates = [...new Set(logs.map((l) => l.date))].map((date) => ({ date, amount: 1 }))
  families.push({
    id: 'days', sectionId: null, title: 'Días registrados', metric: 'días con al menos 1 acción', unit: 'días',
    current: allDates.length,
    levels: levels('days', DAYS_TIERS, crossings(allDates, DAYS_TIERS)),
  })
  const best = index.reduce((m, p) => Math.max(m, p.value), 1)
  families.push({
    id: 'index', sectionId: null, title: 'Índice 1%', metric: 'mejor valor alcanzado', unit: '×',
    current: best,
    levels: INDEX_TIERS.map((t, i) => ({
      id: `index:${t}`, threshold: t, tier: i as Tier,
      unlockedOn: index.find((p) => p.value >= t)?.date ?? null,
    })),
  })
  return families
}

export const TIER_COLORS = ['#B0703C', '#9BA3AE', '#D4A017', '#5FB3B3', '#7C8CF8'] as const
export const TIER_NAMES = ['Bronce', 'Plata', 'Oro', 'Platino', 'Diamante'] as const

export function unlockedIds(families: AchievementFamily[]): string[] {
  return families.flatMap((f) => f.levels.filter((l) => l.unlockedOn).map((l) => l.id))
}

export function formatAmount(v: number, unit: string): string {
  if (unit === '×') return `${v.toLocaleString('es-UY', { maximumFractionDigits: 2 })}×`
  const n = v.toLocaleString('es-UY', { maximumFractionDigits: 1 })
  if (unit === '$') return `$ ${n}`
  return `${n} ${unit}`
}
