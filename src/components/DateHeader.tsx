import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, formatLong, relativeLabel } from '../lib/date'
import { StreakBadge } from './StreakBadge'

interface Props {
  date: string
  today: string
  onChange: (date: string) => void
  streak: number
}

export function DateHeader({ date, today, onChange, streak }: Props) {
  const rel = relativeLabel(date, today)
  const isToday = date === today

  return (
    <div className="flex items-center justify-between">
      <button type="button" aria-label="Día anterior" className="nav-btn" onClick={() => onChange(addDays(date, -1))}>
        <ChevronLeft size={22} />
      </button>

      {/* El input de fecha transparente encima abre el selector nativo de iOS. */}
      <div className="relative text-center">
        <div className="flex h-5 items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {rel && <span>{rel}</span>}
          <StreakBadge key={date} value={streak} color="#F76B15" />
        </div>
        <div className="text-lg font-bold tracking-tight text-neutral-900">{formatLong(date)}</div>
        <input
          type="date"
          aria-label="Elegir fecha"
          className="absolute inset-0 opacity-0"
          value={date}
          max={today}
          onChange={(e) => e.target.value && onChange(e.target.value > today ? today : e.target.value)}
        />
      </div>

      <button
        type="button"
        aria-label="Día siguiente"
        className="nav-btn disabled:opacity-25"
        disabled={isToday}
        onClick={() => onChange(addDays(date, 1))}
      >
        <ChevronRight size={22} />
      </button>
    </div>
  )
}
