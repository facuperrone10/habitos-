// Respaldo: exportar / importar. Formato JSON versionado (restaurable) y CSV (para Excel).
import { db, SCHEMA_VERSION } from '../db/db'
import type { Action, Day, Log, Section, Setting } from '../db/types'
import { todayKey } from './date'

export interface BackupFile {
  app: 'habitos'
  schemaVersion: number
  exportedAt: string
  sections: Section[]
  actions: Action[]
  days: Day[]
  logs: Log[]
  settings: Setting[]
}

async function collect(): Promise<BackupFile> {
  const [sections, actions, days, logs, settings] = await Promise.all([
    db.sections.toArray(), db.actions.toArray(), db.days.toArray(), db.logs.toArray(), db.settings.toArray(),
  ])
  return { app: 'habitos', schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), sections, actions, days, logs, settings }
}

/**
 * Entrega un archivo al usuario. En iPhone abre el menú Compartir
 * (Guardar en Archivos, iCloud, WhatsApp, Mail...). Si no se puede, lo descarga.
 * Devuelve false si el usuario canceló.
 */
async function deliver(file: File): Promise<boolean> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name })
      return true
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return false
      // otro error: probamos con descarga
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  return true
}

async function markBackup() {
  await db.settings.put({ key: 'lastBackupAt', value: new Date().toISOString() })
}

export async function exportJSON(): Promise<boolean> {
  const data = await collect()
  const file = new File([JSON.stringify(data, null, 2)], `habitos-respaldo-${todayKey()}.json`, { type: 'application/json' })
  const ok = await deliver(file)
  if (ok) await markBackup()
  return ok
}

/** CSV: una fila por acción registrada, con el ánimo y la nota del día. Separador ';' (Excel en español). */
export async function exportCSV(): Promise<boolean> {
  const data = await collect()
  const sectionById = new Map(data.sections.map((s) => [s.id, s]))
  const actionById = new Map(data.actions.map((a) => [a.id, a]))
  const dayByDate = new Map(data.days.map((d) => [d.date, d]))
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const rows = [['fecha', 'seccion', 'accion', 'valor', 'unidad', 'animo_del_dia', 'nota_del_dia']]
  const logs = [...data.logs].sort((a, b) => a.date.localeCompare(b.date))
  for (const l of logs) {
    const a = actionById.get(l.actionId)
    const s = a ? sectionById.get(a.sectionId) : undefined
    const d = dayByDate.get(l.date)
    rows.push([
      l.date, s?.name ?? '', a?.name ?? '',
      l.value == null ? '' : String(l.value).replace('.', ','), // coma decimal
      a?.unit ?? '', d?.mood ?? '', d?.note ?? '',
    ].map(String))
  }
  const csv = '﻿' + rows.map((r) => r.map(esc).join(';')).join('\r\n') // BOM: Excel lee bien los acentos
  const ok = await deliver(new File([csv], `habitos-registros-${todayKey()}.csv`, { type: 'text/csv' }))
  return ok
}

export interface ImportSummary {
  file: BackupFile
  logs: number
  days: number
  from: string | null
  to: string | null
}

/** Lee y valida un archivo de respaldo (no toca la base todavía). */
export async function readBackup(f: File): Promise<ImportSummary> {
  let data: BackupFile
  try {
    data = JSON.parse(await f.text())
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }
  if (data?.app !== 'habitos' || !Array.isArray(data.sections) || !Array.isArray(data.logs)) {
    throw new Error('El archivo no es un respaldo de esta app.')
  }
  if (data.schemaVersion > SCHEMA_VERSION) {
    throw new Error('El respaldo es de una versión más nueva de la app. Actualizá la app y probá de nuevo.')
  }
  const dates = data.logs.map((l) => l.date).sort()
  return { file: data, logs: data.logs.length, days: new Set(dates).size, from: dates[0] ?? null, to: dates.at(-1) ?? null }
}

/** Reemplaza TODOS los datos por los del respaldo, en una sola transacción (todo o nada). */
export async function restoreBackup(data: BackupFile) {
  await db.transaction('rw', [db.sections, db.actions, db.days, db.logs, db.settings], async () => {
    await Promise.all([db.sections.clear(), db.actions.clear(), db.days.clear(), db.logs.clear(), db.settings.clear()])
    await db.sections.bulkAdd(data.sections)
    await db.actions.bulkAdd(data.actions ?? [])
    await db.days.bulkAdd(data.days ?? [])
    await db.logs.bulkAdd(data.logs)
    await db.settings.bulkAdd(data.settings ?? [])
    await db.settings.put({ key: 'lastBackupAt', value: new Date().toISOString() })
  })
}
