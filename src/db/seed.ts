import type { Transaction } from 'dexie'
import type { Action, Section, Setting } from './types'

interface SeedAction {
  name: string
  unit?: string // si tiene unidad => hasValue = true
  noStreak?: boolean
}

interface SeedSection {
  name: string
  icon: string
  color: string
  actions: SeedAction[]
}

const DEFAULTS: SeedSection[] = [
  {
    name: 'Salud', icon: 'heart', color: '#E5484D',
    actions: [
      { name: 'Dormí 7 h o más' },
      { name: 'Tomé 2 L de agua' },
      { name: 'Comí sano' },
      { name: 'Sin pantallas antes de dormir' },
    ],
  },
  {
    name: 'Deporte', icon: 'dumbbell', color: '#F76B15',
    actions: [
      { name: 'Fui al gym' },
      { name: 'Caminé', unit: 'min' },
      { name: 'Jugué al fútbol', noStreak: true },
      { name: 'Estiramiento/movilidad' },
    ],
  },
  {
    name: 'Estudio', icon: 'graduation', color: '#3E63DD',
    actions: [
      { name: 'Estudié para la facu', unit: 'min' },
      { name: 'Practiqué inglés', unit: 'min' },
      { name: 'Programación/datos', unit: 'min' },
    ],
  },
  {
    name: 'Trabajo', icon: 'briefcase', color: '#12A594',
    actions: [
      { name: 'Cumplí la tarea prioritaria' },
      { name: 'Bloque de foco de 1 h o más' },
      { name: 'Aprendí algo nuevo del rol' },
    ],
  },
  {
    name: 'Lectura', icon: 'book', color: '#8E4EC6',
    actions: [
      { name: 'Leí', unit: 'págs' },
      { name: 'Leí antes de dormir' },
      { name: 'Leí sobre economía/mercados', noStreak: true },
    ],
  },
  {
    name: 'Finanzas familiares', icon: 'wallet', color: '#30A46C',
    actions: [
      { name: 'Registré gastos' },
      { name: 'Sin compras impulsivas' },
      { name: 'Revisé el presupuesto', noStreak: true },
      { name: 'Aparté ahorro', unit: '$', noStreak: true },
    ],
  },
]

export async function seedDefaults(tx: Transaction) {
  const now = new Date().toISOString()
  const sections: Section[] = []
  const actions: Action[] = []

  DEFAULTS.forEach((s, si) => {
    const sectionId = crypto.randomUUID()
    sections.push({
      id: sectionId, name: s.name, icon: s.icon, color: s.color,
      order: si, hidden: false, createdAt: now, archivedAt: null,
    })
    s.actions.forEach((a, ai) => {
      actions.push({
        id: crypto.randomUUID(), sectionId, name: a.name, order: ai,
        hasValue: Boolean(a.unit), unit: a.unit ?? null,
        trackStreak: !a.noStreak, createdAt: now, archivedAt: null,
      })
    })
  })

  const settings: Setting[] = [
    { key: 'schemaVersion', value: 1 },
    { key: 'weekStartsOn', value: 1 },
    { key: 'soundEnabled', value: false },
    { key: 'backupReminderEnabled', value: true },
    { key: 'lastBackupAt', value: null },
  ]

  await tx.table('sections').bulkAdd(sections)
  await tx.table('actions').bulkAdd(actions)
  await tx.table('settings').bulkAdd(settings)
}
