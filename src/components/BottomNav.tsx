import { CalendarDays, ChartColumn, CircleCheckBig, Settings, type LucideIcon } from 'lucide-react'

export type Tab = 'hoy' | 'calendario' | 'stats' | 'ajustes'

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'hoy', label: 'Hoy', Icon: CircleCheckBig },
  { id: 'calendario', label: 'Calendario', Icon: CalendarDays },
  { id: 'stats', label: 'Stats', Icon: ChartColumn },
  { id: 'ajustes', label: 'Ajustes', Icon: Settings },
]

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-black/5 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex max-w-md">
        {TABS.map(({ id, label, Icon }) => {
          const active = id === tab
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 pt-2.5 pb-2 text-[11px] font-semibold ${active ? 'text-neutral-900' : 'text-neutral-400'}`}
            >
              <Icon size={24} strokeWidth={active ? 2.4 : 1.9} />
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
