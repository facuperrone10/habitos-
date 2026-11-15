import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Action, Day, Log, Section } from '../db/types'

export interface SectionWithActions {
  section: Section
  actions: Action[]
}

export interface DayData {
  sections: SectionWithActions[]
  logsByAction: Map<string, Log>
  day: Day | undefined
}

// Lectura reactiva: se re-ejecuta sola cuando cambian las tablas consultadas.
export function useDayData(date: string): DayData | undefined {
  return useLiveQuery(async () => {
    const [sections, actions, logs, day] = await Promise.all([
      db.sections.orderBy('order').toArray(),
      db.actions.orderBy('order').toArray(),
      db.logs.where('date').equals(date).toArray(),
      db.days.get(date),
    ])
    const activeActions = actions.filter((a) => !a.archivedAt)
    return {
      sections: sections
        .filter((s) => !s.archivedAt && !s.hidden)
        .map((section) => ({
          section,
          actions: activeActions.filter((a) => a.sectionId === section.id),
        }))
        .filter((s) => s.actions.length > 0),
      logsByAction: new Map(logs.map((l) => [l.actionId, l])),
      day,
    }
  }, [date])
}
