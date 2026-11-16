import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Action, Day, Log, Measurement, Section } from '../db/types'

export interface AllData {
  sections: Section[] // visibles, ordenadas
  actions: Action[] // todas (las ocultas conservan historial)
  logs: Log[]
  days: Day[]
  measurements: Measurement[]
}

/** Todo el historial (es chico: miles de filas). Se actualiza solo ante cualquier cambio. */
export function useAllData(): AllData | undefined {
  return useLiveQuery(async () => {
    const [sections, actions, logs, days, measurements] = await Promise.all([
      db.sections.orderBy('order').toArray(),
      db.actions.toArray(),
      db.logs.toArray(),
      db.days.toArray(),
      db.measurements.orderBy('date').toArray(),
    ])
    return { sections: sections.filter((s) => !s.hidden && !s.archivedAt), actions, logs, days, measurements }
  })
}
