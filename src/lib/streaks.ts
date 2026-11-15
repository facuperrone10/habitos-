import { addDays } from './date'

/**
 * Racha actual al día `ref`.
 * Regla (fase 1): si `ref` es hoy y todavía no está hecho, se cuenta hasta ayer (no se corta).
 */
export function currentStreak(dates: Set<string>, ref: string, today: string): number {
  let d = ref
  if (!dates.has(d)) {
    if (ref !== today) return 0
    d = addDays(d, -1)
  }
  let n = 0
  while (dates.has(d)) {
    n++
    d = addDays(d, -1)
  }
  return n
}

/** Racha más larga de toda la historia. */
export function longestStreak(dates: Set<string>): number {
  let best = 0
  for (const d of dates) {
    if (dates.has(addDays(d, -1))) continue // solo arranca a contar desde el inicio de cada tramo
    let n = 1
    let next = addDays(d, 1)
    while (dates.has(next)) {
      n++
      next = addDays(next, 1)
    }
    best = Math.max(best, n)
  }
  return best
}
