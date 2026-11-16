import { Pencil } from 'lucide-react'
import { useEffect, useRef, type CSSProperties } from 'react'
import type { Action, Log } from '../db/types'
import type { SectionWithActions } from '../hooks/useDayData'
import { sectionIcon } from '../lib/icons'
import { bump } from '../lib/motion'
import { ActionChip } from './ActionChip'
import { StreakBadge } from './StreakBadge'
import { VotesCount } from './VotesCount'

interface Props {
  data: SectionWithActions
  logsByAction: Map<string, Log>
  glowing: boolean
  sectionStreak: number
  votes: number
  actionStreak: (actionId: string) => number
  onToggle: (action: Action) => void
  onEditValue: (action: Action) => void
  onEditSection: () => void
}

export function SectionCard({ data, logsByAction, glowing, sectionStreak, votes, actionStreak, onToggle, onEditValue, onEditSection }: Props) {
  const { section, actions } = data
  const Icon = sectionIcon(section.icon)
  const doneCount = actions.filter((a) => logsByAction.has(a.id)).length

  // "Bump" del contador solo cuando sube.
  const countRef = useRef<HTMLSpanElement>(null)
  const prev = useRef(doneCount)
  useEffect(() => {
    if (doneCount > prev.current) bump(countRef.current)
    prev.current = doneCount
  }, [doneCount])

  return (
    <section
      className={`section-card ${glowing ? 'section-card--glow' : ''}`}
      style={{ '--c': section.color } as CSSProperties}
    >
      <header className="mb-3 flex items-center gap-2">
        <span className="section-icon">
          <Icon size={16} strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] leading-tight font-semibold tracking-tight text-neutral-800">{section.name}</h2>
          <div className="truncate text-xs text-neutral-400">
            <VotesCount value={votes} color={section.color} />
            {section.identity ? ` · ${section.identity}` : ''}
          </div>
        </div>
        <StreakBadge value={sectionStreak} color={section.color} />
        <span
          ref={countRef}
          className="ml-2 inline-block text-sm font-semibold tabular-nums"
          style={{ color: doneCount ? section.color : 'var(--color-neutral-400)' }}
        >
          {doneCount}/{actions.length}
        </span>
        <button
          type="button"
          aria-label={`Editar ${section.name}`}
          onClick={onEditSection}
          className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 active:bg-neutral-100"
        >
          <Pencil size={16} />
        </button>
      </header>
      {actions.length === 0 && (
        <button type="button" onClick={onEditSection} className="text-sm text-neutral-400">
          Sin acciones visibles · tocá el lápiz para agregar
        </button>
      )}
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => {
          const log = logsByAction.get(a.id)
          return (
            <ActionChip
              key={a.id}
              action={a}
              color={section.color}
              done={Boolean(log)}
              value={log?.value ?? null}
              streak={actionStreak(a.id)}
              onToggle={onToggle}
              onEditValue={onEditValue}
            />
          )
        })}
      </div>
    </section>
  )
}
