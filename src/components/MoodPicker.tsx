import { Angry, Frown, Laugh, Meh, Smile, type LucideIcon } from 'lucide-react'
import type { Mood } from '../db/types'
import { pop } from '../lib/motion'

const MOODS: { value: Mood; Icon: LucideIcon; color: string; label: string }[] = [
  { value: 1, Icon: Angry, color: '#E5484D', label: 'Muy mal' },
  { value: 2, Icon: Frown, color: '#F76B15', label: 'Mal' },
  { value: 3, Icon: Meh, color: '#A1A1AA', label: 'Normal' },
  { value: 4, Icon: Smile, color: '#46A758', label: 'Bien' },
  { value: 5, Icon: Laugh, color: '#30A46C', label: 'Muy bien' },
]

interface Props {
  mood: Mood | null
  onChange: (mood: Mood | null) => void
}

export function MoodPicker({ mood, onChange }: Props) {
  return (
    <div className="flex justify-between rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-black/5">
      {MOODS.map(({ value, Icon, color, label }) => {
        const active = mood === value
        return (
          <button
            key={value}
            type="button"
            aria-label={label}
            aria-pressed={active}
            onClick={(e) => {
              if (!active) pop(e.currentTarget)
              onChange(active ? null : value) // tocar de nuevo = quitar
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-200"
            style={{ background: active ? `${color}22` : 'transparent', color: active ? color : '#c4c4c4' }}
          >
            <Icon size={30} strokeWidth={active ? 2.3 : 1.8} />
          </button>
        )
      })}
    </div>
  )
}
