import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

export interface History {
  /** actionId -> fechas en que se hizo */
  byAction: Map<string, Set<string>>
  /** sectionId -> fechas con al menos 1 acción diaria (trackStreak) de la sección */
  bySection: Map<string, Set<string>>
  /** fechas con al menos 1 acción diaria de cualquier sección visible */
  general: Set<string>
  /** fecha -> ids de acciones hechas ese día */
  byDate: Map<string, Set<string>>
}

// Todo el historial en memoria: ~7k filas/año, se recalcula en milisegundos.
export function useHistory(): History | undefined {
  return useLiveQuery(async () => {
    const [logs, actions, sections] = await Promise.all([
      db.logs.toArray(),
      db.actions.toArray(),
      db.sections.toArray(),
    ])
    const actionById = new Map(actions.map((a) => [a.id, a]))
    const visibleSections = new Set(sections.filter((s) => !s.hidden && !s.archivedAt).map((s) => s.id))

    const byAction = new Map<string, Set<string>>()
    const bySection = new Map<string, Set<string>>()
    const byDate = new Map<string, Set<string>>()
    const general = new Set<string>()
    const add = <K,>(m: Map<K, Set<string>>, k: K, v: string) => {
      let s = m.get(k)
      if (!s) m.set(k, (s = new Set()))
      s.add(v)
    }

    for (const l of logs) {
      add(byAction, l.actionId, l.date)
      add(byDate, l.date, l.actionId)
      const a = actionById.get(l.actionId)
      if (!a || !a.trackStreak) continue
      add(bySection, a.sectionId, l.date)
      if (visibleSections.has(a.sectionId)) general.add(l.date)
    }
    return { byAction, bySection, general, byDate }
  })
}
