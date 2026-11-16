import { BookOpen, ChevronDown, Lightbulb, Play } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import type { Action } from '../db/types'
import { STUDY_TIPS, TECHNIQUES, type TechniqueId } from '../lib/focus'

interface Props {
  action: Action
  color: string
  sectionName: string
  onStart: (techniqueId: TechniqueId) => void
  onClose: () => void
}

/** Elegir técnica para medir minutos de una acción. */
export function FocusPicker({ action, color, sectionName, onStart, onClose }: Props) {
  const [selected, setSelected] = useState<TechniqueId>('pomodoro')
  const [tipsOpen, setTipsOpen] = useState(false)
  const lower = sectionName.toLowerCase()
  // Primero las técnicas que corresponden a la sección.
  const tips = [...STUDY_TIPS].sort((a, b) => Number(lower.includes(b.for)) - Number(lower.includes(a.for)))

  return (
    <div className="fixed inset-0 z-40 flex items-end" role="dialog" aria-modal>
      <button type="button" aria-label="Cerrar" className="sheet-backdrop absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="sheet relative flex max-h-[90vh] w-full flex-col rounded-t-3xl bg-page shadow-2xl" style={{ '--c': color } as CSSProperties}>
        <div className="mx-auto mt-3 mb-2 h-1.5 w-10 rounded-full bg-neutral-200" />
        <div className="px-5 pb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Medir minutos</div>
          <h2 className="text-xl font-bold text-neutral-900">{action.name}</h2>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
          {TECHNIQUES.map((t) => {
            const on = t.id === selected
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                onClick={() => setSelected(t.id)}
                className="w-full rounded-2xl bg-surface px-4 py-3 text-left ring-1 transition-shadow"
                style={{ boxShadow: on ? `inset 0 0 0 2px ${color}` : undefined, ['--tw-ring-color' as string]: 'rgb(0 0 0 / 0.05)' }}
              >
                <div className="text-[15px] font-semibold text-neutral-900">{t.name}</div>
                <div className="text-xs text-neutral-500">{t.short}</div>
              </button>
            )
          })}

          <button
            type="button"
            onClick={() => setTipsOpen((o) => !o)}
            className="mt-2 flex w-full items-center gap-2 rounded-2xl px-2 py-2 text-left text-sm font-semibold text-neutral-600"
          >
            <Lightbulb size={17} style={{ color }} />
            <span className="flex-1">Técnicas de estudio y lectura</span>
            <ChevronDown size={17} className={`transition-transform ${tipsOpen ? 'rotate-180' : ''}`} />
          </button>
          {tipsOpen && (
            <div className="space-y-2">
              {tips.map((tip) => (
                <div key={tip.title} className="rounded-2xl bg-surface px-4 py-3 ring-1 ring-black/5">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
                    {tip.for === 'lectura' ? <BookOpen size={14} className="text-neutral-400" /> : <Lightbulb size={14} className="text-neutral-400" />}
                    {tip.title}
                    <span className="text-xs font-normal text-neutral-400">· {tip.for}</span>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-neutral-600">{tip.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-black/5 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)]">
          <button
            type="button"
            onClick={() => onStart(selected)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white"
            style={{ background: color }}
          >
            <Play size={18} fill="white" /> Empezar
          </button>
        </div>
      </div>
    </div>
  )
}
