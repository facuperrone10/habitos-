import { useEffect, useRef, type CSSProperties } from 'react'
import type { Action, Log } from '../db/types'
import type { SectionWithActions } from '../hooks/useDayData'
import { sectionIcon } from '../lib/icons'
import { bump } from '../lib/motion'
import { ActionChip } from './ActionChip'

interface Props {
  data: SectionWithActions
  logsByAction: Map<string, Log>
  glowing: boolean
  onToggle: (action: Action) => void
  onEditValue: (action: Action) => void
}

export function SectionCard({ data, logsByAction, glowing, onToggle, onEditValue }: Props) {
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
        <h2 className="flex-1 text-[15px] font-semibold tracking-tight text-neutral-800">{section.name}</h2>
        <span
          ref={countRef}
          className="inline-block text-sm font-semibold tabular-nums"
          style={{ color: doneCount ? section.color : '#a3a3a3' }}
        >
          {doneCount}/{actions.length}
        </span>
      </header>
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
              onToggle={onToggle}
              onEditValue={onEditValue}
            />
          )
        })}
      </div>
    </section>
  )
}
