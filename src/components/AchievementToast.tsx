import { Medal } from 'lucide-react'
import { useEffect } from 'react'
import { TIER_COLORS, TIER_NAMES, formatAmount } from '../lib/achievements'

export interface UnlockEvent {
  key: string
  title: string
  unit: string
  threshold: number
  tier: 0 | 1 | 2 | 3 | 4
}

/** Festejo de logro: tarjeta arriba + confeti (lo dispara App). Se cierra sola o al tocarla. */
export function AchievementToast({ event, onDone, onOpen }: { event: UnlockEvent | null; onDone: () => void; onOpen: () => void }) {
  useEffect(() => {
    if (!event) return
    const t = window.setTimeout(onDone, 4000)
    return () => window.clearTimeout(t)
  }, [event, onDone])
  if (!event) return null
  const color = TIER_COLORS[event.tier]
  return (
    <div className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+10px)] z-50 flex justify-center">
      <button
        key={event.key}
        type="button"
        onClick={() => { onOpen(); onDone() }}
        className="achievement-in flex w-full max-w-md items-center gap-3 rounded-3xl p-3 pr-4 text-left shadow-2xl"
        style={{ background: '#1f2328', color: '#fff' }}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: color }}>
          <Medal size={26} />
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color }}>Logro {TIER_NAMES[event.tier]}</span>
          <span className="block truncate text-[15px] font-bold">{formatAmount(event.threshold, event.unit)} · {event.title}</span>
        </span>
      </button>
    </div>
  )
}
