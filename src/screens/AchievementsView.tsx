import { Lock, Medal } from 'lucide-react'
import type { Section } from '../db/types'
import { formatAmount, TIER_COLORS, TIER_NAMES, type AchievementFamily } from '../lib/achievements'
import { formatLong } from '../lib/date'
import { sectionIcon } from '../lib/icons'

export function AchievementsView({ families, sections }: { families: AchievementFamily[]; sections: Section[] }) {
  const all = families.flatMap((f) => f.levels)
  const unlocked = all.filter((l) => l.unlockedOn)
  const general = families.filter((f) => f.sectionId === null)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-black/5">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: '#D4A01722', color: '#B8860B' }}>
          <Medal size={30} />
        </span>
        <div>
          <div className="text-2xl font-bold tabular-nums text-neutral-900">{unlocked.length} <span className="text-base font-semibold text-neutral-400">de {all.length}</span></div>
          <div className="text-sm text-neutral-500">logros desbloqueados</div>
        </div>
      </div>

      <Group title="Generales" color="var(--ink)" families={general} />
      {sections.map((s) => {
        const fs = families.filter((f) => f.sectionId === s.id)
        if (!fs.length) return null
        return <Group key={s.id} title={s.name} color={s.color} icon={s.icon} families={fs} />
      })}
    </div>
  )
}

function Group({ title, color, icon, families }: { title: string; color: string; icon?: string; families: AchievementFamily[] }) {
  const Icon = icon ? sectionIcon(icon) : null
  // Primero las familias con más avance.
  const sorted = [...families].sort((a, b) => progress(b) - progress(a))
  return (
    <section className="rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-black/5">
      <h2 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-neutral-900">
        {Icon && <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white" style={{ background: color }}><Icon size={15} /></span>}
        {title}
      </h2>
      <div className="divide-y divide-neutral-100">
        {sorted.map((f) => <FamilyRow key={f.id} f={f} color={color} />)}
      </div>
    </section>
  )
}

function progress(f: AchievementFamily) {
  const next = f.levels.find((l) => !l.unlockedOn)
  const done = f.levels.filter((l) => l.unlockedOn).length
  return done + (next ? Math.min(1, f.current / next.threshold) : 0)
}

function FamilyRow({ f, color }: { f: AchievementFamily; color: string }) {
  const next = f.levels.find((l) => !l.unlockedOn)
  const lastUnlocked = [...f.levels].reverse().find((l) => l.unlockedOn)
  const pct = next ? Math.min(1, f.current / next.threshold) : 1

  return (
    <div className="py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-neutral-800">{f.title}</div>
          <div className="text-xs text-neutral-400">{f.metric}</div>
        </div>
        <div className="flex shrink-0 gap-1">
          {f.levels.map((l) => (
            <span
              key={l.id}
              title={`${TIER_NAMES[l.tier]}: ${formatAmount(l.threshold, f.unit)}`}
              aria-label={`${TIER_NAMES[l.tier]} ${formatAmount(l.threshold, f.unit)} ${l.unlockedOn ? 'desbloqueado' : 'bloqueado'}`}
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={l.unlockedOn
                ? { background: TIER_COLORS[l.tier], color: 'white' }
                : { background: 'var(--color-neutral-100)', color: 'var(--color-neutral-300)' }}
            >
              {l.unlockedOn ? <Medal size={14} /> : <Lock size={12} />}
            </span>
          ))}
        </div>
      </div>
      {next ? (
        <div className="mt-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div className="stat-bar h-full rounded-full" style={{ width: `${pct * 100}%`, background: color }} />
          </div>
          <div className="mt-1 flex justify-between text-xs tabular-nums text-neutral-500">
            <span>{formatAmount(f.current, f.unit)} de {formatAmount(next.threshold, f.unit)}</span>
            <span>Próximo: {TIER_NAMES[next.tier]}</span>
          </div>
        </div>
      ) : (
        <div className="mt-1 text-xs font-semibold text-neutral-500">¡Todos los niveles completos!</div>
      )}
      {lastUnlocked && (
        <div className="mt-0.5 text-xs text-neutral-400">
          Último: {TIER_NAMES[lastUnlocked.tier]} ({formatAmount(lastUnlocked.threshold, f.unit)}) el {formatLong(lastUnlocked.unlockedOn!).toLowerCase()}
        </div>
      )}
    </div>
  )
}
