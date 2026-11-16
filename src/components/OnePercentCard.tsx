import { TrendingUp } from 'lucide-react'
import type { IndexPoint } from '../lib/onePercent'
import { formatIndex, todayDelta } from '../lib/onePercent'

/** Tarjeta compacta en "Hoy": índice 1% + mini curva de los últimos 30 días. Tocarla abre Stats. */
export function OnePercentCard({ points, onOpen }: { points: IndexPoint[]; onOpen: () => void }) {
  if (!points.length) return null
  const last = points.at(-1)!
  const delta = todayDelta(points)
  const tail = points.slice(-30).map((p) => p.value)
  const min = Math.min(...tail, 1)
  const max = Math.max(...tail, 1.01)
  const W = 110
  const H = 34
  const xy = tail.map((v, i) => [tail.length === 1 ? W : (i / (tail.length - 1)) * W, H - ((v - min) / (max - min)) * (H - 4) - 2])
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const status = last.kind === 'good' ? '+1% hoy' : last.kind === 'pending' ? 'Hoy suma con el 50%' : ''

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-left shadow-sm ring-1 ring-black/5"
    >
      <div className="flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Índice 1%</div>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-[28px] leading-tight font-semibold tabular-nums text-neutral-900">{formatIndex(last.value)}</span>
          <span className={`text-xs font-semibold ${delta > 0 ? 'text-emerald-700' : 'text-neutral-400'}`}>
            {delta > 0 && <TrendingUp size={12} className="mr-0.5 inline" />}
            {status}
          </span>
        </div>
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden className="shrink-0 overflow-visible">
        <path d={d} fill="none" stroke="#30A46C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={xy.at(-1)![0]} cy={xy.at(-1)![1]} r={3.5} fill="#30A46C" />
      </svg>
    </button>
  )
}
