import Dexie, { type EntityTable } from 'dexie'
import type { Action, Day, Log, Measurement, Section, Setting } from './types'
import { DEFAULT_IDENTITIES, seedDefaults } from './seed'

export const SCHEMA_VERSION = 2

class HabitosDB extends Dexie {
  sections!: EntityTable<Section, 'id'>
  actions!: EntityTable<Action, 'id'>
  days!: EntityTable<Day, 'date'>
  logs!: EntityTable<Log, 'id'>
  settings!: EntityTable<Setting, 'key'>
  measurements!: EntityTable<Measurement, 'id'>

  constructor() {
    super('habitos')
    // Solo se declaran los campos indexados. '&[date+actionId]' = índice único compuesto.
    this.version(1).stores({
      sections: 'id, order',
      actions: 'id, sectionId, order',
      days: 'date',
      logs: 'id, date, actionId, &[date+actionId]',
      settings: 'key',
    })
    // v2: tabla de peso + frase de identidad en las secciones existentes.
    this.version(2)
      .stores({ measurements: 'id, date' })
      .upgrade(async (tx) => {
        await tx.table('sections').toCollection().modify((s: Section) => {
          if (s.identity == null) s.identity = DEFAULT_IDENTITIES[s.name] ?? null
        })
        await tx.table('settings').put({ key: 'schemaVersion', value: 2 })
      })
    // Se ejecuta una sola vez, cuando la base se crea por primera vez.
    this.on('populate', (tx) => seedDefaults(tx))
  }
}

export const db = new HabitosDB()

// Pide al navegador que no borre los datos ante falta de espacio.
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist()
    }
  } catch {
    /* sin soporte: no pasa nada */
  }
}
