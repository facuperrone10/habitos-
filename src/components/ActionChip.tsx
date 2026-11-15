import { Flame } from 'lucide-react'
import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { Action } from '../db/types'
import { pop, prefersReducedMotion } from '../lib/motion'

interface Props {
  action: Action
  color: string
  done: boolean
  value: number | null
  streak: number
  onToggle: (action: Action) => void
  onEditValue: (action: Action) => void
}

const PARTICLES = 8

/**
 * Chip de acción. Es un <label> que envuelve un <input type="checkbox" switch> oculto:
 * el tap real del usuario activa ese interruptor nativo y iOS dispara la vibración
 * (Taptic Engine). Si Safari deja de hacerlo, todo lo visual sigue funcionando.
 */
export function ActionChip({ action, color, done, value, streak, onToggle, onEditValue }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [burst, setBurst] = useState(0)

  // Guarda el punto de toque para que el relleno "nazca" desde el dedo.
  const setOrigin = (e: PointerEvent<HTMLLabelElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`)
  }

  const handleChange = () => {
    if (!done) {
      pop(wrapRef.current)
      if (!prefersReducedMotion()) setBurst((b) => b + 1)
    }
    onToggle(action)
  }

  const showValue = done && action.hasValue

  return (
    <div ref={wrapRef} className="chip-wrap" data-done={done} style={{ '--c': color } as CSSProperties}>
      <label className={`chip ${showValue ? 'chip--with-value' : ''}`} onPointerDown={setOrigin}>
        <input
          type="checkbox"
          className="haptic-switch"
          checked={done}
          onChange={handleChange}
          aria-label={action.name}
          {...{ switch: '' }}
        />
        <span className="chip-fill" aria-hidden />
        <span className="chip-content">
          <svg className="chip-check" viewBox="0 0 24 24" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} />
          </svg>
          <span>{action.name}</span>
          {action.trackStreak && streak >= 3 && (
            <span className="chip-streak" aria-label={`Racha de ${streak} días`}>
              <Flame size={12} strokeWidth={2.6} />
              {streak}
            </span>
          )}
        </span>
        {burst > 0 && (
          <span key={burst} className="chip-burst" aria-hidden>
            {Array.from({ length: PARTICLES }, (_, i) => (
              <i key={i} style={{ '--a': `${(360 / PARTICLES) * i + 20}deg` } as CSSProperties} />
            ))}
          </span>
        )}
      </label>
      {showValue && (
        <button type="button" className="chip-value" onClick={() => onEditValue(action)}>
          {value != null ? `${formatValue(value)} ${action.unit ?? ''}` : `+ ${action.unit ?? ''}`}
        </button>
      )}
    </div>
  )
}

function formatValue(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toLocaleString('es-UY', { maximumFractionDigits: 2 })
}
