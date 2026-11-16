import type { AllData } from '../hooks/useAllData'
import type { AchievementFamily } from '../lib/achievements'
import type { IndexPoint } from '../lib/onePercent'
import { AchievementsView } from './AchievementsView'
import { BodyView } from './BodyView'
import { ProgressView } from './ProgressView'

export type StatsView = 'progreso' | 'cuerpo' | 'logros'

const VIEWS: { id: StatsView; label: string }[] = [
  { id: 'progreso', label: 'Progreso' },
  { id: 'cuerpo', label: 'Cuerpo' },
  { id: 'logros', label: 'Logros' },
]

interface Props {
  view: StatsView
  setView: (v: StatsView) => void
  data: AllData
  indexPoints: IndexPoint[]
  achievements: AchievementFamily[]
}

export function StatsScreen({ view, setView, data, indexPoints, achievements }: Props) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Estadísticas</h1>
      <div className="flex rounded-xl bg-neutral-200/70 p-1" role="tablist">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            onClick={() => setView(v.id)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${view === v.id ? 'bg-surface text-neutral-900 shadow-sm' : 'text-neutral-500'}`}
          >
            {v.label}
          </button>
        ))}
      </div>
      {view === 'progreso' && <ProgressView indexPoints={indexPoints} />}
      {view === 'cuerpo' && <BodyView measurements={data.measurements} />}
      {view === 'logros' && <AchievementsView families={achievements} sections={data.sections} />}
    </div>
  )
}
