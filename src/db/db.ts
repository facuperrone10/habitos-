import Dexie, { type EntityTable } from 'dexie'
import type { Action, Day, Log, Section, Setting } from './types'
import { seedDefaults } from './seed'

export const SCHEMA_VERSION = 1

class HabitosDB extends Dexie {
  sections!: EntityTable<Section, 'id'>
  actions!: EntityTable<Action, 'id'>
  days!: EntityTable<Day, 'date'>
  logs!: EntityTable<Log, 'id'>
  settings!: EntityTable<Setting, 'key'>

  constructor() {
    super('habitos')
    // Solo se declaran los campos indexados. '&[date+actionId]' = índice único compuesto.
    this.version(SCHEMA_VERSION).stores({
      sections: 'id, order',
      actions: 'id, sectionId, order',
      days: 'date',
      logs: 'id, date, actionId, &[date+actionId]',
      settings: 'key',
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
