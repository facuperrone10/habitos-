// Operaciones de escritura. La UI nunca toca Dexie directo para escribir.
import { db } from './db'
import type { Action, Day, Mood, Section } from './types'

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

// ---------- Edición de acciones ----------

export async function addAction(sectionId: string, name: string) {
  const clean = name.trim()
  if (!clean) return
  const siblings = await db.actions.where('sectionId').equals(sectionId).toArray()
  const maxOrder = siblings.reduce((m, a) => Math.max(m, a.order), -1)
  await db.actions.add({
    id: crypto.randomUUID(), sectionId, name: clean, order: maxOrder + 1,
    hasValue: false, unit: null, trackStreak: true, createdAt: nowIso(), archivedAt: null,
  })
}

export async function updateAction(id: string, patch: Partial<Omit<Action, 'id' | 'sectionId'>>) {
  await db.actions.update(id, patch)
}

// Ocultar = archivar: desaparece de "Hoy" pero conserva su historial.
export const setActionHidden = (id: string, hidden: boolean) =>
  db.actions.update(id, { archivedAt: hidden ? nowIso() : null })

/** Mueve una acción visible una posición arriba (-1) o abajo (+1) dentro de su sección. */
export async function moveAction(sectionId: string, id: string, dir: -1 | 1) {
  await db.transaction('rw', db.actions, async () => {
    const list = (await db.actions.where('sectionId').equals(sectionId).toArray())
      .filter((a) => !a.archivedAt)
      .sort((a, b) => a.order - b.order)
    const i = list.findIndex((a) => a.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    await Promise.all(list.map((a, idx) => db.actions.update(a.id, { order: idx })))
  })
}

// ---------- Edición de secciones ----------

export async function addSection(name: string, color: string, icon: string): Promise<string> {
  const all = await db.sections.toArray()
  const id = crypto.randomUUID()
  await db.sections.add({
    id, name: name.trim() || 'Nueva sección', icon, color,
    order: all.reduce((m, s) => Math.max(m, s.order), -1) + 1,
    hidden: false, createdAt: nowIso(), archivedAt: null,
  })
  return id
}

export const updateSection = (id: string, patch: Partial<Omit<Section, 'id'>>) => db.sections.update(id, patch)

export async function moveSection(id: string, dir: -1 | 1) {
  await db.transaction('rw', db.sections, async () => {
    const list = (await db.sections.toArray()).filter((s) => !s.archivedAt).sort((a, b) => a.order - b.order)
    const i = list.findIndex((s) => s.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    await Promise.all(list.map((s, idx) => db.sections.update(s.id, { order: idx })))
  })
}
