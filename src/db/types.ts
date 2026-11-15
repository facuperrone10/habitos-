// Tipos del modelo de datos (congelado en la fase 1).

export interface Section {
  id: string
  name: string
  icon: string // clave del registro de íconos (src/lib/icons.ts)
  color: string // hex
  order: number
  hidden: boolean
  createdAt: string
  archivedAt: string | null
}

export interface Action {
  id: string
  sectionId: string
  name: string
  order: number
  hasValue: boolean
  unit: string | null
  trackStreak: boolean
  createdAt: string
  archivedAt: string | null
}

export type Mood = 1 | 2 | 3 | 4 | 5

export interface Day {
  date: string // 'YYYY-MM-DD' local
  mood: Mood | null
  note: string | null
  celebratedAt: string | null
  updatedAt: string
}

export interface Log {
  id: string
  date: string // 'YYYY-MM-DD' local
  actionId: string
  value: number | null
  createdAt: string
}

export interface Setting {
  key: string
  value: unknown
}
