// Operaciones de escritura. La UI nunca toca Dexie directo para escribir.
import { db } from './db'
import type { Action, Day, Mood } from './types'

const nowIso = () => new Date().toISOString()

// Último valor usado para una acción (para precargar al marcar).
async function lastValue(actionId: string): Promise<number | null> {
  const logs = await db.logs.where('actionId').equals(actionId).toArray()
  const withValue = logs.filter((l) => l.value != null).sort((a, b) => b.date.localeCompare(a.date))
  return withValue[0]?.value ?? null
}

/** Marca o desmarca. Devuelve true si quedó hecha. */
export async function toggleAction(date: string, action: Action): Promise<boolean> {
  return db.transaction('rw', db.logs, async () => {
    const existing = await db.logs.where('[date+actionId]').equals([date, action.id]).first()
    if (existing) {
      await db.logs.delete(existing.id)
      return false
    }
    await db.logs.add({
      id: crypto.randomUUID(),
      date,
      actionId: action.id,
      value: action.hasValue ? await lastValue(action.id) : null,
      createdAt: nowIso(),
    })
    return true
  })
}

export async function setLogValue(date: string, actionId: string, value: number | null) {
  const log = await db.logs.where('[date+actionId]').equals([date, actionId]).first()
  if (log) await db.logs.update(log.id, { value })
}

async function upsertDay(date: string, patch: Partial<Omit<Day, 'date'>>) {
  await db.transaction('rw', db.days, async () => {
    const current = await db.days.get(date)
    await db.days.put({
      date,
      mood: null,
      note: null,
      celebratedAt: null,
      ...current,
      ...patch,
      updatedAt: nowIso(),
    })
  })
}

export const setMood = (date: string, mood: Mood | null) => upsertDay(date, { mood })

export const setNote = (date: string, note: string) =>
  upsertDay(date, { note: note.trim() ? note.trim() : null })

export const markCelebrated = (date: string) => upsertDay(date, { celebratedAt: nowIso() })

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const s = await db.settings.get(key)
  return (s?.value as T) ?? fallback
}
