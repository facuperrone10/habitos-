import { useRef, useState, type PointerEvent } from 'react'
import { formatLong } from '../lib/date'
import { formatIndex, referenceCurves, type IndexPoint } from '../lib/onePercent'

const W = 340
const H = 180
const PAD = { l: 34, r: 56, t: 10, b: 22 }
const GOOD = '#30A46C'
const BAD = '#E5484D'

/**
 * Curva del índice 1% vs. "1% mejor todos los días" y "1% peor todos los días".
 * Una sola escala; etiquetas directas al final de cada línea; tocar/arrastrar muestra el valor del día.
 */
export function IndexChart({ points }: { points: IndexPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  if (points.length < 2) {
    return (
      <section className="rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-black/5">
        <h2 className="text-[15px] font-bold text-neutral-900">Tu curva 1%</h2>
        <p className="mt-1 text-sm text-neutral-500">Aparece a partir del segundo día registrado.</p>
      </section>
    )
  }

  const n = points.length
  const { better, worse } = referenceCurves(n)
  const yMax = Math.max(...better, ...points.map((p) => p.value)) * 1.02
  const yMin = Math.min(...worse, ...points.map((p) => p.value)) * 0.98
  const x = (i: number) => PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r)
  const y = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b)
  const path = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const mine = points.map((p) => p.value)
  const ticks = [yMin, 1, yMax].map((v) => Math.round(v * 100) / 100)

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = svgRef.current!.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, i)))
  }

  const h = hover != null ? points[hover] : null
  const kindLabel: Record<string, string> = {
    good: 'Día bueno · +1%', weak: 'Día flojo · sin cambio', miss: 'Sin registro · sin cambio', miss2: 'Faltaste 2 seguidos · −1%', pending: 'Hoy · en curso',
  }

  return (
    <section className="rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-black/5">
      <h2 className="text-[15px] font-bold text-neutral-900">Tu curva 1%</h2>
      <p className="mb-2 text-xs text-neutral-400">Día bueno (≥ 50% de tus acciones diarias) = +1%. Faltar 2 días seguidos = −1%.</p>
      <div className="mb-1 h-9 text-sm">
        {h ? (
          <>
            <span className="font-bold tabular-nums text-neutral-900">{formatIndex(h.value)}</span>
            <span className="text-neutral-500"> · {formatLong(h.date)}</span>
            <div className="text-xs text-neutral-400">{kindLabel[h.kind]}</div>
          </>
        ) : (
          <span className="text-neutral-400">Tocá la curva para ver cada día.</span>
        )}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`Índice 1% actual ${formatIndex(mine.at(-1)!)} en ${n} días`}
        className="touch-none select-none"
        onPointerDown={onMove}
        onPointerMove={(e) => e.buttons && onMove(e)}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--color-neutral-100)" strokeWidth={1} />
            <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--color-neutral-400)">{t.toFixed(2)}</text>
          </g>
        ))}
        <path d={path(better)} fill="none" stroke={GOOD} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7} />
        <path d={path(worse)} fill="none" stroke={BAD} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7} />
        <path d={path(mine)} fill="none" stroke="var(--ink)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <text x={W - PAD.r + 6} y={y(better.at(-1)!) + 4} fontSize={11} fill="var(--color-neutral-500)">1% mejor</text>
        <text x={W - PAD.r + 6} y={y(worse.at(-1)!) + 4} fontSize={11} fill="var(--color-neutral-500)">1% peor</text>
        <text x={W - PAD.r + 6} y={y(mine.at(-1)!) + 4} fontSize={11} fontWeight={700} fill="var(--ink)">Vos</text>
        <circle cx={x(n - 1)} cy={y(mine.at(-1)!)} r={4} fill="var(--ink)" stroke="var(--surface)" strokeWidth={2} />
        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="var(--color-neutral-300)" strokeWidth={1} />
            <circle cx={x(hover)} cy={y(mine[hover])} r={5} fill="var(--ink)" stroke="var(--surface)" strokeWidth={2} />
          </g>
        )}
        <text x={PAD.l} y={H - 4} fontSize={11} fill="var(--color-neutral-400)">{formatLong(points[0].date)}</text>
        <text x={W - PAD.r} y={H - 4} fontSize={11} textAnchor="end" fill="var(--color-neutral-400)">Hoy</text>
      </svg>
    </section>
  )
}
