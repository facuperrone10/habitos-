import { useEffect, useRef, useState } from 'react'
import { db } from '../db/db'
import type { UnlockEvent } from '../components/AchievementToast'
import type { AchievementFamily } from '../lib/achievements'
import { unlockedIds } from '../lib/achievements'
import { celebrateDay } from '../lib/confetti'

const KEY = 'seenAchievements'

/**
 * Compara los logros desbloqueados con los ya "vistos".
 * La primera vez (o tras importar un respaldo sin esa info) los marca vistos sin festejar.
 */
export function useAchievementWatcher(families: AchievementFamily[] | undefined) {
  const [queue, setQueue] = useState<UnlockEvent[]>([])
  // Las verificaciones se encadenan para que dos cambios rápidos no festejen dos veces.
  const chain = useRef(Promise.resolve())

  useEffect(() => {
    if (!families) return
    chain.current = chain.current.then(async () => {
      const ids = unlockedIds(families)
      const stored = await db.settings.get(KEY)
      if (!stored) {
        await db.settings.put({ key: KEY, value: ids })
        return
      }
      const seen = new Set(stored.value as string[])
      const fresh = ids.filter((id) => !seen.has(id))
      if (!fresh.length) return
      await db.settings.put({ key: KEY, value: [...seen, ...fresh] })
      const events: UnlockEvent[] = []
      for (const f of families) {
        for (const l of f.levels) {
          if (fresh.includes(l.id)) events.push({ key: l.id, title: f.title, unit: f.unit, threshold: l.threshold, tier: l.tier })
        }
      }
      celebrateDay(['#D4A017', '#B0703C', '#9BA3AE', '#7C8CF8'])
      setQueue((q) => [...q, ...events])
    }).catch(() => {})
  }, [families])

  const current = queue[0] ?? null
  const next = () => setQueue((q) => q.slice(1))
  return { current, next }
}
