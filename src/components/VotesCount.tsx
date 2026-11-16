import { useEffect, useRef, useState } from 'react'
import { bump } from '../lib/motion'

/** "31 votos" — al sumar un voto, salta y muestra "+1 voto". */
export function VotesCount({ value, color }: { value: number; color: string }) {
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

  return (
    <span className="relative inline-flex">
      <span ref={ref} className="inline-block tabular-nums">{value} {value === 1 ? 'voto' : 'votos'}</span>
      {plus > 0 && (
        <span key={plus} className="streak-plus whitespace-nowrap" style={{ color }} aria-hidden>
          +1 voto
        </span>
      )}
    </span>
  )
}
