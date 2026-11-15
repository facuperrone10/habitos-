import type { Action } from '../db/types'
import type { SectionWithActions } from '../hooks/useDayData'

// Acciones que cuentan para "sección completa": las diarias (trackStreak).
// Si una sección no tiene ninguna diaria, cuentan todas.
function requiredActions(actions: Action[]): Action[] {
  const daily = actions.filter((a) => a.trackStreak)
  return daily.length ? daily : actions
}

export function isSectionComplete(s: SectionWithActions, done: Set<string>): boolean {
  return requiredActions(s.actions).every((a) => done.has(a.id))
}

// Día completo = todas las secciones visibles con al menos 1 acción hecha.
export function isDayComplete(sections: SectionWithActions[], done: Set<string>): boolean {
  return sections.length > 0 && sections.every((s) => s.actions.some((a) => done.has(a.id)))
}
