import { useRef, useState, type PointerEvent } from 'react'
import { formatLong } from '../lib/date'

interface Props {
  points: { date: string; value: number }[]
  color: string
  format: (v: number) => string
  /** Banda de referencia opcional (ej. IMC normal 18,5–25). */
  band?: { from: number; to: number; label: string }
  ariaLabel: string
}

const W = 340
const H = 160
const PAD = { l: 38, r: 12, t: 10, b: 22 }

/** Gráfico de línea simple de una serie, con tocar/arrastrar para ver cada punto. */
export function LineChart({ points, color, format, band, ariaLabel }: Props) {
  const ref = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const n = points.length
  const vals = points.map((p) => p.value)
  let lo = Math.min(...vals, ...(band ? [band.from] : []))
  let hi = Math.max(...vals, ...(band ? [band.to] : []))
  if (hi - lo < 1) { hi += 0.5; lo -= 0.5 }
  const span = hi - lo
  lo -= span * 0.1
  hi += span * 0.1
  const x = (i: number) => (n === 1 ? (PAD.l + W - PAD.r) / 2 : PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r))
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b)
  const d = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const ticks = [lo + (hi - lo) * 0.1, (lo + hi) / 2, hi - (hi - lo) * 0.1]

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = ref.current!.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const i = n === 1 ? 0 : Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, i)))
  }
  const h = hover != null ? points[hover] : points.at(-1)!

  return (
    <div>
      <div className="mb-1 text-sm">
        <span className="font-bold tabular-nums text-neutral-900">{format(h.value)}</span>
        <span className="text-neutral-500"> · {formatLong(h.date)}</span>
      </div>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={ariaLabel}
        className="touch-none select-none"
        onPointerDown={onMove}
        onPointerMove={(e) => e.buttons && onMove(e)}
        onPointerLeave={() => setHover(null)}
      >
        {band && (
          <g>
            <rect x={PAD.l} width={W - PAD.l - PAD.r} y={y(band.to)} height={Math.max(0, y(band.from) - y(band.to))} fill="#30A46C" opacity={0.1} />
            <text x={W - PAD.r - 4} y={y(band.to) + 13} textAnchor="end" fontSize={11} fill="var(--color-neutral-500)">{band.label}</text>
          </g>
        )}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--color-neutral-100)" />
            <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--color-neutral-400)">{t.toFixed(1)}</text>
          </g>
        ))}
        {n > 1 && <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
        {points.map((p, i) => (
          <circle key={p.date} cx={x(i)} cy={y(p.value)} r={hover === i ? 5.5 : 3.5} fill={color} stroke="var(--surface)" strokeWidth={2} />
        ))}
        {n > 0 && (
          <>
            <text x={PAD.l} y={H - 4} fontSize={11} fill="var(--color-neutral-400)">{formatLong(points[0].date)}</text>
            {n > 1 && <text x={W - PAD.r} y={H - 4} textAnchor="end" fontSize={11} fill="var(--color-neutral-400)">{formatLong(points.at(-1)!.date)}</text>}
          </>
        )}
      </svg>
    </div>
  )
}
