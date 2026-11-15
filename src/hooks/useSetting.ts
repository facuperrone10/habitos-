import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

/** Lee un ajuste de la base de forma reactiva. */
export function useSetting<T>(key: string, fallback: T): T {
  const v = useLiveQuery(() => db.settings.get(key), [key])
  return (v?.value as T) ?? fallback
}

export function setSetting(key: string, value: unknown) {
  return db.settings.put({ key, value })
}
