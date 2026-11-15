import { Flame } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { bump } from '../lib/motion'

interface Props {
  value: number
  color: string
  size?: 'sm' | 'md'
}

/** Llama + número. Cuando sube, salta y muestra "+1" flotando. */
export function StreakBadge({ value, color, size = 'sm' }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(value)
  const [plus, setPlus] = useState(0)

  useEffect(() => {
    if (value > prev.current) {
      bump(ref.current)
      setPlus((p) => p + 1)
    }
    prev.current = value
  }, [value])

  if (value <= 0) return null
  const icon = size === 'md' ? 18 : 14
  return (
    <span className="relative inline-flex items-center">
      <span
        ref={ref}
        className={`inline-flex items-center gap-0.5 font-bold tabular-nums ${size === 'md' ? 'text-base' : 'text-sm'}`}
        style={{ color }}
      >
        <Flame size={icon} strokeWidth={2.4} fill={color} fillOpacity={0.18} />
        {value}
      </span>
      {plus > 0 && (
        <span key={plus} className="streak-plus" style={{ color }} aria-hidden>
          +1
        </span>
      )}
    </span>
  )
}
