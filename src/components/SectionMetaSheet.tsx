import { useLiveQuery } from 'dexie-react-hooks'
import { Check, ListChecks } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { db } from '../db/db'
import { updateSection } from '../db/repo'
import { SECTION_COLORS, SECTION_ICONS, sectionIcon } from '../lib/icons'

interface Props {
  sectionId: string
  onClose: () => void
  onEditActions: () => void
}

/** Editar nombre, color, ícono y visibilidad de una sección. Todo se guarda al instante. */
export function SectionMetaSheet({ sectionId, onClose, onEditActions }: Props) {
  const section = useLiveQuery(() => db.sections.get(sectionId), [sectionId])
  const [name, setName] = useState<string | null>(null)

  if (!section) return null
  const Icon = sectionIcon(section.icon)
  const shownName = name ?? section.name

  const saveName = () => {
    const clean = (name ?? '').trim()
    if (clean && clean !== section.name) updateSection(section.id, { name: clean })
    setName(null)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end" role="dialog" aria-modal>
      <button type="button" aria-label="Cerrar" className="sheet-backdrop absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="sheet relative flex max-h-[90vh] w-full flex-col rounded-t-3xl bg-page shadow-2xl"
        style={{ '--c': section.color } as CSSProperties}
      >
        <header className="flex items-center gap-3 px-5 pt-4 pb-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: section.color }}>
            <Icon size={22} strokeWidth={2.2} />
          </span>
          <input
            value={shownName}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            enterKeyHint="done"
            maxLength={30}
            aria-label="Nombre de la sección"
            className="min-w-0 flex-1 bg-transparent text-xl font-bold text-neutral-900 outline-none"
          />
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-[15px] font-semibold text-white" style={{ background: section.color }}>
            Listo
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2.5">
              {SECTION_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  aria-pressed={section.color === c}
                  onClick={() => updateSection(section.id, { color: c })}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                  style={{ background: c, boxShadow: section.color === c ? `0 0 0 3px var(--page), 0 0 0 5px ${c}` : undefined }}
                >
                  {section.color === c && <Check size={18} strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Ícono</Label>
            <div className="grid grid-cols-7 gap-2">
              {Object.entries(SECTION_ICONS).map(([key, I]) => {
                const active = section.icon === key
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={`Ícono ${key}`}
                    aria-pressed={active}
                    onClick={() => updateSection(section.id, { icon: key })}
                    className="flex aspect-square items-center justify-center rounded-xl"
                    style={active ? { background: section.color, color: 'white' } : { background: 'var(--surface)', color: 'var(--color-neutral-500)' }}
                  >
                    <I size={20} />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={onEditActions}
              className="flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 text-left ring-1 ring-black/5"
            >
              <ListChecks size={20} style={{ color: section.color }} />
              <span className="flex-1 text-[15px] font-semibold text-neutral-800">Editar acciones</span>
              <span className="text-neutral-400">›</span>
            </button>
            <button
              type="button"
              onClick={() => updateSection(section.id, { hidden: !section.hidden })}
              className="flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 text-left ring-1 ring-black/5"
            >
              <span className="flex-1">
                <span className="block text-[15px] font-semibold text-neutral-800">Mostrar en "Hoy"</span>
                <span className="block text-xs text-neutral-400">Si la ocultás, su historial se conserva.</span>
              </span>
              <Switch on={!section.hidden} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Label({ children }: { children: string }) {
  return <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">{children}</div>
}

/** Interruptor visual (el botón que lo contiene maneja el tap). */
export function Switch({ on, color = '#30A46C' }: { on: boolean; color?: string }) {
  return (
    <span
      aria-hidden
      className="relative inline-block h-[30px] w-[50px] shrink-0 rounded-full transition-colors duration-200"
      style={{ background: on ? color : 'var(--color-neutral-200)' }}
    >
      <span
        className="absolute top-[2px] left-[2px] h-[26px] w-[26px] rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: on ? 'translateX(20px)' : 'none' }}
      />
    </span>
  )
}
