import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus } from 'lucide-react'
import { useState, type CSSProperties, type ReactNode } from 'react'
import { db } from '../db/db'
import { addAction, moveAction, setActionHidden, updateAction } from '../db/repo'
import type { Action, Section } from '../db/types'
import { sectionIcon } from '../lib/icons'

interface Props {
  section: Section
  onClose: () => void
}

/** Hoja para elegir qué acciones aparecen en una sección y cómo se comportan. */
export function EditSectionSheet({ section, onClose }: Props) {
  const all = useLiveQuery(
    () => db.actions.where('sectionId').equals(section.id).sortBy('order'),
    [section.id],
  )
  const [newName, setNewName] = useState('')
  const Icon = sectionIcon(section.icon)

  const visible = all?.filter((a) => !a.archivedAt) ?? []
  const hidden = all?.filter((a) => a.archivedAt) ?? []

  const submitNew = async () => {
    await addAction(section.id, newName)
    setNewName('')
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end" role="dialog" aria-modal>
      <button type="button" aria-label="Cerrar" className="sheet-backdrop absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="sheet relative flex max-h-[88vh] w-full flex-col rounded-t-3xl bg-[#f6f6f4] shadow-2xl"
        style={{ '--c': section.color } as CSSProperties}
      >
        <header className="flex items-center gap-2 px-5 pt-4 pb-3">
          <span className="section-icon"><Icon size={16} strokeWidth={2.4} /></span>
          <h2 className="flex-1 text-lg font-bold text-neutral-900">{section.name}</h2>
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-[15px] font-semibold text-white" style={{ background: section.color }}>
            Listo
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+20px)]">
          <div className="space-y-2">
            {visible.map((a, i) => (
              <ActionRow
                key={a.id}
                action={a}
                isFirst={i === 0}
                isLast={i === visible.length - 1}
                onMove={(dir) => moveAction(section.id, a.id, dir)}
              />
            ))}
            {visible.length === 0 && (
              <p className="px-1 py-2 text-sm text-neutral-400">No hay acciones visibles en esta sección.</p>
            )}
          </div>

          <form
            className="flex items-center gap-2 rounded-2xl bg-white p-2 pl-4 ring-1 ring-black/5"
            onSubmit={(e) => { e.preventDefault(); submitNew() }}
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nueva acción…"
              enterKeyHint="done"
              maxLength={40}
              className="min-w-0 flex-1 bg-transparent text-base text-neutral-800 outline-none placeholder:text-neutral-400"
            />
            <button type="submit" disabled={!newName.trim()} aria-label="Agregar"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white disabled:opacity-30"
              style={{ background: section.color }}>
              <Plus size={20} />
            </button>
          </form>

          {hidden.length > 0 && (
            <div className="pt-2">
              <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Ocultas ({hidden.length})
              </div>
              <div className="space-y-2">
                {hidden.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-white/60 py-2 pr-2 pl-4 ring-1 ring-black/5">
                    <span className="flex-1 text-[15px] text-neutral-400">{a.name}</span>
                    <button type="button" onClick={() => setActionHidden(a.id, false)}
                      className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-semibold ring-1 ring-black/10"
                      style={{ color: section.color }}>
                      <Eye size={16} /> Mostrar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="px-1 pt-1 text-xs leading-relaxed text-neutral-400">
            Ocultar una acción no borra su historial: vuelve con "Mostrar".
            "Racha" apagado = acción no diaria (no cuenta para rachas ni para "sección completa").
          </p>
        </div>
      </div>
    </div>
  )
}

function ActionRow({ action, isFirst, isLast, onMove }: {
  action: Action
  isFirst: boolean
  isLast: boolean
  onMove: (dir: -1 | 1) => void
}) {
  const [name, setName] = useState(action.name)
  const [unit, setUnit] = useState(action.unit ?? 'min')

  const saveName = () => {
    const clean = name.trim()
    if (clean && clean !== action.name) updateAction(action.id, { name: clean })
    else setName(action.name)
  }

  const toggleValue = () =>
    updateAction(action.id, action.hasValue
      ? { hasValue: false, unit: null }
      : { hasValue: true, unit: unit.trim() || 'min' })

  return (
    <div className="rounded-2xl bg-white p-2 pl-3 ring-1 ring-black/5">
      <div className="flex items-center gap-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          enterKeyHint="done"
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          maxLength={40}
          aria-label="Nombre de la acción"
          className="min-w-0 flex-1 bg-transparent py-1.5 text-base font-semibold text-neutral-800 outline-none"
        />
        <IconBtn label="Subir" disabled={isFirst} onClick={() => onMove(-1)}><ArrowUp size={18} /></IconBtn>
        <IconBtn label="Bajar" disabled={isLast} onClick={() => onMove(1)}><ArrowDown size={18} /></IconBtn>
        <IconBtn label="Ocultar" onClick={() => setActionHidden(action.id, true)}><EyeOff size={18} /></IconBtn>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <Toggle on={action.hasValue} onClick={toggleValue}>Valor #</Toggle>
        {action.hasValue && (
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            onBlur={() => updateAction(action.id, { unit: unit.trim() || 'min' })}
            maxLength={8}
            aria-label="Unidad"
            placeholder="unidad"
            className="w-20 rounded-full bg-neutral-100 px-3 py-1.5 text-base text-neutral-700 outline-none"
          />
        )}
        <Toggle on={action.trackStreak} onClick={() => updateAction(action.id, { trackStreak: !action.trackStreak })}>
          Racha
        </Toggle>
      </div>
    </div>
  )
}

function IconBtn({ label, disabled, onClick, children }: {
  label: string; disabled?: boolean; onClick: () => void; children: ReactNode
}) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 active:bg-neutral-100 disabled:opacity-25">
      {children}
    </button>
  )
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className="rounded-full px-3 py-1.5 text-sm font-semibold transition-colors"
      style={on
        ? { background: 'var(--c)', color: 'white' }
        : { background: '#f1f1f0', color: '#8a8a8a' }}>
      {children}
    </button>
  )
}
